# Claude Codex Multi-Team Refactor Architecture

## Overview

This document outlines the complete architectural plan for refactoring Claude Codex from a TDD-specific tool to a generic multi-team system. The refactor maintains the core coder → reviewer pattern while making it configurable for different development teams.

## 🚀 Key Architectural Insight: File-Based State Management

**Revolutionary Simplification**: Instead of complex parameter passing between agents, we use the **file system as the state mechanism**:
- Coder checks `.temp/review-feedback.md` to detect revisions
- Coder saves work summary to `.temp/coder-feedback.md` for reviewer
- Reviewer saves feedback to `.temp/review-feedback.md` for next iteration
- Both agents discover context naturally from working directory
- **Single parameter**: just the raw input (spec or GitHub issue)

This eliminates complex state management while leveraging model intelligence perfectly.

## Core Design Principles

1. **Lean on Model Intelligence** - Let Claude figure out input types, file formats, and context
2. **Team Agnostic** - Same coordinator, different prompts and tool configurations
3. **File-Based State** - Use filesystem for agent communication, not programmatic state
4. **Ultra-Simple Interface** - Single parameter functions, minimal complexity
5. **Standard Patterns** - Follow Claude Code conventions for MCP and variables

## File Structure Changes

### Current Structure
```
src/
├── cli/
│   ├── args.ts                    # Manual argument parsing
│   ├── index.ts                   # TDD-specific routing
│   └── commands/
│       └── tdd.ts                 # TDD-only command handler
├── workflows/
│   └── tdd.ts                     # TDD-specific workflow
└── core/operations/
    └── prompts.ts                 # Hard-coded TDD prompts
```

### New Structure
```
~/.claude/
├── .codex.config.json             # Hidden config with API keys
├── teams/
│   ├── standard.ts                # Standard team (single file)
│   ├── tdd.ts                     # TDD team (single file)
│   ├── frontend.ts                # Frontend team (single file)
│   └── smart-contract.ts          # Smart contract team (single file)
└── commands/
    └── ARCHITECT.md               # Auto-registered slash command

src/
├── cli/
│   ├── index.ts                   # Commander.js integration
│   └── commands/
│       └── team.ts                # Generic team command handler
├── teams/
│   └── coordinator.ts             # Team execution coordinator
├── core/
│   ├── config.ts                  # Config loading and validation
│   └── operations/
│       └── prompts.ts             # DELETE - replaced by team builders
├── ui/
│   └── display.ts                 # CLI display components
```

## Configuration System

### Config Schema

```typescript
const CodexConfigSchema = z.object({
  // Standard MCP format (same as Claude Code)
  mcpServers: z.record(z.object({
    command: z.string(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
  })).optional(),

  // Team-specific configurations
  teams: z.record(z.object({
    mcps: z.array(z.string()),                    // MCP server names enabled for this team
  })),

  // Global defaults
  defaults: z.object({
    team: z.string().default('standard'),         // Default team, but any team name is valid
    maxReviews: z.number().min(1).max(10).default(3),
    cleanup: z.boolean().default(true),
  }),
});

type CodexConfig = z.infer<typeof CodexConfigSchema>;
```

### Example Configuration

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "$GITHUB_TOKEN"
      }
    },
    "browser": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  },

  "teams": {
    "standard": {
      "mcps": ["filesystem", "github"]
    },
    "tdd": {
      "mcps": ["filesystem", "github", "memory"]
    },
    "frontend": {
      "mcps": ["filesystem", "github", "browser"]
    },
    "smart-contract": {
      "mcps": ["filesystem", "github"]
    }
  },

  "defaults": {
    "team": "standard",
    "maxReviews": 3,
    "cleanup": true
  }
}
```

## CLI System Refactor

### Current CLI
```bash
claude-codex tdd <spec-path> [options]
```

### New CLI (Commander.js)
```bash
claude-codex <input> [options]
```

Where `<input>` can be:
- Local file: `./spec.md`
- GitHub issue: `#123`
- GitHub URL: `https://github.com/owner/repo/issues/123`
- Short format: `owner/repo#123`

### New CLI Options
```bash
Usage: claude-codex <input> [options]

Arguments:
  input                    Specification file or GitHub reference

Options:
  -t, --team <type>        Team type (any team from ~/.claude/teams/, default: "standard")
  -r, --reviews <number>   Maximum review iterations (default: 3)
  -b, --branch <name>      Git branch name (auto-generated if not provided)
  --no-cleanup            Keep worktree and task state after completion
  -v, --verbose           Enable verbose output
  -h, --help              Display help for command
  -V, --version           Display version number

Examples:
  claude-codex ./spec.md
  claude-codex #123 --team frontend
  claude-codex owner/repo#456 --team smart-contract --reviews 5
  claude-codex ./spec.md --team my-custom-team
```

### CLI Implementation
```typescript
// src/cli/index.ts
import { Command } from 'commander';

const program = new Command()
  .name('claude-codex')
  .description('AI-powered development teams')
  .version(getVersion())
  .argument('<input>', 'Specification file or GitHub reference')
  .option('-t, --team <type>', 'team type (any team from ~/.claude/teams/)', 'standard')
  .option('-r, --reviews <number>', 'maximum review iterations', '3')
  .option('-b, --branch <name>', 'git branch name (auto-generated if not provided)')
  .option('--no-cleanup', 'keep worktree and task state after completion')
  .option('-v, --verbose', 'enable verbose output')
  .action(executeWorkflow);
```

## Team Builder System

### Ultra-Simple File-Based State Management

**Key Insight**: Instead of complex parameter passing, use the **file system as the state mechanism**:
- Coder checks `.temp/review-feedback.md` to detect if this is a revision
- Reviewer saves feedback to `.temp/review-feedback.md` for next iteration
- Both agents discover context naturally from the working directory
- **Single parameter**: just the raw input (spec or GitHub issue)

### Team Structure (Single File Per Team)
```typescript
// ~/.claude/teams/tdd.ts
const CODER = (SPEC_OR_ISSUE: string) => `
You are implementing this specification/issue: ${SPEC_OR_ISSUE}

IF THERE IS A REVIEW AT '.temp/review-feedback.md', THEN ADDRESS THAT FEEDBACK FIRST.

Use Test-Driven Development:
1. Write comprehensive tests FIRST
2. Implement minimal code to pass tests
3. Refactor for quality

Save your implementation summary to .temp/coder-feedback.md
`;

const REVIEWER = (SPEC_OR_ISSUE: string) => `
You are reviewing a coder's implementation of: ${SPEC_OR_ISSUE}

Read the coder's work from .temp/coder-feedback.md

REVIEW PROCESS:
1. Analyze codebase structure and testing framework
2. Execute testing instructions provided by coder
3. Verify implementation meets original requirements
4. Assess code quality and maintainability

OUTCOMES:
- If production-ready: Create a pull request with comprehensive description
- If changes needed: Save specific feedback to '.temp/review-feedback.md'
`;

const TEAM = {
  CODER,
  REVIEWER,
};

export default TEAM;
```

### Team Interface (Simplified)
```typescript
// Ultra-simple interface
type PromptBuilder = (specOrIssue: string) => string;

interface Team {
  CODER: PromptBuilder;
  REVIEWER: PromptBuilder;
}
```

### Team Loading System
```typescript
// src/core/config.ts
export async function loadAllTeams(): Promise<Record<string, Team>> {
  const teamsDir = path.join(os.homedir(), '.claude', 'teams');
  const teamFiles = await fs.readdir(teamsDir);
  const teams: Record<string, Team> = {};

  for (const file of teamFiles) {
    if (file.endsWith('.ts')) {
      const teamName = file.replace('.ts', '');
      const teamPath = path.join(teamsDir, file);
      const teamModule = await import(teamPath);

      teams[teamName] = teamModule.default; // Export default TEAM object
    }
  }

  return teams;
}
```

## Team Coordinator

### Current Workflow (TDD-specific)
```typescript
// src/workflows/tdd.ts
export async function executeTDDWorkflow(options: TDDOptions): Promise<TDDResult>
```

### New Team Coordinator
```typescript
// src/teams/coordinator.ts
export async function coordinateTeam(options: CoordinationOptions): Promise<TeamResult>

interface CoordinationOptions {
  input: string;                    // File path or GitHub reference
  teamType: string;                 // Any team name (loaded dynamically)
  maxReviews: number;
  branchName?: string;
  cleanup: boolean;
}

interface WorkflowResult {
  success: boolean;
  prUrl?: string;
  iterations: number;
  taskId: string;
  error?: string;
}
```

### Team Coordinator Implementation
```typescript
export async function coordinateTeam(options: CoordinationOptions): Promise<TeamResult> {
  const taskId = generateTaskId();
  let worktreeInfo: WorktreeInfo | null = null;

  try {
    // Load configuration and team builders
    const config = await loadCodexConfig();
    const teams = await loadAllTeams();
    const team = teams[options.teamType];

    if (!team) {
      throw new ValidationError(`Team "${options.teamType}" not found`);
    }

    // Get MCP configuration for this team
    const mcpConfig = await getMCPConfigForTeam(options.teamType, config);

    // Validate input and read content if file
    // Note: No input type detection - let the model figure it out

    // Initialize task state (team-agnostic)
    const taskState = await initializeTaskState(options.input, {
      taskId,
      maxIterations: options.maxReviews,
      teamType: options.teamType,
    });

    // Create worktree with team-specific branch naming
    worktreeInfo = await createWorktree(taskId, {
      branchName: options.branchName || `${options.teamType}/${taskId}`,
    });

    await updateWorktreeInfo(taskId, worktreeInfo);

    // Agent iteration loop
    for (let iteration = 1; iteration <= options.maxReviews; iteration++) {
      // Display cycle start
      displayCycleStart(iteration, options.maxReviews, options.teamType);

      // Run Coder Agent
      displayAgentStart('coder', iteration);
      const coderPrompt = team.CODER(options.input); // Ultra-simple: just pass the input

      const coderResult = await runClaudeAgent({
        prompt: coderPrompt,
        cwd: worktreeInfo.path,
        mcpConfig,                        // Just the MCP config
        permissionMode: 'bypassPermissions', // Always bypass
        displayOptions: {
          showToolCalls: true,
          showTimestamps: false,
          verbose: false,
        },
      });

      if (!coderResult.success) {
        throw new AgentExecutionError('Coder agent execution was not successful');
      }
      displayAgentComplete('coder');

      // Run Reviewer Agent
      displayAgentStart('reviewer', iteration);
      const reviewerPrompt = team.REVIEWER(options.input); // Ultra-simple: just pass the input

      const reviewerResult = await runClaudeAgent({
        prompt: reviewerPrompt,
        cwd: worktreeInfo.path,
        mcpConfig,                        // Just the MCP config
        permissionMode: 'bypassPermissions', // Always bypass
        displayOptions: {
          showToolCalls: true,
          showTimestamps: false,
          verbose: false,
        },
      });

      if (!reviewerResult.success) {
        throw new AgentExecutionError('Reviewer agent execution was not successful');
      }
      displayAgentComplete('reviewer');

      // Check for PR creation (success condition)
      displayPRCheck(iteration);
      const prInfo = await checkPRExists(worktreeInfo.branchName);
      if (prInfo) {
        displaySuccess(prInfo.url, iteration);
        
        // Update task state to completed
        await updateTaskState(taskId, { status: 'completed' });
        
        return {
          success: true,
          prUrl: prInfo.url,
          iterations: iteration,
          taskId,
        };
      }

      displayCycleComplete(iteration, options.maxReviews, false); // false = no PR found
      
      // Update current iteration in state
      await updateTaskState(taskId, { currentIteration: iteration });
    }

    // Max iterations reached - mark as failed
    await updateTaskState(taskId, { status: 'failed' });
    
    return {
      success: false,
      iterations: options.maxReviews,
      taskId,
      error: `Max iterations (${options.maxReviews}) reached without PR creation`,
    };

  } catch (error) {
    // Error occurred - mark as failed
    await updateTaskState(taskId, { status: 'failed' });
    
    return {
      success: false,
      iterations: 0,
      taskId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

  } finally {
    // Cleanup based on options.cleanup
    if (options.cleanup && worktreeInfo) {
      try {
        console.log('🧹 Cleaning up worktree and task state...');
        await cleanupWorktree(worktreeInfo);
        await cleanupTaskState(taskId);
      } catch (cleanupError) {
        console.warn('⚠️  Cleanup failed:', cleanupError);
      }
    }
  }
}
```

## CLI Display Components

### Display Functions for Better UX
```typescript
// src/ui/display.ts

export function displayCycleStart(iteration: number, maxIterations: number, teamType: string): void
// Example: "🔄 Cycle 1/3 • TDD Team • Starting coder → reviewer cycle"

export function displayAgentStart(agentType: 'coder' | 'reviewer', iteration: number): void  
// Example: "🤖 [Cycle 1] Coder Agent • Implementing specification..."
// Example: "🔍 [Cycle 1] Reviewer Agent • Analyzing implementation..."

export function displayAgentComplete(agentType: 'coder' | 'reviewer'): void
// Example: "✅ Coder Agent • Implementation complete"
// Example: "✅ Reviewer Agent • Review complete" 

export function displayPRCheck(iteration: number): void
// Example: "🔍 [Cycle 1] Checking for pull request creation..."

export function displayCycleComplete(iteration: number, maxIterations: number, foundPR: boolean): void
// Example: "⏭️  Cycle 1/3 complete • No PR found • Continuing to next cycle..."
// Example: "⚠️  Cycle 3/3 complete • No PR found • Max iterations reached"

export function displaySuccess(prUrl: string, iteration: number): void
// Example: "🎉 Success! • PR created in cycle 2 • https://github.com/..."

export function displayError(error: string, iteration: number): void
// Example: "💥 Error in cycle 2 • Agent execution failed • Details: ..."
```

### Usage in Team Coordinator
The coordinator uses these components for consistent, informative progress display:

```typescript
// Clean, informative progress reporting
displayCycleStart(1, 3, 'tdd');
// Output: "🔄 Cycle 1/3 • TDD Team • Starting coder → reviewer cycle"

displayAgentStart('coder', 1);  
// Output: "🤖 [Cycle 1] Coder Agent • Implementing specification..."

// ... agent execution ...

displayAgentComplete('coder');
// Output: "✅ Coder Agent • Implementation complete"
```

## MCP Integration System

### MCP Config Type (Claude SDK Compatible)
```typescript
interface ClaudeSDKMCPConfig {
  mcpServers: Record<string, {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }>;
}
```

### Team MCP Configuration Loader
```typescript
export async function getMCPConfigForTeam(
  teamType: string,
  config: CodexConfig
): Promise<ClaudeSDKMCPConfig> {
  const teamConfig = config.teams[teamType];
  if (!teamConfig) {
    throw new Error(`Team "${teamType}" not found in config`);
  }

  // Filter MCP servers to only include those enabled for this team
  const enabledMCPServers: Record<string, any> = {};

  for (const mcpName of teamConfig.mcps) {
    if (config.mcpServers?.[mcpName]) {
      enabledMCPServers[mcpName] = config.mcpServers[mcpName];
    }
  }

  return {
    mcpServers: enabledMCPServers
  };
}
```

### SDK Wrapper Integration
```typescript
// src/core/messaging/sdk-wrapper.ts - Add MCP config support
export interface ClaudeAgentOptions {
  // ... all existing options ...

  // Add MCP configuration
  mcpConfig?: ClaudeSDKMCPConfig;
}

// In runClaudeAgent function
const sdkOptions: Parameters<typeof query>[0]['options'] = {
  // ... all existing options ...

  // Add MCP config if provided
  ...(options.mcpConfig && { mcpConfig: options.mcpConfig }),
};
```

## State Management Updates

### Current State (TDD-specific)
```typescript
interface TaskState {
  // TDD-specific fields
}
```

### New Generic State
```typescript
interface TaskState {
  taskId: string;
  input: string;                    // Raw input (file or GitHub reference)
  teamType: string;                 // Team type
  currentIteration: number;
  maxIterations: number;
  branchName: string;
  worktreeInfo: WorktreeInfo;
  createdAt: string;
  updatedAt: string;
  status: 'running' | 'completed' | 'failed';
}

interface TaskStateOptions {
  taskId: string;
  maxIterations: number;
  teamType: string;
}
```

## Worktree System Updates

### Current Implementation
- Path: `../.codex-worktrees/${taskId}`
- Branch: `tdd/${taskId}`

### Updated Implementation
- Path: `../.codex-worktrees/${taskId}` (unchanged)
- Branch: `${teamType}/${taskId}` (dynamic based on team)

## Core Function Signatures

### Config System
```typescript
// src/core/config.ts
export async function loadCodexConfig(): Promise<CodexConfig>
export async function initializeCodexConfig(): Promise<void>
export async function loadAllTeams(): Promise<Record<string, Team>>
export async function getMCPConfigForTeam(teamType: string, config: CodexConfig): Promise<ClaudeSDKMCPConfig>
export function validateTeamExists(teamType: string, teams: Record<string, Team>): boolean

// State Management
export async function initializeTaskState(input: string, options: TaskStateOptions): Promise<TaskState>
export async function updateTaskState(taskId: string, updates: Partial<TaskState>): Promise<void>
export async function getTaskState(taskId: string): Promise<TaskState>
export async function cleanupTaskState(taskId: string): Promise<void>
```

### CLI Display System
```typescript
// src/ui/display.ts
export function displayCycleStart(iteration: number, maxIterations: number, teamType: string): void
export function displayAgentStart(agentType: 'coder' | 'reviewer', iteration: number): void
export function displayAgentComplete(agentType: 'coder' | 'reviewer'): void
export function displayPRCheck(iteration: number): void
export function displayCycleComplete(iteration: number, maxIterations: number, foundPR: boolean): void
export function displaySuccess(prUrl: string, iteration: number): void
export function displayError(error: string, iteration: number): void
```

### CLI System
```typescript
// src/cli/index.ts
export async function runCLI(argv: string[]): Promise<void>

// src/cli/commands/team.ts
export async function handleTeamCommand(args: TeamCommandArgs): Promise<void>
```

### Team Coordinator
```typescript
// src/teams/coordinator.ts
export async function coordinateTeam(options: CoordinationOptions): Promise<TeamResult>
function generateTaskId(): string
```

### Type System Updates
```typescript
// src/shared/types.ts
export interface TeamCommandArgs {
  input: string;
  team: string;
  reviews: number;
  branch?: string;
  cleanup: boolean;
  verbose: boolean;
}

export interface CoordinationOptions {
  input: string;
  teamType: string;                 // Any team name (loaded dynamically)
  maxReviews: number;
  branchName?: string;
  cleanup: boolean;
}

export interface TeamResult {
  success: boolean;
  prUrl?: string;
  iterations: number;
  taskId: string;
  error?: string;
}

// No fixed enum - teams are loaded dynamically from ~/.claude/teams/
// Users can add custom teams by creating new .ts files
```

## Initialization System

### Initialization Command
```bash
claude-codex init [options]
```

Options:
- `--force` - Overwrite existing files
- `--teams-only` - Only create team files
- `--config-only` - Only create config file

### Automatic Initialization
- Check for our specific files on every CLI run: config, teams/, commands/
- If any are missing, create only the missing pieces
- Show user what was created and provide clear next steps
- No user prompt - just inform them what's being added

```typescript
// src/cli/index.ts - Auto-initialization check
async function ensureInitialized(): Promise<void> {
  const claudeDir = path.join(os.homedir(), '.claude');
  const configPath = path.join(claudeDir, '.codex.config.json');
  const teamsDir = path.join(claudeDir, 'teams');
  const commandsDir = path.join(claudeDir, 'commands');
  
  const missingItems: string[] = [];
  
  // Check for config file
  if (!await pathExists(configPath)) {
    missingItems.push('config');
  }
  
  // Check for teams directory and default teams
  if (!await pathExists(teamsDir)) {
    missingItems.push('teams');
  } else {
    // Check for default team files
    const defaultTeams = ['standard', 'tdd', 'frontend', 'smart-contract'];
    for (const team of defaultTeams) {
      const teamPath = path.join(teamsDir, `${team}.ts`);
      if (!await pathExists(teamPath)) {
        missingItems.push(`team: ${team}`);
      }
    }
  }
  
  // Check for commands directory
  if (!await pathExists(commandsDir)) {
    missingItems.push('commands');
  }
  
  // Only initialize if something is missing
  if (missingItems.length > 0) {
    console.log(`🚀 Setting up missing Claude Codex components: ${missingItems.join(', ')}`);
    await initializeClaudeCodex({
      force: false, // Only create missing files
    });
    console.log('\n✨ Setup complete! You can now run your command.\n');
  }
}

// Called before any command execution
const program = new Command()
  .name('claude-codex')
  .description('AI-powered development teams')
  .version(getVersion())
  .hook('preAction', async () => {
    await ensureInitialized();
  });
```

### Initialization Implementation
```typescript
// src/core/initialization.ts
export async function initializeClaudeCodex(options: InitOptions = {}): Promise<void> {
  const claudeDir = path.join(os.homedir(), '.claude');
  const teamsDir = path.join(claudeDir, 'teams');
  const commandsDir = path.join(claudeDir, 'commands');
  const configPath = path.join(claudeDir, '.codex.config.json');

  // Create directories
  await fs.mkdir(teamsDir, { recursive: true });
  await fs.mkdir(commandsDir, { recursive: true });

  // Create default config (if doesn't exist or force)
  if (!await pathExists(configPath) || options.force) {
    const defaultConfig = createDefaultConfig();
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log('✅ Created config:', configPath);
  }

  // Create default teams
  const defaultTeams = ['standard', 'tdd', 'frontend', 'smart-contract'];
  for (const teamName of defaultTeams) {
    const teamPath = path.join(teamsDir, `${teamName}.ts`);
    if (!await pathExists(teamPath) || options.force) {
      const teamContent = createDefaultTeam(teamName);
      await fs.writeFile(teamPath, teamContent);
      console.log('✅ Created team:', teamPath);
    }
  }

  // Create example command
  const exampleCommandPath = path.join(commandsDir, 'ARCHITECT.md');
  if (!await pathExists(exampleCommandPath) || options.force) {
    const commandContent = createExampleCommand();
    await fs.writeFile(exampleCommandPath, commandContent);
    console.log('✅ Created example command:', exampleCommandPath);
  }

  console.log('\n🎉 Claude Codex initialized successfully!');
  console.log('\nNext steps:');
  console.log('1. Edit ~/.claude/.codex.config.json to add your GitHub token');
  console.log('2. Run: claude-codex ./spec.md --team standard');
  console.log('3. Add custom teams in ~/.claude/teams/');
}

function createDefaultConfig(): CodexConfig {
  return {
    mcpServers: {
      filesystem: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/'],
      },
      github: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
          GITHUB_TOKEN: '$GITHUB_TOKEN', // User must set this
        },
      },
      memory: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
      },
      browser: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-puppeteer'],
      },
    },
    teams: {
      standard: { mcps: ['filesystem', 'github'] },
      tdd: { mcps: ['filesystem', 'github', 'memory'] },
      frontend: { mcps: ['filesystem', 'github', 'browser'] },
      'smart-contract': { mcps: ['filesystem', 'github'] },
    },
    defaults: {
      team: 'standard',
      maxReviews: 3,
      cleanup: true,
    },
  };
}

function createDefaultTeam(teamName: string): string {
  switch (teamName) {
    case 'standard':
      return `const CODER = (SPEC_OR_ISSUE: string) => \`
You are implementing this specification/issue: \${SPEC_OR_ISSUE}

IF THERE IS A REVIEW AT '.temp/review-feedback.md', THEN ADDRESS THAT FEEDBACK FIRST.

Focus on clean, maintainable code with proper error handling.

Save your implementation summary to .temp/coder-feedback.md
\`;

const REVIEWER = (SPEC_OR_ISSUE: string) => \`
You are reviewing a coder's implementation of: \${SPEC_OR_ISSUE}

Read the coder's work from .temp/coder-feedback.md

REVIEW PROCESS:
1. Analyze code quality and maintainability
2. Verify implementation meets requirements
3. Check for proper error handling

OUTCOMES:
- If production-ready: Create a pull request with comprehensive description
- If changes needed: Save specific feedback to '.temp/review-feedback.md'
\`;

const TEAM = { CODER, REVIEWER };
export default TEAM;`;

    case 'tdd':
      return `const CODER = (SPEC_OR_ISSUE: string) => \`
You are implementing this specification/issue: \${SPEC_OR_ISSUE}

IF THERE IS A REVIEW AT '.temp/review-feedback.md', THEN ADDRESS THAT FEEDBACK FIRST.

Use Test-Driven Development:
1. Write comprehensive tests FIRST
2. Implement minimal code to pass tests
3. Refactor for quality

Save your implementation summary to .temp/coder-feedback.md
\`;

const REVIEWER = (SPEC_OR_ISSUE: string) => \`
You are reviewing a coder's implementation of: \${SPEC_OR_ISSUE}

Read the coder's work from .temp/coder-feedback.md

REVIEW PROCESS:
1. Analyze codebase structure and testing framework
2. Execute testing instructions provided by coder
3. Verify implementation meets original requirements
4. Assess code quality and maintainability

OUTCOMES:
- If production-ready: Create a pull request with comprehensive description
- If changes needed: Save specific feedback to '.temp/review-feedback.md'
\`;

const TEAM = { CODER, REVIEWER };
export default TEAM;`;

    case 'frontend':
      return `const CODER = (SPEC_OR_ISSUE: string) => \`
You are implementing this specification/issue: \${SPEC_OR_ISSUE}

IF THERE IS A REVIEW AT '.temp/review-feedback.md', THEN ADDRESS THAT FEEDBACK FIRST.

Focus on modern frontend development:
1. Component-based architecture
2. Responsive design
3. Accessibility best practices
4. Performance optimization

Save your implementation summary to .temp/coder-feedback.md
\`;

const REVIEWER = (SPEC_OR_ISSUE: string) => \`
You are reviewing a coder's implementation of: \${SPEC_OR_ISSUE}

Read the coder's work from .temp/coder-feedback.md

REVIEW PROCESS:
1. Test UI components and interactions
2. Verify responsive design
3. Check accessibility compliance
4. Assess performance and bundle size

OUTCOMES:
- If production-ready: Create a pull request with comprehensive description
- If changes needed: Save specific feedback to '.temp/review-feedback.md'
\`;

const TEAM = { CODER, REVIEWER };
export default TEAM;`;

    case 'smart-contract':
      return `const CODER = (SPEC_OR_ISSUE: string) => \`
You are implementing this specification/issue: \${SPEC_OR_ISSUE}

IF THERE IS A REVIEW AT '.temp/review-feedback.md', THEN ADDRESS THAT FEEDBACK FIRST.

Focus on secure smart contract development:
1. Security-first approach
2. Gas optimization
3. Comprehensive testing
4. Clear documentation

Save your implementation summary to .temp/coder-feedback.md
\`;

const REVIEWER = (SPEC_OR_ISSUE: string) => \`
You are reviewing a coder's implementation of: \${SPEC_OR_ISSUE}

Read the coder's work from .temp/coder-feedback.md

REVIEW PROCESS:
1. Security audit for common vulnerabilities
2. Gas efficiency analysis
3. Test coverage verification
4. Documentation review

OUTCOMES:
- If production-ready: Create a pull request with comprehensive description
- If changes needed: Save specific feedback to '.temp/review-feedback.md'
\`;

const TEAM = { CODER, REVIEWER };
export default TEAM;`;

    default:
      throw new Error(`Unknown team: ${teamName}`);
  }
}

function createExampleCommand(): string {
  return `# ARCHITECT Command

This is an example slash command that gets auto-registered.

## Usage
Use this command when you need architectural guidance.

## Prompt
You are a senior software architect. Analyze the current codebase and provide architectural recommendations focusing on:

1. Code organization and structure
2. Design patterns and best practices  
3. Scalability and maintainability
4. Technology stack optimization

Provide specific, actionable recommendations with examples.
`;
}

interface InitOptions {
  force?: boolean;
  teamsOnly?: boolean;
  configOnly?: boolean;
}
```

### CLI Integration
```typescript
// Update src/cli/index.ts to add init command
const program = new Command()
  .name('claude-codex')
  .description('AI-powered development teams')
  .version(getVersion());

// Main command
program
  .argument('<input>', 'Specification file or GitHub reference')
  .option('-t, --team <type>', 'team type', 'standard')
  // ... other options
  .action(executeWorkflow);

// Init subcommand
program
  .command('init')
  .description('Initialize Claude Codex configuration and teams')
  .option('--force', 'overwrite existing files')
  .option('--teams-only', 'only create team files')
  .option('--config-only', 'only create config file')
  .action(initializeClaudeCodex);
```

## Implementation Plan

### Phase 1: Initialization System
1. **Install commander.js** dependency
2. **Create initialization system** - `src/core/initialization.ts` with team templates
3. **Add init command** - `claude-codex init` CLI command
4. **Add auto-initialization check** - Check ~/.claude/ exists on every run

### Phase 2: Foundation
1. **Create config system** - Zod schema, loading, validation from ~/.claude/.codex.config.json
2. **Update types** - Remove TDD-specific types, add team types
3. **Create team loading system** - Dynamic loading from ~/.claude/teams/

### Phase 3: CLI Refactor
1. **Refactor CLI parsing** - Replace manual parsing with commander
2. **Update command handler** - Generic team command instead of TDD-specific
3. **Update help system** - New usage patterns and examples

### Phase 4: Team System
1. **Create team builder interface** - TypeScript function signatures
2. **Implement team coordinator** - Orchestrates coder → reviewer execution
3. **Add MCP integration** - Team-specific MCP configuration

### Phase 5: State Management & Integration
1. **Update state management** - Team-agnostic task state
2. **Update SDK wrapper** - Add MCP config support
3. **Update all tests** - New CLI structure and team patterns

## Migration Strategy

### Backward Compatibility
- Support deprecated `claude-codex tdd <file>` with warning
- Migrate existing .codex state files if needed
- Preserve existing worktree and cleanup behavior

### Default Behavior
- Default team: `standard` (not TDD)
- Permission mode: `bypassPermissions` (always, not configurable)
- Default cleanup: `true`
- Default reviews: `3`

### User Experience
- Interactive help for unsupported old syntax
- Clear error messages for configuration issues
- Automatic config initialization on first run

## Benefits of This Architecture

1. **Simplified Complexity** - Removed complex template variables, handoff parsing
2. **Model Intelligence** - Let Claude handle input detection and context understanding
3. **Standard Patterns** - Follow Claude Code conventions users already know
4. **Flexible Configuration** - Easy to add new teams and customize existing ones
5. **Type Safety** - Zod validation ensures config correctness
6. **Extensible** - Users can add custom teams by creating ~/.claude/teams/my-team.ts files
7. **Clean Separation** - Clear boundaries between CLI, config, teams, and engine

This architecture maintains the proven coder → reviewer pattern while making it generic and configurable for any development team.

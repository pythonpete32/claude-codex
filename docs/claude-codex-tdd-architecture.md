# Claude Codex TDD Workflow - Architecture Specification

## High-Level Architectural Structure

Based on your requirements, I propose this modular structure for the TDD workflow:

### **Core Architecture Layers**

```
src/
├── cli/
│   ├── args.ts (extend existing for `tdd` subcommand)
│   └── commands/
│       └── tdd.ts (TDD command handler)
├── core/
│   ├── messaging.ts (existing)
│   ├── query.ts (existing - runClaudeWithSDK)
│   ├── auth.ts (existing)
│   └── operations/
│       ├── worktree.ts (git worktree management)
│       ├── github.ts (GitHub REST API client)
│       ├── prompts.ts (prompt templating utilities)
│       └── state.ts (`.codex/` state management)
├── workflows/
│   └── tdd.ts (main TDD workflow orchestrator)
├── shared/
│   ├── types.ts (all interfaces and types)
│   └── errors.ts (custom error classes)
└── index.ts (existing entry point)
```

### **Data Flow Overview**
1. **CLI** → Parse `tdd` command + spec file path
2. **TDD Workflow** → Initialize state, create worktree
3. **TDD Workflow** → Format Coder prompt → runClaudeWithSDK → Extract handoff
4. **State Manager** → Save coder handoff
5. **TDD Workflow** → Format Reviewer prompt → runClaudeWithSDK → Extract result
6. **GitHub Client** → Check for PR creation
7. **TDD Workflow** → Loop or cleanup based on results

### **Key Design Principles**
- **Intelligent Agent Coordination**: The orchestration coordinates intelligent agents, trusting them to do their jobs well while ensuring proper handoffs
- **State-Driven**: All coordination happens through `.codex/task-{id}.json` files
- **MVP Focus**: Simple, functional components without over-engineering
- **GitHub Native**: Direct REST API integration for PR detection

---

## Detailed Component Specifications

### **TDD Workflow Orchestrator** (`workflows/tdd.ts`)

#### **Purpose**
Main coordinator that handles the complete TDD task lifecycle from spec file to PR creation.

#### **Dependencies**
- `runClaudeWithSDK` from `core/query.ts`
- State management functions from `core/operations/state.ts`
- Worktree functions from `core/operations/worktree.ts`
- GitHub functions from `core/operations/github.ts`
- Prompt utilities from `core/operations/prompts.ts`

#### **Function Signatures**

```typescript
interface TDDOptions {
  specPath: string
  maxReviews: number
  branchName?: string
  cleanup: boolean
}

interface TDDResult {
  success: boolean
  prUrl?: string
  iterations: number
  taskId: string
  error?: string
}

async function executeTDDWorkflow(options: TDDOptions): Promise<TDDResult>
```

#### **Behavioral Description**

**`executeTDDWorkflow(options: TDDOptions): Promise<TDDResult>`**
- **Purpose**: Orchestrates the complete TDD workflow from start to finish
- **Parameters**: 
  - `options.specPath`: Path to the specification markdown file
  - `options.maxReviews`: Maximum number of review iterations (default: 3)
  - `options.branchName`: Optional custom branch name (auto-generated if not provided)
  - `options.cleanup`: Whether to cleanup worktree on failure (default: true)
- **Returns**: TDDResult with success status, PR URL if created, iteration count, and task ID
- **Behavior**:
  1. Generate unique task ID and initialize state
  2. Read and validate spec file exists
  3. Create isolated git worktree with new branch
  4. Initialize task state file (`.codex/task-{id}.json`)
  5. **Agent Loop** (max iterations):
     - Format Coder Agent prompt with spec + any previous feedback
     - Call `runClaudeWithSDK` with Coder prompt
     - Extract structured handoff from Coder response
     - Save handoff to task state
     - Format Reviewer Agent prompt with original spec + Coder handoff
     - Call `runClaudeWithSDK` with Reviewer prompt
     - Check if PR was created (success condition)
     - If PR exists: return success result
     - If feedback provided: save feedback and continue loop
     - If max iterations reached: return partial result
  6. Cleanup worktree if requested
  7. Return final result with success status and metadata

#### **Error Handling**
- **SpecFileNotFoundError**: When spec file doesn't exist or isn't readable
- **WorktreeCreationError**: When git worktree creation fails
- **AgentExecutionError**: When `runClaudeWithSDK` fails
- **GitHubAPIError**: When PR detection fails
- **StateManagementError**: When task state operations fail

#### **Types/Interfaces Needed**
- `TaskState` - Structure for task state files
- `CoderHandoff` - Structured handoff template from Coder Agent
- `ReviewerFeedback` - Feedback structure from Reviewer Agent
- `WorktreeInfo` - Git worktree metadata
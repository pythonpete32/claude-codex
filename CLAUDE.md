# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Development Commands

### Building and Development
- `bun run build` - Build the CLI for production (outputs to `dist/`)
- `bun run dev` - Run in development mode with hot reload
- `bun run start` - Run the built CLI executable

### Code Quality and Testing
- `bun run check:fix` - Auto-fix all formatting and linting issues (recommended before commits)
- `bun run format` - Format all code with Biome
- `bun run lint` - Lint code with Biome
- `bun run test` - Run all unit tests
- `bun run test:watch` - Run tests in watch mode for TDD
- `bun run test:coverage` - Run tests with coverage report

### Release Management
- `bun run changeset` - Create a changeset describing your changes (required for releases)
- `bun run release` - Complete release workflow (build + publish to npm)


### Advanced Technical Architecture

**Claude Code SDK Integration:**
- **177-line advanced SDK wrapper** with comprehensive options support and dependency injection
- **Real-time message processing pipeline** with adaptive terminal display and streaming
- **Debug logging system** with structured output and task state persistence
- **Error handling hierarchy** with specific exception types and graceful recovery
- Enforces subscription mode by removing API key environment variables
- Supports all Claude Code permission modes and tool restrictions

**MCP Server Ecosystem Integration:**
```json
{
  "mcpServers": {
    "puppeteer": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-puppeteer"] },
    "snap-happy": { "command": "npx", "args": ["@mariozechner/snap-happy"] },
    "context7": { "command": "npx", "args": ["-y", "@upstash/context7-mcp"] },
    "mcp_excalidraw": { "command": "npx", "args": ["-y", "excalidraw-mcp"] },
    "sequential-thinking": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"] }
  },
  "teams": {
    "frontend": { "mcps": ["context7", "puppeteer"] },
    "tdd": { "mcps": ["context7", "snap-happy"] },
    "standard": { "mcps": ["context7", "snap-happy"] },
    "smart-contract": { "mcps": ["context7"] }
  }
}
```

**Git Worktree Isolation System:**
- **Parallel task execution** without conflicts via isolated worktrees
- **Automatic branch creation** (`tdd/{taskId}` or custom names)
- **Task state management** with persistent state in `.codex/task-{id}.json`
- **Cleanup orchestration** with optional preservation for debugging
- **Agent communication protocol** via `.temp/coder-feedback.md` and `.temp/review-feedback.md`


## Development Workflow

### Code Quality Automation
This project uses automated git hooks via Lefthook:
- **Pre-commit**: Automatically formats staged files with Biome
- **Pre-push**: Runs format check, linting, and tests (blocks push if any fail)

### Advanced Testing Strategy

**Multi-Agent System Testing:**
- **Agent Template Validation**: Test prompt engineering and reasoning capabilities
- **MCP Integration Testing**: Validate server connectivity and tool functionality  
- **Workflow Orchestration Testing**: End-to-end team coordination validation
- **Worktree Isolation Testing**: Git operation safety and cleanup verification
- **Configuration Management Testing**: Template and config file validation

**Testing Infrastructure:**
- Uses Vitest for testing with Node.js environment
- Test files: `tests/**/*.{test,spec}.{js,ts}` (separate from source code)
- Coverage reports generated to `coverage/` directory
- Tests run automatically on pre-push hook
- **Advanced Testing Patterns**: See @docs/TESTING.md for multi-agent testing strategies

**Specialized Testing Patterns:**
- **Mock MCP Servers**: Injectable MCP server implementations for testing
- **Agent Response Mocking**: Controllable agent behavior for deterministic tests
- **Worktree Environment Isolation**: Safe testing environments with automatic cleanup
- **Multi-Team Integration Testing**: Cross-team workflow validation and state management

### Release Process
Uses Changesets for automated releases:
1. Make changes and create changeset with `bun run changeset`
2. GitHub Actions creates Release PR with version bump
3. Merging Release PR automatically publishes to npm

## Important Technical Considerations

### Claude Code SDK Usage
- The tool forces subscription authentication to ensure users leverage their Claude Code subscription
- External Claude Code SDK dependency allows users to control their Claude Code version
- Supports all Claude Code permission modes and tool restrictions

### CLI Design
- Follows standard CLI conventions with help/version flags
- Graceful error handling with colored output
- Supports Ctrl+C interruption with cleanup
- Conversation saving in JSON format when requested

### Development Tools
- **Biome** replaces ESLint + Prettier for faster linting and formatting
- **Bun** used as package manager for performance
- **TypeScript** with strict configuration
- Modern ESM modules throughout

## Project Architecture

**Claude Codex** is a sophisticated **multi-agent orchestration platform** that coordinates specialized AI teams to automate complex development workflows. The system integrates advanced MCP servers, git worktree isolation, and domain-expert agents to deliver enterprise-grade automation capabilities.

### Multi-Agent Team Architecture

#### Specialized Agent Teams
- **TDD Team**: Test-Driven Development specialists with comprehensive testing methodology and Red-Green-Refactor workflow enforcement
- **Frontend Team**: Modern web development experts with accessibility (WCAG 2.1 AA), performance (Core Web Vitals), and responsive design focus  
- **Standard Team**: General-purpose development automation with Clean Architecture and SOLID principles
- **Smart Contract Team**: Blockchain and Web3 development specialists with security-first approach and economic attack prevention

#### Agent Capabilities Integration
- **ULTRA THINK**: Advanced reasoning for complex architectural decisions and comprehensive codebase analysis
- **Subagents**: Parallel specialized processing for multi-perspective development and comprehensive analysis
- **Codebase Exploration**: Mandatory deep-dive exploration before any implementation work begins
- **Critical Validation**: Multi-layer validation preventing dangerous changes and ensuring GitHub issue compliance

#### Team Execution Workflow
1. **Initialization**: Create isolated git worktree for task execution (`../.codex-worktrees/`)
2. **Coder Phase**: Specialized domain-expert agent implements requirements with full codebase context
3. **Reviewer Phase**: Quality assurance and validation agent provides comprehensive feedback
4. **Iteration Loop**: Feedback integration and refinement through `.temp/` file communication
5. **Completion**: Automated PR creation with GitHub integration and optional cleanup

### Core CLI Commands

#### Initialization
```bash
# Initialize configuration and team templates
claude-codex init [--force]  # Overwrite existing configuration
```

#### Team-Based Execution  
```bash
# Execute specialized team workflows
claude-codex team <type> <spec-or-issue> [options]

# Available teams
claude-codex team standard ./spec.md     # General development
claude-codex team tdd ./spec.md          # Test-driven development
claude-codex team frontend ./spec.md     # Modern web development
claude-codex team smart-contract ./spec.md  # Blockchain development

# Options
-r, --max-reviews <number>    # Maximum review iterations (default: 3)
-b, --branch-name <name>      # Custom branch name (default: tdd/{taskId})
--no-cleanup                  # Skip worktree cleanup after completion
```

#### Configuration Management
- **Config file**: `~/.claude/.codex.config.json` - Team and MCP server configuration
- **Team templates**: `~/.claude/teams/` - Customizable agent prompt templates  
- **Command templates**: `~/.claude/commands/` - Reusable command patterns

## Claude Code Best Practices Integration

This project follows [Anthropic's Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices):

### **Explore-Plan-Code-Commit Workflow**
When implementing features:
1. **Explore**: Read relevant files, understand context and requirements
2. **Plan**: Create detailed implementation plan (show for approval)  
3. **Code**: Implement using TDD with frequent verification
4. **Commit**: Verify quality, test coverage, and requirements compliance

### **Task Execution Commands**
- **Implementation**: Use `@scripts/execute-task.md` with task file path
- **Code Review**: Use `@scripts/review-code.md` with task file path

### **TDD with Subagents**
- Use separate Claude instances for test writing vs implementation
- Prevents "cheating" where code writer knows test expectations
- Write failing tests FIRST, then implement minimal passing code
- Iterate with frequent verification cycles

### **Context Management**
- Use `/clear` command to maintain focused context during long sessions
- Break complex tasks into smaller, focused sub-tasks
- Show progress incrementally rather than big-bang implementations

### **Visual Verification**
- Screenshot results when implementing UI changes
- Verify actual behavior matches expected outcomes
- Course-correct early and frequently based on concrete evidence

### **Permission Management**
- Start with conservative tool permissions
- Use `/permissions` to customize access as needed
- Consider safety implications for file system and git operations

### **Quality Standards**
- Follow @docs/TESTING.md patterns for meaningful tests
- Use dependency injection for testability
- Test error scenarios comprehensively
- Achieve ≥90% test coverage with behavioral verification

## Coding Style Guidelines

### **Control Flow: Switch vs If-Else Chains**

❌ **Bad: Long if-else chains**
```typescript
function handleTaskStatus(status: string): string {
  if (status === 'pending') {
    return 'Task is waiting to be processed';
  } else if (status === 'in_progress') {
    return 'Task is currently being worked on';
  } else if (status === 'completed') {
    return 'Task has been successfully completed';
  } else if (status === 'failed') {
    return 'Task encountered an error and failed';
  } else if (status === 'cancelled') {
    return 'Task was cancelled by user';
  } else {
    return 'Unknown task status';
  }
}
```

✅ **Good: Switch statements for multiple conditions**
```typescript
function handleTaskStatus(status: string): string {
  switch (status) {
    case 'pending':
      return 'Task is waiting to be processed';
    case 'in_progress':
      return 'Task is currently being worked on';
    case 'completed':
      return 'Task has been successfully completed';
    case 'failed':
      return 'Task encountered an error and failed';
    case 'cancelled':
      return 'Task was cancelled by user';
    default:
      return 'Unknown task status';
  }
}
```

**Why switch is better:**
- More readable and scannable
- Easier to add/remove cases
- Better performance for multiple conditions
- TypeScript provides better exhaustiveness checking
- Clear intent for enum-like value handling

### **When to Use Each**

**Use switch when:**
- Comparing a single variable against multiple specific values
- Handling enums or union types
- 3+ conditions on the same variable
- You need fall-through behavior

**Use if-else when:**
- Complex boolean conditions
- Different variables in each condition
- Only 1-2 simple conditions
- Conditions involve ranges or complex logic

```typescript
// Good use of if-else (different conditions)
if (user.isAdmin && hasPermission) {
  return AdminDashboard;
} else if (user.isAuthenticated) {
  return UserDashboard;
} else {
  return LoginPage;
}
```

## File Management

### Document Storage Guidelines
- Temporary documents are saved in the .temp file
- Permanent documents are saved in docs

### Git Workflow Guidelines
- NEVER make PRs into main only dev

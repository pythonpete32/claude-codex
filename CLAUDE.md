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


### Key Technical Details

**Claude Code SDK Integration:**
- Uses `@anthropic-ai/claude-code` SDK for AI interactions
- Enforces subscription mode by removing API key environment variables
- Supports streaming message output with real-time display
- Handles abort signals and graceful shutdown


## Development Workflow

### Code Quality Automation
This project uses automated git hooks via Lefthook:
- **Pre-commit**: Automatically formats staged files with Biome
- **Pre-push**: Runs format check, linting, and tests (blocks push if any fail)

### Testing Strategy
- Uses Vitest for testing with Node.js environment
- Test files: `tests/**/*.{test,spec}.{js,ts}` (separate from source code)
- Coverage reports generated to `coverage/` directory
- Tests run automatically on pre-push hook
- **Testing Guidelines**: See @docs/TESTING.md for patterns and best practices

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

## Project Context

This is part of a larger "Claude Codex" automation toolkit. The current implementation provides a foundation CLI that interfaces with Claude Code SDK. According to the PRD, this will evolve into a TDD (Test-Driven Development) workflow system with background agents for automated feature implementation.

The CLI currently provides basic Claude Code interaction with enhanced UX (colors, streaming, error handling) while ensuring subscription-based authentication.

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

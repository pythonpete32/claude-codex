---
"claude-codex": minor
---

Implement complete TDD Workflow Orchestration & CLI Integration

Add comprehensive Test-Driven Development workflow system with agent coordination, CLI integration, and GitHub operations. This is the core feature implementation per SPEC.md requirements.

**Major Features Added:**
- Complete CLI system with argument parsing and validation
- TDD workflow orchestrator with Coder/Reviewer agent coordination
- Git worktree isolation for clean task execution
- GitHub integration for PR creation and management
- Comprehensive state management with atomic operations
- Environment validation and preflight checks
- Error handling with specific error types
- Agent prompt generation and formatting
- Comprehensive test coverage (205 tests, >95% coverage)

**New CLI Commands:**
- `claude-codex tdd <spec-file>` - Launch TDD workflow with options for reviews, branch, cleanup, and verbose output

**Technical Architecture:**
- Modular operations layer (GitHub, prompts, state, worktree)
- Robust error handling with specific error classes
- TypeScript strict typing throughout
- Comprehensive testing with mocked dependencies
- Integration with Claude Code SDK for agent execution

This implements the complete specification from Task 03 and provides the foundation for future workflow types.
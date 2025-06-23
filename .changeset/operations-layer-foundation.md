---
"claude-codex": minor
---

Implement core operations layer and development infrastructure

Add comprehensive operations layer with GitHub integration, state management, worktree operations, and development infrastructure improvements per SPEC.md requirements.

**Core Operations Added:**
- GitHub API integration with authentication and PR management
- State management with atomic file operations and task persistence
- Git worktree operations for isolated development environments
- Prompt generation system for agent coordination
- Claude Code SDK integration with subscription authentication

**Development Infrastructure:**
- Comprehensive testing strategy with 205+ tests
- CLAUDE.md project instructions and development workflow
- TESTING.md guidelines for behavioral testing patterns
- Task specifications and architecture documentation
- Biome integration for fast linting and formatting
- Vitest configuration with proper mocking patterns

**Quality Assurance:**
- Dependency injection patterns for testability
- Comprehensive error handling with specific error types
- TypeScript strict configuration throughout
- Pre-commit and pre-push hooks for quality enforcement
- Coverage reporting and test documentation

This establishes the foundation layer that enables the TDD workflow orchestration system.
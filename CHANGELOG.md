# claude-codex

## 0.3.0

### Minor Changes

- b3c98bf: Implement core operations layer and development infrastructure

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

- b3c98bf: Implement complete TDD Workflow Orchestration & CLI Integration

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

### Patch Changes

- b3c98bf: Fix agent responses being saved as empty strings instead of actual content

  Resolves GitHub Issue #12 by implementing proper permission bypass mode in Claude SDK integration. Agent responses are now correctly extracted and saved to task state files.

  - Added `permissionMode: 'bypassPermissions'` to Claude SDK query options
  - Simplified message extraction logic with proper TypeScript type guards
  - Removed complex extraction code and replaced with simple fallback chain
  - All 184 tests passing with improved reliability

- b3c98bf: Update README documentation to accurately reflect Claude Code API usage

  Remove misleading claims about offline capability and code privacy. Update messaging to clarify that workflow orchestration runs locally while still using Claude Code API for agent execution. Focus on the actual value proposition: no additional API costs and local workflow coordination.

  Key changes:

  - Remove "code never leaves machine" claims
  - Remove offline and zero latency assertions
  - Remove cost comparison and detailed documentation sections
  - Remove architecture diagrams with false local-only claims
  - Remove privacy & security section with inaccurate statements
  - Remove enterprise integration and comparison sections
  - Update core messaging to focus on local orchestration with Claude Code API

## 0.2.0

### Minor Changes

- 810f7da: Implement core operations layer and development infrastructure

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

- 810f7da: Implement complete TDD Workflow Orchestration & CLI Integration

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

### Patch Changes

- 810f7da: Update README documentation to accurately reflect Claude Code API usage

  Remove misleading claims about offline capability and code privacy. Update messaging to clarify that workflow orchestration runs locally while still using Claude Code API for agent execution. Focus on the actual value proposition: no additional API costs and local workflow coordination.

  Key changes:

  - Remove "code never leaves machine" claims
  - Remove offline and zero latency assertions
  - Remove cost comparison and detailed documentation sections
  - Remove architecture diagrams with false local-only claims
  - Remove privacy & security section with inaccurate statements
  - Remove enterprise integration and comparison sections
  - Update core messaging to focus on local orchestration with Claude Code API

## 0.1.1

### Patch Changes

- 2f9a8ca: Test automated release workflow with GitHub releases

  This is a test release to verify that the complete automated workflow now works including NPM publishing, Git tag creation, and GitHub release generation.

## 0.1.0

### Minor Changes

- b7719c0: Set up modern development tooling stack

  - Add Biome for fast linting and formatting (replacing ESLint + Prettier)
  - Add Vitest for fast unit testing with coverage support
  - Add Lefthook for automated git hooks (pre-commit formatting, pre-push validation)
  - Add tsup for modern TypeScript bundling optimized for CLI tools
  - Add Changesets for version management and changelog generation
  - Configure all tools to work with Bun package manager
  - Add comprehensive npm scripts for development workflow
  - Create sample tests for messaging utilities
  - Update CLI with proper --version and --help flags
  - Optimize package.json for bundled distribution

### Patch Changes

- Initial release of Claude Codex - Local Background Agents for Software Development

  First public release featuring:

  - TDD workflow with local agent runtime
  - Modern development tooling stack (Biome, Vitest, tsup, Changesets)
  - Complete CI/CD pipeline with GitHub Actions
  - Git worktree isolation and Claude Code integration
  - Zero additional costs - uses existing Claude Code subscription

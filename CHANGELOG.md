# claude-codex

## 0.6.0

### Minor Changes

- 93d6d42: Complete Phase 5: Multi-team system with comprehensive testing and cleanup

  - **BREAKING**: Removed legacy TDD workflow (use team system with 'tdd' type instead)
  - **NEW**: Complete file reorganization by domain (teams/, config/, operations/, shared/, messaging/)
  - **NEW**: TypeScript path mapping with ~ shortcuts for cleaner imports
  - **NEW**: Dynamic version loading with proper error handling (no fallbacks)
  - **FIX**: Critical state management and cleanup error handling bugs
  - **FIX**: All test imports updated after file reorganization
  - **IMPROVE**: 183/183 tests passing with comprehensive coverage
  - **IMPROVE**: Clean Commander.js CLI with --no-cleanup flag
  - **IMPROVE**: Vitest configuration with path mapping support

  This completes the multi-team architecture refactor with full testing coverage and modern file organization.

## 0.5.0

### Minor Changes

- 4fa7dcd: Complete Phase 5: Multi-team system with comprehensive testing and cleanup

  - **BREAKING**: Removed legacy TDD workflow (use team system with 'tdd' type instead)
  - **NEW**: Complete file reorganization by domain (teams/, config/, operations/, shared/, messaging/)
  - **NEW**: TypeScript path mapping with ~ shortcuts for cleaner imports
  - **NEW**: Dynamic version loading with proper error handling (no fallbacks)
  - **FIX**: Critical state management and cleanup error handling bugs
  - **FIX**: All test imports updated after file reorganization
  - **IMPROVE**: 183/183 tests passing with comprehensive coverage
  - **IMPROVE**: Clean Commander.js CLI with --no-cleanup flag
  - **IMPROVE**: Vitest configuration with path mapping support

  This completes the multi-team architecture refactor with full testing coverage and modern file organization.

- a30c52d: Implement core operations layer and development infrastructure

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

- a30c52d: Refactor Claude SDK message processing with single entry point and enhanced functionality

  - **BREAKING CHANGE**: Replace `runAgent()` with `runClaudeAgent()` for all Claude SDK interactions
  - **NEW**: Single SDK wrapper with natural completion (no default maxTurns)
  - **NEW**: Real-time progressive message display during agent execution
  - **NEW**: Comprehensive debug logging with structured metadata
  - **NEW**: Full Claude Code SDK option support with proper TypeScript types
  - **IMPROVED**: Injectable dependencies for reliable testing with debug data
  - **IMPROVED**: Bundle size reduced by 6.4% (37.13KB → 34.76KB)
  - **REMOVED**: Legacy `runAgent()` and `extractMessageText()` functions
  - **FIXED**: Empty finalResponse issues for naturally completed tasks

  This refactor provides a clean, production-ready foundation for Claude SDK interactions with no legacy overhead and improved performance. All 232 tests pass with comprehensive coverage including real debug data integration.

- a30c52d: Implement complete TDD Workflow Orchestration & CLI Integration

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

- a30c52d: Task 05: Message Processing Refactor - Minor Bump (0.2.0 → 0.3.0)

### Patch Changes

- a30c52d: ✨ Enhance Terminal Output with Beautiful Component-Based UI

  Implement comprehensive component-based UI system for terminal output, replacing simple text with professional bordered components. This enhancement provides a much more polished and readable user experience.

  ## New Features

  - **Component-Based Architecture**: Modular UI components with consistent styling
  - **Adaptive Terminal Width**: Responsive 60-120 character range support
  - **Professional Box Components**: Unicode borders with proper spacing and alignment
  - **Enhanced Message Display**: Beautiful formatting for assistant messages, tool calls, and results
  - **Smart Content Truncation**: Intelligent text wrapping and ellipsis handling
  - **ANSI Color Integration**: Full color support with existing picocolors system
  - **Backward Compatibility**: Feature flag system maintains existing functionality

  ## Components Added

  - `BoxComponent`: Core bordered container with smart truncation
  - `MessageCard`: Enhanced assistant message display
  - `ToolCallCard`: Professional tool call formatting
  - `ResultSummary`: Structured tool result presentation
  - `SessionSummary`: Comprehensive session completion details
  - `TodoTable`: Perfectly aligned todo list with colored status indicators
  - `TerminalLayout`: Adaptive width calculation and responsive utilities
  - `MessageFormatter`: Enhanced message processing with component integration

  ## Technical Improvements

  - Dynamic width calculation based on terminal size
  - Visual length calculation excluding ANSI color codes
  - Smart column alignment for tabular data
  - Consistent component styling and spacing
  - Enhanced error handling and edge case management

  All existing functionality is preserved through backward compatibility flags. The new UI system provides a significantly more professional and readable terminal experience while maintaining the same underlying capabilities.

- a30c52d: Fix GITHUB_TOKEN environment variable detection not working

  Resolves GitHub issue #15 where GITHUB_TOKEN environment variable detection was failing for users who stored their tokens in .env files. The system now properly loads environment variables from .env and .env.local files before validation, following standard precedence rules (process.env > .env.local > .env).

  - Added comprehensive .env file loading functionality
  - Enhanced environment validation to handle edge cases
  - Maintains backward compatibility with existing workflows
  - Includes extensive test coverage for various token formats and edge cases

- a30c52d: Update README documentation to accurately reflect Claude Code API usage

  Remove misleading claims about offline capability and code privacy. Update messaging to clarify that workflow orchestration runs locally while still using Claude Code API for agent execution. Focus on the actual value proposition: no additional API costs and local workflow coordination.

  Key changes:

  - Remove "code never leaves machine" claims
  - Remove offline and zero latency assertions
  - Remove cost comparison and detailed documentation sections
  - Remove architecture diagrams with false local-only claims
  - Remove privacy & security section with inaccurate statements
  - Remove enterprise integration and comparison sections
  - Update core messaging to focus on local orchestration with Claude Code API

## 0.4.0

### Minor Changes

- 950c3b0: Implement core operations layer and development infrastructure

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

- 950c3b0: Refactor Claude SDK message processing with single entry point and enhanced functionality

  - **BREAKING CHANGE**: Replace `runAgent()` with `runClaudeAgent()` for all Claude SDK interactions
  - **NEW**: Single SDK wrapper with natural completion (no default maxTurns)
  - **NEW**: Real-time progressive message display during agent execution
  - **NEW**: Comprehensive debug logging with structured metadata
  - **NEW**: Full Claude Code SDK option support with proper TypeScript types
  - **IMPROVED**: Injectable dependencies for reliable testing with debug data
  - **IMPROVED**: Bundle size reduced by 6.4% (37.13KB → 34.76KB)
  - **REMOVED**: Legacy `runAgent()` and `extractMessageText()` functions
  - **FIXED**: Empty finalResponse issues for naturally completed tasks

  This refactor provides a clean, production-ready foundation for Claude SDK interactions with no legacy overhead and improved performance. All 232 tests pass with comprehensive coverage including real debug data integration.

- 950c3b0: Implement complete TDD Workflow Orchestration & CLI Integration

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

- 950c3b0: Task 05: Message Processing Refactor - Minor Bump (0.2.0 → 0.3.0)

### Patch Changes

- 950c3b0: Update README documentation to accurately reflect Claude Code API usage

  Remove misleading claims about offline capability and code privacy. Update messaging to clarify that workflow orchestration runs locally while still using Claude Code API for agent execution. Focus on the actual value proposition: no additional API costs and local workflow coordination.

  Key changes:

  - Remove "code never leaves machine" claims
  - Remove offline and zero latency assertions
  - Remove cost comparison and detailed documentation sections
  - Remove architecture diagrams with false local-only claims
  - Remove privacy & security section with inaccurate statements
  - Remove enterprise integration and comparison sections
  - Update core messaging to focus on local orchestration with Claude Code API

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

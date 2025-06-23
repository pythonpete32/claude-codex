# claude-codex

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

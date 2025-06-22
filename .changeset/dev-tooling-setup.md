---
"claude-codex": minor
---

Set up modern development tooling stack

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
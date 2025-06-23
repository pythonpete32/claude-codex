# Tests Directory Structure

This directory contains all test files for Claude Codex, organized to mirror the source code structure.

## Structure

```
tests/
├── cli/
│   ├── commands/           # CLI command tests
│   │   └── tdd.test.ts    # TDD command handler tests
│   ├── args.test.ts       # Argument parsing tests
│   └── index.test.ts      # Main CLI integration tests
├── core/
│   ├── operations/        # Core operation tests
│   │   ├── github.test.ts    # GitHub API integration tests
│   │   ├── prompts.test.ts   # Prompt formatting tests
│   │   ├── state.test.ts     # Task state management tests
│   │   └── worktree.test.ts  # Git worktree operation tests
│   └── claude.test.ts     # Claude SDK wrapper tests
├── shared/
│   ├── errors.test.ts     # Custom error class tests
│   ├── preflight.test.ts  # Environment validation tests
│   └── types.test.ts      # Type definition tests
├── workflows/
│   └── tdd.test.ts        # TDD workflow orchestrator tests
└── README.md              # This file
```

## Testing Principles

- Tests are **separated from source code** for cleaner organization
- Each test file mirrors its corresponding source file structure
- Follow patterns from `@docs/TESTING.md` for test quality
- Use dependency injection and proper mocking strategies
- Achieve ≥90% test coverage with meaningful behavioral tests

## Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode (for TDD)
bun run test:watch

# Run with coverage report
bun run test:coverage

# Run specific test file
bun run test tests/core/claude.test.ts
```

## Test Organization Guidelines

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test component interactions with mocked external dependencies
- **End-to-End Tests**: Test complete workflows with minimal mocking

See `@docs/TESTING.md` for detailed testing patterns and best practices.
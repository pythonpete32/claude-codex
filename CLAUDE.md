# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Claude Codex** - A DDD (Domain-Driven Design) monorepo for parsing and displaying Claude Code tool logs. The architecture follows a hybrid schema approach where parsers output UI-ready props that components can directly consume.

### Repository Structure
```
claude-codex-1/
├── apps/                    # Application layer
│   ├── api/                # Backend API server (Next.js API routes)
│   └── web/                # Frontend Next.js application
├── packages/               # Core domain packages
│   ├── core/              # Business logic and parsers
│   ├── log-processor/     # Log monitoring and transformation
│   ├── types/             # Shared type definitions
│   └── utils/             # Shared utilities (logging)
├── docs/                   # Architecture documentation
└── LEGACY/                # Previous implementation (preserved)
```

## Essential Commands

```bash
# Development
bun dev              # Start all development servers (API + Web)
bun build            # Build all packages in dependency order
bun test             # Run all tests across packages
bun lint             # Run Biome linter
bun format           # Format code with Biome
bun type-check       # TypeScript type checking

# Testing (from package directory)
bun test             # Run tests for specific package
bun test:watch       # Watch mode for test development
bun test:coverage    # Generate coverage reports
bun test:ui          # Vitest UI for debugging tests

# Run single test file
bun test packages/core/src/parsers/tests/bash-parser.test.ts
```

## Architecture & Key Concepts

### 1. Hybrid Schema Architecture
- **Simple Tools** (Bash, Read, Write): Use flat props for immediate UI consumption
- **Complex Tools** (Grep, MultiEdit, LS): Use structured props for relational data
- **Parser-centric Design**: Parsers transform raw logs into UI-ready props
- **No Runtime Transformation**: Components directly consume parser output

### 2. Parser Architecture
All parsers follow this pattern:
```typescript
parse(toolCall: LogEntry, toolResult?: LogEntry, config?: ParseConfig): ToolProps
```

Key responsibilities:
- Extract ALL data from raw log fixtures (never comment out fields)
- Map tool-specific statuses to normalized UI statuses
- Output props that UI components can directly consume
- Handle correlation via UUIDs for tool call/result linking

### 3. Status Mapping
The `StatusMapper` harmonizes diverse tool statuses:
- Normalized statuses: `pending`, `running`, `completed`, `failed`, `interrupted`, `unknown`
- Preserves original status for debugging
- Handles MCP tool variability gracefully

### 4. Type System
- All UI props centralized in `@claude-codex/types`
- Parser interfaces and base types defined here
- StatusMapper included for consistent status handling
- **CRITICAL**: All types MUST follow `/docs/SOT/0_1_type-system-design-authority.md`

## Critical Principles

### 1. NEVER BE LAZY - Extract ALL Data from Raw Logs

**The source of truth is ALWAYS the raw log data in fixtures, NOT the initial type definitions.**

- Parsers should be transparent pipes that extract ALL available data
- NEVER comment out fields because of type mismatches - fix the types instead
- If data exists in the raw logs, it MUST be extracted and passed through
- The UI components should decide what to show, not the parsers

### 2. ABSOLUTELY NO `any` TYPES

The `any` type is FORBIDDEN in this codebase. Instead:
- Use proper TypeScript interfaces for all data structures
- Use `unknown` for truly unknown data, then narrow with type guards
- Leverage TypeScript's strict mode for compile-time safety

### 3. NEVER USE RELATIVE IMPORTS

In this monorepo, always use workspace imports:
```typescript
// ✅ CORRECT
import { parserLogger } from '@claude-codex/utils';

// ❌ WRONG
import { parserLogger } from '../../../utils/src/logger';
```

### 4. Always Update Documentation When Deviating

When making architectural decisions that deviate from the original plan:
1. Update `docs/scratch-pads/ddd-architecture-deviations.md`
2. Explain WHY the deviation was necessary
3. Document WHAT changed
4. Describe the IMPACT of the change

### 5. Validate Against Real Fixture Data

Before implementing any parser:
1. Check the actual fixture files in `packages/core/src/parsers/fixtures/`
2. Understand the real data structure
3. Don't make assumptions - test against multiple examples

### 6. TYPE SAFETY IS FOUNDATIONAL

**All type definitions MUST follow the Source of Truth document.**

- **Before creating ANY type**: Read `/docs/SOT/0_1_type-system-design-authority.md`
- **Output field naming**: Simple tools use direct props, complex tools use `results`
- **Inheritance rules**: Extend proper base classes (CommandToolProps, FileToolProps, SearchToolProps, MCPToolProps)
- **No mixed patterns**: Either fully flat OR fully structured - never mixed
- **No exceptions**: Deviations require approval and documentation

## Testing Standards

- All parsers must have 100% test coverage
- Test fixtures use real Claude Code log data
- Tests should cover success, failure, and edge cases
- Use descriptive test names that explain the scenario

## Logging Architecture

The project uses Pino for structured logging:
- Logger instances created per package: `parserLogger`, `processorLogger`, etc.
- Dependency injection pattern keeps types package pure
- Log levels: trace, debug, info, warn, error, fatal
- Pretty printing in development, JSON in production

## Common Patterns

### Parser Implementation Pattern
```typescript
export class BashToolParser implements ToolParser<LogEntry, LogEntry, BashToolProps> {
  parse(toolCall: LogEntry, toolResult?: LogEntry): BashToolProps {
    // 1. Extract correlation data (UUIDs)
    // 2. Extract tool-specific input
    // 3. Extract output and determine status
    // 4. Map status using StatusMapper
    // 5. Return UI-ready props
  }
}
```

### Adding New Parsers
1. **READ THE SOT FIRST**: `/docs/SOT/0_1_type-system-design-authority.md`
2. Define UI props in `packages/types/src/ui-props/` (following SOT rules)
3. Create parser in `packages/core/src/parsers/`
4. Add fixtures in `packages/core/src/parsers/fixtures/`
5. Write comprehensive tests
6. Register in parser registry

## Important Files to Know

- **`docs/SOT/0_1_type-system-design-authority.md`** - **MUST READ**: Source of truth for all type definitions
- `docs/hybrid-schema-architecture.md` - Core architecture documentation
- `docs/scratch-pads/ddd-architecture-deviations.md` - Track all changes from original plan
- `packages/types/src/status-mapper.ts` - Status harmonization logic
- `packages/core/src/parsers/registry.ts` - Parser registration system
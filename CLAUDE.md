# CLAUDE.md - Project-Specific Instructions for Claude Codex

## Critical Principles

### 1. NEVER BE LAZY - Extract ALL Data from Raw Logs

**Context**: During parser implementation, I made a critical mistake by commenting out error messages and other data fields instead of properly extracting them from the raw logs. This could have derailed the entire project.

**Principle**: 
- The source of truth is ALWAYS the raw log data in fixtures, NOT the initial type definitions
- Parsers should be transparent pipes that extract ALL available data from logs
- NEVER comment out fields because of type mismatches - fix the types instead
- If data exists in the raw logs, it MUST be extracted and passed through

**Why This Matters**:
- Error messages are valuable for users to understand failures
- Metadata (counts, priorities, statuses) helps the UI provide better experiences
- Losing information at the parser level makes the entire system less useful
- The UI components should decide what to show, not the parsers

**Correct Approach**:
1. FIRST examine the fixture data to understand what's available
2. THEN update type definitions to match the actual data structure
3. FINALLY implement parsers to extract all available data
4. NEVER skip fields just to make TypeScript happy

**Example of WRONG approach**:
```typescript
// DON'T DO THIS
// let errorMessage: string | undefined; // TODO: surface errors in UI
```

**Example of RIGHT approach**:
```typescript
// DO THIS
let errorMessage: string | undefined;
// ... extract from toolUseResult
errorMessage = rawResult.errorMessage || rawResult.error || rawResult.message;
```

### 2. Always Update Documentation When Deviating

When making architectural decisions that deviate from the original plan:
1. Update `docs/scratch-pads/ddd-architecture-deviations.md`
2. Explain WHY the deviation was necessary
3. Document WHAT changed
4. Describe the IMPACT of the change

### 3. ABSOLUTELY NO `any` TYPES - Use Proper Type Safety

**Context**: The codebase had multiple `any` types that completely disable TypeScript's type checking and create dangerous runtime errors.

**Principle**:
- The `any` type is ABSOLUTELY FORBIDDEN in this codebase
- ALWAYS use proper TypeScript interfaces and type definitions
- Use `unknown` for truly unknown data, then narrow with type guards
- Create specific interfaces for structured data (RawToolResult, ParsedToolOutput, etc.)

**Why This Matters**:
- `any` disables ALL type checking and defeats the purpose of TypeScript
- It creates runtime errors that could have been caught at compile time
- It makes refactoring dangerous and error-prone
- It reduces code quality and maintainability significantly

**Correct Approach**:
1. Define proper interfaces for all data structures
2. Use type-safe parsing with proper type guards
3. Leverage TypeScript's type system for compile-time safety
4. Use `unknown` and type narrowing instead of `any`

**Example of WRONG approach**:
```typescript
// NEVER DO THIS
const output = result.output as any;
const rawResult: any = getData();
```

**Example of RIGHT approach**:
```typescript
// DO THIS
const output = result.output as ParsedToolOutput;
const rawResult: RawToolResult | null = extractRawToolResult(toolResult);
```

### 4. Validate Against Real Data

Before implementing any parser or type definition:
1. Check the actual fixture files
2. Understand the real data structure
3. Don't make assumptions about what data is available
4. Test against multiple examples to ensure completeness

## Project Context

This is Claude Codex - a DDD monorepo implementation for parsing and displaying Claude Code tool logs. The architecture follows a hybrid schema approach where parsers output UI-ready props that components can directly consume.

Key architectural decisions:
- Parsers output exactly what UI components need
- StatusMapper harmonizes diverse tool statuses
- All tool data from logs should be preserved
- The UI decides what to display, not the parsers

## Tools and Technologies

- bun is our package manager

## Remember

Being thorough and extracting all data is NOT over-engineering - it's building a robust system that gives users and UI components maximum flexibility. Taking shortcuts by commenting out "difficult" fields is technical debt that compounds quickly.
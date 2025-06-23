# Task 01: Foundation Layer Implementation

## Overview
Implement the core foundation layer that provides the essential building blocks for the TDD workflow. This layer includes type definitions, error handling, Claude SDK integration, and task state management.

## Architecture Reference
**IMPORTANT**: This task implements components specified in the [**SPEC.md**](../SPEC.md) document, which is the **single source of truth** for the TDD workflow implementation.

Specifically references:
- [SPEC - Consolidated Type Definitions](../SPEC.md#consolidated-type-definitions-sharedtypests)
- [SPEC - Error Handling Standards](../SPEC.md#error-handling-standards-sharederrorsts)  
- [SPEC - State Manager](../SPEC.md#state-manager-coreoperationsstatets)

**All implementation must follow the SPEC.md document exactly. Do not deviate from the specification.**

## Scope
Create the foundational components that all other TDD workflow components depend on:

1. **Type definitions** (`src/shared/types.ts`)
2. **Error classes** (`src/shared/errors.ts`) 
3. **Claude SDK wrapper** (`src/core/claude.ts`)
4. **Task state management** (`src/core/operations/state.ts`)

## Requirements

### 1. Type Definitions (`src/shared/types.ts`)
**Objective**: Define all TypeScript interfaces and types used across the TDD workflow.

**Key Types to Implement**:
- Re-export Claude Code SDK types: `SDKMessage`, `SDKResult`
- Core workflow types: `TaskState`, `WorktreeInfo`, `TDDOptions`, `TDDResult`
- Component-specific types: `PRInfo`, `GitHubConfig`, `CoderPromptOptions`, `ReviewerPromptOptions`

**Code Structure Example**:
```typescript
// Re-export Claude Code types
export type { SDKMessage } from "@anthropic-ai/claude-code";

// Core workflow types  
export interface TaskState {
  taskId: string;
  specPath: string;
  // ... (see architecture for complete interface)
}

export interface TDDOptions {
  specPath: string;
  maxReviews: number;
  // ... (see architecture for complete interface)  
}
```

**Reference**: See [Consolidated Type Definitions](../SPEC.md#consolidated-type-definitions-sharedtypests) for complete interface specifications.

### 2. Error Classes (`src/shared/errors.ts`)
**Objective**: Provide standardized error handling across all components.

**Implementation**: Create custom error classes for each error scenario identified in the architecture.

**Code Structure Example**:
```typescript
export class SpecFileNotFoundError extends Error {
  constructor(specPath: string) {
    super(`Specification file not found: ${specPath}`);
    this.name = 'SpecFileNotFoundError';
  }
}
```

**Reference**: See [Error Handling Standards](../SPEC.md#error-handling-standards-sharederrorsts) for complete list of required error classes.

### 3. Claude SDK Wrapper (`src/core/claude.ts`)
**Objective**: Provide a clean interface for agent execution using the official Claude Code SDK.

**Claude Code SDK Documentation**: 
- Official docs: https://docs.anthropic.com/en/docs/claude-code/sdk#typescript
- Package types: Available in `@anthropic-ai/claude-code` (already installed in project)

**Key Functions to Implement**:
```typescript
export interface AgentOptions {
  prompt: string;
  maxTurns?: number; 
  cwd?: string;
  abortController?: AbortController;
}

export interface AgentResult {
  messages: SDKMessage[];
  finalResponse: string;
  success: boolean;
  cost: number;
  duration: number;
}

export async function runAgent(options: AgentOptions): Promise<AgentResult>
```

**CRITICAL: Subscription Authentication**:
You **MUST** call `forceSubscriptionAuth()` from `src/lib.ts` before any Claude SDK operations to prevent accidental API key usage.

```typescript
import { forceSubscriptionAuth } from '../lib.js';

export async function runAgent(options: AgentOptions): Promise<AgentResult> {
  // CRITICAL: Force subscription auth to prevent API key usage
  forceSubscriptionAuth();
  
  // ... rest of implementation
}
```

**Why This Is Critical**: Without `forceSubscriptionAuth()`, the SDK might accidentally use the user's API key instead of their Claude Code subscription, resulting in unexpected charges.

**SDK Usage Pattern**:
```typescript
import { query, type SDKMessage } from "@anthropic-ai/claude-code";

// Basic usage pattern
for await (const message of query({
  prompt: options.prompt,
  abortController: options.abortController,
  options: { maxTurns: options.maxTurns }
})) {
  // Process streaming messages
}
```

### 4. Task State Management (`src/core/operations/state.ts`)
**Objective**: Manage `.codex/task-{id}.json` files for workflow coordination.

**Key Functions**: Implement all functions specified in [State Manager section of SPEC.md](../SPEC.md#state-manager-coreoperationsstatets).

**Critical Requirements**:
- Atomic file operations (use temporary files + rename)
- Proper error handling for file system operations
- Thread-safe state updates
- Automatic `.codex/` directory creation

## Testing Strategy

### Unit Tests Required
Create comprehensive test coverage for each component:

**Type Tests** (`tests/shared/types.test.ts`):
- Validate interface completeness
- Test type compatibility with Claude SDK types
- Ensure no breaking changes to public interfaces

**Error Tests** (`tests/shared/errors.test.ts`):
- Test error construction with proper messages
- Validate error inheritance chain
- Test error serialization/deserialization

**Claude SDK Tests** (`tests/core/claude.test.ts`):
- Mock Claude SDK `query` function
- Test different response scenarios (success, error, timeout)
- Test message extraction logic
- Test cost and duration tracking
- Test abort controller functionality

**State Management Tests** (`tests/core/operations/state.test.ts`):
- File system operations (mock `fs` module)
- Concurrent access scenarios
- Invalid JSON handling
- Directory creation
- State validation
- Cleanup operations

### Test Setup Requirements
- Use Vitest framework (already configured)
- Mock file system operations using `vitest.mock('fs/promises')`
- Mock Claude SDK using `vitest.mock('@anthropic-ai/claude-code')`
- Create temporary directories for integration tests
- Use factory functions for test data generation

### Test Data Patterns
```typescript
// Example test factory
function createMockTaskState(overrides: Partial<TaskState> = {}): TaskState {
  return {
    taskId: 'test-task-123',
    specPath: './test-spec.md',
    originalSpec: 'Test specification content',
    // ... complete with defaults
    ...overrides
  };
}
```

## Definition of Done

### Code Requirements
- [ ] All TypeScript interfaces implemented per architecture specification
- [ ] All error classes created with proper inheritance and messages
- [ ] Claude SDK wrapper handles all message types and error scenarios
- [ ] State management supports all required operations with atomic file handling
- [ ] All functions have proper TypeScript type annotations
- [ ] No `any` types used (use proper generic constraints)
- [ ] All exports properly declared in module files

### Testing Requirements  
- [ ] Unit test coverage ≥90% for all components
- [ ] All error scenarios tested with appropriate error types
- [ ] File system operations tested with mocked dependencies
- [ ] Claude SDK integration tested with mocked responses
- [ ] Edge cases covered (malformed JSON, missing files, concurrent access)
- [ ] Test factories created for reusable test data
- [ ] Integration tests pass with temporary file system

### Quality Requirements
- [ ] Code passes Biome linting and formatting checks
- [ ] No TypeScript compilation errors or warnings
- [ ] All functions documented with TSDoc comments
- [ ] Error messages are clear and actionable for users
- [ ] Follows existing codebase patterns and conventions

### Integration Requirements  
- [ ] Types are properly exported and importable by other modules
- [ ] Error classes are properly exported for use in other components
- [ ] Claude SDK wrapper is ready for use by workflow orchestrator
- [ ] State management can persist and retrieve task state across process restarts
- [ ] All components work together without circular dependencies

### Documentation Requirements
- [ ] README updated with foundation layer overview
- [ ] API documentation generated for all public interfaces
- [ ] Error handling guide created for component consumers
- [ ] Testing guide updated with new test patterns

## Dependencies
- `@anthropic-ai/claude-code` (already installed)
- Node.js `fs/promises` for file operations
- Built-in `path` module for file path operations

## Estimated Effort
**2-3 developer days** for implementation and comprehensive testing.

## Next Steps
Upon completion, this foundation enables parallel development of:
- Operations layer (worktree, GitHub, prompts)
- Workflow orchestrator
- CLI integration
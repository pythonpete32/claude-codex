# Task 04: GitHub Issue Integration for TDD Workflow

## Overview

Extend the existing TDD workflow to support GitHub issues as specification input, enabling developers to run `claude-codex tdd --issue 123` in addition to the existing `claude-codex tdd --spec ./file.md` functionality.

This task builds on the robust foundation established in Tasks 01-03, extending the CLI interface, GitHub operations, and workflow orchestration to support issue-driven development.

## Architecture Reference

**IMPORTANT**: This task extends components specified in the [**SPEC.md**](../SPEC.md) document, which is the **single source of truth** for the enhanced TDD workflow implementation.

Specifically references:
- [SPEC - TDD Workflow Orchestrator](../SPEC.md#tdd-workflow-orchestrator-workflowstddts)
- [SPEC - GitHub Operations](../SPEC.md#github-operations-coreoperationsgithubts)
- [SPEC - Consolidated Type Definitions](../SPEC.md#consolidated-type-definitions-sharedtypests)

**All implementation must follow the SPEC.md document exactly. Do not deviate from the specification.**

## Prerequisites

- **Tasks 01-03** must be completed and tested
- Existing GitHub operations (`getGitHubConfig`, `checkPRExists`) are available
- All foundation types and workflow orchestration are working
- Test coverage for dependencies is ≥90%

## Scope

Extend the existing architecture to support GitHub issue integration:

1. **Interface Extensions** (`src/shared/types.ts` and `src/shared/errors.ts`)
2. **GitHub Operations Enhancement** (`src/core/operations/github.ts`)
3. **CLI Enhancement** (`src/cli/args.ts` and `src/cli/commands/tdd.ts`)
4. **Workflow Orchestration Updates** (`src/workflows/tdd.ts`)
5. **State Management Enhancement** (`src/core/operations/state.ts`)
6. **Prompt Template Updates** (`src/core/operations/prompts.ts`)

## Requirements

### 1. Interface Extensions (`src/shared/types.ts`)

**Objective**: Add GitHub issue support to existing type system.

**Key Interfaces**: Implement all interfaces specified in [Consolidated Type Definitions section of SPEC.md](../SPEC.md#consolidated-type-definitions-sharedtypests).

**Required Interface Changes**:
```typescript
// Add new interface
export interface IssueInfo {
  number: number;
  title: string;
  body: string;
  labels: string[];
  assignees: string[];
  state: 'open' | 'closed';
  url: string;
  createdAt: string;
  updatedAt: string;
}

// Update existing interfaces
export interface TDDOptions {
  specPath?: string;      // Now optional
  issueNumber?: number;   // New field
  maxReviews: number;
  branchName?: string;
  cleanup: boolean;
}

export interface TDDResult {
  success: boolean;
  prUrl?: string;
  iterations: number;
  taskId: string;
  issueNumber?: number;   // New field
  error?: string;
}

export interface TaskState {
  taskId: string;
  specPath?: string;          // Now optional
  issueNumber?: number;       // New field
  originalSpec: string;
  // ... rest unchanged
}

// Update prompt options
export interface CoderPromptOptions {
  specContent: string;
  reviewerFeedback?: string;
  issueNumber?: number;    // New field
}

export interface ReviewerPromptOptions {
  originalSpec: string;
  coderHandoff: string;
  issueNumber?: number;    // New field
}
```

### 2. Error Type Extensions (`src/shared/errors.ts`)

**Objective**: Add issue-specific error handling.

**Required Error Classes**:
```typescript
export class IssueNotFoundError extends Error {
  constructor(issueNumber: number, repo: string);
}

export class InvalidInputError extends Error {
  constructor(message: string);
}
```

### 3. GitHub Operations Enhancement (`src/core/operations/github.ts`)

**Objective**: Add issue fetching capability to existing GitHub operations.

**Main Function**: Implement `fetchIssue` as specified in [GitHub Operations section of SPEC.md](../SPEC.md#github-operations-coreoperationsgithubts).

**Function Signature**:
```typescript
async function fetchIssue(issueNumber: number): Promise<IssueInfo>
```

**Implementation Requirements**:
- Use existing `getGitHubConfig()` for authentication
- Handle GitHub API v3 `/repos/{owner}/{repo}/issues/{issueNumber}` endpoint
- Transform API response to `IssueInfo` interface
- Proper error handling for 404 (IssueNotFoundError) and other API errors
- Follow existing GitHub operations patterns

### 4. CLI Enhancement (`src/cli/args.ts`)

**Objective**: Support mutually exclusive `--spec` and `--issue` arguments.

**Argument Configuration**:
- Make `spec` positional argument optional
- Add `--issue <number>` option with conflict resolution
- Add input validation for mutual exclusivity
- Update help text and examples

**Validation Requirements**:
- Exactly one of `--spec` or `--issue` must be provided
- Issue numbers must be positive integers
- Clear error messages for invalid combinations

### 5. Workflow Orchestration Updates (`src/workflows/tdd.ts`)

**Objective**: Support specification loading from both files and GitHub issues.

**Architectural Pattern**:
```typescript
async function loadSpecificationContent(options: TDDOptions): Promise<string> {
  if (options.specPath) {
    // Existing file loading logic
    return fileContent;
  }
  
  if (options.issueNumber) {
    // New issue loading logic using fetchIssue()
    return issueContent;
  }
  
  throw new InvalidInputError(/* ... */);
}
```

**Integration Points**:
- Use existing workflow orchestration structure
- Extend state initialization with issue metadata
- Pass issue context to prompt formatting
- Include issue number in workflow results

### 6. State Management Enhancement (`src/core/operations/state.ts`)

**Objective**: Update state initialization to handle pre-loaded content.

**Function Signature Change**: Update `initializeTaskState` as specified in [State Manager section of SPEC.md](../SPEC.md#state-manager-coreoperationsstatets).

**Current Signature**:
```typescript
async function initializeTaskState(specPath: string, options: Partial<TaskState>): Promise<TaskState>
```

**Updated Signature**:
```typescript
async function initializeTaskState(taskId: string, content: string, options: Partial<TaskState>): Promise<TaskState>
```

**Breaking Change Considerations**:
- This is a breaking change to existing function signature
- Workflow orchestrator will handle content loading (file or issue)
- State manager receives pre-loaded content

### 7. Prompt Template Updates (`src/core/operations/prompts.ts`)

**Objective**: Include issue context in agent prompts for automatic PR linking.

**Enhancement Pattern**:
- Add issue number context to both Coder and Reviewer prompts
- Include "Fixes #123" instruction for automatic issue linking
- Maintain existing prompt structure and functionality

## Testing Requirements

**Testing Strategy**: Follow the comprehensive testing approach detailed in [TESTING.md](../TESTING.md) - prioritize integration and E2E tests that catch real-world failures.

### Unit Test Coverage (25%)
- `fetchIssue` function with mocked GitHub API responses
- CLI argument parsing with issue options  
- Input validation for mutual exclusivity
- Pure functions and business logic validation

### Integration Test Coverage (50%)
- **Real GitHub API Integration**: Test actual issue fetching with test repositories
- **CLI Argument Integration**: Test complete argument processing pipeline
- **State Management Integration**: Real file I/O with task state persistence
- **Component Boundary Testing**: Verify data flow between modules
- **Flag Combination Testing**: Ensure `--issue` works with all existing flags

### End-to-End Test Coverage (25%)
- **Complete Issue Workflow**: Full `claude-codex tdd --issue 123` execution
- **Backward Compatibility**: Verify existing `--spec` workflows unaffected
- **Error Propagation**: Test error handling from API failures to user messages
- **PR Linking Verification**: Confirm "Fixes #123" appears in generated PRs

### Critical Integration Tests (Required)
```typescript
// Real file I/O test
it('should persist issue metadata to task state file', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'issue-test-'));
  process.chdir(tempDir);
  
  const result = await executeTDDWorkflow({ 
    issueNumber: 123, 
    maxReviews: 1,
    cleanup: false 
  });
  
  // Read actual task state from disk
  const taskState = JSON.parse(
    await readFile(`.codex/task-${result.taskId}.json`, 'utf-8')
  );
  
  expect(taskState.issueNumber).toBe(123);
  expect(taskState.originalSpec).toContain('issue content');
});

// Flag isolation test  
it('should behave identically with --issue vs --spec for same content', async () => {
  // Mock issue to return same content as test file
  const testContent = 'Feature specification content';
  vi.mocked(fetchIssue).mockResolvedValue({
    number: 123,
    body: testContent,
    // ... other fields
  });
  
  const issueResult = await executeTDDWorkflow({ issueNumber: 123, maxReviews: 1 });
  const specResult = await executeTDDWorkflow({ specPath: './spec.md', maxReviews: 1 });
  
  // Core behavior should be identical
  expect(issueResult.success).toBe(specResult.success);
  expect(issueResult.iterations).toBe(specResult.iterations);
});
```

### Error Scenario Coverage
- **API Failures**: 404 responses, rate limiting, network timeouts
- **Permission Errors**: Private repository access without proper tokens
- **Invalid Input**: Non-existent issues, malformed issue numbers
- **Integration Failures**: GitHub API down, authentication failures

### Bug Reproduction Tests
Before implementing, create failing tests that reproduce discovered bugs:
```typescript
describe('Bug Prevention', () => {
  it('should not save empty issue content to task state', async () => {
    // This test ensures we don't repeat agent response saving bugs
    const result = await executeTDDWorkflow({ issueNumber: 123, maxReviews: 1 });
    const taskState = await getTaskState(result.taskId);
    
    expect(taskState.originalSpec).not.toBe('');
    expect(taskState.originalSpec).toContain('issue content');
  });
});

## Success Criteria

- [ ] CLI supports both `--spec <file>` and `--issue <number>` arguments (mutually exclusive)
- [ ] GitHub issue content is fetched and used as specification input
- [ ] Generated PRs automatically link to the originating issue via "Fixes #123"
- [ ] All existing spec-file functionality continues to work unchanged
- [ ] Comprehensive test coverage (≥90%) for all new functionality
- [ ] Error handling for invalid issues, permissions, and API failures
- [ ] Function signatures match SPEC.md definitions exactly

## Implementation Notes

### Architectural Considerations
- Maintain separation of concerns between content loading and state management
- Reuse existing GitHub operations patterns and error handling
- Preserve backward compatibility with current TDD workflows
- Follow established testing patterns from previous tasks

### Edge Cases
- Empty issue bodies or titles
- Private repository access
- GitHub API rate limiting
- Network timeouts during issue fetching

This task extends the existing TDD workflow architecture to support GitHub issue integration while maintaining the architectural integrity and patterns established in Tasks 01-03.
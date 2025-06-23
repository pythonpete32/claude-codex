# Task 02: Operations Layer Implementation

## Overview
Implement the operations layer that provides git worktree management, GitHub API integration, and prompt formatting utilities. This layer builds on the foundation layer and provides the core operational capabilities needed by the TDD workflow orchestrator.

## Architecture Reference
**IMPORTANT**: This task implements components specified in the [**SPEC.md**](../SPEC.md) document, which is the **single source of truth** for the TDD workflow implementation.

Specifically references:
- [SPEC - Worktree Operations](../SPEC.md#worktree-operations-coreoperationsworktreetts)
- [SPEC - GitHub Operations](../SPEC.md#github-operations-coreoperationsgithubts)
- [SPEC - Prompt Utilities](../SPEC.md#prompt-utilities-coreoperationspromptstt)

**All implementation must follow the SPEC.md document exactly. Do not deviate from the specification.**

## Prerequisites
- **Task 01** (Foundation Layer) must be completed
- Foundation types (`TaskState`, `WorktreeInfo`, `PRInfo`, etc.) are available
- Claude SDK wrapper is implemented and tested

## Scope
Create the operations components that handle external integrations and utilities:

1. **Git worktree operations** (`src/core/operations/worktree.ts`)
2. **GitHub API integration** (`src/core/operations/github.ts`)
3. **Prompt formatting utilities** (`src/core/operations/prompts.ts`)

## Requirements

### 1. Git Worktree Operations (`src/core/operations/worktree.ts`)
**Objective**: Manage isolated git worktrees for task execution without conflicts.

**Key Functions**: Implement all functions specified in [Worktree Operations section of SPEC.md](../SPEC.md#worktree-operations-coreoperationsworktreetts).

**Critical Implementation Details**:
- Worktree path pattern: `../.codex-worktrees/{taskId}`
- Branch naming: `tdd/{taskId}` or user-provided name
- Safe cleanup that won't fail if worktree already removed
- Proper git command error handling and validation

**Example Implementation Approach**:
```typescript
export async function createWorktree(
  taskId: string, 
  options?: { branchName?: string, baseBranch?: string }
): Promise<WorktreeInfo> {
  // 1. Validate git repository
  await isGitRepository(); // throws if not git repo
  
  // 2. Get base branch and generate names
  const baseBranch = options?.baseBranch || await getCurrentBranch();
  const branchName = options?.branchName || `tdd/${taskId}`;
  
  // 3. Execute git worktree command with proper error handling
  // 4. Return WorktreeInfo object
}
```

**Git Command Execution**: Use Node.js `child_process.exec` with proper error handling and command validation.

### 2. GitHub API Integration (`src/core/operations/github.ts`)
**Objective**: Detect pull request creation as workflow success indicator.

**Key Functions**: Implement all functions specified in [GitHub Operations section of SPEC.md](../SPEC.md#github-operations-coreoperationsgithubts).

**GitHub API Details**:
- **API Version**: REST API v3 for maximum compatibility
- **Authentication**: Uses `GITHUB_TOKEN` environment variable
- **Endpoint**: `GET /repos/{owner}/{repo}/pulls`
- **Rate Limiting**: Handle 403 responses appropriately

**Repository Detection Pattern**:
```typescript
export async function getGitHubConfig(): Promise<GitHubConfig> {
  // 1. Validate GITHUB_TOKEN exists
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new GitHubAuthError('GITHUB_TOKEN not found');
  
  // 2. Get git remote URL
  const remoteUrl = await exec('git remote get-url origin');
  
  // 3. Parse URL for owner/repo (handle both HTTPS and SSH)
  // HTTPS: https://github.com/owner/repo.git
  // SSH: git@github.com:owner/repo.git
  
  return { token, owner, repo };
}
```

**HTTP Client**: Use Node.js built-in `fetch` or `https` module with proper error handling.

### 3. Prompt Formatting Utilities (`src/core/operations/prompts.ts`)
**Objective**: Format agent prompts with proper context and structure for consistent agent behavior.

**Key Functions**: Implement all functions specified in [Prompt Utilities section of SPEC.md](../SPEC.md#prompt-utilities-coreoperationspromptstt).

**Prompt Templates**: Use the exact templates from [TDD PRD - Agent Prompts](../claude-codex-tdd-prd.md#agent-prompts).

**Template Approach**:
```typescript
export async function formatCoderPrompt(options: CoderPromptOptions): Promise<string> {
  const isRevision = !!options.reviewerFeedback;
  
  if (isRevision) {
    return `Address this review feedback: ${options.reviewerFeedback}
Update tests and implementation as needed.

${CODER_HANDOFF_TEMPLATE}`;
  } else {
    return `Implement the specification in the provided file using Test-Driven Development:
1. Read and understand the requirements
2. Write comprehensive tests first  
3. Implement the minimal code to pass tests
4. Refactor for quality and clarity

SPECIFICATION:
${options.specContent}

${CODER_HANDOFF_TEMPLATE}`;
  }
}
```

**Message Extraction**: Handle different Claude SDK message content structures safely.

## Testing Strategy

### Unit Tests Required

**Worktree Tests** (`tests/core/operations/worktree.test.ts`):
- Mock `child_process.exec` for git command testing
- Test successful worktree creation with generated paths/branches
- Test worktree creation with custom branch names
- Test cleanup operations (both success and failure scenarios)
- Test git repository validation
- Test branch detection and parsing
- Test error scenarios (invalid repos, command failures, permission issues)

**GitHub Tests** (`tests/core/operations/github.test.ts`):
- Mock HTTP requests using `nock` or similar
- Test GitHub config extraction from different remote URL formats
- Test PR detection with various API responses
- Test authentication error handling
- Test rate limiting scenarios
- Test API error responses (404, 403, etc.)
- Test repository URL parsing edge cases

**Prompt Tests** (`tests/core/operations/prompts.test.ts`):
- Test coder prompt formatting for initial runs
- Test coder prompt formatting for revision runs
- Test reviewer prompt formatting with all context
- Test message extraction from different SDK response formats
- Test template consistency and required sections
- Test edge cases (empty content, malformed messages)

### Integration Tests Required
- **Git Integration**: Test with real temporary git repositories
- **GitHub Integration**: Test with GitHub API using test tokens (if available)
- **End-to-End**: Test prompt → agent execution → response extraction

### Test Setup Patterns
```typescript
// Git command mocking
vi.mock('child_process', () => ({
  exec: vi.fn()
}));

// HTTP request mocking  
import nock from 'nock';
const scope = nock('https://api.github.com')
  .get('/repos/owner/repo/pulls')
  .reply(200, mockPRResponse);

// Temporary git repository setup
async function setupTempGitRepo(): Promise<string> {
  // Create temp directory with git init
  // Add initial commit
  // Return repo path for testing
}
```

## Definition of Done

### Code Requirements
- [ ] All functions implemented per architecture specifications
- [ ] Git worktree operations handle all specified scenarios safely
- [ ] GitHub API integration supports both public and private repositories
- [ ] Prompt formatting produces templates matching PRD specifications
- [ ] All functions have proper error handling with custom error types
- [ ] TypeScript types are properly used throughout
- [ ] No hardcoded values (use constants and configuration)

### Testing Requirements
- [ ] Unit test coverage ≥90% for all functions
- [ ] All git commands tested with mocked child processes
- [ ] HTTP requests tested with mocked responses
- [ ] Error scenarios comprehensively tested
- [ ] Integration tests pass with temporary repositories
- [ ] Mock strategies documented for future test development

### Quality Requirements  
- [ ] Code passes Biome linting and formatting checks
- [ ] No TypeScript compilation errors or warnings
- [ ] Git operations are safe and don't affect main repository
- [ ] HTTP requests include proper error handling and timeouts
- [ ] Prompt templates are maintainable and parameterized

### Integration Requirements
- [ ] Components integrate cleanly with foundation layer types
- [ ] Error types from foundation layer are used consistently
- [ ] Functions are ready for consumption by workflow orchestrator
- [ ] No circular dependencies between operations components
- [ ] Operations can be used independently for testing

### Security Requirements
- [ ] GitHub token handling follows security best practices
- [ ] Git operations are safely scoped to worktrees
- [ ] No secrets or tokens logged or exposed in error messages
- [ ] Input validation prevents command injection in git operations

## Dependencies
- Foundation layer types and errors (from Task 01)
- Node.js `child_process` for git command execution
- Node.js `fetch` or `https` for GitHub API calls
- Git command-line tool (runtime dependency)

## Environment Requirements
- Git repository with remote origin pointing to GitHub
- `GITHUB_TOKEN` environment variable for API access
- Write permissions for worktree directory creation

## Estimated Effort
**3-4 developer days** for implementation and comprehensive testing.

## Notes for Reviewer
When reviewing this task completion:

1. **Git Safety**: Verify that all git operations are properly scoped to worktrees and won't affect the main repository
2. **Error Handling**: Ensure all external commands and API calls have proper error handling
3. **Template Consistency**: Validate that prompt templates match the PRD specifications exactly
4. **Security**: Check that no tokens or sensitive data are logged or exposed
5. **Integration**: Verify that all functions integrate properly with foundation layer types

## Next Steps
Upon completion, this operations layer enables implementation of:
- TDD Workflow Orchestrator (Task 03)
- CLI integration and command routing
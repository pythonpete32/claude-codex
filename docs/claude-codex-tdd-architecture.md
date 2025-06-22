# Claude Codex TDD Workflow - Architecture Specification

## High-Level Architectural Structure

Based on your requirements, I propose this modular structure for the TDD workflow:

### **Core Architecture Layers**

```
src/
├── cli/
│   ├── args.ts (extend existing for `tdd` subcommand)
│   └── commands/
│       └── tdd.ts (TDD command handler)
├── core/
│   ├── messaging.ts (existing)
│   ├── query.ts (existing - runClaudeWithSDK)
│   ├── auth.ts (existing)
│   └── operations/
│       ├── worktree.ts (git worktree management)
│       ├── github.ts (GitHub REST API client)
│       ├── prompts.ts (prompt templating utilities)
│       └── state.ts (`.codex/` state management)
├── workflows/
│   └── tdd.ts (main TDD workflow orchestrator)
├── shared/
│   ├── types.ts (all interfaces and types)
│   ├── errors.ts (custom error classes)
│   └── preflight.ts (environment validation)
└── index.ts (existing entry point)
```

### **Data Flow Overview**
1. **CLI** → Parse `tdd` command + spec file path
2. **TDD Workflow** → Initialize state, create worktree
3. **TDD Workflow** → Format Coder prompt → runClaudeWithSDK → Extract handoff
4. **State Manager** → Save coder handoff
5. **TDD Workflow** → Format Reviewer prompt → runClaudeWithSDK → Extract result
6. **GitHub Client** → Check for PR creation
7. **TDD Workflow** → Loop or cleanup based on results

### **Key Design Principles**
- **Intelligent Agent Coordination**: The orchestration coordinates intelligent agents, trusting them to do their jobs well while ensuring proper handoffs
- **State-Driven**: All coordination happens through `.codex/task-{id}.json` files
- **MVP Focus**: Simple, functional components without over-engineering
- **GitHub Native**: Direct REST API integration for PR detection

---

## Detailed Component Specifications

### **TDD Workflow Orchestrator** (`workflows/tdd.ts`)

#### **Purpose**
Main coordinator that handles the complete TDD task lifecycle from spec file to PR creation.

#### **Dependencies**
- `runClaudeWithSDK` from `core/query.ts`
- State management functions from `core/operations/state.ts`
- Worktree functions from `core/operations/worktree.ts`
- GitHub functions from `core/operations/github.ts`
- Prompt utilities from `core/operations/prompts.ts`

#### **Function Signatures**

```typescript
interface TDDOptions {
  specPath: string
  maxReviews: number
  branchName?: string
  cleanup: boolean
}

interface TDDResult {
  success: boolean
  prUrl?: string
  iterations: number
  taskId: string
  error?: string
}

async function executeTDDWorkflow(options: TDDOptions): Promise<TDDResult>
```

#### **Behavioral Description**

**`executeTDDWorkflow(options: TDDOptions): Promise<TDDResult>`**
- **Purpose**: Orchestrates the complete TDD workflow from start to finish
- **Parameters**: 
  - `options.specPath`: Path to the specification markdown file
  - `options.maxReviews`: Maximum number of review iterations (default: 3)
  - `options.branchName`: Optional custom branch name (auto-generated if not provided)
  - `options.cleanup`: Whether to cleanup worktree on failure (default: true)
- **Returns**: TDDResult with success status, PR URL if created, iteration count, and task ID
- **Behavior**:
  1. Generate unique task ID 
  2. Read and validate spec file exists
  3. Create isolated git worktree with new branch
  4. Initialize task state file (`.codex/task-{id}.json`) with worktree info
  5. **Agent Loop** (max iterations):
     - Format Coder Agent prompt with spec + any previous feedback
     - Call `runClaudeWithSDK` with Coder prompt
     - Extract structured handoff from Coder response
     - Save handoff to task state
     - Format Reviewer Agent prompt with original spec + Coder handoff
     - Call `runClaudeWithSDK` with Reviewer prompt
     - Check if PR was created (success condition)
     - If PR exists: return success result
     - If feedback provided: save feedback and continue loop  
     - If neither PR nor feedback: terminate with failure
     - If max iterations reached: return partial result
  6. Cleanup worktree and task state if requested
  7. Return final result with success status and metadata

#### **Error Handling**
- **SpecFileNotFoundError**: When spec file doesn't exist or isn't readable
- **WorktreeCreationError**: When git worktree creation fails
- **AgentExecutionError**: When `runClaudeWithSDK` fails
- **GitHubAPIError**: When PR detection fails
- **StateManagementError**: When task state operations fail

#### **Types/Interfaces Needed**
- `TaskState` - Structure for task state files
- `WorktreeInfo` - Git worktree metadata

---

### **State Manager** (`core/operations/state.ts`)

#### **Purpose**
Manages `.codex/task-{id}.json` files that coordinate data flow between workflow steps and agent iterations.

#### **Dependencies**
- Node.js `fs/promises` for file operations
- `shared/types.ts` for type definitions

#### **Function Signatures**

```typescript
// All interfaces defined in shared/types.ts
interface TaskState {
  taskId: string
  specPath: string
  originalSpec: string
  currentIteration: number
  maxIterations: number
  branchName: string
  worktreeInfo: WorktreeInfo
  coderResponses: string[]
  reviewerResponses: string[]
  createdAt: string
  updatedAt: string
  status: 'running' | 'completed' | 'failed'
}

interface WorktreeInfo {
  path: string
  branchName: string
  baseBranch: string
}

async function initializeTaskState(specPath: string, options: Partial<TaskState>): Promise<TaskState>
async function getTaskState(taskId: string): Promise<TaskState>
async function updateTaskState(taskState: TaskState): Promise<void>
async function addCoderResponse(taskId: string, response: string): Promise<void>
async function addReviewerResponse(taskId: string, response: string): Promise<void>
async function cleanupTaskState(taskId: string): Promise<void>
```

#### **Behavioral Description**

**`initializeTaskState(specPath: string, options: Partial<TaskState>): Promise<TaskState>`**
- **Purpose**: Creates new task state file and returns initialized TaskState
- **Parameters**: 
  - `specPath`: Path to the spec file
  - `options`: Optional overrides for default task state values
- **Returns**: Complete TaskState object with generated taskId and timestamps
- **Behavior**:
  1. Generate unique task ID (timestamp + random suffix)
  2. Read and store original spec content
  3. Create `.codex/` directory if it doesn't exist
  4. Initialize TaskState with defaults and provided options
  5. Write state file to `.codex/task-{id}.json`
  6. Return complete TaskState object

**`getTaskState(taskId: string): Promise<TaskState>`**
- **Purpose**: Retrieves existing task state from file
- **Parameters**: `taskId` - The task identifier
- **Returns**: Complete TaskState object
- **Behavior**: Read and parse `.codex/task-{taskId}.json`, validate structure

**`updateTaskState(taskState: TaskState): Promise<void>`**
- **Purpose**: Overwrites entire task state file with new data
- **Parameters**: `taskState` - Complete updated TaskState object
- **Returns**: void
- **Behavior**: Update `updatedAt` timestamp and write to file atomically

**`addCoderResponse(taskId: string, response: string): Promise<void>`**
- **Purpose**: Appends new coder response to existing task state
- **Parameters**: 
  - `taskId` - The task identifier  
  - `response` - Raw response string from Coder Agent
- **Returns**: void
- **Behavior**: Load state, append response to coderResponses array, update file

**`addReviewerResponse(taskId: string, response: string): Promise<void>`**
- **Purpose**: Appends new reviewer response to existing task state
- **Parameters**: 
  - `taskId` - The task identifier
  - `response` - Raw response string from Reviewer Agent
- **Returns**: void  
- **Behavior**: Load state, append response to reviewerResponses array, update file

**`cleanupTaskState(taskId: string): Promise<void>`**
- **Purpose**: Removes task state file from filesystem
- **Parameters**: `taskId` - The task identifier
- **Returns**: void
- **Behavior**: Delete `.codex/task-{taskId}.json` file

#### **Error Handling**
- **TaskNotFoundError**: When task state file doesn't exist
- **StateParseError**: When task state JSON is malformed
- **FileSystemError**: When file operations fail (permissions, disk space)
- **ValidationError**: When task state structure is invalid

#### **Testing Considerations**
- File operations must be mockable for unit tests
- State validation should be tested with malformed JSON
- Concurrent access scenarios should be considered (though unlikely in MVP)

---

### **Worktree Operations** (`core/operations/worktree.ts`)

#### **Purpose**
Manages git worktree creation and cleanup for task isolation, ensuring each TDD task runs in its own branch and directory.

#### **Dependencies**
- Node.js `child_process` for git command execution
- `shared/types.ts` for WorktreeInfo interface

#### **Function Signatures**

```typescript
// WorktreeInfo defined in shared/types.ts

async function createWorktree(taskId: string, options?: { branchName?: string, baseBranch?: string }): Promise<WorktreeInfo>
async function getCurrentBranch(): Promise<string>
async function isGitRepository(): Promise<boolean>
async function cleanupWorktree(worktreeInfo: WorktreeInfo): Promise<void>
async function listWorktrees(): Promise<WorktreeInfo[]>
```

#### **Behavioral Description**

**`createWorktree(taskId: string, options?: { branchName?: string, baseBranch?: string }): Promise<WorktreeInfo>`**
- **Purpose**: Creates isolated git worktree and branch for TDD task
- **Parameters**: 
  - `taskId`: Unique task identifier for naming consistency
  - `options.branchName`: Optional custom branch name (defaults to `tdd/{taskId}`)
  - `options.baseBranch`: Base branch to branch from (defaults to current branch)
- **Returns**: WorktreeInfo with paths and branch names
- **Behavior**:
  1. Validate we're in a git repository
  2. Get current branch as base (unless overridden)
  3. Generate branch name: `tdd/{taskId}` or use provided name
  4. Create worktree path: `../.codex-worktrees/{taskId}`
  5. Execute: `git worktree add ../.codex-worktrees/{taskId} -b {branchName} {baseBranch}`
  6. Return WorktreeInfo with generated paths and branch names

**`getCurrentBranch(): Promise<string>`**
- **Purpose**: Gets the currently checked out git branch name
- **Parameters**: None
- **Returns**: Current branch name as string
- **Behavior**: Execute `git branch --show-current` and return result

**`isGitRepository(): Promise<boolean>`**
- **Purpose**: Validates that current directory is inside a git repository
- **Parameters**: None
- **Returns**: Boolean indicating if git repo exists
- **Behavior**: Execute `git rev-parse --git-dir` and check for success

**`cleanupWorktree(worktreeInfo: WorktreeInfo): Promise<void>`**
- **Purpose**: Removes git worktree and associated branch
- **Parameters**: `worktreeInfo` - The worktree information to cleanup
- **Returns**: void
- **Behavior**:
  1. Execute: `git worktree remove {worktreeInfo.path}` (removes worktree)
  2. Execute: `git branch -D {worktreeInfo.branchName}` (deletes branch)
  3. Remove empty parent directory if no other worktrees exist

**`listWorktrees(): Promise<WorktreeInfo[]>`**
- **Purpose**: Lists all existing worktrees (useful for debugging/cleanup)
- **Parameters**: None
- **Returns**: Array of WorktreeInfo for all worktrees
- **Behavior**: Parse output of `git worktree list --porcelain`

#### **Error Handling**
- **NotGitRepositoryError**: When not inside a git repository
- **WorktreeCreationError**: When git worktree creation fails (branch exists, path conflicts)
- **WorktreeCleanupError**: When worktree removal fails (worktree in use, permission issues)
- **GitCommandError**: When any git command execution fails

#### **Testing Considerations**
- Git commands must be mockable for unit tests
- Temporary directories needed for integration tests
- Branch name conflicts should be tested
- Cleanup should be tested with both success and failure scenarios

#### **Implementation Notes**
- Worktrees are created outside the main repo to avoid cluttering workspace
- Branch naming follows `tdd/{taskId}` convention for easy identification
- Use `--no-track` when pushing to avoid remote branch cleanup issues
- Cleanup is designed to be safe - won't fail if worktree already removed

---

### **GitHub Operations** (`core/operations/github.ts`)

#### **Purpose**
Handles GitHub REST API integration for PR detection and repository operations, enabling workflow success detection.

#### **Dependencies**
- Node.js `https` or `fetch` for HTTP requests
- GitHub REST API v3
- Environment variable `GITHUB_TOKEN` for authentication

#### **Function Signatures**

```typescript
interface PRInfo {
  number: number
  title: string
  url: string
  state: 'open' | 'closed' | 'merged'
  headBranch: string
  baseBranch: string
}

interface GitHubConfig {
  token: string
  owner: string
  repo: string
}

async function getGitHubConfig(): Promise<GitHubConfig>
async function checkPRExists(branchName: string): Promise<PRInfo | null>
async function listPRsForBranch(branchName: string): Promise<PRInfo[]>
```

#### **Behavioral Description**

**`getGitHubConfig(): Promise<GitHubConfig>`**
- **Purpose**: Extracts GitHub repository info and validates authentication
- **Parameters**: None
- **Returns**: GitHubConfig with token, owner, and repo name
- **Behavior**:
  1. Check for `GITHUB_TOKEN` environment variable
  2. Execute `git remote get-url origin` to get repository URL
  3. Parse URL to extract owner and repo name (handles both HTTPS and SSH formats)
  4. Return validated config object

**`checkPRExists(branchName: string): Promise<PRInfo | null>`**
- **Purpose**: Checks if a pull request exists for the given branch
- **Parameters**: `branchName` - The branch to check for PRs
- **Returns**: PRInfo if PR exists, null if no PR found
- **Behavior**:
  1. Get GitHub config (token, owner, repo)
  2. Call GitHub API: `GET /repos/{owner}/{repo}/pulls?head={owner}:{branchName}&state=open`
  3. If PR found, return formatted PRInfo
  4. If no PR found, return null

**`listPRsForBranch(branchName: string): Promise<PRInfo[]>`**
- **Purpose**: Lists all PRs (open/closed/merged) for a branch (debugging utility)
- **Parameters**: `branchName` - The branch to list PRs for
- **Returns**: Array of all PRInfo for the branch
- **Behavior**: Call GitHub API with `state=all` parameter and return all matches

#### **Error Handling**
- **GitHubAuthError**: When `GITHUB_TOKEN` is missing or invalid
- **GitHubAPIError**: When API requests fail (rate limits, network issues)
- **RepositoryNotFoundError**: When git remote origin is not a GitHub repository
- **ConfigurationError**: When unable to parse repository info from git remote

#### **Testing Considerations**
- GitHub API calls must be mockable for unit tests
- Rate limiting scenarios should be tested
- Different repository URL formats (HTTPS/SSH) should be tested
- Authentication failure scenarios need coverage

#### **Implementation Notes**
- Uses GitHub REST API v3 for compatibility
- Expects standard GitHub token with repo read permissions
- Handles both public and private repositories
- PR detection is immediate after agent execution completes

---

### **Prompt Utilities** (`core/operations/prompts.ts`)

#### **Purpose**
Provides prompt templating utilities for formatting Coder and Reviewer agent prompts with proper context and structure.

#### **Dependencies**
- `shared/types.ts` for interface definitions
- Node.js `fs/promises` for reading spec files
- Existing `runClaudeWithSDK` from `core/query.ts`

#### **Function Signatures**

```typescript
interface CoderPromptOptions {
  specContent: string
  reviewerFeedback?: string
}

interface ReviewerPromptOptions {
  originalSpec: string
  coderHandoff: string
}

async function formatCoderPrompt(options: CoderPromptOptions): Promise<string>
async function formatReviewerPrompt(options: ReviewerPromptOptions): Promise<string>
async function extractFinalMessage(messages: SDKMessage[]): Promise<string>

// Expected runClaudeWithSDK interface (from core/query.ts)
interface ClaudeMaxOptions {
  prompt: string
  // Additional options as defined in existing implementation
}

interface SDKMessage {
  role: 'user' | 'assistant' | 'system'
  content: string | { type: string; text?: string; [key: string]: any }[]
}

interface SDKResult {
  messages: SDKMessage[]
  // Additional fields as defined in existing implementation
}

async function runClaudeWithSDK(options: ClaudeMaxOptions): Promise<SDKResult>
```

#### **Behavioral Description**

**`formatCoderPrompt(options: CoderPromptOptions): Promise<string>`**
- **Purpose**: Formats the prompt for the Coder Agent with spec and optional feedback
- **Parameters**: 
  - `options.specContent`: The specification file content
  - `options.reviewerFeedback`: Optional feedback from previous review iteration (if present, this is a revision run)
- **Returns**: Formatted prompt string ready for `runClaudeWithSDK`
- **Behavior**:
  1. Choose prompt template: initial run if no feedback, revision run if feedback provided
  2. Inject spec content into template
  3. Include reviewer feedback if provided
  4. Add structured handoff template requirement
  5. Return complete prompt string

**`formatReviewerPrompt(options: ReviewerPromptOptions): Promise<string>`**
- **Purpose**: Formats the prompt for the Reviewer Agent with full context
- **Parameters**: 
  - `options.originalSpec`: The original specification content
  - `options.coderHandoff`: The final message content from Coder Agent
- **Returns**: Formatted prompt string ready for `runClaudeWithSDK`
- **Behavior**:
  1. Use reviewer prompt template from PRD
  2. Inject original specification and coder handoff
  3. Add clear outcome instructions (PR creation vs feedback)
  4. Return complete prompt string

**`extractFinalMessage(messages: SDKMessage[]): Promise<string>`**
- **Purpose**: Extracts the final assistant message content from Claude SDK response
- **Parameters**: `messages` - The complete message array from `runClaudeWithSDK`
- **Returns**: The content of the last assistant message as string
- **Behavior**:
  1. Find the last message where `message.role === 'assistant'`
  2. Extract the content (handle both string and complex content structures)
  3. Return the content as plain text

#### **Error Handling**
- **PromptFormattingError**: When template rendering fails
- **MessageExtractionError**: When no assistant message found in SDK response
- **SpecFileError**: When spec file cannot be read or is empty

#### **Testing Considerations**
- Template rendering should be tested with various input combinations
- Message extraction should handle different SDK response formats
- Template consistency with PRD specifications should be validated

#### **Implementation Notes**
- Prompt templates match exactly with PRD specifications
- Uses SDK message structure instead of brittle text parsing
- Simple prompt parameters focused on essential data only
- Orchestrator handles iteration logic, not individual agents

---

## Consolidated Type Definitions (`shared/types.ts`)

```typescript
// Core workflow types
export interface TaskState {
  taskId: string
  specPath: string
  originalSpec: string
  currentIteration: number
  maxIterations: number
  branchName: string
  worktreeInfo: WorktreeInfo
  coderResponses: string[]
  reviewerResponses: string[]
  createdAt: string
  updatedAt: string
  status: 'running' | 'completed' | 'failed'
}

export interface WorktreeInfo {
  path: string
  branchName: string
  baseBranch: string
}

export interface PRInfo {
  number: number
  title: string
  url: string
  state: 'open' | 'closed' | 'merged'
  headBranch: string
  baseBranch: string
}

// Claude SDK types
export interface SDKMessage {
  role: 'user' | 'assistant' | 'system'
  content: string | { type: string; text?: string; [key: string]: any }[]
}

export interface SDKResult {
  messages: SDKMessage[]
  // Additional fields as defined in existing implementation
}

// Configuration types
export interface TDDOptions {
  specPath: string
  maxReviews: number
  branchName?: string
  cleanup: boolean
}

export interface TDDResult {
  success: boolean
  prUrl?: string
  iterations: number
  taskId: string
  error?: string
}

export interface GitHubConfig {
  token: string
  owner: string
  repo: string
}

// Prompt utility types
export interface CoderPromptOptions {
  specContent: string
  reviewerFeedback?: string
}

export interface ReviewerPromptOptions {
  originalSpec: string
  coderHandoff: string
}
```

## Error Handling Standards (`shared/errors.ts`)

```typescript
// Standardized error classes with consistent naming
export class SpecFileNotFoundError extends Error {}
export class WorktreeCreationError extends Error {}
export class AgentExecutionError extends Error {}
export class GitHubAPIError extends Error {}
export class StateManagementError extends Error {}
export class TaskNotFoundError extends Error {}
export class StateParseError extends Error {}
export class FileSystemError extends Error {}
export class ValidationError extends Error {}
export class GitRepositoryNotFoundError extends Error {}
export class WorktreeCleanupError extends Error {}
export class GitCommandError extends Error {}
export class GitHubAuthError extends Error {}
export class RepositoryNotFoundError extends Error {}
export class ConfigurationError extends Error {}
export class PromptFormattingError extends Error {}
export class MessageExtractionError extends Error {}
```

## Environment Validation (`shared/preflight.ts`)

```typescript
export interface PreflightResult {
  success: boolean
  errors: string[]
  warnings: string[]
}

export async function validateEnvironment(): Promise<PreflightResult>
// Validates:
// - Git repository exists
// - GITHUB_TOKEN is present and valid
// - Claude credentials are configured
// - Required directories are writable
```
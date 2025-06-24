// Re-export Claude Code SDK types
export type {
  SDKAssistantMessage,
  SDKMessage,
  SDKResultMessage,
  SDKResultMessage as SDKResult,
  SDKSystemMessage,
  SDKUserMessage,
} from '@anthropic-ai/claude-code';

// Core team workflow types
export interface TaskState {
  taskId: string;
  specOrIssue: string; // Spec file or GitHub issue reference
  teamType: string; // Team type
  currentIteration: number;
  maxIterations: number;
  branchName: string;
  worktreeInfo: WorktreeInfo;
  createdAt: string;
  updatedAt: string;
  status: 'running' | 'completed' | 'failed';
}

export interface WorktreeInfo {
  path: string;
  branchName: string;
  baseBranch: string;
}

export interface PRInfo {
  number: number;
  title: string;
  url: string;
  state: 'open' | 'closed' | 'merged';
  headBranch: string;
  baseBranch: string;
}

// Agent execution types for Claude SDK wrapper

// Team coordination types
export interface CoordinationOptions {
  specOrIssue: string; // Spec file or GitHub issue reference
  teamType: string; // Any team name (loaded dynamically)
  maxReviews: number;
  branchName?: string;
  cleanup: boolean;
}

export interface TeamResult {
  success: boolean;
  prUrl?: string;
  iterations: number;
  taskId: string;
  error?: string;
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

// Team builder types
export type PromptBuilder = (specOrIssue: string) => string;

export interface Team {
  CODER: PromptBuilder;
  REVIEWER: PromptBuilder;
}

// Git command execution result
export interface GitCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

// Worktree creation options
export interface CreateWorktreeOptions {
  branchName?: string;
  baseBranch?: string;
}

// Environment validation result
export interface PreflightResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

// CLI argument types
export interface TeamCommandArgs {
  specOrIssue: string;
  team: string;
  reviews: number;
  branch?: string;
  cleanup: boolean;
  verbose: boolean;
}

// State management options
export interface TaskStateOptions {
  taskId: string;
  maxIterations: number;
  teamType: string;
}

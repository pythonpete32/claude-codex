// Re-export Claude Code types
export type { SDKMessage } from '@anthropic-ai/claude-code';

// Core workflow types
export interface TaskState {
  taskId: string;
  specPath: string;
  originalSpec: string;
  currentIteration: number;
  maxIterations: number;
  branchName: string;
  worktreeInfo: WorktreeInfo;
  coderResponses: string[];
  reviewerResponses: string[];
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

// Claude SDK types
export interface SDKResult {
  messages: SDKMessage[];
  // Additional fields as defined in existing implementation
}

// Configuration types
export interface TDDOptions {
  specPath: string;
  maxReviews: number;
  branchName?: string;
  cleanup: boolean;
}

export interface TDDResult {
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

// GitHub API response types
export interface GitHubPullRequest {
  number: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed' | 'merged';
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
}

export interface GitCommandError {
  code?: number;
  stderr?: string;
  message: string;
}

// Prompt utility types
export interface CoderPromptOptions {
  specContent: string;
  reviewerFeedback?: string;
}

export interface ReviewerPromptOptions {
  originalSpec: string;
  coderHandoff: string;
}

// CLI types
export interface TDDCommandArgs {
  specPath: string;
  reviews?: number;
  branch?: string;
  cleanup?: boolean;
  verbose?: boolean;
}

export interface ParsedArgs {
  command?: 'tdd';
  tdd?: TDDCommandArgs;
  help?: boolean;
  version?: boolean;
}

// Preflight types
export interface PreflightResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

// Claude SDK integration types
export interface ClaudeMaxOptions {
  prompt: string;
  cwd?: string;
  maxTurns?: number;
}

// Utility type for agent execution
export interface AgentResult {
  finalResponse: string;
  messages: SDKMessage[];
}

// Re-export Claude Code SDK types
import type { SDKMessage } from '@anthropic-ai/claude-code';

export type {
  SDKAssistantMessage,
  SDKMessage,
  SDKResultMessage,
  SDKResultMessage as SDKResult,
  SDKSystemMessage,
  SDKUserMessage,
} from '@anthropic-ai/claude-code';

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

// Agent execution types for Claude SDK wrapper
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

// Prompt utility types
export interface CoderPromptOptions {
  specContent: string;
  reviewerFeedback?: string;
}

export interface ReviewerPromptOptions {
  originalSpec: string;
  coderHandoff: string;
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

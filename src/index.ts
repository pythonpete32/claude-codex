// Main entry point for Claude Codex TDD CLI

// Re-export core functionality
export {
  extractMessageText,
  runAgent,
} from './core/claude.js';
// Re-export utilities
export {
  colors,
  logDim,
  logError,
  logInfo,
  logSuccess,
  logWarning,
} from './core/messaging.js';
export {
  checkPRExists,
  getGitHubConfig,
  listPRsForBranch,
} from './core/operations/github.js';
export {
  extractFinalMessage,
  formatCoderPrompt,
  formatReviewerPrompt,
} from './core/operations/prompts.js';
export {
  addCoderResponse,
  addReviewerResponse,
  cleanupTaskState,
  getTaskState,
  initializeTaskState,
  updateTaskState,
} from './core/operations/state.js';

// Re-export operations
export {
  cleanupWorktree,
  createWorktree,
  getCurrentBranch,
  isGitRepository,
  listWorktrees,
} from './core/operations/worktree.js';
export { forceSubscriptionAuth } from './lib.js';
// Re-export error classes
export {
  AgentExecutionError,
  ConfigurationError,
  FileSystemError,
  GitCommandError,
  GitHubAPIError,
  GitHubAuthError,
  GitRepositoryNotFoundError,
  MessageExtractionError,
  PromptFormattingError,
  RepositoryNotFoundError,
  SpecFileNotFoundError,
  StateManagementError,
  StateParseError,
  TaskNotFoundError,
  ValidationError,
  WorktreeCleanupError,
  WorktreeCreationError,
} from './shared/errors.js';
// Re-export types for external use
export type {
  AgentOptions,
  AgentResult,
  CoderPromptOptions,
  GitHubConfig,
  PRInfo,
  ReviewerPromptOptions,
  SDKMessage,
  SDKResult,
  TaskState,
  TDDOptions,
  TDDResult,
  WorktreeInfo,
} from './shared/types.js';

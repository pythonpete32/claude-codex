// Claude Codex Library - Public API for external use

// Re-export new messaging functionality
export {
  type AgentResult as NewAgentResult,
  type ClaudeAgentOptions,
  runClaudeAgent,
} from '~/messaging/index.js';
export {
  checkPRExists,
  getGitHubConfig,
  listPRsForBranch,
} from '~/operations/github.js';
// Re-export utilities
export {
  colors,
  logDim,
  logError,
  logInfo,
  logSuccess,
  logWarning,
} from '~/shared/colors.js';

// Prompt formatting now handled by teams directly

export {
  cleanupTaskState,
  getTaskState,
  initializeTaskState,
  updateTaskState,
} from '~/operations/state.js';

// Re-export operations
export {
  cleanupWorktree,
  createWorktree,
  getCurrentBranch,
  isGitRepository,
  listWorktrees,
} from '~/operations/worktree.js';
// Authentication utilities
export { forceSubscriptionAuth } from '~/shared/auth.js';
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
} from '~/shared/errors.js';
// Re-export types for external use
export type {
  CoordinationOptions,
  GitHubConfig,
  PRInfo,
  PreflightResult,
  PromptBuilder,
  SDKMessage,
  SDKResult,
  TaskState,
  Team,
  TeamCommandArgs,
  TeamResult,
  WorktreeInfo,
} from '~/shared/types.js';
export { executeTeamWorkflow, listTeams } from '~/teams/coordinator.js';

// Legacy TDD workflow removed - use executeTeamWorkflow with 'tdd' team

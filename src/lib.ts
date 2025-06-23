import { colors } from './core/messaging.js';

/**
 * Ensure we're using subscription authentication by removing API keys
 */
export function forceSubscriptionAuth(): void {
  const apiKeyVars = ['ANTHROPIC_API_KEY', 'CLAUDE_API_KEY', 'ANTHROPIC_KEY', 'CLAUDE_KEY'];

  let removed = false;
  for (const varName of apiKeyVars) {
    if (process.env[varName]) {
      console.log(`${colors.warning('→')} Removing ${varName} from environment`);
      delete process.env[varName];
      removed = true;
    }
  }

  // Set flag to indicate subscription mode
  process.env.CLAUDE_USE_SUBSCRIPTION = 'true';

  if (removed) {
    console.log(`${colors.success('✓')} Environment cleaned for subscription auth\n`);
  }
}

// Re-export new messaging functionality
export {
  type AgentResult as NewAgentResult,
  type ClaudeAgentOptions,
  runClaudeAgent,
} from './core/messaging/index.js';

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
  CoderPromptOptions,
  GitHubConfig,
  PRInfo,
  PreflightResult,
  ReviewerPromptOptions,
  SDKMessage,
  SDKResult,
  TaskState,
  TDDCommandArgs,
  TDDOptions,
  TDDResult,
  WorktreeInfo,
} from './shared/types.js';
// Re-export workflow
export { executeTDDWorkflow } from './workflows/tdd.js';

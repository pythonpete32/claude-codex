#!/usr/bin/env node

/**
 * Claude Codex - Main Entry Point
 *
 * This file serves dual purposes:
 * 1. CLI executable entry point when run directly
 * 2. Library exports for programmatic use
 */

// Library exports for programmatic use
export {
  extractMessageText,
  runAgent,
} from './core/claude.js';
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
export {
  cleanupWorktree,
  createWorktree,
  getCurrentBranch,
  isGitRepository,
  listWorktrees,
} from './core/operations/worktree.js';
export { forceSubscriptionAuth } from './lib.js';
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
export {
  hasUpstreamBranch,
  validateDirectoryStructure,
  validateEnvironment,
} from './shared/preflight.js';
// Export types for external use
export type {
  AgentOptions,
  AgentResult,
  CoderPromptOptions,
  GitHubConfig,
  ParsedArgs,
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
export { executeTDDWorkflow } from './workflows/tdd.js';

// CLI execution (only when run directly as executable)
async function runCLI() {
  const { main } = await import('./cli/index.js');
  await main();
}

// Check if this file is being run directly as a CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI().catch((error) => {
    console.error('CLI execution failed:', error);
    process.exit(1);
  });
}

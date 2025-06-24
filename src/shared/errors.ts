// Standardized error classes with consistent naming

// Workflow orchestration errors
export class SpecFileNotFoundError extends Error {
  constructor(specOrIssue: string) {
    super(`Specification file not found: ${specOrIssue}`);
    this.name = 'SpecFileNotFoundError';
  }
}

export class AgentExecutionError extends Error {
  constructor(message: string, cause?: Error) {
    super(`Agent execution failed: ${message}`);
    this.name = 'AgentExecutionError';
    this.cause = cause;
  }
}

// Git worktree operation errors
export class WorktreeCreationError extends Error {
  constructor(message: string, cause?: Error) {
    super(`Worktree creation failed: ${message}`);
    this.name = 'WorktreeCreationError';
    this.cause = cause;
  }
}

export class WorktreeCleanupError extends Error {
  constructor(message: string, cause?: Error) {
    super(`Worktree cleanup failed: ${message}`);
    this.name = 'WorktreeCleanupError';
    this.cause = cause;
  }
}

export class GitRepositoryNotFoundError extends Error {
  constructor() {
    super('Not in a git repository');
    this.name = 'GitRepositoryNotFoundError';
  }
}

export class GitCommandError extends Error {
  constructor(command: string, exitCode: number, stderr: string) {
    super(`Git command failed: ${command} (exit code: ${exitCode})\n${stderr}`);
    this.name = 'GitCommandError';
  }
}

// GitHub API errors
export class GitHubAPIError extends Error {
  constructor(message: string, statusCode?: number) {
    super(`GitHub API error: ${message}${statusCode ? ` (status: ${statusCode})` : ''}`);
    this.name = 'GitHubAPIError';
  }
}

export class GitHubAuthError extends Error {
  constructor(message: string) {
    super(`GitHub authentication error: ${message}`);
    this.name = 'GitHubAuthError';
  }
}

export class RepositoryNotFoundError extends Error {
  constructor(repoUrl: string) {
    super(`Repository not found or not accessible: ${repoUrl}`);
    this.name = 'RepositoryNotFoundError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(`Configuration error: ${message}`);
    this.name = 'ConfigurationError';
  }
}

// State management errors
export class StateManagementError extends Error {
  constructor(message: string, cause?: Error) {
    super(`State management error: ${message}`);
    this.name = 'StateManagementError';
    this.cause = cause;
  }
}

export class TaskNotFoundError extends Error {
  constructor(taskId: string) {
    super(`Task not found: ${taskId}`);
    this.name = 'TaskNotFoundError';
  }
}

export class StateParseError extends Error {
  constructor(taskId: string, cause?: Error) {
    super(`Failed to parse task state: ${taskId}`);
    this.name = 'StateParseError';
    this.cause = cause;
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(`Validation error: ${message}`);
    this.name = 'ValidationError';
  }
}

// File system errors
export class FileSystemError extends Error {
  constructor(operation: string, path: string, cause?: Error) {
    super(`File system error during ${operation}: ${path}`);
    this.name = 'FileSystemError';
    this.cause = cause;
  }
}

// Prompt formatting errors
export class PromptFormattingError extends Error {
  constructor(message: string) {
    super(`Prompt formatting error: ${message}`);
    this.name = 'PromptFormattingError';
  }
}

export class MessageExtractionError extends Error {
  constructor(message: string) {
    super(`Message extraction error: ${message}`);
    this.name = 'MessageExtractionError';
  }
}

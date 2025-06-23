// Standardized error classes with consistent naming

// Workflow orchestration errors
export class SpecFileNotFoundError extends Error {
  constructor(specPath: string) {
    super(`Specification file not found: ${specPath}`);
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

// State management errors
export class StateManagementError extends Error {
  constructor(message: string) {
    super(`State management error: ${message}`);
    this.name = 'StateManagementError';
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
    super(`Failed to parse task state for ${taskId}`);
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
  constructor(message: string, operation: string) {
    super(`File system error during ${operation}: ${message}`);
    this.name = 'FileSystemError';
  }
}

// Git worktree errors
export class WorktreeCreationError extends Error {
  constructor(message: string, cause?: Error) {
    super(`Failed to create worktree: ${message}`);
    this.name = 'WorktreeCreationError';
    this.cause = cause;
  }
}

export class WorktreeCleanupError extends Error {
  constructor(message: string, cause?: Error) {
    super(`Failed to cleanup worktree: ${message}`);
    this.name = 'WorktreeCleanupError';
    this.cause = cause;
  }
}

export class GitCommandError extends Error {
  constructor(command: string, exitCode: number, stderr: string) {
    super(`Git command failed: ${command} (exit code ${exitCode}): ${stderr}`);
    this.name = 'GitCommandError';
  }
}

export class GitRepositoryNotFoundError extends Error {
  constructor(path: string) {
    super(`Not a git repository: ${path}`);
    this.name = 'GitRepositoryNotFoundError';
  }
}

// GitHub API errors
export class GitHubAPIError extends Error {
  constructor(message: string, statusCode?: number) {
    super(`GitHub API error${statusCode ? ` (${statusCode})` : ''}: ${message}`);
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
  constructor(message: string) {
    super(`Repository not found: ${message}`);
    this.name = 'RepositoryNotFoundError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(`Configuration error: ${message}`);
    this.name = 'ConfigurationError';
  }
}

// Prompt utility errors
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

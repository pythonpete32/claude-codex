import { describe, expect, it } from 'vitest';
import {
  AgentExecutionError,
  FileSystemError,
  GitCommandError,
  GitHubAPIError,
  GitHubAuthError,
  GitRepositoryNotFoundError,
  MessageExtractionError,
  PromptFormattingError,
  SpecFileNotFoundError,
  StateManagementError,
  StateParseError,
  TaskNotFoundError,
  WorktreeCreationError,
} from '../../src/shared/errors.js';

describe('Error Classes', () => {
  describe('SpecFileNotFoundError', () => {
    it('should create error with spec path', () => {
      const error = new SpecFileNotFoundError('./missing-spec.md');

      expect(error.name).toBe('SpecFileNotFoundError');
      expect(error.message).toContain('./missing-spec.md');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('AgentExecutionError', () => {
    it('should create error with message and optional cause', () => {
      const cause = new Error('Network timeout');
      const error = new AgentExecutionError('Claude SDK failed', cause);

      expect(error.name).toBe('AgentExecutionError');
      expect(error.message).toContain('Claude SDK failed');
      expect(error.cause).toBe(cause);
    });

    it('should work without cause', () => {
      const error = new AgentExecutionError('Simple failure');

      expect(error.name).toBe('AgentExecutionError');
      expect(error.cause).toBeUndefined();
    });
  });

  describe('StateManagementError', () => {
    it('should create error with state operation context', () => {
      const error = new StateManagementError('Failed to save task state');

      expect(error.name).toBe('StateManagementError');
      expect(error.message).toContain('State management error');
    });
  });

  describe('TaskNotFoundError', () => {
    it('should create error with task ID', () => {
      const error = new TaskNotFoundError('task-123');

      expect(error.name).toBe('TaskNotFoundError');
      expect(error.message).toContain('task-123');
    });
  });

  describe('StateParseError', () => {
    it('should create error with task ID and cause', () => {
      const cause = new SyntaxError('Invalid JSON');
      const error = new StateParseError('task-123', cause);

      expect(error.name).toBe('StateParseError');
      expect(error.message).toContain('task-123');
      expect(error.cause).toBe(cause);
    });
  });

  describe('FileSystemError', () => {
    it('should create error with operation context', () => {
      const error = new FileSystemError('Permission denied', 'writeFile');

      expect(error.name).toBe('FileSystemError');
      expect(error.message).toContain('writeFile');
      expect(error.message).toContain('Permission denied');
    });
  });

  describe('WorktreeCreationError', () => {
    it('should create error with cause', () => {
      const cause = new Error('Branch already exists');
      const error = new WorktreeCreationError('Branch conflict', cause);

      expect(error.name).toBe('WorktreeCreationError');
      expect(error.cause).toBe(cause);
    });
  });

  describe('GitCommandError', () => {
    it('should create error with command details', () => {
      const error = new GitCommandError('git branch -D test', 1, 'branch not found');

      expect(error.name).toBe('GitCommandError');
      expect(error.message).toContain('git branch -D test');
      expect(error.message).toContain('exit code 1');
      expect(error.message).toContain('branch not found');
    });
  });

  describe('GitRepositoryNotFoundError', () => {
    it('should create error with path', () => {
      const error = new GitRepositoryNotFoundError('/not/a/repo');

      expect(error.name).toBe('GitRepositoryNotFoundError');
      expect(error.message).toContain('/not/a/repo');
    });
  });

  describe('GitHubAPIError', () => {
    it('should create error with status code', () => {
      const error = new GitHubAPIError('Rate limit exceeded', 429);

      expect(error.name).toBe('GitHubAPIError');
      expect(error.message).toContain('429');
      expect(error.message).toContain('Rate limit exceeded');
    });

    it('should work without status code', () => {
      const error = new GitHubAPIError('Network error');

      expect(error.message).not.toContain('(');
    });
  });

  describe('GitHubAuthError', () => {
    it('should create auth-specific error', () => {
      const error = new GitHubAuthError('Invalid token');

      expect(error.name).toBe('GitHubAuthError');
      expect(error.message).toContain('authentication error');
    });
  });

  describe('PromptFormattingError', () => {
    it('should create prompt error', () => {
      const error = new PromptFormattingError('Template rendering failed');

      expect(error.name).toBe('PromptFormattingError');
      expect(error.message).toContain('Prompt formatting error');
    });
  });

  describe('MessageExtractionError', () => {
    it('should create message extraction error', () => {
      const error = new MessageExtractionError('No assistant message found');

      expect(error.name).toBe('MessageExtractionError');
      expect(error.message).toContain('Message extraction error');
    });
  });

  describe('Error inheritance', () => {
    it('should maintain proper inheritance chain', () => {
      const errors = [
        new SpecFileNotFoundError('test'),
        new AgentExecutionError('test'),
        new GitCommandError('cmd', 1, 'stderr'),
        new GitHubAPIError('test'),
      ];

      for (const error of errors) {
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBeDefined();
        expect(error.message).toBeDefined();
      }
    });
  });
});

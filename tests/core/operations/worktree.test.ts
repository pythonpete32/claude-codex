import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GitCommandError,
  GitRepositoryNotFoundError,
  WorktreeCreationError,
} from '../../../src/shared/errors.js';

// Mock child_process and util modules first
const mockExec = vi.fn();

vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

vi.mock('util', () => ({
  promisify: vi.fn(() => mockExec),
}));

// Import the modules after mocking
const { createWorktree, getCurrentBranch, isGitRepository, cleanupWorktree, listWorktrees } =
  await import('../../../src/core/operations/worktree.js');

describe('Worktree Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isGitRepository', () => {
    it('should return true when in a git repository', async () => {
      mockExec.mockResolvedValue({
        stdout: '.git\n',
        stderr: '',
      });

      const result = await isGitRepository();
      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalledWith('git rev-parse --git-dir');
    });

    it('should return false when not in a git repository', async () => {
      mockExec.mockRejectedValue(new Error('not a git repository'));

      const result = await isGitRepository();
      expect(result).toBe(false);
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      mockExec.mockResolvedValue({
        stdout: 'main\n',
        stderr: '',
      });

      const result = await getCurrentBranch();
      expect(result).toBe('main');
      expect(mockExec).toHaveBeenCalledWith('git branch --show-current');
    });

    it('should handle git command failure', async () => {
      mockExec.mockRejectedValue(new Error('Command failed'));

      await expect(getCurrentBranch()).rejects.toThrow(GitCommandError);
    });

    it('should handle empty branch name', async () => {
      mockExec.mockResolvedValue({
        stdout: '\n',
        stderr: '',
      });

      await expect(getCurrentBranch()).rejects.toThrow(GitCommandError);
    });
  });

  describe('createWorktree', () => {
    beforeEach(() => {
      // Mock isGitRepository to return true by default
      mockExec.mockImplementation((command: string) => {
        if (command === 'git rev-parse --git-dir') {
          return Promise.resolve({ stdout: '.git\n', stderr: '' });
        }
        if (command === 'git branch --show-current') {
          return Promise.resolve({ stdout: 'main\n', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });
    });

    it('should create worktree with default branch name', async () => {
      const taskId = 'task-123';

      const result = await createWorktree(taskId);

      expect(result).toEqual({
        path: `../.codex-worktrees/${taskId}`,
        branchName: `tdd/${taskId}`,
        baseBranch: 'main',
      });

      expect(mockExec).toHaveBeenCalledWith(
        `git worktree add ../.codex-worktrees/${taskId} -b tdd/${taskId} main`
      );
    });

    it('should create worktree with custom branch name', async () => {
      const taskId = 'task-123';
      const customBranch = 'feature-branch';

      const result = await createWorktree(taskId, { branchName: customBranch });

      expect(result.branchName).toBe(customBranch);
      expect(mockExec).toHaveBeenCalledWith(
        `git worktree add ../.codex-worktrees/${taskId} -b ${customBranch} main`
      );
    });

    it('should create worktree with custom base branch', async () => {
      const taskId = 'task-123';
      const baseBranch = 'develop';

      // Mock getCurrentBranch for custom base
      mockExec.mockImplementation((command: string) => {
        if (command === 'git rev-parse --git-dir') {
          return Promise.resolve({ stdout: '.git\n', stderr: '' });
        }
        if (command === 'git branch --show-current') {
          return Promise.resolve({ stdout: 'main\n', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const result = await createWorktree(taskId, { baseBranch });

      expect(result.baseBranch).toBe(baseBranch);
      expect(mockExec).toHaveBeenCalledWith(
        `git worktree add ../.codex-worktrees/${taskId} -b tdd/${taskId} ${baseBranch}`
      );
    });

    it('should throw error when not in git repository', async () => {
      mockExec.mockImplementation((command: string) => {
        if (command === 'git rev-parse --git-dir') {
          return Promise.reject(new Error('not a git repository'));
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      await expect(createWorktree('task-123')).rejects.toThrow(GitRepositoryNotFoundError);
    });

    it('should handle worktree creation failure', async () => {
      mockExec.mockImplementation((command: string) => {
        if (command === 'git rev-parse --git-dir') {
          return Promise.resolve({ stdout: '.git\n', stderr: '' });
        }
        if (command === 'git branch --show-current') {
          return Promise.resolve({ stdout: 'main\n', stderr: '' });
        }
        if (command.includes('git worktree add')) {
          return Promise.reject(new Error('fatal: branch already exists'));
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      await expect(createWorktree('task-123')).rejects.toThrow(WorktreeCreationError);
    });
  });

  describe('cleanupWorktree', () => {
    it('should cleanup worktree and branch successfully', async () => {
      const worktreeInfo = {
        path: '../.codex-worktrees/task-123',
        branchName: 'tdd/task-123',
        baseBranch: 'main',
      };

      await cleanupWorktree(worktreeInfo);

      expect(mockExec).toHaveBeenCalledWith(`git worktree remove ${worktreeInfo.path}`);
      expect(mockExec).toHaveBeenCalledWith(`git branch -D ${worktreeInfo.branchName}`);
    });

    it('should handle worktree removal failure gracefully', async () => {
      mockExec.mockImplementation((command: string) => {
        if (command.includes('git worktree remove')) {
          return Promise.reject(new Error('worktree not found'));
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const worktreeInfo = {
        path: '../.codex-worktrees/task-123',
        branchName: 'tdd/task-123',
        baseBranch: 'main',
      };

      // Should not throw, continue with branch deletion
      await cleanupWorktree(worktreeInfo);

      expect(mockExec).toHaveBeenCalledWith(`git branch -D ${worktreeInfo.branchName}`);
    });

    it('should handle branch deletion failure gracefully', async () => {
      mockExec.mockImplementation((command: string) => {
        if (command.includes('git branch -D')) {
          return Promise.reject(new Error('branch not found'));
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const worktreeInfo = {
        path: '../.codex-worktrees/task-123',
        branchName: 'tdd/task-123',
        baseBranch: 'main',
      };

      // Should complete without throwing
      await cleanupWorktree(worktreeInfo);
    });
  });

  describe('listWorktrees', () => {
    it('should parse worktree list output correctly', async () => {
      const mockOutput = `worktree /path/to/main
HEAD abcd1234
branch refs/heads/main

worktree /path/to/../.codex-worktrees/task-123
HEAD efgh5678
branch refs/heads/tdd/task-123

worktree /path/to/../.codex-worktrees/task-456
HEAD ijkl9012
branch refs/heads/tdd/task-456
`;

      mockExec.mockResolvedValue({
        stdout: mockOutput,
        stderr: '',
      });

      const result = await listWorktrees();

      expect(result).toEqual([
        {
          path: '/path/to/main',
          branchName: 'main',
          baseBranch: 'main',
        },
        {
          path: '/path/to/../.codex-worktrees/task-123',
          branchName: 'tdd/task-123',
          baseBranch: 'tdd/task-123',
        },
        {
          path: '/path/to/../.codex-worktrees/task-456',
          branchName: 'tdd/task-456',
          baseBranch: 'tdd/task-456',
        },
      ]);
    });

    it('should handle empty worktree list', async () => {
      mockExec.mockResolvedValue({
        stdout: '',
        stderr: '',
      });

      const result = await listWorktrees();
      expect(result).toEqual([]);
    });

    it('should handle git command failure', async () => {
      mockExec.mockRejectedValue(new Error('Command failed'));

      await expect(listWorktrees()).rejects.toThrow(GitCommandError);
    });
  });
});

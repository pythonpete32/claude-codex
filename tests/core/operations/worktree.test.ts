import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanupWorktree,
  createWorktree,
  getCurrentBranch,
  isGitRepository,
  listWorktrees,
} from '../../../src/core/operations/worktree.js';
import {
  GitCommandError,
  GitRepositoryNotFoundError,
  WorktreeCleanupError,
  WorktreeCreationError,
} from '../../../src/shared/errors.js';
import type { WorktreeInfo } from '../../../src/shared/types.js';

// Mock Node.js exec
vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

vi.mock('node:util', () => ({
  promisify: vi.fn((fn) => fn),
}));

const mockExec = vi.mocked(await import('node:child_process')).exec;

describe('Worktree Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isGitRepository', () => {
    it('should return true when in git repository', async () => {
      mockExec.mockResolvedValue({ stdout: '.git' });

      const result = await isGitRepository();

      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalledWith('git rev-parse --git-dir');
    });

    it('should return false when not in git repository', async () => {
      mockExec.mockRejectedValue(new Error('not a git repository'));

      const result = await isGitRepository();

      expect(result).toBe(false);
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      mockExec.mockResolvedValue({ stdout: 'main\n' });

      const result = await getCurrentBranch();

      expect(result).toBe('main');
      expect(mockExec).toHaveBeenCalledWith('git branch --show-current');
    });

    it('should throw GitCommandError when command fails', async () => {
      mockExec.mockRejectedValue(new Error('failed'));

      await expect(getCurrentBranch()).rejects.toThrow(GitCommandError);
      await expect(getCurrentBranch()).rejects.toThrow('Failed to get current branch');
    });
  });

  describe('createWorktree', () => {
    it('should create worktree with default options', async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: '.git' }) // isGitRepository
        .mockResolvedValueOnce({ stdout: 'main' }) // getCurrentBranch
        .mockResolvedValueOnce({ stdout: 'worktree created' }); // git worktree add

      const result = await createWorktree('test-123');

      expect(result).toEqual({
        path: '../.codex-worktrees/test-123',
        branchName: 'tdd/test-123',
        baseBranch: 'main',
      });

      expect(mockExec).toHaveBeenCalledWith(
        'git worktree add "../.codex-worktrees/test-123" -b "tdd/test-123" "main"'
      );
    });

    it('should create worktree with custom options', async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: '.git' }) // isGitRepository
        .mockResolvedValueOnce({ stdout: 'worktree created' }); // git worktree add

      const result = await createWorktree('test-123', {
        branchName: 'feature/custom',
        baseBranch: 'develop',
      });

      expect(result).toEqual({
        path: '../.codex-worktrees/test-123',
        branchName: 'feature/custom',
        baseBranch: 'develop',
      });

      expect(mockExec).toHaveBeenCalledWith(
        'git worktree add "../.codex-worktrees/test-123" -b "feature/custom" "develop"'
      );
    });

    it('should throw GitRepositoryNotFoundError when not in git repo', async () => {
      mockExec.mockRejectedValue(new Error('not a git repository'));

      await expect(createWorktree('test-123')).rejects.toThrow(GitRepositoryNotFoundError);
    });

    it('should throw WorktreeCreationError when git command fails', async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: '.git' }) // isGitRepository
        .mockResolvedValueOnce({ stdout: 'main' }) // getCurrentBranch
        .mockRejectedValueOnce({
          code: 128,
          stderr: 'branch already exists',
          message: 'git failed',
        }); // git worktree add fails

      await expect(createWorktree('test-123')).rejects.toThrow(WorktreeCreationError);
    });

    it('should handle unexpected errors', async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: '.git' }) // isGitRepository
        .mockResolvedValueOnce({ stdout: 'main' }) // getCurrentBranch
        .mockRejectedValueOnce('string error'); // git worktree add fails

      await expect(createWorktree('test-123')).rejects.toThrow(WorktreeCreationError);
    });
  });

  describe('cleanupWorktree', () => {
    const mockWorktreeInfo: WorktreeInfo = {
      path: '../.codex-worktrees/test-123',
      branchName: 'tdd/test-123',
      baseBranch: 'main',
    };

    it('should cleanup worktree successfully', async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: 'removed' }) // git worktree remove
        .mockResolvedValueOnce({ stdout: 'deleted' }); // git branch -D

      await cleanupWorktree(mockWorktreeInfo);

      expect(mockExec).toHaveBeenCalledWith('git worktree remove "../.codex-worktrees/test-123"');
      expect(mockExec).toHaveBeenCalledWith('git branch -D "tdd/test-123"');
    });

    it('should force remove worktree if normal remove fails', async () => {
      mockExec
        .mockRejectedValueOnce(
          new GitCommandError('git worktree remove', 1, 'working tree has modifications')
        ) // first remove fails
        .mockResolvedValueOnce({ stdout: 'force removed' }) // git worktree remove --force
        .mockResolvedValueOnce({ stdout: 'deleted' }); // git branch -D

      await cleanupWorktree(mockWorktreeInfo);

      expect(mockExec).toHaveBeenCalledWith('git worktree remove "../.codex-worktrees/test-123"');
      expect(mockExec).toHaveBeenCalledWith(
        'git worktree remove --force "../.codex-worktrees/test-123"'
      );
      expect(mockExec).toHaveBeenCalledWith('git branch -D "tdd/test-123"');
    });

    it('should ignore branch deletion errors for non-existent branches', async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: 'removed' }) // git worktree remove
        .mockRejectedValueOnce(new GitCommandError('git branch -D', 1, 'branch not found')); // branch delete fails

      await cleanupWorktree(mockWorktreeInfo);

      expect(mockExec).toHaveBeenCalledWith('git worktree remove "../.codex-worktrees/test-123"');
      expect(mockExec).toHaveBeenCalledWith('git branch -D "tdd/test-123"');
    });

    it('should throw WorktreeCleanupError for serious branch deletion failures', async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: 'removed' }) // git worktree remove
        .mockRejectedValueOnce(new GitCommandError('git branch -D', 1, 'permission denied')); // branch delete fails

      await expect(cleanupWorktree(mockWorktreeInfo)).rejects.toThrow(WorktreeCleanupError);
    });

    it('should throw WorktreeCleanupError when worktree removal fails', async () => {
      mockExec.mockRejectedValueOnce(new Error('permission denied')); // not a GitCommandError

      await expect(cleanupWorktree(mockWorktreeInfo)).rejects.toThrow(WorktreeCleanupError);
    });

    it('should handle unexpected errors', async () => {
      mockExec.mockRejectedValueOnce('string error'); // unexpected error type

      await expect(cleanupWorktree(mockWorktreeInfo)).rejects.toThrow(WorktreeCleanupError);
    });
  });

  describe('listWorktrees', () => {
    it('should list worktrees successfully', async () => {
      const porcelainOutput = `worktree /path/to/main
HEAD abc123def456
branch refs/heads/main

worktree /path/to/feature
HEAD def456abc123
branch refs/heads/feature/test

worktree /path/to/detached
HEAD 789abc012def
detached`;

      mockExec.mockResolvedValue({ stdout: porcelainOutput });

      const result = await listWorktrees();

      expect(result).toEqual([
        {
          path: '/path/to/main',
          branchName: 'main',
          baseBranch: '',
        },
        {
          path: '/path/to/feature',
          branchName: 'feature/test',
          baseBranch: '',
        },
      ]);

      expect(mockExec).toHaveBeenCalledWith('git worktree list --porcelain');
    });

    it('should handle empty worktree list', async () => {
      mockExec.mockResolvedValue({ stdout: '' });

      const result = await listWorktrees();

      expect(result).toEqual([]);
    });

    it('should handle malformed worktree entries', async () => {
      const malformedOutput = `worktree /path/to/main
HEAD abc123def456

worktree /path/incomplete
`;

      mockExec.mockResolvedValue({ stdout: malformedOutput });

      const result = await listWorktrees();

      expect(result).toEqual([]);
    });

    it('should throw GitCommandError when command fails', async () => {
      mockExec.mockRejectedValue(new GitCommandError('git worktree list', 1, 'command failed'));

      await expect(listWorktrees()).rejects.toThrow(GitCommandError);
    });

    it('should wrap unexpected errors in GitCommandError', async () => {
      mockExec.mockRejectedValue(new Error('unexpected error'));

      await expect(listWorktrees()).rejects.toThrow(GitCommandError);
    });
  });
});

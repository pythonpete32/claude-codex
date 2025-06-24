import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import {
  GitCommandError,
  GitRepositoryNotFoundError,
  WorktreeCleanupError,
  WorktreeCreationError,
} from '~/shared/errors.js';
import type { CreateWorktreeOptions, WorktreeInfo } from '~/shared/types.js';

const execAsync = promisify(exec);

/**
 * Validates that current directory is inside a git repository
 */
export async function isGitRepository(): Promise<boolean> {
  try {
    await execAsync('git rev-parse --git-dir');
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the currently checked out git branch name
 */
export async function getCurrentBranch(): Promise<string> {
  try {
    const { stdout } = await execAsync('git branch --show-current');
    const branchName = stdout.trim();

    if (!branchName) {
      throw new GitCommandError('git branch --show-current', 0, 'No branch name returned');
    }

    return branchName;
  } catch (error) {
    if (error instanceof GitCommandError) {
      throw error;
    }
    throw new GitCommandError(
      'git branch --show-current',
      1,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Creates isolated git worktree and branch for TDD task
 */
export async function createWorktree(
  taskId: string,
  options?: CreateWorktreeOptions
): Promise<WorktreeInfo> {
  // Validate we're in a git repository
  if (!(await isGitRepository())) {
    throw new GitRepositoryNotFoundError();
  }

  try {
    // Get base branch (current branch unless overridden)
    const baseBranch = options?.baseBranch || (await getCurrentBranch());

    // Generate branch name
    const branchName = options?.branchName || `tdd/${taskId}`;

    // Generate worktree path
    const worktreePath = `../.codex-worktrees/${taskId}`;

    // Execute git worktree add command
    const command = `git worktree add ${worktreePath} -b ${branchName} ${baseBranch}`;
    await execAsync(command);

    return {
      path: worktreePath,
      branchName,
      baseBranch,
    };
  } catch (error) {
    throw new WorktreeCreationError(
      error instanceof Error ? error.message : 'Unknown error',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Removes git worktree and associated branch
 */
export async function cleanupWorktree(worktreeInfo: WorktreeInfo): Promise<void> {
  const errors: string[] = [];

  // Try to remove worktree (don't fail if already removed)
  try {
    await execAsync(`git worktree remove ${worktreeInfo.path}`);
  } catch (error) {
    errors.push(
      `Failed to remove worktree: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Try to delete branch (don't fail if already deleted)
  try {
    await execAsync(`git branch -D ${worktreeInfo.branchName}`);
  } catch (error) {
    errors.push(
      `Failed to delete branch: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Only throw if both operations failed with unexpected errors
  if (errors.length === 2) {
    throw new WorktreeCleanupError(errors.join('; '));
  }
}

/**
 * Lists all existing worktrees
 */
export async function listWorktrees(): Promise<WorktreeInfo[]> {
  try {
    const { stdout } = await execAsync('git worktree list --porcelain');

    if (!stdout.trim()) {
      return [];
    }

    const worktrees: WorktreeInfo[] = [];
    const entries = stdout.trim().split('\n\n');

    for (const entry of entries) {
      const lines = entry.split('\n');
      let path = '';
      let branchName = '';

      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          path = line.substring('worktree '.length);
        } else if (line.startsWith('branch ')) {
          const branchRef = line.substring('branch '.length);
          branchName = branchRef.replace('refs/heads/', '');
        }
      }

      if (path && branchName) {
        worktrees.push({
          path,
          branchName,
          baseBranch: branchName, // For listing purposes, use same as branch name
        });
      }
    }

    return worktrees;
  } catch (error) {
    throw new GitCommandError(
      'git worktree list --porcelain',
      1,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

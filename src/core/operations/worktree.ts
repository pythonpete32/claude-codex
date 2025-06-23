import { exec } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';
import {
  GitCommandError,
  GitRepositoryNotFoundError,
  WorktreeCleanupError,
  WorktreeCreationError,
} from '../../shared/errors.js';
import type { GitCommandError as GitErrorType, WorktreeInfo } from '../../shared/types.js';

const execAsync = promisify(exec);

async function runGitCommand(command: string): Promise<string> {
  try {
    const { stdout } = await execAsync(command);
    return stdout.trim();
  } catch (error: unknown) {
    const gitError = error as GitErrorType;
    const exitCode = gitError.code || 1;
    const stderr = gitError.stderr || (error instanceof Error ? error.message : String(error));
    throw new GitCommandError(command, exitCode, stderr);
  }
}

export async function isGitRepository(): Promise<boolean> {
  try {
    await runGitCommand('git rev-parse --git-dir');
    return true;
  } catch {
    return false;
  }
}

export async function getCurrentBranch(): Promise<string> {
  try {
    return await runGitCommand('git branch --show-current');
  } catch (_error) {
    throw new GitCommandError('git branch --show-current', 1, 'Failed to get current branch');
  }
}

export async function createWorktree(
  taskId: string,
  options: { branchName?: string; baseBranch?: string } = {}
): Promise<WorktreeInfo> {
  if (!(await isGitRepository())) {
    throw new GitRepositoryNotFoundError(process.cwd());
  }

  try {
    const baseBranch = options.baseBranch || (await getCurrentBranch());
    const branchName = options.branchName || `tdd/${taskId}`;
    const worktreePath = join('..', '.codex-worktrees', taskId);

    // Create worktree with new branch
    const command = `git worktree add "${worktreePath}" -b "${branchName}" "${baseBranch}"`;
    await runGitCommand(command);

    return {
      path: worktreePath,
      branchName,
      baseBranch,
    };
  } catch (error) {
    if (error instanceof GitCommandError) {
      throw new WorktreeCreationError(error.message, error);
    }
    throw new WorktreeCreationError(`Unexpected error creating worktree: ${error}`, error as Error);
  }
}

export async function cleanupWorktree(worktreeInfo: WorktreeInfo): Promise<void> {
  try {
    // Remove worktree (this also removes the directory)
    try {
      await runGitCommand(`git worktree remove "${worktreeInfo.path}"`);
    } catch (error) {
      // If worktree remove fails, try force remove
      if (error instanceof GitCommandError) {
        await runGitCommand(`git worktree remove --force "${worktreeInfo.path}"`);
      }
    }

    // Delete the branch (use -D for force delete)
    try {
      await runGitCommand(`git branch -D "${worktreeInfo.branchName}"`);
    } catch (error) {
      // Branch might not exist or already deleted, which is fine
      if (error instanceof GitCommandError && !error.message.includes('not found')) {
        throw error;
      }
    }
  } catch (error) {
    if (error instanceof GitCommandError) {
      throw new WorktreeCleanupError(error.message, error);
    }
    throw new WorktreeCleanupError(
      `Unexpected error cleaning up worktree: ${error}`,
      error as Error
    );
  }
}

export async function listWorktrees(): Promise<WorktreeInfo[]> {
  try {
    const output = await runGitCommand('git worktree list --porcelain');
    const worktrees: WorktreeInfo[] = [];

    const entries = output.split('\n\n').filter((entry) => entry.trim());

    for (const entry of entries) {
      const lines = entry.split('\n');
      let path = '';
      let branchName = '';
      const baseBranch = '';

      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          path = line.substring(9);
        } else if (line.startsWith('branch ')) {
          branchName = line.substring(7).replace('refs/heads/', '');
        }
      }

      if (path && branchName) {
        worktrees.push({
          path,
          branchName,
          baseBranch, // Not available in porcelain format, would need additional lookup
        });
      }
    }

    return worktrees;
  } catch (error) {
    if (error instanceof GitCommandError) {
      throw error;
    }
    throw new GitCommandError(
      'git worktree list --porcelain',
      1,
      `Failed to list worktrees: ${error}`
    );
  }
}

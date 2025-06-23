import { exec } from 'node:child_process';
import { access, constants } from 'node:fs/promises';
import { promisify } from 'node:util';
import { isGitRepository } from '../core/operations/worktree.js';

const execAsync = promisify(exec);

export interface PreflightResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates the environment prerequisites for TDD workflow execution
 *
 * @returns Promise<PreflightResult> - Validation results with errors and warnings
 */
export async function validateEnvironment(): Promise<PreflightResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Git repository validation
  try {
    const isGitRepo = await isGitRepository();
    if (!isGitRepo) {
      errors.push('Current directory is not a git repository. Initialize with: git init');
    }
  } catch (error) {
    errors.push(
      `Failed to check git repository status: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // 2. Git remote origin validation (GitHub repository)
  try {
    const { stdout } = await execAsync('git remote get-url origin');
    const remoteUrl = stdout.trim();

    if (!remoteUrl) {
      errors.push('No git remote origin configured. Add with: git remote add origin <github-url>');
    } else if (!remoteUrl.includes('github.com')) {
      warnings.push('Remote origin is not a GitHub repository. GitHub operations may fail.');
    }
  } catch (_error) {
    errors.push('No git remote origin configured. Add with: git remote add origin <github-url>');
  }

  // 3. GitHub token validation
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    errors.push(
      'GITHUB_TOKEN environment variable not set. Create a token at: https://github.com/settings/tokens'
    );
  } else if (githubToken.length < 20) {
    warnings.push('GITHUB_TOKEN appears to be invalid (too short). Verify token format.');
  }

  // 4. GitHub token permissions validation (if token exists)
  if (githubToken && githubToken.length >= 20) {
    try {
      // Test token by making a simple API call
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${githubToken}`,
          'User-Agent': 'claude-codex',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          errors.push('GITHUB_TOKEN is invalid or expired. Generate a new token.');
        } else {
          warnings.push(
            `GitHub API returned status ${response.status}. Token may have limited permissions.`
          );
        }
      }
    } catch (_error) {
      warnings.push(
        'Unable to validate GitHub token permissions (network issue). Proceeding with caution.'
      );
    }
  }

  // 5. Claude Code CLI authentication check
  try {
    // Test Claude authentication by checking for auth files or attempting a simple operation
    // This is a basic check - the forceSubscriptionAuth() will do the real validation
    const authCheckResult = await validateClaudeAuth();
    if (!authCheckResult.valid) {
      errors.push(authCheckResult.message);
    }
  } catch (_error) {
    warnings.push(
      'Unable to verify Claude Code authentication. Ensure Claude CLI is authenticated.'
    );
  }

  // 6. Directory permissions validation
  try {
    // Check if we can create .codex directory and write to it
    await access('.', constants.W_OK);

    // Try to create .codex directory if it doesn't exist
    try {
      await access('.codex', constants.F_OK);
    } catch {
      // Directory doesn't exist, which is fine
    }
  } catch (_error) {
    errors.push(
      'No write permissions in current directory. Cannot create .codex/ state directory.'
    );
  }

  // 7. Worktree directory permissions (../.codex-worktrees)
  try {
    // Check parent directory write permissions for worktree creation
    await access('..', constants.W_OK);
  } catch (_error) {
    errors.push('No write permissions in parent directory. Cannot create worktree directories.');
  }

  // 8. Git working tree cleanliness check
  try {
    const { stdout } = await execAsync('git status --porcelain');
    if (stdout.trim()) {
      warnings.push(
        'Working directory has uncommitted changes. Consider committing before TDD workflow.'
      );
    }
  } catch (_error) {
    // Not critical, skip this check
  }

  // 9. Git branch check
  try {
    const { stdout } = await execAsync('git branch --show-current');
    const currentBranch = stdout.trim();

    if (!currentBranch) {
      warnings.push('Not currently on any branch. Workflow will use HEAD as base.');
    } else if (currentBranch === 'main' || currentBranch === 'master') {
      warnings.push(
        `Currently on ${currentBranch} branch. Consider switching to a feature branch.`
      );
    }
  } catch (_error) {
    warnings.push('Unable to determine current git branch.');
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates Claude Code CLI authentication
 * This is a simplified check - the real validation happens in forceSubscriptionAuth()
 */
async function validateClaudeAuth(): Promise<{ valid: boolean; message: string }> {
  try {
    // Check if Claude Code CLI is available
    await execAsync('which claude-code');
    return {
      valid: true,
      message: 'Claude Code CLI found',
    };
  } catch (_error) {
    // Check alternative installation locations or methods
    try {
      await execAsync('npx @anthropic-ai/claude-code --version');
      return {
        valid: true,
        message: 'Claude Code CLI available via npx',
      };
    } catch {
      return {
        valid: false,
        message:
          'Claude Code CLI not found. Install with: npm install -g @anthropic-ai/claude-code',
      };
    }
  }
}

/**
 * Checks if the current git repository has any upstream branches configured
 */
export async function hasUpstreamBranch(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('git branch -vv');
    return stdout.includes('[origin/');
  } catch {
    return false;
  }
}

/**
 * Validates that the current directory structure is suitable for TDD workflow
 */
export async function validateDirectoryStructure(): Promise<string[]> {
  const issues: string[] = [];

  // Check for common project indicators
  const projectFiles = [
    'package.json',
    'Cargo.toml',
    'pyproject.toml',
    'requirements.txt',
    'pom.xml',
    'build.gradle',
    'go.mod',
    'Makefile',
  ];

  let hasProjectFile = false;
  for (const file of projectFiles) {
    try {
      await access(file, constants.F_OK);
      hasProjectFile = true;
      break;
    } catch {
      // File doesn't exist, continue checking
    }
  }

  if (!hasProjectFile) {
    issues.push("No common project files detected. Ensure you're in the root of your project.");
  }

  return issues;
}

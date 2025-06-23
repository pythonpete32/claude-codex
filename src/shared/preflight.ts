import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';
import type { PreflightResult } from './types.js';

const execAsync = promisify(exec);

export async function validateEnvironment(): Promise<PreflightResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Git repository validation
  try {
    await execAsync('git rev-parse --git-dir');
  } catch {
    errors.push(
      'Current directory is not a git repository. Please run this command from within a git repository.'
    );
  }

  // 2. GitHub token validation
  if (!process.env.GITHUB_TOKEN) {
    errors.push(
      'GITHUB_TOKEN environment variable not set. Please set your GitHub personal access token.'
    );
  } else {
    // Validate token has required permissions
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          'User-Agent': 'claude-codex-tdd',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          errors.push('GITHUB_TOKEN is invalid or expired. Please update your GitHub token.');
        } else {
          warnings.push(
            `GitHub API returned status ${response.status}. Token may have limited permissions.`
          );
        }
      }
    } catch (_error) {
      warnings.push('Unable to validate GitHub token due to network error.');
    }
  }

  // 3. Claude Code authentication check
  try {
    // Check if claude command is available
    await execAsync('which claude || where claude', { shell: true });
  } catch {
    errors.push('Claude Code CLI not found. Please install and authenticate with Claude Code.');
  }

  // 4. Directory permissions
  try {
    // Check if we can create .codex directory
    await fs.mkdir('.codex', { recursive: true });
    await fs.access('.codex', fs.constants.W_OK);
  } catch {
    errors.push('Cannot write to current directory. Please check write permissions.');
  }

  // 5. Worktree directory permissions
  try {
    // Check if we can create worktree parent directory
    await fs.mkdir('../.codex-worktrees', { recursive: true });
    await fs.access('../.codex-worktrees', fs.constants.W_OK);
  } catch {
    errors.push(
      'Cannot create worktree directory. Please check write permissions for parent directory.'
    );
  }

  // 6. Check git remote origin
  try {
    const { stdout } = await execAsync('git remote get-url origin');
    const remoteUrl = stdout.trim();

    if (!remoteUrl.includes('github.com')) {
      warnings.push('Git remote origin is not a GitHub repository. PR creation may not work.');
    }
  } catch {
    warnings.push('No git remote origin found. PR creation will not work.');
  }

  // 7. Check git configuration
  try {
    await execAsync('git config user.name');
    await execAsync('git config user.email');
  } catch {
    warnings.push('Git user configuration missing. Please set git user.name and user.email.');
  }

  // 8. Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = Number.parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 18) {
    errors.push(
      `Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js 18 or higher.`
    );
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

export function printPreflightResults(result: PreflightResult): void {
  if (result.errors.length > 0) {
    console.error('❌ Environment validation failed:');
    for (const error of result.errors) {
      console.error(`   • ${error}`);
    }
    console.error();
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    for (const warning of result.warnings) {
      console.warn(`   • ${warning}`);
    }
    console.warn();
  }

  if (result.success) {
    console.log('✅ Environment validation passed');
    if (result.warnings.length > 0) {
      console.log('   (with warnings - see above)');
    }
    console.log();
  }
}

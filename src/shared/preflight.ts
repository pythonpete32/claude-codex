import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';
import { isGitRepository } from '../core/operations/worktree.js';
import { loadEnvironmentVariables } from './env-loader.js';

const execAsync = promisify(exec);

export interface PreflightResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate environment requirements before TDD workflow execution
 */
export async function validateEnvironment(): Promise<PreflightResult> {
  // Load environment variables from .env files first
  await loadEnvironmentVariables();

  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Git repository validation
  if (!(await isGitRepository())) {
    errors.push('Current directory is not a git repository. Run "git init" to initialize one.');
  } else {
    // Check if we have a remote origin configured
    try {
      await execAsync('git remote get-url origin');
    } catch {
      warnings.push(
        'No remote "origin" configured. You may need to set up GitHub integration manually.'
      );
    }

    // Check for uncommitted changes that might conflict
    try {
      const { stdout: statusOutput } = await execAsync('git status --porcelain');
      if (statusOutput.trim()) {
        warnings.push(
          'Working directory has uncommitted changes. Consider committing or stashing them first.'
        );
      }
    } catch {
      warnings.push('Unable to check git status. Repository may be in an inconsistent state.');
    }
  }

  // 2. GitHub token validation
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken || githubToken.trim().length === 0) {
    errors.push(
      'GITHUB_TOKEN environment variable not set. ' +
        'Create a personal access token at https://github.com/settings/tokens and export it as GITHUB_TOKEN.'
    );
  } else if (githubToken.length < 10) {
    errors.push('GITHUB_TOKEN appears to be invalid (too short). Please check your token value.');
  }

  // 3. Claude Code authentication check
  try {
    // Check if Claude Code is available by running a simple command
    await execAsync('claude --version', { timeout: 5000 });
  } catch {
    warnings.push(
      'Claude Code CLI not found or not working. ' +
        'Install it with: npm install -g @anthropic-ai/claude-code'
    );
  }

  // 4. Directory permissions validation
  try {
    // Check if we can create the .codex directory
    const codexDir = '.codex';
    try {
      await fs.access(codexDir);
    } catch {
      // Directory doesn't exist, try to create it
      try {
        await fs.mkdir(codexDir);
        // Clean up test directory
        await fs.rmdir(codexDir);
      } catch {
        errors.push(
          'Cannot create .codex directory. Check write permissions in current directory.'
        );
      }
    }

    // Check write permissions in current directory
    try {
      const testFile = `.codex-test-${Date.now()}`;
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
    } catch {
      errors.push('No write permissions in current directory.');
    }
  } catch {
    errors.push('Unable to validate directory permissions.');
  }

  // 5. Node.js version check
  const nodeVersion = process.version;
  const majorVersion = Number.parseInt(nodeVersion.slice(1).split('.')[0], 10);
  if (majorVersion < 18) {
    errors.push(`Node.js ${nodeVersion} is not supported. Please upgrade to Node.js 18 or later.`);
  }

  // 6. Check for required git configuration
  try {
    await execAsync('git config user.name');
    await execAsync('git config user.email');
  } catch {
    warnings.push(
      'Git user.name or user.email not configured. ' +
        'Set them with: git config --global user.name "Your Name" && git config --global user.email "your@email.com"'
    );
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Quick validation for critical requirements only
 */
export async function quickValidation(): Promise<boolean> {
  try {
    // Load environment variables first
    await loadEnvironmentVariables();

    // Only check the most critical requirements
    return (
      (await isGitRepository()) &&
      !!process.env.GITHUB_TOKEN &&
      process.version.startsWith('v1') &&
      Number.parseInt(process.version.slice(1), 10) >= 18
    );
  } catch {
    return false;
  }
}

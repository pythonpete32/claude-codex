import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import {
  ConfigurationError,
  GitCommandError,
  GitHubAPIError,
  GitHubAuthError,
} from '../../shared/errors.js';
import type { GitHubConfig, PRInfo } from '../../shared/types.js';

const execAsync = promisify(exec);

/**
 * Extracts GitHub repository info and validates authentication
 */
export async function getGitHubConfig(): Promise<GitHubConfig> {
  // Check for GITHUB_TOKEN environment variable
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new GitHubAuthError('GITHUB_TOKEN not found in environment variables');
  }

  try {
    // Get git remote URL
    const { stdout } = await execAsync('git remote get-url origin');
    const remoteUrl = stdout.trim();

    // Parse URL to extract owner and repo name
    const { owner, repo } = parseGitHubUrl(remoteUrl);

    return { token, owner, repo };
  } catch (error) {
    // Re-throw ConfigurationError as-is
    if (error instanceof ConfigurationError) {
      throw error;
    }
    // Other errors are git command failures
    throw new GitCommandError(
      'git remote get-url origin',
      1,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Parses GitHub URL to extract owner and repository name
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } {
  // Handle HTTPS format: https://github.com/owner/repo.git or https://github.com/owner/repo
  const httpsMatch = url.match(/https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/)?$/);
  if (httpsMatch) {
    return {
      owner: httpsMatch[1],
      repo: httpsMatch[2],
    };
  }

  // Handle SSH format: git@github.com:owner/repo.git
  const sshMatch = url.match(/git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (sshMatch) {
    return {
      owner: sshMatch[1],
      repo: sshMatch[2],
    };
  }

  // Check if it's a non-GitHub URL
  if (url.includes('github.com')) {
    throw new ConfigurationError(`Unable to parse GitHub URL format: ${url}`);
  }
  throw new ConfigurationError(`Remote origin is not a GitHub repository: ${url}`);
}

/**
 * Checks if a pull request exists for the given branch
 */
export async function checkPRExists(branchName: string): Promise<PRInfo | null> {
  const config = await getGitHubConfig();

  try {
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/pulls?head=${config.owner}:${branchName}&state=open`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'claude-codex-tdd',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Repository not found or no access - return null
        return null;
      }
      if (response.status === 401 || response.status === 403) {
        throw new GitHubAuthError(`Authentication failed: ${response.statusText}`);
      }
      throw new GitHubAPIError(`API request failed: ${response.statusText}`, response.status);
    }

    const prs = await response.json();

    if (!Array.isArray(prs) || prs.length === 0) {
      return null;
    }

    // Return the first (most recent) PR
    const pr = prs[0];
    return formatPRInfo(pr);
  } catch (error) {
    if (error instanceof GitHubAuthError || error instanceof GitHubAPIError) {
      throw error;
    }
    throw new GitHubAPIError(
      `Failed to check PR existence: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Lists all PRs (open/closed/merged) for a branch
 */
export async function listPRsForBranch(branchName: string): Promise<PRInfo[]> {
  const config = await getGitHubConfig();

  try {
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/pulls?head=${config.owner}:${branchName}&state=all`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'claude-codex-tdd',
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new GitHubAuthError(`Authentication failed: ${response.statusText}`);
      }
      throw new GitHubAPIError(`API request failed: ${response.statusText}`, response.status);
    }

    const prs = await response.json();

    if (!Array.isArray(prs)) {
      return [];
    }

    return prs.map(formatPRInfo);
  } catch (error) {
    if (error instanceof GitHubAuthError || error instanceof GitHubAPIError) {
      throw error;
    }
    throw new GitHubAPIError(
      `Failed to list PRs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// GitHub API PR response interface
interface GitHubPRResponse {
  number: number;
  title: string;
  html_url: string;
  state: string;
  head: { ref: string };
  base: { ref: string };
}

/**
 * Formats GitHub API PR response to PRInfo interface
 */
function formatPRInfo(pr: GitHubPRResponse): PRInfo {
  return {
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    state: pr.state as 'open' | 'closed' | 'merged',
    headBranch: pr.head.ref,
    baseBranch: pr.base.ref,
  };
}

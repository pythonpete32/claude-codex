import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import {
  ConfigurationError,
  GitHubAPIError,
  GitHubAuthError,
  RepositoryNotFoundError,
} from '../../shared/errors.js';
import type { GitHubConfig, GitHubPullRequest, PRInfo } from '../../shared/types.js';

const execAsync = promisify(exec);

async function runGitCommand(command: string): Promise<string> {
  try {
    const { stdout } = await execAsync(command);
    return stdout.trim();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Git command failed: ${command} - ${message}`);
  }
}

export async function getGitHubConfig(): Promise<GitHubConfig> {
  // Check for GitHub token
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new GitHubAuthError('GITHUB_TOKEN environment variable not set');
  }

  try {
    // Get remote origin URL
    const remoteUrl = await runGitCommand('git remote get-url origin');

    // Parse GitHub repository info from URL
    const { owner, repo } = parseGitHubUrl(remoteUrl);

    return { token, owner, repo };
  } catch (error) {
    throw new ConfigurationError(`Failed to get GitHub configuration: ${error}`);
  }
}

function parseGitHubUrl(url: string): { owner: string; repo: string } {
  // Handle both HTTPS and SSH formats
  let match: RegExpMatchArray | null = null;

  // HTTPS format: https://github.com/owner/repo.git
  match = url.match(/https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);

  if (!match) {
    // SSH format: git@github.com:owner/repo.git
    match = url.match(/git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
  }

  if (!match) {
    throw new RepositoryNotFoundError(`Not a valid GitHub repository URL: ${url}`);
  }

  const [, owner, repo] = match;
  return { owner, repo };
}

async function githubApiRequest(
  config: GitHubConfig,
  endpoint: string
): Promise<GitHubPullRequest[]> {
  const url = `https://api.github.com${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'claude-codex-tdd',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new GitHubAuthError('Invalid GitHub token');
      }
      if (response.status === 404) {
        throw new RepositoryNotFoundError(
          `Repository ${config.owner}/${config.repo} not found or not accessible`
        );
      }
      throw new GitHubAPIError(
        `GitHub API request failed: ${response.statusText}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (
      error instanceof GitHubAuthError ||
      error instanceof RepositoryNotFoundError ||
      error instanceof GitHubAPIError
    ) {
      throw error;
    }
    throw new GitHubAPIError(`Network error: ${error}`);
  }
}

export async function checkPRExists(branchName: string): Promise<PRInfo | null> {
  try {
    const config = await getGitHubConfig();
    const endpoint = `/repos/${config.owner}/${config.repo}/pulls?head=${config.owner}:${branchName}&state=open`;

    const prs = await githubApiRequest(config, endpoint);

    if (prs.length === 0) {
      return null;
    }

    const pr = prs[0]; // Get the first (most recent) PR
    return {
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      state: pr.state,
      headBranch: pr.head.ref,
      baseBranch: pr.base.ref,
    };
  } catch (error) {
    if (
      error instanceof GitHubAuthError ||
      error instanceof RepositoryNotFoundError ||
      error instanceof GitHubAPIError ||
      error instanceof ConfigurationError
    ) {
      throw error;
    }
    throw new GitHubAPIError(`Failed to check PR existence: ${error}`);
  }
}

export async function listPRsForBranch(branchName: string): Promise<PRInfo[]> {
  try {
    const config = await getGitHubConfig();
    const endpoint = `/repos/${config.owner}/${config.repo}/pulls?head=${config.owner}:${branchName}&state=all`;

    const prs = await githubApiRequest(config, endpoint);

    return prs.map(
      (pr): PRInfo => ({
        number: pr.number,
        title: pr.title,
        url: pr.html_url,
        state: pr.state,
        headBranch: pr.head.ref,
        baseBranch: pr.base.ref,
      })
    );
  } catch (error) {
    if (
      error instanceof GitHubAuthError ||
      error instanceof RepositoryNotFoundError ||
      error instanceof GitHubAPIError ||
      error instanceof ConfigurationError
    ) {
      throw error;
    }
    throw new GitHubAPIError(`Failed to list PRs for branch: ${error}`);
  }
}

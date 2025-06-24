import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConfigurationError,
  GitCommandError,
  GitHubAPIError,
  GitHubAuthError,
} from '../../../src/shared/errors.js';

// Mock node:child_process
const mockExec = vi.fn();
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));
vi.mock('util', () => ({
  promisify: vi.fn(() => mockExec),
}));

// Mock global fetch
global.fetch = vi.fn();
const mockFetch = vi.mocked(fetch);

// Import modules after mocking
const { getGitHubConfig, checkPRExists, listPRsForBranch } = await import(
  '../../../src/operations/github.js'
);

describe('GitHub Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.GITHUB_TOKEN;
  });

  describe('getGitHubConfig', () => {
    it('should extract config from HTTPS remote URL', async () => {
      process.env.GITHUB_TOKEN = 'test-token';
      mockExec.mockResolvedValue({
        stdout: 'https://github.com/owner/repo.git\n',
        stderr: '',
      });

      const config = await getGitHubConfig();

      expect(config).toEqual({
        token: 'test-token',
        owner: 'owner',
        repo: 'repo',
      });
      expect(mockExec).toHaveBeenCalledWith('git remote get-url origin');
    });

    it('should extract config from SSH remote URL', async () => {
      process.env.GITHUB_TOKEN = 'test-token';
      mockExec.mockResolvedValue({
        stdout: 'git@github.com:owner/repo.git\n',
        stderr: '',
      });

      const config = await getGitHubConfig();

      expect(config).toEqual({
        token: 'test-token',
        owner: 'owner',
        repo: 'repo',
      });
    });

    it('should handle HTTPS URL without .git suffix', async () => {
      process.env.GITHUB_TOKEN = 'test-token';
      mockExec.mockResolvedValue({
        stdout: 'https://github.com/owner/repo\n',
        stderr: '',
      });

      const config = await getGitHubConfig();

      expect(config).toEqual({
        token: 'test-token',
        owner: 'owner',
        repo: 'repo',
      });
    });

    it('should throw GitHubAuthError when GITHUB_TOKEN is missing', async () => {
      await expect(getGitHubConfig()).rejects.toThrow(GitHubAuthError);
    });

    it('should throw GitCommandError when git remote fails', async () => {
      process.env.GITHUB_TOKEN = 'test-token';
      mockExec.mockRejectedValue(new Error('not a git repository'));

      await expect(getGitHubConfig()).rejects.toThrow(GitCommandError);
    });

    it('should throw ConfigurationError for non-GitHub remote', async () => {
      process.env.GITHUB_TOKEN = 'test-token';
      mockExec.mockResolvedValue({
        stdout: 'https://gitlab.com/owner/repo.git\n',
        stderr: '',
      });

      await expect(getGitHubConfig()).rejects.toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError for invalid URL format', async () => {
      process.env.GITHUB_TOKEN = 'test-token';
      mockExec.mockResolvedValue({
        stdout: 'invalid-url\n',
        stderr: '',
      });

      await expect(getGitHubConfig()).rejects.toThrow(ConfigurationError);
    });
  });

  describe('checkPRExists', () => {
    beforeEach(() => {
      process.env.GITHUB_TOKEN = 'test-token';
      mockExec.mockResolvedValue({
        stdout: 'https://github.com/owner/repo.git\n',
        stderr: '',
      });
    });

    it('should return PR info when PR exists', async () => {
      const mockPRResponse = [
        {
          number: 123,
          title: 'Test PR',
          html_url: 'https://github.com/owner/repo/pull/123',
          state: 'open',
          head: { ref: 'tdd/task-123' },
          base: { ref: 'main' },
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPRResponse,
      } as Response);

      const result = await checkPRExists('tdd/task-123');

      expect(result).toEqual({
        number: 123,
        title: 'Test PR',
        url: 'https://github.com/owner/repo/pull/123',
        state: 'open',
        headBranch: 'tdd/task-123',
        baseBranch: 'main',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/pulls?head=owner:tdd/task-123&state=open',
        {
          headers: {
            Authorization: 'Bearer test-token',
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'claude-codex-tdd',
          },
        }
      );
    });

    it('should return null when no PR exists', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);

      const result = await checkPRExists('tdd/task-123');
      expect(result).toBeNull();
    });

    it('should handle 404 response gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await checkPRExists('tdd/task-123');
      expect(result).toBeNull();
    });

    it('should throw GitHubAuthError for 401/403 responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(checkPRExists('tdd/task-123')).rejects.toThrow(GitHubAuthError);
    });

    it('should throw GitHubAPIError for other HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(checkPRExists('tdd/task-123')).rejects.toThrow(GitHubAPIError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(checkPRExists('tdd/task-123')).rejects.toThrow(GitHubAPIError);
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(checkPRExists('tdd/task-123')).rejects.toThrow(GitHubAPIError);
    });
  });

  describe('listPRsForBranch', () => {
    beforeEach(() => {
      process.env.GITHUB_TOKEN = 'test-token';
      mockExec.mockResolvedValue({
        stdout: 'https://github.com/owner/repo.git\n',
        stderr: '',
      });
    });

    it('should return all PRs for branch', async () => {
      const mockPRResponse = [
        {
          number: 123,
          title: 'Test PR',
          html_url: 'https://github.com/owner/repo/pull/123',
          state: 'open',
          head: { ref: 'tdd/task-123' },
          base: { ref: 'main' },
        },
        {
          number: 124,
          title: 'Closed PR',
          html_url: 'https://github.com/owner/repo/pull/124',
          state: 'closed',
          head: { ref: 'tdd/task-123' },
          base: { ref: 'main' },
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPRResponse,
      } as Response);

      const result = await listPRsForBranch('tdd/task-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        number: 123,
        title: 'Test PR',
        url: 'https://github.com/owner/repo/pull/123',
        state: 'open',
        headBranch: 'tdd/task-123',
        baseBranch: 'main',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/pulls?head=owner:tdd/task-123&state=all',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should return empty array when no PRs exist', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);

      const result = await listPRsForBranch('tdd/task-123');
      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(listPRsForBranch('tdd/task-123')).rejects.toThrow(GitHubAPIError);
    });
  });
});

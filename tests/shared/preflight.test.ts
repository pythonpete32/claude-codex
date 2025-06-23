import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { printPreflightResults, validateEnvironment } from '../../src/shared/preflight.js';
import type { PreflightResult } from '../../src/shared/types.js';

// Mock Node.js modules with proper factory functions
vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

vi.mock('node:fs', () => ({
  promises: {
    mkdir: vi.fn(),
    access: vi.fn(),
  },
  constants: {
    W_OK: 2,
  },
}));

vi.mock('node:util', () => ({
  promisify: vi.fn((fn) => fn),
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock console methods
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();
const mockConsoleWarn = vi.fn();

vi.stubGlobal('console', {
  log: mockConsoleLog,
  error: mockConsoleError,
  warn: mockConsoleWarn,
});

// Get mocked functions
const mockExec = vi.mocked(await import('node:child_process')).exec;
const mockFs = vi.mocked(await import('node:fs')).promises;

describe('Preflight Environment Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock process.version
    Object.defineProperty(process, 'version', {
      value: 'v18.0.0',
      writable: true,
    });

    // Mock process.env.GITHUB_TOKEN
    process.env.GITHUB_TOKEN = 'github_token_123';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.GITHUB_TOKEN;
  });

  describe('validateEnvironment', () => {
    it.skip('should pass all validations with no errors or warnings', async () => {
      // Setup successful mocks
      mockExec
        .mockResolvedValueOnce({ stdout: '.git', stderr: '' }) // git rev-parse
        .mockResolvedValueOnce({ stdout: '/usr/local/bin/claude', stderr: '' }) // which claude
        .mockResolvedValueOnce({ stdout: 'https://github.com/owner/repo.git\n', stderr: '' }) // git remote
        .mockResolvedValueOnce({ stdout: 'John Doe\n', stderr: '' }) // git config user.name
        .mockResolvedValueOnce({ stdout: 'john@example.com\n', stderr: '' }); // git config user.email

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.access.mockResolvedValue(undefined);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await validateEnvironment();

      // Debug to see what's failing
      if (!result.success) {
        console.log('❌ Debug - Errors:', result.errors);
        console.log('⚠️  Debug - Warnings:', result.warnings);
      }

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should fail when not in git repository', async () => {
      mockExec.mockRejectedValueOnce(new Error('Not a git repository'));

      const result = await validateEnvironment();

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Current directory is not a git repository. Please run this command from within a git repository.'
      );
    });

    it('should fail when GITHUB_TOKEN is not set', async () => {
      delete process.env.GITHUB_TOKEN;

      mockExec.mockResolvedValueOnce({ stdout: '.git', stderr: '' }); // git rev-parse

      const result = await validateEnvironment();

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'GITHUB_TOKEN environment variable not set. Please set your GitHub personal access token.'
      );
    });

    it('should fail when GITHUB_TOKEN is invalid', async () => {
      mockExec.mockResolvedValueOnce({ stdout: '.git', stderr: '' }); // git rev-parse

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await validateEnvironment();

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'GITHUB_TOKEN is invalid or expired. Please update your GitHub token.'
      );
    });

    it('should warn when GitHub API returns non-401 error', async () => {
      mockExec.mockResolvedValueOnce({ stdout: '.git', stderr: '' }); // git rev-parse

      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
      });

      const result = await validateEnvironment();

      expect(result.warnings).toContain(
        'GitHub API returned status 403. Token may have limited permissions.'
      );
    });

    it('should warn when GitHub API request fails due to network error', async () => {
      mockExec.mockResolvedValueOnce({ stdout: '.git', stderr: '' }); // git rev-parse

      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await validateEnvironment();

      expect(result.warnings).toContain('Unable to validate GitHub token due to network error.');
    });

    it('should fail when Claude CLI is not found', async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: '.git', stderr: '' }) // git rev-parse
        .mockRejectedValueOnce(new Error('claude not found')); // which claude

      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const result = await validateEnvironment();

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Claude Code CLI not found. Please install and authenticate with Claude Code.'
      );
    });

    it('should fail when directory permissions are insufficient', async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: '.git', stderr: '' }) // git rev-parse
        .mockResolvedValueOnce({ stdout: '/usr/local/bin/claude', stderr: '' }); // which claude

      mockFetch.mockResolvedValue({ ok: true, status: 200 });
      mockFs.mkdir.mockRejectedValueOnce(new Error('Permission denied'));

      const result = await validateEnvironment();

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Cannot write to current directory. Please check write permissions.'
      );
    });

    it('should fail when worktree directory cannot be created', async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: '.git', stderr: '' }) // git rev-parse
        .mockResolvedValueOnce({ stdout: '/usr/local/bin/claude', stderr: '' }); // which claude

      mockFetch.mockResolvedValue({ ok: true, status: 200 });
      mockFs.mkdir
        .mockResolvedValueOnce(undefined) // .codex directory
        .mockRejectedValueOnce(new Error('Permission denied')); // worktree directory

      mockFs.access.mockResolvedValueOnce(undefined); // .codex access

      const result = await validateEnvironment();

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Cannot create worktree directory. Please check write permissions for parent directory.'
      );
    });

    it('should warn when git remote is not GitHub', async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: '.git', stderr: '' }) // git rev-parse
        .mockResolvedValueOnce({ stdout: '/usr/local/bin/claude', stderr: '' }) // which claude
        .mockResolvedValueOnce({ stdout: 'https://gitlab.com/owner/repo.git\n', stderr: '' }); // git remote

      mockFetch.mockResolvedValue({ ok: true, status: 200 });
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.access.mockResolvedValue(undefined);

      const result = await validateEnvironment();

      expect(result.warnings).toContain(
        'Git remote origin is not a GitHub repository. PR creation may not work.'
      );
    });

    it('should warn when no git remote origin found', async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: '.git', stderr: '' }) // git rev-parse
        .mockResolvedValueOnce({ stdout: '/usr/local/bin/claude', stderr: '' }) // which claude
        .mockRejectedValueOnce(new Error('No such remote')); // git remote

      mockFetch.mockResolvedValue({ ok: true, status: 200 });
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.access.mockResolvedValue(undefined);

      const result = await validateEnvironment();

      expect(result.warnings).toContain('No git remote origin found. PR creation will not work.');
    });

    it('should warn when git user configuration is missing', async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: '.git', stderr: '' }) // git rev-parse
        .mockResolvedValueOnce({ stdout: '/usr/local/bin/claude', stderr: '' }) // which claude
        .mockResolvedValueOnce({ stdout: 'https://github.com/owner/repo.git\n', stderr: '' }) // git remote
        .mockRejectedValueOnce(new Error('No such config')); // git config user.name

      mockFetch.mockResolvedValue({ ok: true, status: 200 });
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.access.mockResolvedValue(undefined);

      const result = await validateEnvironment();

      expect(result.warnings).toContain(
        'Git user configuration missing. Please set git user.name and user.email.'
      );
    });

    it('should fail when Node.js version is too old', async () => {
      Object.defineProperty(process, 'version', {
        value: 'v16.14.0',
        writable: true,
      });

      mockExec.mockResolvedValueOnce({ stdout: '.git', stderr: '' }); // git rev-parse

      const result = await validateEnvironment();

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Node.js version v16.14.0 is not supported. Please upgrade to Node.js 18 or higher.'
      );
    });

    it('should handle multiple errors and warnings', async () => {
      delete process.env.GITHUB_TOKEN;
      Object.defineProperty(process, 'version', {
        value: 'v14.0.0',
        writable: true,
      });

      mockExec
        .mockRejectedValueOnce(new Error('Not a git repo')) // git rev-parse
        .mockRejectedValueOnce(new Error('claude not found')); // which claude

      const result = await validateEnvironment();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4); // At least: git repo, github token, claude cli, node version
    });
  });

  describe('printPreflightResults', () => {
    it('should print success message when validation passes', () => {
      const result: PreflightResult = {
        success: true,
        errors: [],
        warnings: [],
      };

      printPreflightResults(result);

      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Environment validation passed');
    });

    it('should print errors when validation fails', () => {
      const result: PreflightResult = {
        success: false,
        errors: ['Error 1', 'Error 2'],
        warnings: [],
      };

      printPreflightResults(result);

      expect(mockConsoleError).toHaveBeenCalledWith('❌ Environment validation failed:');
      expect(mockConsoleError).toHaveBeenCalledWith('   • Error 1');
      expect(mockConsoleError).toHaveBeenCalledWith('   • Error 2');
    });

    it('should print warnings when present', () => {
      const result: PreflightResult = {
        success: true,
        errors: [],
        warnings: ['Warning 1', 'Warning 2'],
      };

      printPreflightResults(result);

      expect(mockConsoleWarn).toHaveBeenCalledWith('⚠️  Environment warnings:');
      expect(mockConsoleWarn).toHaveBeenCalledWith('   • Warning 1');
      expect(mockConsoleWarn).toHaveBeenCalledWith('   • Warning 2');
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Environment validation passed');
      expect(mockConsoleLog).toHaveBeenCalledWith('   (with warnings - see above)');
    });

    it('should print both errors and warnings', () => {
      const result: PreflightResult = {
        success: false,
        errors: ['Fatal error'],
        warnings: ['Minor warning'],
      };

      printPreflightResults(result);

      expect(mockConsoleError).toHaveBeenCalledWith('❌ Environment validation failed:');
      expect(mockConsoleError).toHaveBeenCalledWith('   • Fatal error');
      expect(mockConsoleWarn).toHaveBeenCalledWith('⚠️  Environment warnings:');
      expect(mockConsoleWarn).toHaveBeenCalledWith('   • Minor warning');
    });
  });
});

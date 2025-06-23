import { beforeEach, describe, expect, it, vi } from 'vitest';

// Types for mock functions
interface ExecOptions {
  cwd?: string;
  env?: Record<string, string>;
  [key: string]: unknown;
}

// Mock dependencies first
const mockExecAsync = vi.fn();

vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

vi.mock('util', () => ({
  promisify: vi.fn(() => mockExecAsync),
}));

vi.mock('fs', () => ({
  promises: {
    access: vi.fn(),
    mkdir: vi.fn(),
    rmdir: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn(),
  },
}));

vi.mock('../../src/core/operations/worktree.js', () => ({
  isGitRepository: vi.fn(),
}));

// Import modules after mocking
const { validateEnvironment, quickValidation } = await import('../../src/shared/preflight.js');
const mockFs = await import('node:fs');
const mockWorktree = await import('../../src/core/operations/worktree.js');

describe('Environment Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default successful environment
    vi.mocked(mockWorktree.isGitRepository).mockResolvedValue(true);
    mockExecAsync.mockImplementation((cmd: string, _options?: ExecOptions) => {
      switch (cmd) {
        case 'git remote get-url origin':
          return Promise.resolve({ stdout: 'https://github.com/test/repo.git', stderr: '' });
        case 'git status --porcelain':
          return Promise.resolve({ stdout: '', stderr: '' });
        case 'claude-code --version':
          return Promise.resolve({ stdout: 'claude-code v1.0.0', stderr: '' });
        case 'git config user.name':
          return Promise.resolve({ stdout: 'Test User', stderr: '' });
        case 'git config user.email':
          return Promise.resolve({ stdout: 'test@example.com', stderr: '' });
        default:
          return Promise.resolve({ stdout: '', stderr: '' });
      }
    });

    // Setup successful filesystem operations
    vi.mocked(mockFs.promises.access).mockResolvedValue(undefined);
    vi.mocked(mockFs.promises.mkdir).mockResolvedValue(undefined);
    vi.mocked(mockFs.promises.rmdir).mockResolvedValue(undefined);
    vi.mocked(mockFs.promises.writeFile).mockResolvedValue(undefined);
    vi.mocked(mockFs.promises.unlink).mockResolvedValue(undefined);

    // Setup environment variables
    process.env.GITHUB_TOKEN = 'ghp_test_token_1234567890';

    // Mock Node.js version
    Object.defineProperty(process, 'version', {
      value: 'v18.16.0',
      configurable: true,
    });
  });

  describe('validateEnvironment', () => {
    describe('successful validation', () => {
      it('should pass all validations in ideal environment', async () => {
        const result = await validateEnvironment();

        expect(result).toEqual({
          success: true,
          errors: [],
          warnings: [],
        });

        expect(mockWorktree.isGitRepository).toHaveBeenCalledOnce();
        expect(mockExecAsync).toHaveBeenCalledWith('git remote get-url origin');
        expect(mockExecAsync).toHaveBeenCalledWith('git status --porcelain');
        expect(mockExecAsync).toHaveBeenCalledWith('claude --version', { timeout: 5000 });
      });

      it('should pass with warnings for non-critical issues', async () => {
        // No remote configured
        mockExecAsync.mockImplementation((cmd: string, _options?: ExecOptions) => {
          if (cmd === 'git remote get-url origin') {
            return Promise.reject(new Error('No remote'));
          }
          if (cmd === 'claude --version') {
            return Promise.reject(new Error('Command not found'));
          }
          if (cmd === 'git config user.name') {
            return Promise.reject(new Error('Not configured'));
          }
          return Promise.resolve({ stdout: '', stderr: '' });
        });

        const result = await validateEnvironment();

        expect(result.success).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([
          'No remote "origin" configured. You may need to set up GitHub integration manually.',
          'Claude Code CLI not found or not working. Install it with: npm install -g @anthropic-ai/claude-code',
          'Git user.name or user.email not configured. Set them with: git config --global user.name "Your Name" && git config --global user.email "your@email.com"',
        ]);
      });
    });

    describe('git repository validation', () => {
      it('should fail when not in git repository', async () => {
        vi.mocked(mockWorktree.isGitRepository).mockResolvedValue(false);

        const result = await validateEnvironment();

        expect(result.success).toBe(false);
        expect(result.errors).toContain(
          'Current directory is not a git repository. Run "git init" to initialize one.'
        );
      });

      it('should warn about uncommitted changes', async () => {
        mockExecAsync.mockImplementation((cmd: string, _options?: ExecOptions) => {
          if (cmd === 'git status --porcelain') {
            return Promise.resolve({ stdout: 'M  modified-file.ts\n?? new-file.ts', stderr: '' });
          }
          return Promise.resolve({ stdout: '', stderr: '' });
        });

        const result = await validateEnvironment();

        expect(result.success).toBe(true);
        expect(result.warnings).toContain(
          'Working directory has uncommitted changes. Consider committing or stashing them first.'
        );
      });

      it('should warn when git status fails', async () => {
        mockExecAsync.mockImplementation((cmd: string, _options?: ExecOptions) => {
          if (cmd === 'git status --porcelain') {
            return Promise.reject(new Error('Git error'));
          }
          return Promise.resolve({ stdout: '', stderr: '' });
        });

        const result = await validateEnvironment();

        expect(result.warnings).toContain(
          'Unable to check git status. Repository may be in an inconsistent state.'
        );
      });
    });

    describe('GitHub token validation', () => {
      it('should fail when GITHUB_TOKEN is not set', async () => {
        delete process.env.GITHUB_TOKEN;

        const result = await validateEnvironment();

        expect(result.success).toBe(false);
        expect(result.errors).toContain(
          'GITHUB_TOKEN environment variable not set. ' +
            'Create a personal access token at https://github.com/settings/tokens and export it as GITHUB_TOKEN.'
        );
      });

      it('should fail when GITHUB_TOKEN is too short', async () => {
        process.env.GITHUB_TOKEN = 'short';

        const result = await validateEnvironment();

        expect(result.success).toBe(false);
        expect(result.errors).toContain(
          'GITHUB_TOKEN appears to be invalid (too short). Please check your token value.'
        );
      });

      it('should accept valid token length', async () => {
        process.env.GITHUB_TOKEN = 'ghp_1234567890abcdef';

        const result = await validateEnvironment();

        expect(result.success).toBe(true);
        expect(result.errors).not.toContain(expect.stringContaining('GITHUB_TOKEN'));
      });
    });

    describe('directory permissions validation', () => {
      it('should fail when cannot create .codex directory', async () => {
        vi.mocked(mockFs.promises.access).mockRejectedValue(new Error('ENOENT'));
        vi.mocked(mockFs.promises.mkdir).mockRejectedValue(new Error('EACCES'));

        const result = await validateEnvironment();

        expect(result.success).toBe(false);
        expect(result.errors).toContain(
          'Cannot create .codex directory. Check write permissions in current directory.'
        );
      });

      it('should pass when .codex directory already exists', async () => {
        vi.mocked(mockFs.promises.access).mockResolvedValue(undefined); // Directory exists

        const result = await validateEnvironment();

        expect(result.success).toBe(true);
        expect(mockFs.promises.mkdir).not.toHaveBeenCalled();
      });

      it('should fail when no write permissions in current directory', async () => {
        vi.mocked(mockFs.promises.writeFile).mockRejectedValue(new Error('EACCES'));

        const result = await validateEnvironment();

        expect(result.success).toBe(false);
        expect(result.errors).toContain('No write permissions in current directory.');
      });

      it('should handle multiple permission validation errors', async () => {
        // Make all fs operations fail to generate multiple specific errors
        vi.mocked(mockFs.promises.access).mockRejectedValue(new Error('Access error'));
        vi.mocked(mockFs.promises.mkdir).mockRejectedValue(new Error('Mkdir error'));
        vi.mocked(mockFs.promises.rmdir).mockRejectedValue(new Error('Rmdir error'));
        vi.mocked(mockFs.promises.writeFile).mockRejectedValue(new Error('Write error'));
        vi.mocked(mockFs.promises.unlink).mockRejectedValue(new Error('Unlink error'));

        const result = await validateEnvironment();

        expect(result.success).toBe(false);
        expect(result.errors).toContain(
          'Cannot create .codex directory. Check write permissions in current directory.'
        );
        expect(result.errors).toContain('No write permissions in current directory.');
      });
    });

    describe('Node.js version validation', () => {
      it('should fail for Node.js version < 18', async () => {
        Object.defineProperty(process, 'version', {
          value: 'v16.20.0',
          configurable: true,
        });

        const result = await validateEnvironment();

        expect(result.success).toBe(false);
        expect(result.errors).toContain(
          'Node.js v16.20.0 is not supported. Please upgrade to Node.js 18 or later.'
        );
      });

      it('should pass for Node.js version >= 18', async () => {
        Object.defineProperty(process, 'version', {
          value: 'v20.10.0',
          configurable: true,
        });

        const result = await validateEnvironment();

        expect(result.success).toBe(true);
        expect(result.errors).not.toContain(expect.stringContaining('Node.js'));
      });
    });

    describe('claude-code CLI validation', () => {
      it('should warn when claude-code command fails', async () => {
        mockExecAsync.mockImplementation((cmd: string, _options?: ExecOptions) => {
          if (cmd === 'claude --version') {
            return Promise.reject(new Error('Command not found'));
          }
          return Promise.resolve({ stdout: '', stderr: '' });
        });

        const result = await validateEnvironment();

        expect(result.warnings).toContain(
          'Claude Code CLI not found or not working. ' +
            'Install it with: npm install -g @anthropic-ai/claude-code'
        );
      });

      it('should pass when claude-code is available', async () => {
        const result = await validateEnvironment();

        expect(result.success).toBe(true);
        expect(result.warnings).not.toContain(expect.stringContaining('Claude Code'));
      });
    });
  });

  describe('quickValidation', () => {
    it('should return true for valid environment', async () => {
      const result = await quickValidation();

      expect(result).toBe(true);
      expect(mockWorktree.isGitRepository).toHaveBeenCalledOnce();
    });

    it('should return false when not in git repository', async () => {
      vi.mocked(mockWorktree.isGitRepository).mockResolvedValue(false);

      const result = await quickValidation();

      expect(result).toBe(false);
    });

    it('should return false when GITHUB_TOKEN is missing', async () => {
      delete process.env.GITHUB_TOKEN;

      const result = await quickValidation();

      expect(result).toBe(false);
    });

    it('should return false for Node.js version < 18', async () => {
      Object.defineProperty(process, 'version', {
        value: 'v16.20.0',
        configurable: true,
      });

      const result = await quickValidation();

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(mockWorktree.isGitRepository).mockRejectedValue(new Error('Git error'));

      const result = await quickValidation();

      expect(result).toBe(false);
    });

    it('should handle edge case Node.js versions', async () => {
      // Test exactly v18.0.0
      Object.defineProperty(process, 'version', {
        value: 'v18.0.0',
        configurable: true,
      });

      const result = await quickValidation();

      expect(result).toBe(true);

      // Test pre-release version
      Object.defineProperty(process, 'version', {
        value: 'v19.0.0-pre',
        configurable: true,
      });

      const result2 = await quickValidation();

      expect(result2).toBe(true);
    });
  });
});

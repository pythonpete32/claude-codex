import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TDDCommandArgs, TDDResult } from '../../../src/shared/types.js';

// Mock all dependencies
vi.mock('../../../src/core/messaging.js', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
  logSuccess: vi.fn(),
  logWarning: vi.fn(),
}));

vi.mock('../../../src/lib.js', () => ({
  forceSubscriptionAuth: vi.fn(),
}));

vi.mock('../../../src/shared/preflight.js', () => ({
  validateEnvironment: vi.fn(),
}));

vi.mock('../../../src/workflows/tdd.js', () => ({
  executeTDDWorkflow: vi.fn(),
}));

// Import mocked modules
const { logError, logInfo, logSuccess, logWarning } = await import(
  '../../../src/core/messaging.js'
);
const { forceSubscriptionAuth } = await import('../../../src/lib.js');
const { validateEnvironment } = await import('../../../src/shared/preflight.js');
const { executeTDDWorkflow } = await import('../../../src/workflows/tdd.js');

// Import module under test
const { handleTDDCommand } = await import('../../../src/cli/commands/tdd.js');

// Mock process.exit to prevent test process from exiting
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

describe('TDD Command Handler', () => {
  const mockArgs: TDDCommandArgs = {
    specPath: './test-spec.md',
    reviews: 3,
    branch: 'test-branch',
    cleanup: true,
    verbose: false,
  };

  const mockSuccessResult: TDDResult = {
    success: true,
    prUrl: 'https://github.com/test/repo/pull/123',
    iterations: 2,
    taskId: 'test-123',
  };

  const mockFailureResult: TDDResult = {
    success: false,
    iterations: 3,
    taskId: 'test-456',
    error: 'Maximum iterations reached without PR creation',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default successful mocks
    vi.mocked(forceSubscriptionAuth).mockResolvedValue();
    vi.mocked(validateEnvironment).mockResolvedValue({
      success: true,
      errors: [],
      warnings: [],
    });
    vi.mocked(executeTDDWorkflow).mockResolvedValue(mockSuccessResult);
  });

  describe('successful execution', () => {
    it('should complete successfully with PR creation', async () => {
      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit called');

      expect(forceSubscriptionAuth).toHaveBeenCalledOnce();
      expect(validateEnvironment).toHaveBeenCalledOnce();
      expect(executeTDDWorkflow).toHaveBeenCalledWith({
        specPath: expect.stringContaining('test-spec.md'),
        maxReviews: 3,
        branchName: 'test-branch',
        cleanup: true,
      });
      expect(logSuccess).toHaveBeenCalledWith('🎉 TDD Workflow Completed Successfully!');
      expect(logSuccess).toHaveBeenCalledWith(
        '✅ Pull Request Created: https://github.com/test/repo/pull/123'
      );
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('should handle default values correctly', async () => {
      const minimalArgs: TDDCommandArgs = {
        specPath: './spec.md',
      };

      await expect(handleTDDCommand(minimalArgs)).rejects.toThrow('process.exit called');

      expect(executeTDDWorkflow).toHaveBeenCalledWith({
        specPath: expect.stringContaining('spec.md'),
        maxReviews: 3, // Default value
        branchName: undefined,
        cleanup: true, // Default value
      });
    });

    it('should show warnings when present but continue execution', async () => {
      vi.mocked(validateEnvironment).mockResolvedValue({
        success: true,
        errors: [],
        warnings: ['Working directory has uncommitted changes'],
      });

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit called');

      expect(logWarning).toHaveBeenCalledWith('⚠️ Environment warnings:');
      expect(logWarning).toHaveBeenCalledWith('  • Working directory has uncommitted changes');
      expect(logInfo).toHaveBeenCalledWith('Proceeding with warnings...\n');
      expect(executeTDDWorkflow).toHaveBeenCalled();
    });

    it('should preserve resources when cleanup is disabled', async () => {
      const argsNoCleanup = { ...mockArgs, cleanup: false };

      await expect(handleTDDCommand(argsNoCleanup)).rejects.toThrow('process.exit called');

      expect(executeTDDWorkflow).toHaveBeenCalledWith(expect.objectContaining({ cleanup: false }));
      expect(logInfo).toHaveBeenCalledWith('\n📁 Resources preserved for debugging:');
    });
  });

  describe('environment validation failures', () => {
    it('should fail when environment validation has errors', async () => {
      vi.mocked(validateEnvironment).mockResolvedValue({
        success: false,
        errors: ['GITHUB_TOKEN environment variable not set', 'Not a git repository'],
        warnings: ['Token permissions may be limited'],
      });

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit called');

      expect(logError).toHaveBeenCalledWith('❌ Environment validation failed:');
      expect(logError).toHaveBeenCalledWith('  • GITHUB_TOKEN environment variable not set');
      expect(logError).toHaveBeenCalledWith('  • Not a git repository');
      expect(logWarning).toHaveBeenCalledWith('\n⚠️ Warnings:');
      expect(logWarning).toHaveBeenCalledWith('  • Token permissions may be limited');
      expect(executeTDDWorkflow).not.toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should fail when forceSubscriptionAuth throws', async () => {
      vi.mocked(forceSubscriptionAuth).mockRejectedValue(new Error('Authentication failed'));

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit called');

      expect(logError).toHaveBeenCalledWith('❌ TDD Command Failed');
      expect(logError).toHaveBeenCalledWith('💥 Error: Authentication failed');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('workflow execution failures', () => {
    it('should handle workflow failure gracefully', async () => {
      vi.mocked(executeTDDWorkflow).mockResolvedValue(mockFailureResult);

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit called');

      expect(logError).toHaveBeenCalledWith('❌ TDD Workflow Failed');
      expect(logError).toHaveBeenCalledWith(
        '💥 Error: Maximum iterations reached without PR creation'
      );
      expect(logInfo).toHaveBeenCalledWith('📊 Attempted 3 iterations of 3');
      expect(logInfo).toHaveBeenCalledWith('🆔 Task ID: test-456');
      expect(logError).toHaveBeenCalledWith('\n🔧 Troubleshooting suggestions:');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle workflow exception', async () => {
      vi.mocked(executeTDDWorkflow).mockRejectedValue(new Error('Workflow crashed'));

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit called');

      expect(logError).toHaveBeenCalledWith('❌ TDD Command Failed');
      expect(logError).toHaveBeenCalledWith('💥 Error: Workflow crashed');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should show stack trace in verbose mode', async () => {
      const verboseArgs = { ...mockArgs, verbose: true };
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test:1:1';

      vi.mocked(executeTDDWorkflow).mockRejectedValue(error);

      await expect(handleTDDCommand(verboseArgs)).rejects.toThrow('process.exit called');

      expect(logError).toHaveBeenCalledWith('\n🔍 Stack trace:');
      expect(logError).toHaveBeenCalledWith('Error: Test error\n    at test:1:1');
    });
  });

  describe('configuration display', () => {
    it('should display workflow configuration', async () => {
      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit called');

      expect(logInfo).toHaveBeenCalledWith('\n📋 Workflow Configuration:');
      expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('Specification:'));
      expect(logInfo).toHaveBeenCalledWith('  Max Reviews: 3');
      expect(logInfo).toHaveBeenCalledWith('  Branch: test-branch');
      expect(logInfo).toHaveBeenCalledWith('  Cleanup: enabled');
    });

    it('should show auto-generated branch when no branch provided', async () => {
      const argsNoBranch = { ...mockArgs, branch: undefined };

      await expect(handleTDDCommand(argsNoBranch)).rejects.toThrow('process.exit called');

      expect(logInfo).toHaveBeenCalledWith('  Branch: auto-generated');
    });

    it('should show verbose mode when enabled', async () => {
      const verboseArgs = { ...mockArgs, verbose: true };

      await expect(handleTDDCommand(verboseArgs)).rejects.toThrow('process.exit called');

      expect(logInfo).toHaveBeenCalledWith('  Verbose: enabled');
    });

    it('should show cleanup disabled when specified', async () => {
      const argsNoCleanup = { ...mockArgs, cleanup: false };

      await expect(handleTDDCommand(argsNoCleanup)).rejects.toThrow('process.exit called');

      expect(logInfo).toHaveBeenCalledWith('  Cleanup: disabled');
    });
  });

  describe('result reporting', () => {
    it('should provide detailed success information', async () => {
      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit called');

      expect(logSuccess).toHaveBeenCalledWith('🎉 TDD Workflow Completed Successfully!');
      expect(logSuccess).toHaveBeenCalledWith(
        '✅ Pull Request Created: https://github.com/test/repo/pull/123'
      );
      expect(logInfo).toHaveBeenCalledWith('📊 Completed in 2 iterations');
      expect(logInfo).toHaveBeenCalledWith('🆔 Task ID: test-123');
    });

    it('should handle single iteration correctly', async () => {
      const singleIterationResult = { ...mockSuccessResult, iterations: 1 };
      vi.mocked(executeTDDWorkflow).mockResolvedValue(singleIterationResult);

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit called');

      expect(logInfo).toHaveBeenCalledWith('📊 Completed in 1 iteration');
    });

    it('should provide detailed failure information', async () => {
      vi.mocked(executeTDDWorkflow).mockResolvedValue(mockFailureResult);

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit called');

      expect(logError).toHaveBeenCalledWith('❌ TDD Workflow Failed');
      expect(logError).toHaveBeenCalledWith(
        '💥 Error: Maximum iterations reached without PR creation'
      );
      expect(logInfo).toHaveBeenCalledWith('📊 Attempted 3 iterations of 3');
      expect(logInfo).toHaveBeenCalledWith('🆔 Task ID: test-456');
    });

    it('should show troubleshooting suggestions on failure', async () => {
      vi.mocked(executeTDDWorkflow).mockResolvedValue(mockFailureResult);

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit called');

      expect(logError).toHaveBeenCalledWith('\n🔧 Troubleshooting suggestions:');
      expect(logError).toHaveBeenCalledWith(
        '   • Check specification file clarity and completeness'
      );
      expect(logError).toHaveBeenCalledWith('   • Verify GitHub repository permissions');
      expect(logError).toHaveBeenCalledWith(
        '   • Review agent responses for implementation issues'
      );
      expect(logError).toHaveBeenCalledWith('   • Consider increasing --reviews for complex tasks');
    });
  });

  describe('path resolution', () => {
    it('should resolve relative paths to absolute', async () => {
      const argsRelativePath = { ...mockArgs, specPath: './relative/spec.md' };

      await expect(handleTDDCommand(argsRelativePath)).rejects.toThrow('process.exit called');

      expect(executeTDDWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          specPath: expect.stringMatching(/.*relative\/spec\.md$/),
        })
      );
    });

    it('should handle absolute paths correctly', async () => {
      const argsAbsolutePath = { ...mockArgs, specPath: '/absolute/path/spec.md' };

      await expect(handleTDDCommand(argsAbsolutePath)).rejects.toThrow('process.exit called');

      expect(executeTDDWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          specPath: '/absolute/path/spec.md',
        })
      );
    });
  });
});

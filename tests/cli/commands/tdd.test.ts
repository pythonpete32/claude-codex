import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleTDDCommand } from '../../../src/cli/commands/tdd.js';
import type { PreflightResult, TDDCommandArgs, TDDResult } from '../../../src/shared/types.js';

// Mock dependencies
vi.mock('../../../src/workflows/tdd.js', () => ({
  executeTDDWorkflow: vi.fn(),
}));

vi.mock('../../../src/shared/preflight.js', () => ({
  validateEnvironment: vi.fn(),
}));

vi.mock('node:path', () => ({
  resolve: vi.fn((path: string) => `/resolved/${path}`),
}));

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit');
});

// Import mocked modules
const mockWorkflow = await import('../../../src/workflows/tdd.js');
const mockPreflight = await import('../../../src/shared/preflight.js');

describe('TDD CLI Command Handler', () => {
  const mockArgs: TDDCommandArgs = {
    specPath: './test-spec.md',
    reviews: 3,
    branch: 'test-branch',
    cleanup: true,
    verbose: false,
  };

  const mockSuccessfulPreflight: PreflightResult = {
    success: true,
    errors: [],
    warnings: [],
  };

  const mockSuccessfulResult: TDDResult = {
    success: true,
    prUrl: 'https://github.com/test/repo/pull/123',
    iterations: 2,
    taskId: 'test-task-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset console spies
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Setup default successful mocks
    vi.mocked(mockPreflight.validateEnvironment).mockResolvedValue(mockSuccessfulPreflight);
    vi.mocked(mockWorkflow.executeTDDWorkflow).mockResolvedValue(mockSuccessfulResult);
  });

  describe('successful execution', () => {
    it('should handle successful workflow execution', async () => {
      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit');

      expect(mockPreflight.validateEnvironment).toHaveBeenCalledOnce();
      expect(mockWorkflow.executeTDDWorkflow).toHaveBeenCalledWith({
        specPath: '/resolved/./test-spec.md',
        maxReviews: 3,
        branchName: 'test-branch',
        cleanup: true,
      });

      expect(console.log).toHaveBeenCalledWith('✅ TDD Workflow Completed Successfully!');
      expect(console.log).toHaveBeenCalledWith(
        '   📝 Pull Request: https://github.com/test/repo/pull/123'
      );
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('should display workflow configuration', async () => {
      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit');

      expect(console.log).toHaveBeenCalledWith('🤖 Claude Codex - Starting TDD Workflow');
      expect(console.log).toHaveBeenCalledWith('   Specification: /resolved/./test-spec.md');
      expect(console.log).toHaveBeenCalledWith('   Max Reviews: 3');
      expect(console.log).toHaveBeenCalledWith('   Branch: test-branch');
      expect(console.log).toHaveBeenCalledWith('   Cleanup: enabled');
    });

    it('should handle args without branch name', async () => {
      const argsNoBranch = { ...mockArgs, branch: undefined };

      await expect(handleTDDCommand(argsNoBranch)).rejects.toThrow('process.exit');

      expect(mockWorkflow.executeTDDWorkflow).toHaveBeenCalledWith({
        specPath: '/resolved/./test-spec.md',
        maxReviews: 3,
        branchName: undefined,
        cleanup: true,
      });

      // Should not display branch line
      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Branch:'));
    });

    it('should show verbose mode when enabled', async () => {
      const verboseArgs = { ...mockArgs, verbose: true };

      await expect(handleTDDCommand(verboseArgs)).rejects.toThrow('process.exit');

      expect(console.log).toHaveBeenCalledWith('   Verbose: enabled');
    });

    it('should handle cleanup disabled', async () => {
      const noCleanupArgs = { ...mockArgs, cleanup: false };

      await expect(handleTDDCommand(noCleanupArgs)).rejects.toThrow('process.exit');

      expect(console.log).toHaveBeenCalledWith('   Cleanup: disabled');
      expect(mockWorkflow.executeTDDWorkflow).toHaveBeenCalledWith({
        specPath: '/resolved/./test-spec.md',
        maxReviews: 3,
        branchName: 'test-branch',
        cleanup: false,
      });
    });
  });

  describe('environment validation failures', () => {
    it('should handle environment validation errors', async () => {
      const failedPreflight: PreflightResult = {
        success: false,
        errors: ['GITHUB_TOKEN not found', 'Not a git repository'],
        warnings: ['Git user not configured'],
      };

      vi.mocked(mockPreflight.validateEnvironment).mockResolvedValue(failedPreflight);

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith('❌ Environment validation failed:');
      expect(console.error).toHaveBeenCalledWith('  • GITHUB_TOKEN not found');
      expect(console.error).toHaveBeenCalledWith('  • Not a git repository');
      expect(console.warn).toHaveBeenCalledWith('⚠️  Warnings:');
      expect(console.warn).toHaveBeenCalledWith('  • Git user not configured');

      expect(mockWorkflow.executeTDDWorkflow).not.toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should display warnings even when validation succeeds', async () => {
      const preflightWithWarnings: PreflightResult = {
        success: true,
        errors: [],
        warnings: ['Claude Code CLI not found'],
      };

      vi.mocked(mockPreflight.validateEnvironment).mockResolvedValue(preflightWithWarnings);

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit');

      expect(console.warn).toHaveBeenCalledWith('⚠️  Warnings:');
      expect(console.warn).toHaveBeenCalledWith('  • Claude Code CLI not found');
      expect(mockWorkflow.executeTDDWorkflow).toHaveBeenCalled();
    });
  });

  describe('workflow execution failures', () => {
    it('should handle workflow failure with max iterations', async () => {
      const failedResult: TDDResult = {
        success: false,
        iterations: 3,
        taskId: 'test-task-456',
        error: 'Max iterations (3) reached without PR creation',
      };

      vi.mocked(mockWorkflow.executeTDDWorkflow).mockResolvedValue(failedResult);

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith('❌ TDD Workflow Failed');
      expect(console.error).toHaveBeenCalledWith('   🔄 Iterations: 3');
      expect(console.error).toHaveBeenCalledWith('   📁 Task ID: test-task-456');
      expect(console.error).toHaveBeenCalledWith(
        '   💥 Error: Max iterations (3) reached without PR creation'
      );

      // Should show specific guidance for max iterations
      expect(console.error).toHaveBeenCalledWith('💡 Suggestions:');
      expect(console.error).toHaveBeenCalledWith(
        '   • Try increasing --reviews for more iterations'
      );

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle specification file errors', async () => {
      const specError: TDDResult = {
        success: false,
        iterations: 0,
        taskId: 'test-task-789',
        error: 'Specification file not found: /path/to/spec.md',
      };

      vi.mocked(mockWorkflow.executeTDDWorkflow).mockResolvedValue(specError);

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith('💡 Suggestions:');
      expect(console.error).toHaveBeenCalledWith(
        '   • Ensure the specification file exists and is readable'
      );
      expect(console.error).toHaveBeenCalledWith('   • Check file path and permissions');
    });

    it('should handle environment errors', async () => {
      const envError: TDDResult = {
        success: false,
        iterations: 0,
        taskId: 'test-task-env',
        error: 'environment validation failed',
      };

      vi.mocked(mockWorkflow.executeTDDWorkflow).mockResolvedValue(envError);

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith('💡 Suggestions:');
      expect(console.error).toHaveBeenCalledWith(
        '   • Run with --verbose for detailed environment info'
      );
      expect(console.error).toHaveBeenCalledWith('   • Check GITHUB_TOKEN environment variable');
    });

    it('should handle generic errors', async () => {
      const genericError: TDDResult = {
        success: false,
        iterations: 1,
        taskId: 'test-task-generic',
        error: 'Some other error occurred',
      };

      vi.mocked(mockWorkflow.executeTDDWorkflow).mockResolvedValue(genericError);

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith('❌ TDD Workflow Failed');
      expect(console.error).toHaveBeenCalledWith('   💥 Error: Some other error occurred');
    });
  });

  describe('unexpected errors', () => {
    it('should handle unexpected errors during execution', async () => {
      const unexpectedError = new Error('Something went wrong');
      vi.mocked(mockWorkflow.executeTDDWorkflow).mockRejectedValue(unexpectedError);

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith('💥 Unexpected error occurred:');
      expect(console.error).toHaveBeenCalledWith('   Something went wrong');
      expect(console.error).toHaveBeenCalledWith('💡 Try running with --verbose for more details');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should show stack trace in verbose mode', async () => {
      const verboseArgs = { ...mockArgs, verbose: true };
      const errorWithStack = new Error('Test error');
      errorWithStack.stack = 'Error: Test error\n    at test:1:1';

      vi.mocked(mockWorkflow.executeTDDWorkflow).mockRejectedValue(errorWithStack);

      await expect(handleTDDCommand(verboseArgs)).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith('Stack trace:');
      expect(console.error).toHaveBeenCalledWith('Error: Test error\n    at test:1:1');
    });

    it('should handle non-Error objects', async () => {
      vi.mocked(mockWorkflow.executeTDDWorkflow).mockRejectedValue('String error');

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith('   String error');
    });
  });

  describe('output formatting', () => {
    it('should display results with proper formatting and duration', async () => {
      // Mock Date.now to control duration calculation
      const startTime = 1000000;
      const endTime = 1005500; // 5.5 seconds later
      vi.spyOn(Date, 'now').mockReturnValueOnce(startTime).mockReturnValueOnce(endTime);

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit');

      expect(console.log).toHaveBeenCalledWith('═'.repeat(60));
      expect(console.log).toHaveBeenCalledWith('   ⏱️  Duration: 5.5s');
      expect(console.log).toHaveBeenCalledWith('   📁 Task ID: test-task-123');
      expect(console.log).toHaveBeenCalledWith(
        '🎉 Your feature has been implemented with comprehensive tests!'
      );
    });
  });
});

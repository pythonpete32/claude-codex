import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleTDDCommand } from '../../../src/cli/commands/tdd.js';
import type { TDDCommandArgs } from '../../../src/shared/types.js';

// Mock dependencies
vi.mock('../../../src/shared/preflight.js', () => ({
  validateEnvironment: vi.fn(),
  printPreflightResults: vi.fn(),
}));

vi.mock('../../../src/workflows/tdd.js', () => ({
  executeTDDWorkflow: vi.fn(),
}));

// Mock console methods
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();
const mockProcessExit = vi.fn();

vi.stubGlobal('console', {
  log: mockConsoleLog,
  error: mockConsoleError,
});

vi.stubGlobal('process', {
  exit: mockProcessExit,
});

const mockValidateEnvironment = vi.mocked(
  await import('../../../src/shared/preflight.js')
).validateEnvironment;
const mockPrintPreflightResults = vi.mocked(
  await import('../../../src/shared/preflight.js')
).printPreflightResults;
const mockExecuteTDDWorkflow = vi.mocked(
  await import('../../../src/workflows/tdd.js')
).executeTDDWorkflow;

describe('TDD Command Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessExit.mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleTDDCommand', () => {
    const mockArgs: TDDCommandArgs = {
      specPath: './test-spec.md',
      reviews: 3,
      branch: 'feature/test',
      cleanup: true,
      verbose: false,
    };

    it('should handle successful TDD workflow', async () => {
      mockValidateEnvironment.mockResolvedValue({
        success: true,
        errors: [],
        warnings: [],
      });

      mockExecuteTDDWorkflow.mockResolvedValue({
        success: true,
        prUrl: 'https://github.com/owner/repo/pull/123',
        iterations: 2,
        taskId: 'test-123',
      });

      await handleTDDCommand(mockArgs);

      expect(mockValidateEnvironment).toHaveBeenCalled();
      expect(mockPrintPreflightResults).toHaveBeenCalled();
      expect(mockExecuteTDDWorkflow).toHaveBeenCalledWith({
        specPath: expect.stringContaining('test-spec.md'),
        maxReviews: 3,
        branchName: 'feature/test',
        cleanup: true,
      });

      expect(mockConsoleLog).toHaveBeenCalledWith('🎉 TDD Workflow Completed Successfully!');
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '   • Pull Request: https://github.com/owner/repo/pull/123'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith('   • Iterations: 2');
      expect(mockConsoleLog).toHaveBeenCalledWith('   • Task ID: test-123');
    });

    it('should handle failed TDD workflow', async () => {
      mockValidateEnvironment.mockResolvedValue({
        success: true,
        errors: [],
        warnings: [],
      });

      mockExecuteTDDWorkflow.mockResolvedValue({
        success: false,
        iterations: 3,
        taskId: 'test-123',
        error: 'Maximum iterations reached',
      });

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit called');

      expect(mockConsoleError).toHaveBeenCalledWith('❌ TDD Workflow Failed');
      expect(mockConsoleError).toHaveBeenCalledWith('   • Error: Maximum iterations reached');
      expect(mockConsoleError).toHaveBeenCalledWith('   • Iterations: 3');
      expect(mockConsoleError).toHaveBeenCalledWith('   • Task ID: test-123');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should reject missing spec path', async () => {
      const invalidArgs: TDDCommandArgs = {
        specPath: '',
      };

      await expect(handleTDDCommand(invalidArgs)).rejects.toThrow('process.exit called');

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Error: Specification file path is required'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Usage: claude-codex tdd <spec-file> [options]'
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should handle environment validation failure', async () => {
      mockValidateEnvironment.mockResolvedValue({
        success: false,
        errors: ['GITHUB_TOKEN not set'],
        warnings: [],
      });

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit called');

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Environment validation failed. Please fix the errors above and try again.'
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should use default values for missing options', async () => {
      const minimalArgs: TDDCommandArgs = {
        specPath: './test-spec.md',
      };

      mockValidateEnvironment.mockResolvedValue({
        success: true,
        errors: [],
        warnings: [],
      });

      mockExecuteTDDWorkflow.mockResolvedValue({
        success: true,
        prUrl: 'https://github.com/owner/repo/pull/123',
        iterations: 1,
        taskId: 'test-123',
      });

      await handleTDDCommand(minimalArgs);

      expect(mockExecuteTDDWorkflow).toHaveBeenCalledWith({
        specPath: expect.stringContaining('test-spec.md'),
        maxReviews: 3, // default
        branchName: undefined, // not provided
        cleanup: true, // default
      });
    });

    it('should handle cleanup false explicitly', async () => {
      const noCleanupArgs: TDDCommandArgs = {
        specPath: './test-spec.md',
        cleanup: false,
      };

      mockValidateEnvironment.mockResolvedValue({
        success: true,
        errors: [],
        warnings: [],
      });

      mockExecuteTDDWorkflow.mockResolvedValue({
        success: true,
        prUrl: 'https://github.com/owner/repo/pull/123',
        iterations: 1,
        taskId: 'test-123',
      });

      await handleTDDCommand(noCleanupArgs);

      expect(mockExecuteTDDWorkflow).toHaveBeenCalledWith({
        specPath: expect.stringContaining('test-spec.md'),
        maxReviews: 3,
        branchName: undefined,
        cleanup: false,
      });
    });

    it('should show verbose output when requested', async () => {
      const verboseArgs: TDDCommandArgs = {
        specPath: './test-spec.md',
        verbose: true,
      };

      mockValidateEnvironment.mockResolvedValue({
        success: true,
        errors: [],
        warnings: [],
      });

      mockExecuteTDDWorkflow.mockResolvedValue({
        success: true,
        prUrl: 'https://github.com/owner/repo/pull/123',
        iterations: 1,
        taskId: 'test-123',
      });

      await handleTDDCommand(verboseArgs);

      expect(mockConsoleLog).toHaveBeenCalledWith('   Verbose: Yes');
      expect(mockConsoleLog).toHaveBeenCalledWith('\n📋 Next Steps:');
      expect(mockConsoleLog).toHaveBeenCalledWith('   1. Review the pull request');
      expect(mockConsoleLog).toHaveBeenCalledWith('   2. Test the implementation');
      expect(mockConsoleLog).toHaveBeenCalledWith('   3. Merge when ready');
    });

    it('should show verbose troubleshooting on failure', async () => {
      const verboseArgs: TDDCommandArgs = {
        specPath: './test-spec.md',
        verbose: true,
      };

      mockValidateEnvironment.mockResolvedValue({
        success: true,
        errors: [],
        warnings: [],
      });

      mockExecuteTDDWorkflow.mockResolvedValue({
        success: false,
        iterations: 3,
        taskId: 'test-123',
        error: 'Max iterations reached',
      });

      await expect(handleTDDCommand(verboseArgs)).rejects.toThrow('process.exit called');

      expect(mockConsoleError).toHaveBeenCalledWith('\n🔧 Troubleshooting:');
      expect(mockConsoleError).toHaveBeenCalledWith(
        '   1. Check the specification file for clarity'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        '   2. Review agent responses in .codex/task-*.json'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        '   3. Ensure GitHub token has required permissions'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        '   4. Try increasing --reviews if close to completion'
      );
    });

    it('should handle unexpected errors', async () => {
      mockValidateEnvironment.mockResolvedValue({
        success: true,
        errors: [],
        warnings: [],
      });

      mockExecuteTDDWorkflow.mockRejectedValue(new Error('Unexpected error'));

      await expect(handleTDDCommand(mockArgs)).rejects.toThrow('process.exit called');

      expect(mockConsoleError).toHaveBeenCalledWith('\n💥 Unexpected error during TDD workflow:');
      expect(mockConsoleError).toHaveBeenCalledWith('   Error: Unexpected error');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should show stack trace in verbose mode on unexpected error', async () => {
      const verboseArgs: TDDCommandArgs = {
        specPath: './test-spec.md',
        verbose: true,
      };

      mockValidateEnvironment.mockResolvedValue({
        success: true,
        errors: [],
        warnings: [],
      });

      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test location';
      mockExecuteTDDWorkflow.mockRejectedValue(error);

      await expect(handleTDDCommand(verboseArgs)).rejects.toThrow('process.exit called');

      expect(mockConsoleError).toHaveBeenCalledWith('\n📊 Stack trace:');
      expect(mockConsoleError).toHaveBeenCalledWith('Error: Test error\n    at test location');
    });
  });
});

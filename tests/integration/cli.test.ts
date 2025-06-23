import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all dependencies for integration test
vi.mock('../../src/core/messaging.js', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
  logSuccess: vi.fn(),
  logWarning: vi.fn(),
}));

vi.mock('../../src/lib.js', () => ({
  forceSubscriptionAuth: vi.fn(),
}));

vi.mock('../../src/shared/preflight.js', () => ({
  validateEnvironment: vi.fn(),
}));

vi.mock('../../src/workflows/tdd.js', () => ({
  executeTDDWorkflow: vi.fn(),
}));

// Import the mocked modules
const { logError, logInfo, logSuccess } = await import('../../src/core/messaging.js');
const { forceSubscriptionAuth } = await import('../../src/lib.js');
const { validateEnvironment } = await import('../../src/shared/preflight.js');
const { executeTDDWorkflow } = await import('../../src/workflows/tdd.js');

// Import modules under test
const { parseArgs, validateArgs } = await import('../../src/cli/args.js');
const { handleTDDCommand } = await import('../../src/cli/commands/tdd.js');
const { main } = await import('../../src/cli/index.js');

// Mock process.exit and process.argv
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

const originalArgv = process.argv;

describe('CLI Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default successful mocks
    vi.mocked(forceSubscriptionAuth).mockResolvedValue();
    vi.mocked(validateEnvironment).mockResolvedValue({
      success: true,
      errors: [],
      warnings: [],
    });
    vi.mocked(executeTDDWorkflow).mockResolvedValue({
      success: true,
      prUrl: 'https://github.com/test/repo/pull/123',
      iterations: 2,
      taskId: 'test-123',
    });
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  describe('end-to-end TDD command flow', () => {
    it('should parse args → validate → execute TDD workflow successfully', async () => {
      // Simulate CLI args
      const args = parseArgs([
        'tdd',
        './test-spec.md',
        '--reviews',
        '3',
        '--branch',
        'test-feature',
      ]);

      // Validate args
      expect(() => validateArgs(args)).not.toThrow();

      // Verify parsed structure
      expect(args).toEqual({
        command: 'tdd',
        tdd: {
          specPath: './test-spec.md',
          reviews: 3,
          branch: 'test-feature',
          cleanup: true,
        },
      });

      // Execute command handler
      await expect(handleTDDCommand(args.tdd!)).rejects.toThrow('process.exit called');

      // Verify the full flow
      expect(forceSubscriptionAuth).toHaveBeenCalledOnce();
      expect(validateEnvironment).toHaveBeenCalledOnce();
      expect(executeTDDWorkflow).toHaveBeenCalledWith({
        specPath: expect.stringContaining('test-spec.md'),
        maxReviews: 3,
        branchName: 'test-feature',
        cleanup: true,
      });
      expect(logSuccess).toHaveBeenCalledWith('🎉 TDD Workflow Completed Successfully!');
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('should handle CLI main function with TDD command', async () => {
      // Mock process.argv for TDD command
      process.argv = ['node', 'cli.js', 'tdd', './spec.md'];

      await expect(main()).rejects.toThrow('process.exit called');

      expect(executeTDDWorkflow).toHaveBeenCalledWith({
        specPath: expect.stringContaining('spec.md'),
        maxReviews: 3,
        branchName: undefined,
        cleanup: true,
      });
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('should handle help command through main function', async () => {
      process.argv = ['node', 'cli.js', '--help'];

      await expect(main()).rejects.toThrow('process.exit called');

      // Should not execute workflow
      expect(executeTDDWorkflow).not.toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('should handle version command through main function', async () => {
      process.argv = ['node', 'cli.js', '--version'];

      await expect(main()).rejects.toThrow('process.exit called');

      // Should not execute workflow
      expect(executeTDDWorkflow).not.toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(0);
    });
  });

  describe('error flow integration', () => {
    it('should handle argument parsing errors', async () => {
      process.argv = ['node', 'cli.js', 'tdd']; // Missing spec file

      await expect(main()).rejects.toThrow('process.exit called');

      expect(logError).toHaveBeenCalledWith(
        expect.stringContaining('TDD command requires a specification file path')
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle environment validation failure', async () => {
      vi.mocked(validateEnvironment).mockResolvedValue({
        success: false,
        errors: ['GITHUB_TOKEN environment variable not set'],
        warnings: [],
      });

      const args = parseArgs(['tdd', './spec.md']);

      await expect(handleTDDCommand(args.tdd!)).rejects.toThrow('process.exit called');

      expect(logError).toHaveBeenCalledWith('❌ Environment validation failed:');
      expect(logError).toHaveBeenCalledWith('  • GITHUB_TOKEN environment variable not set');
      expect(executeTDDWorkflow).not.toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle workflow execution failure', async () => {
      vi.mocked(executeTDDWorkflow).mockResolvedValue({
        success: false,
        iterations: 3,
        taskId: 'test-456',
        error: 'Maximum iterations reached',
      });

      const args = parseArgs(['tdd', './spec.md']);

      await expect(handleTDDCommand(args.tdd!)).rejects.toThrow('process.exit called');

      expect(logError).toHaveBeenCalledWith('❌ TDD Workflow Failed');
      expect(logError).toHaveBeenCalledWith('💥 Error: Maximum iterations reached');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle authentication failure', async () => {
      vi.mocked(forceSubscriptionAuth).mockRejectedValue(new Error('Authentication failed'));

      const args = parseArgs(['tdd', './spec.md']);

      await expect(handleTDDCommand(args.tdd!)).rejects.toThrow('process.exit called');

      expect(logError).toHaveBeenCalledWith('❌ TDD Command Failed');
      expect(logError).toHaveBeenCalledWith('💥 Error: Authentication failed');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('argument validation integration', () => {
    it('should validate complex TDD arguments', () => {
      const validArgs = parseArgs([
        'tdd',
        './complex/path/spec.md',
        '--reviews',
        '5',
        '--branch',
        'feature/complex-feature',
        '--no-cleanup',
        '--verbose',
      ]);

      expect(() => validateArgs(validArgs)).not.toThrow();
      expect(validArgs.tdd).toEqual({
        specPath: './complex/path/spec.md',
        reviews: 5,
        branch: 'feature/complex-feature',
        cleanup: false,
        verbose: true,
      });
    });

    it('should reject invalid argument combinations', () => {
      expect(() => parseArgs(['tdd', './spec.md', '--reviews', '0'])).toThrow();
      expect(() => parseArgs(['tdd', './spec.md', '--reviews', '11'])).toThrow();
      expect(() => parseArgs(['tdd', './spec.md', '--branch'])).toThrow();
      expect(() => parseArgs(['tdd', './spec.md', '--unknown-flag'])).toThrow();
    });
  });

  describe('configuration flow integration', () => {
    it('should properly convert CLI args to workflow options', async () => {
      const args = parseArgs([
        'tdd',
        './my-spec.md',
        '--reviews',
        '4',
        '--branch',
        'feat/test',
        '--verbose',
      ]);

      await expect(handleTDDCommand(args.tdd!)).rejects.toThrow('process.exit called');

      expect(executeTDDWorkflow).toHaveBeenCalledWith({
        specPath: expect.stringContaining('my-spec.md'),
        maxReviews: 4,
        branchName: 'feat/test',
        cleanup: true,
      });
    });

    it('should apply default values correctly', async () => {
      const args = parseArgs(['tdd', './spec.md']);

      await expect(handleTDDCommand(args.tdd!)).rejects.toThrow('process.exit called');

      expect(executeTDDWorkflow).toHaveBeenCalledWith({
        specPath: expect.stringContaining('spec.md'),
        maxReviews: 3, // Default
        branchName: undefined, // Not specified
        cleanup: true, // Default
      });
    });

    it('should handle cleanup disabled', async () => {
      const args = parseArgs(['tdd', './spec.md', '--no-cleanup']);

      await expect(handleTDDCommand(args.tdd!)).rejects.toThrow('process.exit called');

      expect(executeTDDWorkflow).toHaveBeenCalledWith(expect.objectContaining({ cleanup: false }));
    });
  });

  describe('user feedback integration', () => {
    it('should provide detailed success feedback', async () => {
      const args = parseArgs(['tdd', './spec.md']);

      await expect(handleTDDCommand(args.tdd!)).rejects.toThrow('process.exit called');

      expect(logInfo).toHaveBeenCalledWith('🤖 Claude Codex - Starting TDD Workflow');
      expect(logInfo).toHaveBeenCalledWith('🔍 Validating environment...');
      expect(logSuccess).toHaveBeenCalledWith('✅ Environment validation passed');
      expect(logInfo).toHaveBeenCalledWith('\n📋 Workflow Configuration:');
      expect(logInfo).toHaveBeenCalledWith('\n🚀 Starting workflow execution...');
      expect(logSuccess).toHaveBeenCalledWith('🎉 TDD Workflow Completed Successfully!');
      expect(logSuccess).toHaveBeenCalledWith(
        '✅ Pull Request Created: https://github.com/test/repo/pull/123'
      );
    });

    it('should provide detailed failure feedback', async () => {
      vi.mocked(executeTDDWorkflow).mockResolvedValue({
        success: false,
        iterations: 3,
        taskId: 'test-456',
        error: 'Max iterations reached',
      });

      const args = parseArgs(['tdd', './spec.md']);

      await expect(handleTDDCommand(args.tdd!)).rejects.toThrow('process.exit called');

      expect(logError).toHaveBeenCalledWith('❌ TDD Workflow Failed');
      expect(logError).toHaveBeenCalledWith('💥 Error: Max iterations reached');
      expect(logInfo).toHaveBeenCalledWith('📊 Attempted 3 iterations of 3');
      expect(logError).toHaveBeenCalledWith('\n🔧 Troubleshooting suggestions:');
    });
  });
});

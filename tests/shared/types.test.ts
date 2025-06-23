import { describe, expect, it } from 'vitest';
import type {
  PRInfo,
  PreflightResult,
  TaskState,
  TDDCommandArgs,
  TDDOptions,
} from '../../src/shared/types.js';

describe('Shared Types', () => {
  describe('TaskState', () => {
    it('should have all required properties', () => {
      const taskState: TaskState = {
        taskId: 'test-123',
        specPath: './test-spec.md',
        originalSpec: 'Test specification content',
        currentIteration: 1,
        maxIterations: 3,
        branchName: 'tdd/test-123',
        worktreeInfo: {
          path: '../.codex-worktrees/test-123',
          branchName: 'tdd/test-123',
          baseBranch: 'main',
        },
        coderResponses: ['Initial response'],
        reviewerResponses: ['Initial review'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        status: 'running',
      };

      expect(taskState.taskId).toBe('test-123');
      expect(taskState.status).toBe('running');
      expect(taskState.worktreeInfo.path).toBe('../.codex-worktrees/test-123');
    });
  });

  describe('TDDOptions', () => {
    it('should handle required and optional properties', () => {
      const minimalOptions: TDDOptions = {
        specPath: './spec.md',
        maxReviews: 3,
        cleanup: true,
      };

      const fullOptions: TDDOptions = {
        specPath: './spec.md',
        maxReviews: 5,
        branchName: 'feature/test',
        cleanup: false,
      };

      expect(minimalOptions.specPath).toBe('./spec.md');
      expect(fullOptions.branchName).toBe('feature/test');
    });
  });

  describe('TDDResult', () => {
    it('should handle success scenario', () => {
      const successResult: TDDResult = {
        success: true,
        prUrl: 'https://github.com/owner/repo/pull/123',
        iterations: 2,
        taskId: 'test-123',
      };

      expect(successResult.success).toBe(true);
      expect(successResult.prUrl).toBeDefined();
    });

    it('should handle failure scenario', () => {
      const failureResult: TDDResult = {
        success: false,
        iterations: 3,
        taskId: 'test-123',
        error: 'Maximum iterations reached',
      };

      expect(failureResult.success).toBe(false);
      expect(failureResult.error).toBeDefined();
    });
  });

  describe('PRInfo', () => {
    it('should contain GitHub pull request information', () => {
      const prInfo: PRInfo = {
        number: 123,
        title: 'Implement new feature',
        url: 'https://github.com/owner/repo/pull/123',
        state: 'open',
        headBranch: 'feature/test',
        baseBranch: 'main',
      };

      expect(prInfo.number).toBe(123);
      expect(prInfo.state).toBe('open');
    });
  });

  describe('TDDCommandArgs', () => {
    it('should handle CLI argument structure', () => {
      const args: TDDCommandArgs = {
        specPath: './spec.md',
        reviews: 5,
        branch: 'feature/test',
        cleanup: false,
        verbose: true,
      };

      expect(args.specPath).toBe('./spec.md');
      expect(args.verbose).toBe(true);
    });
  });

  describe('PreflightResult', () => {
    it('should handle validation results', () => {
      const successResult: PreflightResult = {
        success: true,
        errors: [],
        warnings: ['Minor warning'],
      };

      const failureResult: PreflightResult = {
        success: false,
        errors: ['Critical error'],
        warnings: [],
      };

      expect(successResult.success).toBe(true);
      expect(failureResult.errors).toHaveLength(1);
    });
  });
});

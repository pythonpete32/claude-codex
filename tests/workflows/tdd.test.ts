import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TDDOptions } from '../../src/shared/types.js';
import { executeTDDWorkflow } from '../../src/workflows/tdd.js';

// Mock all dependencies
vi.mock('../../src/core/operations/state.js', () => ({
  initializeTaskState: vi.fn(),
  addCoderResponse: vi.fn(),
  addReviewerResponse: vi.fn(),
  cleanupTaskState: vi.fn(),
}));

vi.mock('../../src/core/operations/worktree.js', () => ({
  createWorktree: vi.fn(),
  cleanupWorktree: vi.fn(),
}));

vi.mock('../../src/core/operations/github.js', () => ({
  checkPRExists: vi.fn(),
}));

vi.mock('../../src/core/operations/prompts.js', () => ({
  formatCoderPrompt: vi.fn(),
  formatReviewerPrompt: vi.fn(),
}));

vi.mock('../../src/core/claude.js', () => ({
  runAgent: vi.fn(),
}));

// Mock console.log to avoid test output noise
vi.mock('console', () => ({
  log: vi.fn(),
  error: vi.fn(),
}));

const mockInitializeTaskState = vi.mocked(
  await import('../../src/core/operations/state.js')
).initializeTaskState;
const mockCreateWorktree = vi.mocked(
  await import('../../src/core/operations/worktree.js')
).createWorktree;
const mockCheckPRExists = vi.mocked(
  await import('../../src/core/operations/github.js')
).checkPRExists;
const mockFormatCoderPrompt = vi.mocked(
  await import('../../src/core/operations/prompts.js')
).formatCoderPrompt;
const mockFormatReviewerPrompt = vi.mocked(
  await import('../../src/core/operations/prompts.js')
).formatReviewerPrompt;
const mockRunAgent = vi.mocked(await import('../../src/core/claude.js')).runAgent;
const mockAddCoderResponse = vi.mocked(
  await import('../../src/core/operations/state.js')
).addCoderResponse;
const mockAddReviewerResponse = vi.mocked(
  await import('../../src/core/operations/state.js')
).addReviewerResponse;

describe('TDD Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeTDDWorkflow', () => {
    const mockOptions: TDDOptions = {
      specPath: './test-spec.md',
      maxReviews: 3,
      cleanup: true,
    };

    const mockTaskState = {
      taskId: 'test-123',
      specPath: './test-spec.md',
      originalSpec: 'Test specification content',
      currentIteration: 0,
      maxIterations: 3,
      branchName: 'tdd/test-123',
      worktreeInfo: {
        path: '../.codex-worktrees/test-123',
        branchName: 'tdd/test-123',
        baseBranch: 'main',
      },
      coderResponses: [],
      reviewerResponses: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      status: 'running' as const,
    };

    const mockWorktreeInfo = {
      path: '../.codex-worktrees/test-123',
      branchName: 'tdd/test-123',
      baseBranch: 'main',
    };

    it('should complete successfully when PR is created on first iteration', async () => {
      // Setup mocks for successful workflow
      mockInitializeTaskState.mockResolvedValue(mockTaskState);
      mockCreateWorktree.mockResolvedValue(mockWorktreeInfo);
      mockFormatCoderPrompt.mockResolvedValue('Coder prompt');
      mockFormatReviewerPrompt.mockResolvedValue('Reviewer prompt');
      mockRunAgent.mockResolvedValue({
        finalResponse: 'Agent completed successfully',
        messages: [],
      });
      mockCheckPRExists.mockResolvedValue({
        number: 123,
        title: 'Test PR',
        url: 'https://github.com/owner/repo/pull/123',
        state: 'open',
        headBranch: 'tdd/test-123',
        baseBranch: 'main',
      });
      mockAddCoderResponse.mockResolvedValue(undefined);
      mockAddReviewerResponse.mockResolvedValue(undefined);

      const result = await executeTDDWorkflow(mockOptions);

      expect(result).toEqual({
        success: true,
        prUrl: 'https://github.com/owner/repo/pull/123',
        iterations: 1,
        taskId: expect.stringMatching(/^\d+-[a-z0-9]+$/),
      });

      expect(mockInitializeTaskState).toHaveBeenCalledWith(
        expect.stringContaining('test-spec.md'),
        expect.objectContaining({
          maxIterations: 3,
          branchName: expect.stringMatching(/^tdd\/\d+-[a-z0-9]+$/),
          taskId: expect.stringMatching(/^\d+-[a-z0-9]+$/),
        })
      );
      expect(mockCreateWorktree).toHaveBeenCalled();
      expect(mockRunAgent).toHaveBeenCalledTimes(2); // Coder + Reviewer
      expect(mockCheckPRExists).toHaveBeenCalled();
    });

    it('should handle max iterations without PR creation', async () => {
      mockInitializeTaskState.mockResolvedValue(mockTaskState);
      mockCreateWorktree.mockResolvedValue(mockWorktreeInfo);
      mockFormatCoderPrompt.mockResolvedValue('Coder prompt');
      mockFormatReviewerPrompt.mockResolvedValue('Reviewer prompt');
      mockRunAgent.mockResolvedValue({
        finalResponse: 'Provide feedback for next iteration',
        messages: [],
      });
      mockCheckPRExists.mockResolvedValue(null); // No PR found
      mockAddCoderResponse.mockResolvedValue(undefined);
      mockAddReviewerResponse.mockResolvedValue(undefined);

      const result = await executeTDDWorkflow(mockOptions);

      expect(result).toEqual({
        success: false,
        iterations: 3,
        taskId: expect.stringMatching(/^\d+-[a-z0-9]+$/),
        error: 'Maximum iterations (3) reached without completion',
      });

      expect(mockRunAgent).toHaveBeenCalledTimes(6); // 3 iterations × 2 agents
    });

    it('should handle reviewer completion signal without PR detection', async () => {
      mockInitializeTaskState.mockResolvedValue(mockTaskState);
      mockCreateWorktree.mockResolvedValue(mockWorktreeInfo);
      mockFormatCoderPrompt.mockResolvedValue('Coder prompt');
      mockFormatReviewerPrompt.mockResolvedValue('Reviewer prompt');
      mockRunAgent
        .mockResolvedValueOnce({
          finalResponse: 'Coder completed',
          messages: [],
        })
        .mockResolvedValueOnce({
          finalResponse: 'Implementation looks good, please create PR',
          messages: [],
        });
      mockCheckPRExists.mockResolvedValue(null);
      mockAddCoderResponse.mockResolvedValue(undefined);
      mockAddReviewerResponse.mockResolvedValue(undefined);

      const result = await executeTDDWorkflow(mockOptions);

      expect(result).toEqual({
        success: false,
        iterations: 1,
        taskId: expect.stringMatching(/^\d+-[a-z0-9]+$/),
        error: 'Reviewer indicated completion but no PR was created',
      });
    });

    it('should handle task state initialization failure', async () => {
      mockInitializeTaskState.mockRejectedValue(new Error('File not found'));

      const result = await executeTDDWorkflow(mockOptions);

      expect(result).toEqual({
        success: false,
        iterations: 0,
        taskId: expect.stringMatching(/^\d+-[a-z0-9]+$/),
        error: 'File not found',
      });
    });

    it('should handle worktree creation failure', async () => {
      mockInitializeTaskState.mockResolvedValue(mockTaskState);
      mockCreateWorktree.mockRejectedValue(new Error('Git worktree creation failed'));

      const result = await executeTDDWorkflow(mockOptions);

      expect(result).toEqual({
        success: false,
        iterations: 0,
        taskId: expect.stringMatching(/^\d+-[a-z0-9]+$/),
        error: 'Git worktree creation failed',
      });
    });

    it('should handle agent execution failure', async () => {
      mockInitializeTaskState.mockResolvedValue(mockTaskState);
      mockCreateWorktree.mockResolvedValue(mockWorktreeInfo);
      mockFormatCoderPrompt.mockResolvedValue('Coder prompt');
      mockRunAgent.mockRejectedValue(new Error('Claude SDK failed'));

      const result = await executeTDDWorkflow(mockOptions);

      expect(result).toEqual({
        success: false,
        iterations: 0,
        taskId: expect.stringMatching(/^\d+-[a-z0-9]+$/),
        error: 'Claude SDK failed',
      });
    });

    it('should use custom branch name when provided', async () => {
      const customOptions: TDDOptions = {
        ...mockOptions,
        branchName: 'feature/custom-branch',
      };

      mockInitializeTaskState.mockResolvedValue({
        ...mockTaskState,
        branchName: 'feature/custom-branch',
      });
      mockCreateWorktree.mockResolvedValue({
        ...mockWorktreeInfo,
        branchName: 'feature/custom-branch',
      });
      mockFormatCoderPrompt.mockResolvedValue('Coder prompt');
      mockFormatReviewerPrompt.mockResolvedValue('Reviewer prompt');
      mockRunAgent.mockResolvedValue({
        finalResponse: 'Agent completed',
        messages: [],
      });
      mockCheckPRExists.mockResolvedValue({
        number: 123,
        title: 'Test PR',
        url: 'https://github.com/owner/repo/pull/123',
        state: 'open',
        headBranch: 'feature/custom-branch',
        baseBranch: 'main',
      });
      mockAddCoderResponse.mockResolvedValue(undefined);
      mockAddReviewerResponse.mockResolvedValue(undefined);

      const result = await executeTDDWorkflow(customOptions);

      expect(result.success).toBe(true);
      expect(mockCreateWorktree).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          branchName: 'feature/custom-branch',
        })
      );
    });

    it('should skip cleanup when cleanup is false', async () => {
      const noCleanupOptions: TDDOptions = {
        ...mockOptions,
        cleanup: false,
      };

      mockInitializeTaskState.mockResolvedValue(mockTaskState);
      mockCreateWorktree.mockResolvedValue(mockWorktreeInfo);
      mockFormatCoderPrompt.mockResolvedValue('Coder prompt');
      mockFormatReviewerPrompt.mockResolvedValue('Reviewer prompt');
      mockRunAgent.mockResolvedValue({
        finalResponse: 'Agent completed',
        messages: [],
      });
      mockCheckPRExists.mockResolvedValue({
        number: 123,
        title: 'Test PR',
        url: 'https://github.com/owner/repo/pull/123',
        state: 'open',
        headBranch: 'tdd/test-123',
        baseBranch: 'main',
      });
      mockAddCoderResponse.mockResolvedValue(undefined);
      mockAddReviewerResponse.mockResolvedValue(undefined);

      await executeTDDWorkflow(noCleanupOptions);

      const { cleanupWorktree } = await import('../../src/core/operations/worktree.js');
      const { cleanupTaskState } = await import('../../src/core/operations/state.js');

      expect(cleanupWorktree).not.toHaveBeenCalled();
      expect(cleanupTaskState).not.toHaveBeenCalled();
    });
  });
});

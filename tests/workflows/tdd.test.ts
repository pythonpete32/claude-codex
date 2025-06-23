import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentResult, PRInfo, TDDOptions, WorktreeInfo } from '../../src/shared/types.js';
import { executeTDDWorkflow } from '../../src/workflows/tdd.js';

// Mock all dependencies
vi.mock('node:fs', () => ({
  promises: {
    access: vi.fn(),
    readFile: vi.fn(),
  },
}));

vi.mock('node:path', () => ({
  resolve: vi.fn((path: string) => `/resolved/${path}`),
}));

vi.mock('../../src/core/messaging/sdk-wrapper.js', () => ({
  runClaudeAgent: vi.fn(),
}));

vi.mock('../../src/core/operations/github.js', () => ({
  checkPRExists: vi.fn(),
}));

vi.mock('../../src/core/operations/prompts.js', () => ({
  formatCoderPrompt: vi.fn(),
  formatReviewerPrompt: vi.fn(),
}));

vi.mock('../../src/core/operations/state.js', () => ({
  addCoderResponse: vi.fn(),
  addReviewerResponse: vi.fn(),
  cleanupTaskState: vi.fn(),
  initializeTaskState: vi.fn(),
}));

vi.mock('../../src/core/operations/worktree.js', () => ({
  cleanupWorktree: vi.fn(),
  createWorktree: vi.fn(),
}));

// Import mocked modules
const mockFs = await import('node:fs');
const mockPath = await import('node:path');
const mockClaude = await import('../../src/core/messaging/sdk-wrapper.js');
const mockGitHub = await import('../../src/core/operations/github.js');
const mockPrompts = await import('../../src/core/operations/prompts.js');
const mockState = await import('../../src/core/operations/state.js');
const mockWorktree = await import('../../src/core/operations/worktree.js');

describe('TDD Workflow Orchestrator', () => {
  const mockOptions: TDDOptions = {
    specPath: './test-spec.md',
    maxReviews: 3,
    branchName: 'test-branch',
    cleanup: true,
  };

  const mockWorktreeInfo: WorktreeInfo = {
    path: '/tmp/test-worktree',
    branchName: 'test-branch',
    baseBranch: 'main',
  };

  const mockTaskState = {
    taskId: 'test-task-123',
    specPath: './test-spec.md',
    originalSpec: 'Test specification content',
    currentIteration: 1,
    maxIterations: 3,
    branchName: 'test-branch',
    worktreeInfo: mockWorktreeInfo,
    coderResponses: [],
    reviewerResponses: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    status: 'running' as const,
  };

  const mockAgentResult: AgentResult = {
    messages: [
      {
        type: 'assistant',
        message: {
          content: [
            {
              type: 'text',
              text: 'Implementation completed successfully!',
            },
          ],
        },
      },
    ],
    finalResponse: 'Implementation completed successfully!',
    success: true,
    cost: 0.1,
    duration: 5000,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default successful mocks
    vi.mocked(mockFs.promises.access).mockResolvedValue(undefined);
    vi.mocked(mockFs.promises.readFile).mockResolvedValue('Test specification content');
    vi.mocked(mockPath.resolve).mockReturnValue('/resolved/test-spec.md');
    vi.mocked(mockState.initializeTaskState).mockResolvedValue(mockTaskState);
    vi.mocked(mockWorktree.createWorktree).mockResolvedValue(mockWorktreeInfo);
    vi.mocked(mockClaude.runClaudeAgent).mockResolvedValue(mockAgentResult);
    vi.mocked(mockPrompts.formatCoderPrompt).mockResolvedValue('Coder prompt');
    vi.mocked(mockPrompts.formatReviewerPrompt).mockResolvedValue('Reviewer prompt');
    vi.mocked(mockState.addCoderResponse).mockResolvedValue(undefined);
    vi.mocked(mockState.addReviewerResponse).mockResolvedValue(undefined);
    vi.mocked(mockWorktree.cleanupWorktree).mockResolvedValue(undefined);
    vi.mocked(mockState.cleanupTaskState).mockResolvedValue(undefined);
  });

  describe('happy path', () => {
    it('should complete workflow successfully when PR is created in first iteration', async () => {
      const mockPR: PRInfo = {
        number: 123,
        title: 'Test PR',
        url: 'https://github.com/test/repo/pull/123',
        state: 'open',
        headBranch: 'test-branch',
        baseBranch: 'main',
      };

      vi.mocked(mockGitHub.checkPRExists).mockResolvedValue(mockPR);

      const result = await executeTDDWorkflow(mockOptions);

      expect(result).toEqual({
        success: true,
        prUrl: mockPR.url,
        iterations: 1,
        taskId: expect.stringMatching(/^task-\d+-[a-z0-9]+$/),
      });

      // Verify workflow steps
      expect(mockFs.promises.access).toHaveBeenCalledWith('/resolved/test-spec.md');
      expect(mockFs.promises.readFile).toHaveBeenCalledWith('/resolved/test-spec.md', 'utf-8');
      expect(mockState.initializeTaskState).toHaveBeenCalledWith('/resolved/test-spec.md', {
        taskId: expect.stringMatching(/^task-\d+-[a-z0-9]+$/),
        maxIterations: 3,
      });
      expect(mockWorktree.createWorktree).toHaveBeenCalledWith(
        expect.stringMatching(/^task-\d+-[a-z0-9]+$/),
        { branchName: 'test-branch' }
      );

      // Verify agent execution
      expect(mockClaude.runClaudeAgent).toHaveBeenCalledTimes(2); // Coder + Reviewer
      expect(mockPrompts.formatCoderPrompt).toHaveBeenCalledWith({
        specContent: 'Test specification content',
        reviewerFeedback: undefined,
      });
      expect(mockPrompts.formatReviewerPrompt).toHaveBeenCalledWith({
        originalSpec: 'Test specification content',
        coderHandoff: 'Implementation completed successfully!',
      });

      // Verify cleanup
      expect(mockWorktree.cleanupWorktree).toHaveBeenCalledWith(mockWorktreeInfo);
      expect(mockState.cleanupTaskState).toHaveBeenCalledWith(
        expect.stringMatching(/^task-\d+-[a-z0-9]+$/)
      );
    });

    it('should complete workflow successfully with multiple iterations', async () => {
      // First two iterations return no PR, third iteration creates PR
      const mockPR: PRInfo = {
        number: 456,
        title: 'Test PR Final',
        url: 'https://github.com/test/repo/pull/456',
        state: 'open',
        headBranch: 'test-branch',
        baseBranch: 'main',
      };

      vi.mocked(mockGitHub.checkPRExists)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockPR);

      // Mock task state with previous responses for iterations 2 and 3
      const stateWithResponses = {
        ...mockTaskState,
        reviewerResponses: ['First review feedback'],
      };
      vi.mocked(mockState.initializeTaskState).mockResolvedValue(stateWithResponses);

      const result = await executeTDDWorkflow(mockOptions);

      expect(result).toEqual({
        success: true,
        prUrl: mockPR.url,
        iterations: 3,
        taskId: expect.stringMatching(/^task-\d+-[a-z0-9]+$/),
      });

      expect(mockClaude.runClaudeAgent).toHaveBeenCalledTimes(6); // 3 iterations × 2 agents
      expect(mockGitHub.checkPRExists).toHaveBeenCalledTimes(3);
    });
  });

  describe('error handling', () => {
    it('should handle missing specification file', async () => {
      vi.mocked(mockFs.promises.access).mockRejectedValue(new Error('ENOENT'));

      const result = await executeTDDWorkflow(mockOptions);

      expect(result).toEqual({
        success: false,
        iterations: 0,
        taskId: expect.stringMatching(/^task-\d+-[a-z0-9]+$/),
        error: 'Specification file not found: /resolved/test-spec.md',
      });

      // Should not proceed to worktree creation
      expect(mockWorktree.createWorktree).not.toHaveBeenCalled();
    });

    it('should handle empty specification file', async () => {
      vi.mocked(mockFs.promises.readFile).mockResolvedValue('   \n  \t  ');

      const result = await executeTDDWorkflow(mockOptions);

      expect(result).toEqual({
        success: false,
        iterations: 0,
        taskId: expect.stringMatching(/^task-\d+-[a-z0-9]+$/),
        error: 'Validation error: Specification file is empty',
      });
    });

    it('should handle coder agent execution failure', async () => {
      vi.mocked(mockClaude.runClaudeAgent).mockRejectedValue(new Error('Agent timeout'));

      const result = await executeTDDWorkflow(mockOptions);

      expect(result).toEqual({
        success: false,
        iterations: 0,
        taskId: expect.stringMatching(/^task-\d+-[a-z0-9]+$/),
        error: 'Agent execution failed: Coder agent failed',
      });

      // Cleanup should still be called
      expect(mockWorktree.cleanupWorktree).toHaveBeenCalledWith(mockWorktreeInfo);
    });

    it('should handle reviewer agent execution failure', async () => {
      vi.mocked(mockClaude.runClaudeAgent)
        .mockResolvedValueOnce(mockAgentResult) // Coder succeeds
        .mockRejectedValue(new Error('Reviewer failed')); // Reviewer fails

      const result = await executeTDDWorkflow(mockOptions);

      expect(result).toEqual({
        success: false,
        iterations: 0,
        taskId: expect.stringMatching(/^task-\d+-[a-z0-9]+$/),
        error: 'Agent execution failed: Reviewer agent failed',
      });
    });

    it('should handle max iterations without PR creation', async () => {
      vi.mocked(mockGitHub.checkPRExists).mockResolvedValue(null);

      const result = await executeTDDWorkflow(mockOptions);

      expect(result).toEqual({
        success: false,
        iterations: 3,
        taskId: expect.stringMatching(/^task-\d+-[a-z0-9]+$/),
        error: 'Max iterations (3) reached without PR creation',
      });

      expect(mockClaude.runClaudeAgent).toHaveBeenCalledTimes(6); // 3 iterations × 2 agents
      expect(mockGitHub.checkPRExists).toHaveBeenCalledTimes(3);
    });

    it('should handle agent returning unsuccessful result', async () => {
      const unsuccessfulResult = { ...mockAgentResult, success: false };
      vi.mocked(mockClaude.runClaudeAgent).mockResolvedValue(unsuccessfulResult);

      const result = await executeTDDWorkflow(mockOptions);

      expect(result).toEqual({
        success: false,
        iterations: 0,
        taskId: expect.stringMatching(/^task-\d+-[a-z0-9]+$/),
        error: 'Agent execution failed: Coder agent execution was not successful',
      });
    });
  });

  describe('cleanup behavior', () => {
    it('should skip cleanup when cleanup option is false', async () => {
      const optionsNoCleanup = { ...mockOptions, cleanup: false };
      const mockPR: PRInfo = {
        number: 123,
        title: 'Test PR',
        url: 'https://github.com/test/repo/pull/123',
        state: 'open',
        headBranch: 'test-branch',
        baseBranch: 'main',
      };

      vi.mocked(mockGitHub.checkPRExists).mockResolvedValue(mockPR);

      await executeTDDWorkflow(optionsNoCleanup);

      expect(mockWorktree.cleanupWorktree).not.toHaveBeenCalled();
      expect(mockState.cleanupTaskState).not.toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const mockPR: PRInfo = {
        number: 123,
        title: 'Test PR',
        url: 'https://github.com/test/repo/pull/123',
        state: 'open',
        headBranch: 'test-branch',
        baseBranch: 'main',
      };

      vi.mocked(mockGitHub.checkPRExists).mockResolvedValue(mockPR);
      vi.mocked(mockWorktree.cleanupWorktree).mockRejectedValue(new Error('Cleanup failed'));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await executeTDDWorkflow(mockOptions);

      // Should still succeed despite cleanup failure
      expect(result.success).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️  Cleanup failed:', expect.any(Error));

      consoleWarnSpy.mockRestore();
    });

    it('should cleanup even when workflow fails', async () => {
      vi.mocked(mockClaude.runClaudeAgent).mockRejectedValue(new Error('Agent failed'));

      const result = await executeTDDWorkflow(mockOptions);

      expect(result.success).toBe(false);
      expect(mockWorktree.cleanupWorktree).toHaveBeenCalledWith(mockWorktreeInfo);
      expect(mockState.cleanupTaskState).toHaveBeenCalledWith(
        expect.stringMatching(/^task-\d+-[a-z0-9]+$/)
      );
    });
  });

  describe('iteration feedback handling', () => {
    it('should pass reviewer feedback to subsequent coder iterations', async () => {
      vi.mocked(mockGitHub.checkPRExists).mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      // Mock task state with reviewer responses
      const stateWithFeedback = {
        ...mockTaskState,
        reviewerResponses: ['First iteration feedback', 'Second iteration feedback'],
      };
      vi.mocked(mockState.initializeTaskState).mockResolvedValue(stateWithFeedback);

      await executeTDDWorkflow({ ...mockOptions, maxReviews: 2 });

      // First iteration should have no feedback
      expect(mockPrompts.formatCoderPrompt).toHaveBeenNthCalledWith(1, {
        specContent: 'Test specification content',
        reviewerFeedback: undefined,
      });

      // Second iteration should have first reviewer's feedback
      expect(mockPrompts.formatCoderPrompt).toHaveBeenNthCalledWith(2, {
        specContent: 'Test specification content',
        reviewerFeedback: 'First iteration feedback',
      });
    });
  });
});

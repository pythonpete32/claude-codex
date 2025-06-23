import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { runClaudeAgent } from '../core/messaging/sdk-wrapper.js';
import { checkPRExists } from '../core/operations/github.js';
import { formatCoderPrompt, formatReviewerPrompt } from '../core/operations/prompts.js';
import {
  addCoderResponse,
  addReviewerResponse,
  cleanupTaskState,
  initializeTaskState,
  updateWorktreeInfo,
} from '../core/operations/state.js';
import { cleanupWorktree, createWorktree } from '../core/operations/worktree.js';
import { AgentExecutionError, SpecFileNotFoundError, ValidationError } from '../shared/errors.js';
import type { TDDOptions, TDDResult, WorktreeInfo } from '../shared/types.js';

/**
 * Generate unique task ID with timestamp and random suffix
 */
function generateTaskId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `task-${timestamp}-${random}`;
}


/**
 * Main TDD workflow orchestrator that coordinates agent execution
 * from specification to pull request creation
 */
export async function executeTDDWorkflow(options: TDDOptions): Promise<TDDResult> {
  const taskId = generateTaskId();
  let worktreeInfo: WorktreeInfo | null = null;

  try {
    // 1. Validate spec file exists and is readable
    const specPath = resolve(options.specPath);
    try {
      await fs.access(specPath);
    } catch {
      throw new SpecFileNotFoundError(specPath);
    }

    // Read specification content
    const specContent = await fs.readFile(specPath, 'utf-8');
    if (!specContent.trim()) {
      throw new ValidationError('Specification file is empty');
    }

    // 2. Initialize task state and worktree
    const taskState = await initializeTaskState(specPath, {
      taskId,
      maxIterations: options.maxReviews,
    });

    worktreeInfo = await createWorktree(taskId, {
      branchName: options.branchName,
    });

    // Save worktree information to task state
    await updateWorktreeInfo(taskId, worktreeInfo);

    // 3. Agent iteration loop (max iterations)
    for (let iteration = 1; iteration <= options.maxReviews; iteration++) {
      console.log(`🔄 Starting iteration ${iteration}/${options.maxReviews}`);

      // 3a. Run Coder Agent
      console.log('🤖 Running Coder Agent...');
      const reviewerFeedback =
        iteration > 1 ? taskState.reviewerResponses[iteration - 2] : undefined;

      const coderPrompt = await formatCoderPrompt({
        specContent,
        reviewerFeedback,
      });

      let coderResult: Awaited<ReturnType<typeof runClaudeAgent>>;
      try {
        coderResult = await runClaudeAgent({
          prompt: coderPrompt,
          cwd: worktreeInfo.path,
          // No maxTurns - allow natural completion
          displayOptions: {
            showToolCalls: true,
            showTimestamps: false,
            verbose: false,
          },
        });
      } catch (error) {
        throw new AgentExecutionError(
          'Coder agent failed',
          error instanceof Error ? error : undefined
        );
      }

      if (!coderResult.success) {
        throw new AgentExecutionError('Coder agent execution was not successful');
      }

      // Use finalResponse directly from SDK (not extracted from messages)
      const coderHandoff =
        coderResult.finalResponse || '[No final response - task may have been interrupted]';
      await addCoderResponse(taskId, coderHandoff);

      // 3b. Run Reviewer Agent
      console.log('🔍 Running Reviewer Agent...');
      const reviewerPrompt = await formatReviewerPrompt({
        originalSpec: specContent,
        coderHandoff,
      });

      let reviewerResult: Awaited<ReturnType<typeof runClaudeAgent>>;
      try {
        reviewerResult = await runClaudeAgent({
          prompt: reviewerPrompt,
          cwd: worktreeInfo.path,
          // No maxTurns - allow natural completion
          displayOptions: {
            showToolCalls: true,
            showTimestamps: false,
            verbose: false,
          },
        });
      } catch (error) {
        throw new AgentExecutionError(
          'Reviewer agent failed',
          error instanceof Error ? error : undefined
        );
      }

      if (!reviewerResult.success) {
        throw new AgentExecutionError('Reviewer agent execution was not successful');
      }

      // Use finalResponse directly from SDK (not extracted from messages)
      const reviewerResponse =
        reviewerResult.finalResponse || '[No final response - task may have been interrupted]';
      await addReviewerResponse(taskId, reviewerResponse);

      // 3c. Check for PR creation (success condition)
      console.log('🔍 Checking for PR creation...');
      const prInfo = await checkPRExists(worktreeInfo.branchName);
      if (prInfo) {
        console.log(`✅ PR created successfully: ${prInfo.url}`);
        return {
          success: true,
          prUrl: prInfo.url,
          iterations: iteration,
          taskId,
        };
      }

      // 3d. Continue to next iteration if no PR found
      console.log('⏭️  No PR found, continuing to next iteration...');
    }

    // 4. Handle max iterations reached without PR
    return {
      success: false,
      iterations: options.maxReviews,
      taskId,
      error: `Max iterations (${options.maxReviews}) reached without PR creation`,
    };
  } catch (error) {
    // Handle known errors
    if (error instanceof SpecFileNotFoundError) {
      return {
        success: false,
        iterations: 0,
        taskId,
        error: error.message,
      };
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        iterations: 0,
        taskId,
        error: error.message,
      };
    }

    if (error instanceof AgentExecutionError) {
      return {
        success: false,
        iterations: 0,
        taskId,
        error: error.message,
      };
    }

    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      iterations: 0,
      taskId,
      error: `Unexpected error: ${errorMessage}`,
    };
  } finally {
    // 5. Cleanup based on options.cleanup and workflow result
    if (options.cleanup && worktreeInfo) {
      try {
        console.log('🧹 Cleaning up worktree and task state...');
        await cleanupWorktree(worktreeInfo);
        await cleanupTaskState(taskId);
      } catch (cleanupError) {
        // Log cleanup errors but don't fail the workflow
        console.warn('⚠️  Cleanup failed:', cleanupError);
      }
    }
  }
}

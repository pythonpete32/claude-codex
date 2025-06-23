import { resolve } from 'node:path';
import { runAgent } from '../core/claude.js';
import { checkPRExists } from '../core/operations/github.js';
import { formatCoderPrompt, formatReviewerPrompt } from '../core/operations/prompts.js';
// Import operations
import {
  addCoderResponse,
  addReviewerResponse,
  cleanupTaskState,
  initializeTaskState,
} from '../core/operations/state.js';
import { cleanupWorktree, createWorktree } from '../core/operations/worktree.js';
import {
  AgentExecutionError,
  SpecFileNotFoundError,
  StateManagementError,
} from '../shared/errors.js';
import type { TDDOptions, TDDResult, WorktreeInfo } from '../shared/types.js';

function generateTaskId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

export async function executeTDDWorkflow(options: TDDOptions): Promise<TDDResult> {
  const taskId = generateTaskId();
  let worktreeInfo: WorktreeInfo | null = null;

  try {
    // 1. Initialize task state and worktree
    console.log('🚀 Initializing TDD workflow...');

    // Validate spec file exists
    const specPath = resolve(options.specPath);

    const taskState = await initializeTaskState(specPath, {
      taskId,
      maxIterations: options.maxReviews,
      branchName: options.branchName || `tdd/${taskId}`,
    });

    console.log(`📋 Task ID: ${taskId}`);
    console.log(`📄 Spec: ${specPath}`);

    // Create isolated worktree
    console.log('🌿 Creating git worktree...');
    worktreeInfo = await createWorktree(taskId, {
      branchName: options.branchName,
    });

    // Update task state with worktree info
    taskState.worktreeInfo = worktreeInfo;

    console.log(`🔀 Branch: ${worktreeInfo.branchName}`);
    console.log(`📂 Worktree: ${worktreeInfo.path}`);

    // 2. Agent iteration loop
    let reviewerFeedback: string | undefined;

    for (let iteration = 1; iteration <= options.maxReviews; iteration++) {
      console.log(`\n🔄 Iteration ${iteration}/${options.maxReviews}`);

      // 2a. Run Coder Agent
      console.log('👨‍💻 Running Coder Agent...');

      const coderPrompt = await formatCoderPrompt({
        specContent: taskState.originalSpec,
        reviewerFeedback,
      });

      const coderResult = await runAgent({
        prompt: coderPrompt,
        cwd: worktreeInfo.path,
        maxTurns: 5,
      });

      await addCoderResponse(taskId, coderResult.finalResponse);
      console.log('✅ Coder Agent completed');

      // 2b. Run Reviewer Agent
      console.log('👩‍🔬 Running Reviewer Agent...');

      const reviewerPrompt = await formatReviewerPrompt({
        originalSpec: taskState.originalSpec,
        coderHandoff: coderResult.finalResponse,
      });

      const reviewerResult = await runAgent({
        prompt: reviewerPrompt,
        cwd: worktreeInfo.path,
        maxTurns: 3,
      });

      await addReviewerResponse(taskId, reviewerResult.finalResponse);
      console.log('✅ Reviewer Agent completed');

      // 2c. Check for PR creation (success condition)
      console.log('🔍 Checking for pull request...');

      const prInfo = await checkPRExists(worktreeInfo.branchName);
      if (prInfo) {
        console.log(`🎉 Success! Pull request created: ${prInfo.url}`);
        return {
          success: true,
          prUrl: prInfo.url,
          iterations: iteration,
          taskId,
        };
      }

      // 2d. Extract feedback for next iteration
      const response = reviewerResult.finalResponse.toLowerCase();

      if (response.includes('create') && response.includes('pr')) {
        // Reviewer indicated success but we didn't detect PR
        console.log('⚠️  Reviewer indicated completion but no PR detected');
        return {
          success: false,
          iterations: iteration,
          taskId,
          error: 'Reviewer indicated completion but no PR was created',
        };
      }

      if (response.includes('feedback') || response.includes('issue')) {
        // Extract feedback for next iteration
        reviewerFeedback = reviewerResult.finalResponse;
        console.log('📝 Feedback provided, continuing to next iteration...');
        continue;
      }

      // No clear feedback or completion signal
      console.log('❓ Unclear reviewer response, terminating');
      return {
        success: false,
        iterations: iteration,
        taskId,
        error: 'Unclear reviewer response - no clear feedback or completion signal',
      };
    }

    // 3. Max iterations reached
    console.log('⏱️  Maximum iterations reached');
    return {
      success: false,
      iterations: options.maxReviews,
      taskId,
      error: `Maximum iterations (${options.maxReviews}) reached without completion`,
    };
  } catch (error) {
    console.error('💥 Workflow failed:', error);

    let errorMessage = 'Unknown error';
    if (error instanceof SpecFileNotFoundError) {
      errorMessage = `Specification file not found: ${options.specPath}`;
    } else if (error instanceof AgentExecutionError) {
      errorMessage = `Agent execution failed: ${error.message}`;
    } else if (error instanceof StateManagementError) {
      errorMessage = `State management failed: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      iterations: 0,
      taskId,
      error: errorMessage,
    };
  } finally {
    // 4. Cleanup based on options
    if (options.cleanup && worktreeInfo) {
      try {
        console.log('🧹 Cleaning up worktree...');
        await cleanupWorktree(worktreeInfo);
        await cleanupTaskState(taskId);
        console.log('✅ Cleanup completed');
      } catch (cleanupError) {
        console.warn('⚠️  Cleanup failed:', cleanupError);
        // Don't throw here, just warn - original result is more important
      }
    } else if (worktreeInfo) {
      console.log(`💾 Preserving worktree at: ${worktreeInfo.path}`);
      console.log(`🔖 Task state saved for task ID: ${taskId}`);
    }
  }
}

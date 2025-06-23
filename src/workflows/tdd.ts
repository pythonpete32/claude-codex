import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { runAgent } from '../core/claude.js';
import { logDim, logError, logInfo, logSuccess } from '../core/messaging.js';
import { checkPRExists } from '../core/operations/github.js';
import {
  extractFinalMessage,
  formatCoderPrompt,
  formatReviewerPrompt,
} from '../core/operations/prompts.js';
import {
  addCoderResponse,
  addReviewerResponse,
  cleanupTaskState,
  initializeTaskState,
} from '../core/operations/state.js';
import { cleanupWorktree, createWorktree } from '../core/operations/worktree.js';
import { SpecFileNotFoundError, WorktreeCreationError } from '../shared/errors.js';
import type { TaskState, TDDOptions, TDDResult, WorktreeInfo } from '../shared/types.js';

/**
 * Generates a unique task ID using timestamp and random suffix
 */
function generateTaskId(): string {
  const timestamp = Date.now().toString(36);
  const random = randomUUID().split('-')[0];
  return `${timestamp}_${random}`;
}

/**
 * Validates that the specification file exists and is readable
 */
async function validateSpecFile(specPath: string): Promise<string> {
  try {
    const content = await readFile(specPath, 'utf-8');
    if (!content.trim()) {
      throw new SpecFileNotFoundError(`Specification file is empty: ${specPath}`);
    }
    return content;
  } catch (error) {
    if (error instanceof SpecFileNotFoundError) {
      throw error;
    }
    throw new SpecFileNotFoundError(
      `Cannot read specification file: ${specPath}. Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Executes the complete TDD workflow from specification to pull request
 *
 * @param options - TDD workflow configuration
 * @returns Promise<TDDResult> - Workflow execution result
 */
export async function executeTDDWorkflow(options: TDDOptions): Promise<TDDResult> {
  const taskId = generateTaskId();
  let worktreeInfo: WorktreeInfo | null = null;
  let taskState: TaskState | null = null;

  try {
    logInfo(`🤖 Starting TDD Workflow [Task: ${taskId}]`);

    // 1. Validate and read specification file
    const resolvedSpecPath = path.resolve(options.specPath);
    const specContent = await validateSpecFile(resolvedSpecPath);
    logSuccess(`✅ Specification loaded: ${resolvedSpecPath}`);

    // 2. Initialize task state
    taskState = await initializeTaskState(resolvedSpecPath, {
      taskId,
      maxIterations: options.maxReviews,
    });
    logSuccess('✅ Task state initialized');

    // 3. Create isolated worktree
    try {
      worktreeInfo = await createWorktree(taskId, {
        branchName: options.branchName,
      });
      logSuccess(`✅ Worktree created: ${worktreeInfo.branchName} at ${worktreeInfo.path}`);
    } catch (error) {
      throw new WorktreeCreationError(
        `Failed to create worktree for task ${taskId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // 4. Agent iteration loop
    for (let iteration = 1; iteration <= options.maxReviews; iteration++) {
      logInfo(`\n🔄 Iteration ${iteration}/${options.maxReviews}`);

      // 4a. Prepare context for Coder Agent
      const reviewerFeedback =
        iteration > 1
          ? taskState.reviewerResponses[taskState.reviewerResponses.length - 1]
          : undefined;

      // 4b. Run Coder Agent
      logDim('🔨 Running Coder Agent...');
      const coderPrompt = await formatCoderPrompt({
        specContent,
        reviewerFeedback,
      });

      const coderResult = await runAgent({
        prompt: coderPrompt,
        cwd: worktreeInfo.path,
        maxTurns: 5,
      });

      if (!coderResult.success) {
        logError(`❌ Coder Agent failed on iteration ${iteration}`);
        continue;
      }

      const coderHandoff = await extractFinalMessage(coderResult.messages);
      await addCoderResponse(taskId, coderHandoff);
      logSuccess('✅ Coder Agent completed');

      // 4c. Run Reviewer Agent
      logDim('👁️ Running Reviewer Agent...');
      const reviewerPrompt = await formatReviewerPrompt({
        originalSpec: specContent,
        coderHandoff,
      });

      const reviewerResult = await runAgent({
        prompt: reviewerPrompt,
        cwd: worktreeInfo.path,
        maxTurns: 3,
      });

      if (!reviewerResult.success) {
        logError(`❌ Reviewer Agent failed on iteration ${iteration}`);
        continue;
      }

      const reviewerResponse = await extractFinalMessage(reviewerResult.messages);
      await addReviewerResponse(taskId, reviewerResponse);
      logSuccess('✅ Reviewer Agent completed');

      // 4d. Check for PR creation (success condition)
      logDim('🔍 Checking for pull request...');
      const prInfo = await checkPRExists(worktreeInfo.branchName);

      if (prInfo) {
        logSuccess(`🎉 Pull Request created: ${prInfo.url}`);
        return {
          success: true,
          prUrl: prInfo.url,
          iterations: iteration,
          taskId,
        };
      }

      logDim('💭 No PR found, continuing iteration...');

      // Update current iteration in task state
      taskState.currentIteration = iteration;
    }

    // 5. Max iterations reached without PR creation
    logError(`❌ Workflow completed ${options.maxReviews} iterations without PR creation`);
    return {
      success: false,
      iterations: options.maxReviews,
      taskId,
      error: 'Maximum iterations reached without pull request creation',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`❌ Workflow failed: ${errorMessage}`);

    return {
      success: false,
      iterations: taskState?.currentIteration || 0,
      taskId,
      error: errorMessage,
    };
  } finally {
    // 6. Cleanup based on options and success/failure
    if (options.cleanup && worktreeInfo) {
      try {
        logDim('🧹 Cleaning up worktree...');
        await cleanupWorktree(worktreeInfo);
        logSuccess('✅ Worktree cleaned up');
      } catch (cleanupError) {
        logError(
          `⚠️ Cleanup warning: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`
        );
      }
    }

    if (options.cleanup && taskState) {
      try {
        await cleanupTaskState(taskId);
        logSuccess('✅ Task state cleaned up');
      } catch (cleanupError) {
        logError(
          `⚠️ State cleanup warning: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`
        );
      }
    }

    if (!options.cleanup && worktreeInfo) {
      logInfo(`📁 Worktree preserved at: ${worktreeInfo.path}`);
      logInfo(`🌿 Branch: ${worktreeInfo.branchName}`);
    }
  }
}

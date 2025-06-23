import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { runAgent } from '../core/claude.js';
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
 * Extract agent response using simple fallback chain
 */
function extractAgentResponse(agentResult: Awaited<ReturnType<typeof runAgent>>): string {
  const resultMessage = agentResult.messages.find((m) => m.type === 'result');
  return (
    agentResult.finalResponse ||
    resultMessage?.result ||
    '[Agent conversation incomplete - no response content available]'
  );
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

      let coderResult: Awaited<ReturnType<typeof runAgent>>;
      try {
        coderResult = await runAgent({
          prompt: coderPrompt,
          cwd: worktreeInfo.path,
          maxTurns: 10,
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

      // Extract and save coder response
      console.log('💾 Saving complete message structure to debug files...');

      // Save the entire result structure to disk for analysis
      const debugDir = '.codex/debug';
      await fs.mkdir(debugDir, { recursive: true });

      const debugFile = `${debugDir}/${taskId}-coder-messages.json`;
      await fs.writeFile(
        debugFile,
        JSON.stringify(
          {
            taskId,
            timestamp: new Date().toISOString(),
            finalResponse: coderResult.finalResponse,
            success: coderResult.success,
            cost: coderResult.cost,
            duration: coderResult.duration,
            messagesCount: coderResult.messages.length,
            messages: coderResult.messages,
          },
          null,
          2
        )
      );

      console.log(`📁 Complete message structure saved to: ${debugFile}`);
      console.log(`🔍 You can examine the raw data with: cat "${debugFile}"`);

      // Extract agent response using simple fallback chain
      const coderHandoff = extractAgentResponse(coderResult);

      console.log('🔍 Extracted coder handoff:', JSON.stringify(coderHandoff, null, 2));
      await addCoderResponse(taskId, coderHandoff);

      // 3b. Run Reviewer Agent
      console.log('🔍 Running Reviewer Agent...');
      const reviewerPrompt = await formatReviewerPrompt({
        originalSpec: specContent,
        coderHandoff,
      });

      let reviewerResult: Awaited<ReturnType<typeof runAgent>>;
      try {
        reviewerResult = await runAgent({
          prompt: reviewerPrompt,
          cwd: worktreeInfo.path,
          maxTurns: 5,
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

      // Extract and save reviewer response
      console.log('💾 Saving reviewer message structure to debug files...');

      const reviewerDebugFile = `${debugDir}/${taskId}-reviewer-messages.json`;
      await fs.writeFile(
        reviewerDebugFile,
        JSON.stringify(
          {
            taskId,
            timestamp: new Date().toISOString(),
            finalResponse: reviewerResult.finalResponse,
            success: reviewerResult.success,
            cost: reviewerResult.cost,
            duration: reviewerResult.duration,
            messagesCount: reviewerResult.messages.length,
            messages: reviewerResult.messages,
          },
          null,
          2
        )
      );

      console.log(`📁 Reviewer message structure saved to: ${reviewerDebugFile}`);

      // Extract agent response using simple fallback chain
      const reviewerResponse = extractAgentResponse(reviewerResult);

      console.log('🔍 Extracted reviewer response:', JSON.stringify(reviewerResponse, null, 2));
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

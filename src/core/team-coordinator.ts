import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { AgentExecutionError } from '../shared/errors.js';
import type { CoordinationOptions, TeamResult, WorktreeInfo } from '../shared/types.js';
import { generateTaskId } from '../shared/utils.js';
import { getMCPConfigForTeam, loadCodexConfig } from './config.js';
import { runClaudeAgent } from './messaging/sdk-wrapper.js';
import { checkPRExists } from './operations/github.js';
import {
  cleanupTaskState,
  getTaskState,
  initializeTaskState,
  updateTaskState,
  updateWorktreeInfo,
} from './operations/state.js';
import { cleanupWorktree, createWorktree } from './operations/worktree.js';
import { loadTeam } from './teams.js';

/**
 * Execute a team-based workflow
 */
export async function executeTeamWorkflow(options: CoordinationOptions): Promise<TeamResult> {
  const taskId = generateTaskId();
  let worktreeInfo: WorktreeInfo | null = null;

  try {
    // 1. Load team and config
    const team = await loadTeam(options.teamType);
    const config = await loadCodexConfig();
    const mcpConfig = await getMCPConfigForTeam(options.teamType, config);

    // 2. Initialize task state
    await initializeTaskState(options.specOrIssue, {
      taskId,
      maxIterations: options.maxReviews,
      teamType: options.teamType,
    });

    // 3. Create worktree
    console.log('🌿 Creating worktree...');
    worktreeInfo = await createWorktree(taskId, {
      branchName: options.branchName,
    });
    await updateWorktreeInfo(taskId, worktreeInfo);

    // 4. Setup .temp directory for team communication
    const tempDir = join(process.cwd(), '.temp');
    await fs.mkdir(tempDir, { recursive: true });

    // 5. Main iteration loop
    for (let iteration = 1; iteration <= options.maxReviews; iteration++) {
      console.log(`🔄 Starting iteration ${iteration}/${options.maxReviews}`);

      // 5a. Run Coder Agent
      console.log('🤖 Running Coder Agent...');

      const coderPrompt = team.CODER(options.specOrIssue);
      const coderResult = await runClaudeAgent({
        prompt: coderPrompt,
        cwd: worktreeInfo.path,
        mcpConfig,
      });

      if (!coderResult.success) {
        // Update task status to failed
        const taskState = await getTaskState(taskId);
        taskState.status = 'failed';
        await updateTaskState(taskState);
        throw new AgentExecutionError('Coder agent execution failed');
      }

      // 5b. Run Reviewer Agent
      console.log('🔍 Running Reviewer Agent...');

      const reviewerPrompt = team.REVIEWER(options.specOrIssue);
      const reviewerResult = await runClaudeAgent({
        prompt: reviewerPrompt,
        cwd: worktreeInfo.path,
        mcpConfig,
      });

      if (!reviewerResult.success) {
        // Update task status to failed
        const taskState = await getTaskState(taskId);
        taskState.status = 'failed';
        await updateTaskState(taskState);
        throw new AgentExecutionError('Reviewer agent execution failed');
      }

      // Check for PR creation (success condition)
      console.log('🔍 Checking for PR creation...');
      const prInfo = await checkPRExists(worktreeInfo.branchName);

      if (prInfo) {
        console.log(`✅ Pull request created: ${prInfo.url}`);

        // Cleanup if requested
        if (options.cleanup && worktreeInfo) {
          try {
            console.log('🧹 Cleaning up worktree...');
            await cleanupWorktree(worktreeInfo);
            await cleanupTaskState(taskId);
          } catch (cleanupError) {
            console.warn('⚠️  Cleanup failed:', cleanupError);
            // Don't fail the workflow due to cleanup errors
          }
        }

        return {
          success: true,
          prUrl: prInfo.url,
          iterations: iteration,
          taskId,
        };
      }

      // Agents automatically manage iteration feedback via .temp/ files
      console.log('🔄 Continuing to next iteration...');
    }

    // If we get here, max reviews reached without PR
    console.log('⚠️ Maximum reviews reached without successful PR creation');

    // Cleanup if requested
    if (options.cleanup && worktreeInfo) {
      try {
        console.log('🧹 Cleaning up worktree...');
        await cleanupWorktree(worktreeInfo);
        await cleanupTaskState(taskId);
      } catch (cleanupError) {
        console.warn('⚠️  Cleanup failed:', cleanupError);
        // Don't fail the workflow due to cleanup errors
      }
    }

    return {
      success: false,
      iterations: options.maxReviews,
      taskId,
      error: 'Maximum reviews reached without successful PR creation',
    };
  } catch (error) {
    console.error(
      '❌ Team workflow failed:',
      error instanceof Error ? error.message : String(error)
    );

    // Cleanup on error
    if (worktreeInfo && options.cleanup) {
      try {
        await cleanupWorktree(worktreeInfo);
        await cleanupTaskState(taskId);
      } catch (cleanupError) {
        console.error('Failed to cleanup after error:', cleanupError);
      }
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      iterations: 0,
      taskId,
      error: errorMessage,
    };
  }
}

/**
 * List available teams for CLI help
 */
export async function listTeams(): Promise<string[]> {
  try {
    const teams = await import('./teams.js');
    return await teams.listAvailableTeams();
  } catch {
    return ['standard', 'tdd', 'frontend', 'smart-contract']; // fallback
  }
}

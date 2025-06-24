/**
 * Team command handler for Claude Codex CLI
 */

import { executeTeamWorkflow } from '~/teams/coordinator.js';

export interface TeamOptions {
  maxReviews?: string;
  branchName?: string;
  cleanup?: boolean;
}

/**
 * Handle the team command
 */
export async function handleTeamCommand(
  teamType: string,
  specOrIssue: string,
  options: TeamOptions = {}
): Promise<void> {
  try {
    console.log(`🎯 Starting ${teamType} team workflow...`);

    const result = await executeTeamWorkflow({
      teamType,
      specOrIssue,
      maxReviews: options.maxReviews ? Number.parseInt(options.maxReviews, 10) : 3,
      branchName: options.branchName,
      cleanup: options.cleanup !== false, // Default to true unless --no-cleanup
    });

    if (result.success) {
      console.log('🎉 Team workflow completed successfully!');
      if (result.prUrl) {
        console.log(`📋 Pull Request: ${result.prUrl}`);
      }
      console.log(`🔄 Iterations: ${result.iterations}`);
      console.log(`🆔 Task ID: ${result.taskId}`);
    } else {
      console.error('❌ Team workflow failed:', result.error);
      console.log(`🔄 Iterations completed: ${result.iterations}`);
      console.log(`🆔 Task ID: ${result.taskId}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(
      '❌ Team workflow error:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

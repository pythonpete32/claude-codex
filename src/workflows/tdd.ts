// Legacy TDD workflow - now redirects to team coordinator
import type { CoordinationOptions, TeamResult } from '../shared/types.js';

// TODO: Remove TDD-specific types - using temporary aliases for now
type TDDOptions = CoordinationOptions;
type TDDResult = TeamResult;

/**
 * @deprecated Use executeTeamWorkflow with 'tdd' team instead
 *
 * Main TDD workflow orchestrator that coordinates agent execution
 * from specification to pull request creation
 */
export async function executeTDDWorkflow(options: TDDOptions): Promise<TDDResult> {
  // Redirect to new team system
  console.log(
    '⚠️  executeTDDWorkflow is deprecated. Use executeTeamWorkflow with "tdd" team instead.'
  );

  const { executeTeamWorkflow } = await import('../core/team-coordinator.js');

  return await executeTeamWorkflow({
    specOrIssue: options.specOrIssue,
    teamType: 'tdd',
    maxReviews: options.maxReviews,
    branchName: options.branchName,
    cleanup: options.cleanup,
  });
}

import path from 'node:path';
import { logError, logInfo, logSuccess, logWarning } from '../../core/messaging.js';
import { forceSubscriptionAuth } from '../../lib.js';
import { validateEnvironment } from '../../shared/preflight.js';
import type { TDDCommandArgs, TDDOptions } from '../../shared/types.js';
import { executeTDDWorkflow } from '../../workflows/tdd.js';

/**
 * Handles the TDD subcommand execution
 *
 * @param args - Parsed TDD command arguments
 */
export async function handleTDDCommand(args: TDDCommandArgs): Promise<void> {
  try {
    logInfo('🤖 Claude Codex - Starting TDD Workflow');

    // 1. Force subscription authentication
    await forceSubscriptionAuth();

    // 2. Validate environment prerequisites
    logInfo('🔍 Validating environment...');
    const preflightResult = await validateEnvironment();

    if (!preflightResult.success) {
      logError('❌ Environment validation failed:');
      for (const error of preflightResult.errors) {
        logError(`  • ${error}`);
      }

      if (preflightResult.warnings.length > 0) {
        logWarning('\n⚠️ Warnings:');
        for (const warning of preflightResult.warnings) {
          logWarning(`  • ${warning}`);
        }
      }

      logError('\nPlease resolve the above issues before running the TDD workflow.');
      process.exit(1);
    }

    if (preflightResult.warnings.length > 0) {
      logWarning('⚠️ Environment warnings:');
      for (const warning of preflightResult.warnings) {
        logWarning(`  • ${warning}`);
      }
      logInfo('Proceeding with warnings...\n');
    } else {
      logSuccess('✅ Environment validation passed');
    }

    // 3. Convert CLI args to TDDOptions
    const options: TDDOptions = {
      specPath: path.resolve(args.specPath),
      maxReviews: args.reviews || 3,
      branchName: args.branch,
      cleanup: args.cleanup !== false, // Default to true unless explicitly disabled
    };

    // 4. Display workflow configuration
    logInfo('\n📋 Workflow Configuration:');
    logInfo(`  Specification: ${options.specPath}`);
    logInfo(`  Max Reviews: ${options.maxReviews}`);
    if (options.branchName) {
      logInfo(`  Branch: ${options.branchName}`);
    } else {
      logInfo('  Branch: auto-generated');
    }
    logInfo(`  Cleanup: ${options.cleanup ? 'enabled' : 'disabled'}`);
    if (args.verbose) {
      logInfo('  Verbose: enabled');
    }

    // 5. Execute the TDD workflow
    logInfo('\n🚀 Starting workflow execution...');
    const result = await executeTDDWorkflow(options);

    // 6. Report results to user
    console.log(`\n${'='.repeat(60)}`);

    if (result.success) {
      logSuccess('🎉 TDD Workflow Completed Successfully!');
      logSuccess(`✅ Pull Request Created: ${result.prUrl}`);
      logInfo(
        `📊 Completed in ${result.iterations} iteration${result.iterations === 1 ? '' : 's'}`
      );
      logInfo(`🆔 Task ID: ${result.taskId}`);

      if (!options.cleanup) {
        logInfo('\n📁 Resources preserved for debugging:');
        logInfo('   • Worktree and branch kept for manual inspection');
        logInfo('   • Task state preserved in .codex/ directory');
      }

      process.exit(0);
    } else {
      logError('❌ TDD Workflow Failed');

      if (result.error) {
        logError(`💥 Error: ${result.error}`);
      }

      logInfo(
        `📊 Attempted ${result.iterations} iteration${result.iterations === 1 ? '' : 's'} of ${options.maxReviews}`
      );
      logInfo(`🆔 Task ID: ${result.taskId}`);

      if (!options.cleanup) {
        logInfo('\n📁 Resources preserved for debugging:');
        logInfo('   • Check worktree and task state for partial progress');
        logInfo('   • Review agent responses in .codex/ directory');
      }

      // Provide helpful troubleshooting guidance
      logError('\n🔧 Troubleshooting suggestions:');
      logError('   • Check specification file clarity and completeness');
      logError('   • Verify GitHub repository permissions');
      logError('   • Review agent responses for implementation issues');
      logError('   • Consider increasing --reviews for complex tasks');

      process.exit(1);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logError('❌ TDD Command Failed');
    logError(`💥 Error: ${errorMessage}`);

    if (args.verbose && error instanceof Error && error.stack) {
      logError('\n🔍 Stack trace:');
      logError(error.stack);
    }

    logError('\n🔧 Common solutions:');
    logError('   • Check specification file path exists and is readable');
    logError("   • Ensure you're in a git repository with GitHub remote");
    logError('   • Verify GITHUB_TOKEN environment variable is set');
    logError('   • Confirm Claude Code CLI is authenticated');

    process.exit(1);
  }
}

/**
 * Displays usage help specifically for the TDD command
 */
export function showTDDHelp(): string {
  return `
TDD Command - Test-Driven Development Workflow

USAGE:
  claude-codex tdd <spec-file> [OPTIONS]

ARGUMENTS:
  <spec-file>                                     Path to specification markdown file

OPTIONS:
  --reviews <number>                              Maximum review iterations (1-10, default: 3)
  --branch <name>                                 Custom branch name (default: auto-generated)
  --no-cleanup                                    Keep worktree and state files after completion
  --verbose                                       Enable detailed output and error traces

EXAMPLES:
  claude-codex tdd ./feature-spec.md              # Basic TDD workflow
  claude-codex tdd ./spec.md --reviews 5          # Allow up to 5 review iterations
  claude-codex tdd ./spec.md --branch feat/auth   # Use custom branch name
  claude-codex tdd ./spec.md --no-cleanup         # Preserve files for debugging

WORKFLOW:
  1. Validates environment (git repo, GitHub token, Claude auth)
  2. Creates isolated worktree and branch
  3. Runs Coder Agent to implement specification
  4. Runs Reviewer Agent to review and provide feedback
  5. Repeats until PR is created or max iterations reached
  6. Reports final status and cleanup

REQUIREMENTS:
  • Git repository with GitHub remote
  • GITHUB_TOKEN environment variable
  • Claude Code CLI authenticated
  • Write permissions for .codex/ directory

SUCCESS CRITERIA:
  • Pull request successfully created on GitHub
  • Implementation passes all quality gates
  • Code follows best practices and testing standards
`.trim();
}

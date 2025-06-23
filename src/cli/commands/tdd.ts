import { resolve } from 'node:path';
import { validateEnvironment } from '../../shared/preflight.js';
import type { TDDCommandArgs, TDDOptions } from '../../shared/types.js';
import { executeTDDWorkflow } from '../../workflows/tdd.js';

/**
 * Handle TDD subcommand execution with progress reporting
 */
export async function handleTDDCommand(args: TDDCommandArgs): Promise<void> {
  try {
    // 1. Validate arguments and environment
    console.log('🔍 Validating environment...');
    const preflightResult = await validateEnvironment();

    if (!preflightResult.success) {
      console.error('❌ Environment validation failed:');
      for (const error of preflightResult.errors) {
        console.error(`  • ${error}`);
      }

      if (preflightResult.warnings.length > 0) {
        console.warn('⚠️  Warnings:');
        for (const warning of preflightResult.warnings) {
          console.warn(`  • ${warning}`);
        }
      }

      process.exit(1);
    }

    if (preflightResult.warnings.length > 0) {
      console.warn('⚠️  Warnings:');
      for (const warning of preflightResult.warnings) {
        console.warn(`  • ${warning}`);
      }
    }

    // 2. Convert CLI args to TDDOptions
    const options: TDDOptions = {
      specPath: resolve(args.specPath),
      maxReviews: args.reviews || 3,
      branchName: args.branch,
      cleanup: args.cleanup !== false,
    };

    // 3. Display workflow configuration
    console.log('🤖 Claude Codex - Starting TDD Workflow');
    console.log(`   Specification: ${options.specPath}`);
    console.log(`   Max Reviews: ${options.maxReviews}`);
    if (options.branchName) {
      console.log(`   Branch: ${options.branchName}`);
    }
    console.log(`   Cleanup: ${options.cleanup ? 'enabled' : 'disabled'}`);

    if (args.verbose) {
      console.log('   Verbose: enabled');
    }

    console.log('');

    // 4. Execute workflow with progress reporting
    const startTime = Date.now();
    const result = await executeTDDWorkflow(options);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // 5. Report results to user
    console.log('');
    console.log('═'.repeat(60));

    if (result.success) {
      console.log('✅ TDD Workflow Completed Successfully!');
      console.log(`   📝 Pull Request: ${result.prUrl}`);
      console.log(`   🔄 Iterations: ${result.iterations}`);
      console.log(`   ⏱️  Duration: ${duration}s`);
      console.log(`   📁 Task ID: ${result.taskId}`);
      console.log('');
      console.log('🎉 Your feature has been implemented with comprehensive tests!');
      console.log('   Review the PR and merge when ready.');

      process.exit(0);
    } else {
      console.error('❌ TDD Workflow Failed');
      console.error(`   🔄 Iterations: ${result.iterations}`);
      console.error(`   ⏱️  Duration: ${duration}s`);
      console.error(`   📁 Task ID: ${result.taskId}`);
      console.error(`   💥 Error: ${result.error}`);
      console.error('');

      // Provide helpful guidance based on error type
      if (result.error?.includes('Max iterations')) {
        console.error('💡 Suggestions:');
        console.error('   • Try increasing --reviews for more iterations');
        console.error('   • Review your specification for clarity and completeness');
        console.error('   • Check agent responses in .codex/ directory for debugging');
      } else if (result.error?.includes('Specification file')) {
        console.error('💡 Suggestions:');
        console.error('   • Ensure the specification file exists and is readable');
        console.error('   • Check file path and permissions');
      } else if (result.error?.includes('environment')) {
        console.error('💡 Suggestions:');
        console.error('   • Run with --verbose for detailed environment info');
        console.error('   • Check GITHUB_TOKEN environment variable');
        console.error("   • Ensure you're in a Git repository");
      }

      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('💥 Unexpected error occurred:');

    if (error instanceof Error) {
      console.error(`   ${error.message}`);

      if (args.verbose && error.stack) {
        console.error('');
        console.error('Stack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(`   ${String(error)}`);
    }

    console.error('');
    console.error('💡 Try running with --verbose for more details');

    process.exit(1);
  }
}

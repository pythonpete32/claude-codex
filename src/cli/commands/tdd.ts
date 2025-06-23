import { resolve } from 'node:path';
import { printPreflightResults, validateEnvironment } from '../../shared/preflight.js';
import type { TDDCommandArgs } from '../../shared/types.js';
import { executeTDDWorkflow } from '../../workflows/tdd.js';

export async function handleTDDCommand(args: TDDCommandArgs): Promise<void> {
  try {
    // 1. Validate arguments
    if (!args.specPath) {
      console.error('❌ Error: Specification file path is required');
      console.error('Usage: claude-codex tdd <spec-file> [options]');
      process.exit(1);
    }

    // 2. Validate environment
    console.log('🔍 Validating environment...');
    const preflightResult = await validateEnvironment();
    printPreflightResults(preflightResult);

    if (!preflightResult.success) {
      console.error('❌ Environment validation failed. Please fix the errors above and try again.');
      process.exit(1);
    }

    // 3. Convert CLI args to TDDOptions
    const options = {
      specPath: resolve(args.specPath),
      maxReviews: args.reviews || 3,
      branchName: args.branch,
      cleanup: args.cleanup !== false, // Default to true unless explicitly false
    };

    // 4. Show configuration
    console.log('\n📋 TDD Workflow Configuration:');
    console.log(`   Specification: ${options.specPath}`);
    console.log(`   Max Reviews: ${options.maxReviews}`);
    if (options.branchName) {
      console.log(`   Branch Name: ${options.branchName}`);
    }
    console.log(`   Cleanup: ${options.cleanup ? 'Yes' : 'No'}`);
    if (args.verbose) {
      console.log('   Verbose: Yes');
    }

    // 5. Execute workflow with progress reporting
    console.log('\n🤖 Claude Codex - Starting TDD Workflow');
    console.log('━'.repeat(50));

    const result = await executeTDDWorkflow(options);

    // 6. Report results to user
    console.log(`\n${'━'.repeat(50)}`);
    if (result.success) {
      console.log('🎉 TDD Workflow Completed Successfully!');
      console.log(`   • Pull Request: ${result.prUrl}`);
      console.log(`   • Iterations: ${result.iterations}`);
      console.log(`   • Task ID: ${result.taskId}`);

      if (args.verbose) {
        console.log('\n📋 Next Steps:');
        console.log('   1. Review the pull request');
        console.log('   2. Test the implementation');
        console.log('   3. Merge when ready');
      }
    } else {
      console.error('❌ TDD Workflow Failed');
      console.error(`   • Error: ${result.error}`);
      console.error(`   • Iterations: ${result.iterations}`);
      console.error(`   • Task ID: ${result.taskId}`);

      if (args.verbose) {
        console.error('\n🔧 Troubleshooting:');
        console.error('   1. Check the specification file for clarity');
        console.error('   2. Review agent responses in .codex/task-*.json');
        console.error('   3. Ensure GitHub token has required permissions');
        console.error('   4. Try increasing --reviews if close to completion');
      }

      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Unexpected error during TDD workflow:');
    console.error(`   ${error}`);

    if (args.verbose && error instanceof Error) {
      console.error('\n📊 Stack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  }
}

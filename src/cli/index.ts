#!/usr/bin/env node

/**
 * CLI entry point for Claude Codex AI team automation
 */

import { Command } from 'commander';
import { handleInitCommand } from '~/cli/commands/init.js';
import { handleTeamCommand } from '~/cli/commands/team.js';
import { handleTestCommand } from '~/cli/commands/test.js';

// Version from package.json
const version = '0.4.0';

/**
 * Main CLI entry point
 */
export async function runCLI(argv: string[] = process.argv): Promise<void> {
  const program = new Command();

  program.name('claude-codex').description('Claude Codex - AI team automation').version(version);

  // Init command
  program
    .command('init')
    .description('Initialize Claude Codex configuration and teams')
    .option('--force', 'Overwrite existing configuration')
    .action(handleInitCommand);

  // Team command
  program
    .command('team')
    .description('Run AI team execution')
    .argument('<team-type>', 'Team type (standard, tdd, frontend, smart-contract)')
    .argument('<spec-or-issue>', 'Path to specification file or GitHub issue URL')
    .option('-r, --max-reviews <number>', 'Maximum number of review iterations', '3')
    .option('-b, --branch-name <name>', 'Custom branch name for the feature')
    .option('--no-cleanup', 'Skip cleanup of worktree and task state after completion')
    .action(handleTeamCommand);

  // Test command
  program.command('test').description('Test command that outputs ping').action(handleTestCommand);

  try {
    await program.parseAsync(argv);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    console.error('');
    console.error('💡 Use --help for usage information');
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

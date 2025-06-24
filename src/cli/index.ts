#!/usr/bin/env node

/**
 * CLI entry point for Claude Codex multi-team workflow
 */

import { Command } from 'commander';
import { handleTDDCommand } from './commands/tdd.js';
import { handleInitCommand } from './commands/init.js';
import { handleTeamCommand } from './commands/team.js';

// Version from package.json
const version = '0.4.0';

/**
 * Main CLI entry point
 */
export async function runCLI(argv: string[] = process.argv): Promise<void> {
  const program = new Command();

  program
    .name('claude-codex')
    .description('Claude Codex - Multi-team AI workflow automation')
    .version(version);

  // Init command
  program
    .command('init')
    .description('Initialize Claude Codex configuration and teams')
    .option('--force', 'Overwrite existing configuration')
    .action(handleInitCommand);

  // TDD command (deprecated)
  program
    .command('tdd')
    .description('🚨 DEPRECATED: Run TDD workflow (use "team tdd" instead)')
    .argument('<spec-path>', 'Path to specification file or GitHub issue URL')
    .option('-r, --max-reviews <number>', 'Maximum number of review iterations', '3')
    .option('-b, --branch-name <name>', 'Custom branch name for the feature')
    .option('--no-cleanup', 'Skip cleanup of worktree and task state after completion')
    .action(handleTDDCommand);

  // Team command (new multi-team system)
  program
    .command('team')
    .description('Run multi-team workflow')
    .argument('<team-type>', 'Team type (standard, tdd, frontend, smart-contract)')
    .argument('<spec-or-issue>', 'Path to specification file or GitHub issue URL')
    .option('-r, --max-reviews <number>', 'Maximum number of review iterations', '3')
    .option('-b, --branch-name <name>', 'Custom branch name for the feature')
    .option('--no-cleanup', 'Skip cleanup of worktree and task state after completion')
    .action(handleTeamCommand);

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

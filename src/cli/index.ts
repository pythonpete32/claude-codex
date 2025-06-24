#!/usr/bin/env node

/**
 * CLI entry point for Claude Codex AI team automation
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { handleInitCommand } from '~/cli/commands/init.js';
import { handleTeamCommand } from '~/cli/commands/team.js';

// Get version from package.json
function getVersion(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Try multiple possible paths for package.json
  const possiblePaths = [
    join(__dirname, '..', '..', 'package.json'), // From src/cli/
    join(__dirname, '..', 'package.json'), // From dist/
    join(process.cwd(), 'package.json'), // From project root
  ];

  const errors: string[] = [];

  for (const path of possiblePaths) {
    try {
      const packageJson = JSON.parse(readFileSync(path, 'utf-8'));
      if (!packageJson.version) {
        throw new Error(`package.json at ${path} is missing version field`);
      }
      return packageJson.version;
    } catch (error) {
      errors.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(
    `Failed to find package.json or read version. Tried paths:\n${errors.map((e) => `  - ${e}`).join('\n')}`
  );
}

const version = getVersion();

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

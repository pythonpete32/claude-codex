#!/usr/bin/env node

/**
 * CLI entry point for Claude Codex TDD workflow
 */

import { displayHelp, displayVersion, parseArgs, validateArgs } from './args.js';
import { handleTDDCommand } from './commands/tdd.js';

/**
 * Main CLI entry point
 */
export async function runCLI(argv: string[] = process.argv): Promise<void> {
  try {
    // Parse command line arguments
    const args = parseArgs(argv);

    // Handle help and version first
    if (args.help) {
      displayHelp();
      return;
    }

    if (args.version) {
      displayVersion();
      return;
    }

    // Validate arguments
    validateArgs(args);

    // Route to appropriate command handler
    switch (args.command) {
      case 'tdd':
        if (!args.tdd) {
          throw new Error('TDD command arguments missing');
        }
        await handleTDDCommand(args.tdd);
        break;

      default:
        throw new Error('No command specified. Use --help for usage information.');
    }
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

#!/usr/bin/env node

/**
 * Claude Codex CLI Entry Point
 * Provides both TDD workflow automation and direct Claude interaction
 */

import { logError, logInfo } from '../core/messaging.js';
import { parseArgs, showHelp, showVersion, validateArgs } from './args.js';
import { handleTDDCommand } from './commands/tdd.js';

/**
 * Main CLI entry point
 */
export async function main(): Promise<void> {
  try {
    // Get command line arguments (excluding node and script path)
    const rawArgs = process.argv.slice(2);

    // Handle empty arguments
    if (rawArgs.length === 0) {
      console.log(showHelp());
      process.exit(0);
    }

    // Parse command line arguments
    const args = parseArgs(rawArgs);

    // Handle global flags first
    if (args.help) {
      console.log(showHelp());
      process.exit(0);
    }

    if (args.version) {
      console.log(showVersion());
      process.exit(0);
    }

    // Validate parsed arguments
    validateArgs(args);

    // Route to appropriate command handler
    switch (args.command) {
      case 'tdd': {
        if (!args.tdd) {
          throw new Error('Internal error: TDD command missing arguments');
        }
        await handleTDDCommand(args.tdd);
        break;
      }

      default: {
        // Handle direct Claude interaction mode (existing behavior)
        if (args.directMode && args.prompt) {
          logInfo('Direct Claude interaction mode is not implemented yet.');
          logInfo('Use the TDD command: claude-codex tdd <spec-file>');
          process.exit(1);
        } else {
          // Unknown command or invalid usage
          logError('Unknown command or invalid usage.');
          console.log(`\n${showHelp()}`);
          process.exit(1);
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`CLI Error: ${errorMessage}`);

    // Show brief help for argument-related errors
    if (errorMessage.includes('requires') || errorMessage.includes('Unknown')) {
      console.log('\nUse --help for usage information.');
    }

    process.exit(1);
  }
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  logInfo('\n👋 Interrupted by user. Exiting...');
  process.exit(130); // Standard exit code for SIGINT
});

process.on('SIGTERM', () => {
  logInfo('\n👋 Terminated. Exiting...');
  process.exit(143); // Standard exit code for SIGTERM
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, _promise) => {
  logError('Unhandled promise rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError('Uncaught exception:', error.message);
  process.exit(1);
});

// Run the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

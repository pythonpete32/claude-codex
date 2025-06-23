#!/usr/bin/env node

import { parseArgs, printHelp, printVersion } from './cli/args.js';
import { handleTDDCommand } from './cli/commands/tdd.js';

async function main(): Promise<void> {
  try {
    const args = parseArgs(process.argv);

    // Handle help flag
    if (args.help) {
      printHelp();
      return;
    }

    // Handle version flag
    if (args.version) {
      printVersion();
      return;
    }

    // Handle commands
    if (args.command === 'tdd') {
      if (!args.tdd) {
        console.error('❌ Error: TDD command requires arguments');
        printHelp();
        process.exit(1);
      }
      await handleTDDCommand(args.tdd);
      return;
    }

    // No command specified, show help
    if (process.argv.length === 2) {
      printHelp();
      return;
    }

    // Unknown command
    console.error('❌ Error: Unknown command or arguments');
    printHelp();
    process.exit(1);
  } catch (error) {
    console.error('\n💥 Fatal error:');
    console.error(`   ${error}`);

    if (error instanceof Error && error.stack) {
      console.error('\n📊 Stack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught exception:');
  console.error(`   ${error.message}`);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('\n💥 Unhandled promise rejection:');
  console.error(`   ${reason}`);
  process.exit(1);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n\n🛑 Operation cancelled by user');
  process.exit(0);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('\n\n🛑 Operation terminated');
  process.exit(0);
});

// Run main function
main().catch((error) => {
  console.error('\n💥 Main function failed:');
  console.error(`   ${error}`);
  process.exit(1);
});

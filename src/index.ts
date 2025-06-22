#!/usr/bin/env node

import { parseArgs } from './cli/args.js';
import { runClaudeWithSDK } from './core/query.js';
import { colors } from './core/messaging.js';

// Main execution
(async () => {
  try {
    const options = parseArgs();
    await runClaudeWithSDK(options);
  } catch (error) {
    console.error(colors.red('Fatal error:'), error);
    process.exit(1);
  }
})();

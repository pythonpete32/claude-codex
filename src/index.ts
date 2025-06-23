#!/usr/bin/env node

/**
 * Claude Codex TDD CLI - Main entry point
 */

import { runCLI } from './cli/index.js';

// Run CLI if this file is executed directly
runCLI().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});

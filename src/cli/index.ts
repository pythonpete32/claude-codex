#!/usr/bin/env node

export { colors } from '../core/messaging.js';

// Re-export main functionality for CLI usage
export { runClaudeWithSDK } from '../core/query.js';
// CLI entry point for claude-codex
export * from './args.js';

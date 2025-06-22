#!/usr/bin/env node

// CLI entry point for claude-codex
export * from './args.js';

// Re-export main functionality for CLI usage
export { runClaudeWithSDK } from '../core/query.js';
export { colors } from '../core/messaging.js';
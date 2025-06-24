/**
 * Init command handler for Claude Codex CLI
 */

import { initializeClaudeCodex } from '../../core/initialization.js';

export interface InitOptions {
  force?: boolean;
}

/**
 * Handle the init command
 */
export async function handleInitCommand(options: InitOptions = {}): Promise<void> {
  try {
    console.log('🚀 Initializing Claude Codex...');

    await initializeClaudeCodex({
      force: options.force || false,
    });

    console.log('✅ Claude Codex initialized successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Edit ~/.claude/.codex.config.json to configure your teams');
    console.log('  2. Customize team files in ~/.claude/teams/');
    console.log('  3. Run "claude-codex team <team-type> <spec-or-issue>" to start a workflow');
  } catch (error) {
    console.error(
      '❌ Initialization failed:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

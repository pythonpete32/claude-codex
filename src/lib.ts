import pc from 'picocolors';

/**
 * Ensure we're using subscription authentication by removing API keys
 */
export function forceSubscriptionAuth(): void {
  const apiKeyVars = ['ANTHROPIC_API_KEY', 'CLAUDE_API_KEY', 'ANTHROPIC_KEY', 'CLAUDE_KEY'];

  let removed = false;
  for (const varName of apiKeyVars) {
    if (process.env[varName]) {
      console.log(`${pc.yellow('→')} Removing ${varName} from environment`);
      delete process.env[varName];
      removed = true;
    }
  }

  // Set flag to indicate subscription mode
  process.env.CLAUDE_USE_SUBSCRIPTION = 'true';

  if (removed) {
    console.log(`${pc.green('✓')} Environment cleaned for subscription auth\n`);
  }
}

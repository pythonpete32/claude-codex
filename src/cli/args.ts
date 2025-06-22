import { colors } from '../core/messaging.js';

export interface ClaudeMaxOptions {
  prompt: string;
  maxTurns?: number;
  outputFormat?: 'text' | 'json' | 'stream-json';
  verbose?: boolean;
  cwd?: string;
  allowedTools?: string[];
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan';
}

/**
 * Parse command line arguments
 */
export function parseArgs(): ClaudeMaxOptions {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(colors.bright('Claude Code SDK - Max Subscription') + '\n');
    console.log('Usage:');
    console.log('  npx tsx claude-sdk-max.ts "Your prompt here" [options]\n');
    console.log('Options:');
    console.log('  --max-turns <n>      Maximum conversation turns (default: 1)');
    console.log('  --output-format      Output format: text, json, stream-json (default: text)');
    console.log('  --verbose            Show detailed information');
    console.log('  --debug              Show debug information for all messages');
    console.log('  --cwd <path>         Working directory for Claude');
    console.log('  --allowed-tools      Comma-separated list of allowed tools');
    console.log(
      '  --permission-mode    Permission mode: default, acceptEdits, bypassPermissions, plan'
    );
    console.log('  --help, -h           Show this help message\n');
    console.log('Examples:');
    console.log('  npx tsx claude-sdk-max.ts "Write a fibonacci function"');
    console.log('  npx tsx claude-sdk-max.ts "Fix the bug in app.js" --max-turns 3');
    console.log('  npx tsx claude-sdk-max.ts "Refactor this code" --allowed-tools Read,Write');
    console.log('  npx tsx claude-sdk-max.ts "testing" --debug');
    process.exit(0);
  }

  const options: ClaudeMaxOptions = {
    prompt: args[0],
    maxTurns: 1,
    outputFormat: 'text',
    verbose: false,
  };

  // Parse additional arguments
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--max-turns':
        options.maxTurns = Number.parseInt(args[++i], 10) || 1;
        break;
      case '--output-format':
        options.outputFormat = (args[++i] as any) || 'text';
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--debug':
        process.env.DEBUG = 'true';
        options.verbose = true;
        break;
      case '--cwd':
        options.cwd = args[++i];
        break;
      case '--allowed-tools':
        options.allowedTools = args[++i].split(',');
        break;
      case '--permission-mode': {
        const mode = args[++i];
        if (mode === 'auto' || mode === 'manual') {
          options.permissionMode = 'default';
        } else {
          options.permissionMode = mode as any;
        }
        break;
      }
    }
  }

  return options;
}

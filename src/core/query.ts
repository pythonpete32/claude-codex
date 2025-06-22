import { query, type SDKMessage } from '@anthropic-ai/claude-code';
import { writeFile } from 'fs/promises';
import { forceSubscriptionAuth } from './auth.js';
import { colors, formatMessage } from './messaging.js';

export interface ClaudeQueryOptions {
  prompt: string;
  maxTurns?: number;
  outputFormat?: 'text' | 'json' | 'stream-json';
  verbose?: boolean;
  cwd?: string;
  allowedTools?: string[];
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan';
}

/**
 * Run Claude Code using the SDK with Max subscription
 */
export async function runClaudeWithSDK(options: ClaudeQueryOptions): Promise<void> {
  console.log(colors.cyan(colors.bright('Claude Code SDK - Max Subscription Mode')));
  console.log(colors.dim('Using the official @anthropic-ai/claude-code SDK') + '\n');

  // Force subscription authentication
  forceSubscriptionAuth();

  const abortController = new AbortController();

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n' + colors.yellow('Aborting...'));
    abortController.abort();
    process.exit(0);
  });

  console.log(colors.bright('Prompt:') + ` ${options.prompt}\n`);
  console.log(colors.bright('─'.repeat(60)) + '\n');

  const messages: SDKMessage[] = [];
  let hasError = false;

  try {
    // Query Claude using the SDK
    const queryOptions = {
      prompt: options.prompt,
      abortController,
      options: {
        maxTurns: options.maxTurns || 1,
        cwd: options.cwd || process.cwd(),
        ...(options.allowedTools && { allowedTools: options.allowedTools }),
        ...(options.permissionMode && {
          permissionMode: options.permissionMode,
        }),
      },
    };

    let messageCount = 0;

    // Stream messages from Claude
    for await (const message of query(queryOptions)) {
      messageCount++;
      messages.push(message);

      // Display message in real-time
      if (options.outputFormat === 'json' || options.outputFormat === 'stream-json') {
        console.log(JSON.stringify(message, null, 2));
      } else {
        const formatted = formatMessage(message);
        if (formatted.trim()) {
          // Only print if there's content
          console.log(formatted);
        }
      }

      // Check for errors in result messages
      if (message.type === 'result' && message.is_error) {
        hasError = true;
        console.error('\n' + colors.red('Execution Error Detected'));
        console.error(`Error type: ${message.subtype}`);
      }
    }

    // If we got messages but no visible content, show raw messages
    if (
      messageCount > 0 &&
      messages.every((m) => {
        if (m.type === 'assistant' || m.type === 'user') {
          return !m.message.content;
        }
        if (m.type === 'result' && m.subtype === 'success') {
          return !('result' in m) || !m.result;
        }
        return false;
      })
    ) {
      console.log(
        '\n' + colors.yellow(`Note: Received ${messageCount} messages but no visible content.`)
      );
      console.log('Try running with --debug flag to see raw messages.');
    }

    // Summary if verbose mode
    if (options.verbose && messages.length > 0) {
      console.log('\n' + colors.bright('─'.repeat(60)));
      console.log(colors.green('Summary:'));
      console.log(`- Total messages: ${messages.length}`);

      const messageTypes = messages.reduce(
        (acc, msg) => {
          acc[msg.type] = (acc[msg.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      Object.entries(messageTypes).forEach(([type, count]) => {
        console.log(`- ${type}: ${count}`);
      });
    }

    // Save conversation if requested
    if (options.outputFormat === 'json' && !hasError) {
      const outputFile = `claude-conversation-${Date.now()}.json`;
      await writeFile(outputFile, JSON.stringify(messages, null, 2));
      console.log('\n' + colors.green('✓') + ` Conversation saved to: ${outputFile}`);
    }
  } catch (error) {
    console.error('\n' + colors.red('SDK Error:'), error);

    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        console.error('\nClaude Code might not be installed. Install it with:');
        console.error('  npm install -g @anthropic-ai/claude-code');
      } else if (
        error.message.includes('authentication') ||
        error.message.includes('unauthorized')
      ) {
        console.error('\nAuthentication failed. Make sure you:');
        console.error('1. Have an active Max subscription');
        console.error('2. Have logged in via "claude" command');
        console.error("3. Haven't hit rate limits");
      }
    }

    process.exit(1);
  }
}

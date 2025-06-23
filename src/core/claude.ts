import {
  query,
  type SDKAssistantMessage,
  type SDKMessage,
  type SDKResultMessage,
} from '@anthropic-ai/claude-code';
import { forceSubscriptionAuth } from '../lib.js';
import { AgentExecutionError } from '../shared/errors.js';
import type { AgentOptions, AgentResult } from '../shared/types.js';

/**
 * Execute a Claude agent using the Claude Code SDK with subscription authentication
 */
export async function runAgent(options: AgentOptions): Promise<AgentResult> {
  // CRITICAL: Force subscription auth to prevent API key usage
  forceSubscriptionAuth();

  const startTime = Date.now();
  let finalResponse = '';
  const messages: SDKMessage[] = [];
  let cost = 0;
  let success = false;

  try {
    // Execute Claude query with streaming
    for await (const message of query({
      prompt: options.prompt,
      abortController: options.abortController,
      options: {
        maxTurns: options.maxTurns || 1,
        cwd: options.cwd,
      },
    })) {
      messages.push(message);

      // Extract final response from assistant messages
      if (message.type === 'assistant') {
        const assistantMessage = message as SDKAssistantMessage;
        const messageContent = assistantMessage.message.content;

        if (typeof messageContent === 'string') {
          finalResponse = messageContent;
        } else if (Array.isArray(messageContent)) {
          // Handle complex content structure
          const textBlocks: string[] = [];
          for (const block of messageContent) {
            if (block && typeof block === 'object' && 'type' in block) {
              if (block.type === 'text' && 'text' in block && typeof block.text === 'string') {
                textBlocks.push(block.text);
              }
            }
          }
          finalResponse = textBlocks.join('');
        }
      }

      // Extract cost and success from result messages
      if (message.type === 'result') {
        const resultMessage = message as SDKResultMessage;
        cost = resultMessage.total_cost_usd;
        success = !resultMessage.is_error;
      }
    }

    // If no result message was received, assume success
    if (cost === 0) {
      success = true;
    }
  } catch (error) {
    throw new AgentExecutionError(
      error instanceof Error ? error.message : 'Unknown error during agent execution',
      error instanceof Error ? error : undefined
    );
  }

  const duration = Date.now() - startTime;

  return {
    messages,
    finalResponse,
    success,
    cost,
    duration,
  };
}

/**
 * Extract text content from Claude SDK message
 */
export function extractMessageText(message: SDKMessage): string {
  // Only assistant messages have content we can extract
  if (message.type !== 'assistant') {
    return '';
  }

  const assistantMessage = message as SDKAssistantMessage;
  const content = assistantMessage.message.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    const textBlocks: string[] = [];
    for (const block of content) {
      if (block && typeof block === 'object' && 'type' in block) {
        if (block.type === 'text' && 'text' in block && typeof block.text === 'string') {
          textBlocks.push(block.text);
        }
      }
    }
    return textBlocks.join('');
  }

  return String(content || '');
}

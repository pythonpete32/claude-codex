// Import Claude Code SDK
import { runClaudeWithCode } from '@anthropic-ai/claude-code';
import { forceSubscriptionAuth } from '../lib.js';
import { AgentExecutionError } from '../shared/errors.js';
import type { AgentResult, ClaudeMaxOptions, SDKMessage, SDKResult } from '../shared/types.js';

export async function runAgent(options: ClaudeMaxOptions): Promise<AgentResult> {
  try {
    // Ensure subscription authentication
    forceSubscriptionAuth();

    // Default options
    const claudeOptions = {
      prompt: options.prompt,
      cwd: options.cwd || process.cwd(),
      maxTurns: options.maxTurns || 5,
    };

    // Call Claude Code SDK
    const result = await runClaudeWithCode(claudeOptions);

    // Extract final response from the conversation
    const finalResponse = extractFinalResponse(result.messages);

    return {
      finalResponse,
      messages: result.messages,
    };
  } catch (error) {
    throw new AgentExecutionError(`Claude SDK execution failed: ${error}`, error as Error);
  }
}

function extractFinalResponse(messages: SDKMessage[]): string {
  // Find the last assistant message
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role === 'assistant') {
      // Handle both string and complex content structures
      if (typeof message.content === 'string') {
        return message.content;
      }
      if (Array.isArray(message.content)) {
        // Extract text from complex content array
        const textParts: string[] = [];
        for (const part of message.content) {
          if (typeof part === 'object' && part.type === 'text' && 'text' in part) {
            textParts.push(part.text as string);
          }
        }
        if (textParts.length > 0) {
          return textParts.join('\n');
        }
      }
    }
  }

  throw new AgentExecutionError('No assistant response found in Claude SDK result');
}

// Legacy wrapper for backward compatibility
export async function runClaudeWithSDK(options: ClaudeMaxOptions): Promise<SDKResult> {
  const result = await runAgent(options);
  return {
    messages: result.messages,
  };
}

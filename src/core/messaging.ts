import pc from 'picocolors';
import type { SDKMessage } from '@anthropic-ai/claude-code';

// Helper function to extract content from message content
export function extractContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((block: any) =>
        typeof block === 'string' ? block : block.type === 'text' ? block.text : `[${block.type}]`
      )
      .join('');
  }
  return '';
}

// Color utilities using picocolors
export const colors = {
  reset: (text: string) => text,
  bright: pc.bold,
  dim: pc.dim,
  green: pc.green,
  yellow: pc.yellow,
  red: pc.red,
  cyan: pc.cyan,
  magenta: pc.magenta,
};

/**
 * Format message based on type and content
 */
export function formatMessage(message: SDKMessage): string {
  const timestamp = new Date().toLocaleTimeString();
  let output = '';

  // Debug: Show all message properties in verbose mode
  if (process.env.DEBUG === 'true') {
    console.log(colors.dim('[DEBUG] Message:'), JSON.stringify(message, null, 2));
  }

  switch (message.type) {
    case 'assistant':
      output += colors.cyan(`[${timestamp}] Assistant:`) + '\n';
      // SDKAssistantMessage has a message property of type APIAssistantMessage
      if (message.message.content) {
        output += extractContent(message.message.content);
      }
      break;

    case 'user':
      output += colors.magenta(`[${timestamp}] User:`) + '\n';
      // SDKUserMessage has a message property of type APIUserMessage
      if (message.message.content) {
        output += extractContent(message.message.content);
      }
      break;

    case 'system':
      output += colors.yellow(`[${timestamp}] System:`);
      // SDKSystemMessage has specific properties but no content
      output += ` Session initialized (${message.model}, ${message.permissionMode})`;
      if (message.tools && message.tools.length > 0) {
        output += `\n${colors.dim(`Tools: ${message.tools.join(', ')}`)}`;
      }
      output += '\n';
      break;

    case 'result':
      output += colors.green(`[${timestamp}] Result:`);
      if (message.subtype === 'success' && 'result' in message) {
        output += `\n${message.result}`;
      } else {
        output += ` ${message.subtype} (${message.duration_ms}ms, ${message.num_turns} turns)`;
      }
      output += '\n';
      break;

    default: {
      // This should never happen with proper SDKMessage types, but just in case
      const _exhaustive: never = message;
      output += colors.yellow(`[${timestamp}] Unknown:`);
      output += `\n${colors.dim(JSON.stringify(_exhaustive, null, 2))}`;
      output += '\n';
    }
  }

  return output;
}

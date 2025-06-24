import type {
  SDKAssistantMessage,
  SDKMessage,
  SDKResultMessage,
  SDKSystemMessage,
  SDKUserMessage,
} from '@anthropic-ai/claude-code';

import {
  type ComponentDisplayOptions,
  formatMessage,
} from '~/messaging/ui/formatters/MessageFormatter.js';

/**
 * Enhanced display options supporting both legacy and component-based rendering
 */
export interface DisplayOptions extends ComponentDisplayOptions {
  showToolCalls?: boolean;
  showTimestamps?: boolean;
  verbose?: boolean;
  // New component options inherited from ComponentDisplayOptions
}

/**
 * Process messages in real-time as they arrive from the AsyncGenerator
 *
 * This function:
 * - Iterates through messages as Claude generates them
 * - Displays each message immediately for real-time feedback
 * - Collects and returns all messages for final processing
 * - Handles all SDK message types appropriately
 */
export async function processMessagesWithDisplay(
  messageIterator: AsyncGenerator<SDKMessage>,
  options: DisplayOptions = {}
): Promise<SDKMessage[]> {
  const messages: SDKMessage[] = [];
  let messageIndex = 0;

  try {
    for await (const message of messageIterator) {
      messages.push(message);

      // Display message in real-time
      const formattedMessage = formatMessageForDisplay(message, messageIndex, options);
      if (formattedMessage) {
        console.log(formattedMessage);
      }

      messageIndex++;
    }
  } catch (error) {
    console.error('Error processing messages:', error);
    throw error;
  }

  return messages;
}

/**
 * Enhanced message formatter supporting both legacy and component-based display
 *
 * Handles:
 * - Assistant messages (text content and tool calls)
 * - User messages (tool results)
 * - System messages (initialization info)
 * - Result messages (execution summary)
 *
 * Uses new component-based UI by default, with fallback to legacy formatting
 */
export function formatMessageForDisplay(
  message: SDKMessage,
  index: number,
  options: DisplayOptions = {}
): string | null {
  // Use component-based formatting by default
  if (options.useComponents !== false) {
    const componentFormatted = formatMessage(message, options);
    if (componentFormatted) {
      return componentFormatted;
    }
  }

  // Fallback to legacy formatting
  const timestamp = options.showTimestamps ? `[${new Date().toISOString()}] ` : '';
  const prefix = `${timestamp}${index + 1}. `;

  switch (message.type) {
    case 'assistant': {
      const assistantMsg = message as SDKAssistantMessage;
      return formatAssistantMessage(assistantMsg, prefix, options);
    }

    case 'user': {
      const userMsg = message as SDKUserMessage;
      return formatUserMessage(userMsg, prefix, options);
    }

    case 'system': {
      const systemMsg = message as SDKSystemMessage;
      return formatSystemMessage(systemMsg, prefix, options);
    }

    case 'result': {
      return formatResultMessage(message, prefix, options);
    }

    default:
      // Handle any unknown message types
      if (options.verbose) {
        return `${prefix}Unknown message type: ${JSON.stringify(message, null, 2)}`;
      }
      return null;
  }
}

/**
 * Format assistant messages - contains Claude's responses and tool calls
 */
function formatAssistantMessage(
  message: SDKAssistantMessage,
  prefix: string,
  options: DisplayOptions
): string | null {
  const content = message.message.content;

  if (typeof content === 'string') {
    return `${prefix}🤖 Assistant: ${content}`;
  }

  if (Array.isArray(content)) {
    const parts: string[] = [];

    for (const block of content) {
      if (block && typeof block === 'object' && 'type' in block) {
        if (block.type === 'text' && 'text' in block) {
          parts.push(`📝 Text: ${block.text}`);
        } else if (block.type === 'tool_use' && options.showToolCalls !== false) {
          parts.push(formatToolCall(block));
        }
      }
    }

    if (parts.length > 0) {
      return `${prefix}🤖 Assistant:\n${parts.map((p) => `   ${p}`).join('\n')}`;
    }
  }

  return options.verbose ? `${prefix}🤖 Assistant: ${JSON.stringify(content)}` : null;
}

/**
 * Format user messages - contains tool results
 */
function formatUserMessage(
  message: SDKUserMessage,
  prefix: string,
  options: DisplayOptions
): string | null {
  const content = message.message.content;

  if (typeof content === 'string') {
    return `${prefix}👤 User: ${content}`;
  }

  if (Array.isArray(content)) {
    const parts: string[] = [];

    for (const block of content) {
      if (block && typeof block === 'object' && 'type' in block) {
        if (block.type === 'tool_result' && 'content' in block) {
          parts.push(
            `🔧 Tool Result: ${String(block.content).substring(0, 200)}${String(block.content).length > 200 ? '...' : ''}`
          );
        } else if (block.type === 'text' && 'text' in block) {
          parts.push(`📝 Text: ${block.text}`);
        }
      }
    }

    if (parts.length > 0) {
      return `${prefix}👤 User:\n${parts.map((p) => `   ${p}`).join('\n')}`;
    }
  }

  return options.verbose ? `${prefix}👤 User: ${JSON.stringify(content)}` : null;
}

/**
 * Format system messages - initialization and setup info
 */
function formatSystemMessage(
  message: SDKSystemMessage,
  prefix: string,
  options: DisplayOptions
): string | null {
  if (options.verbose) {
    return `${prefix}⚙️  System: ${message.subtype} (${message.tools.length} tools available)`;
  }
  return null; // Don't show system messages by default
}

/**
 * Format result messages - execution summary
 */
function formatResultMessage(
  message: SDKMessage,
  prefix: string,
  _options: DisplayOptions
): string | null {
  if (message.type === 'result') {
    const resultMsg = message as SDKResultMessage;
    const status = resultMsg.is_error ? '❌ Failed' : '✅ Success';
    const duration = `${resultMsg.duration_ms}ms`;
    const cost = `$${resultMsg.total_cost_usd.toFixed(4)}`;

    return `${prefix}📊 Result: ${status} | Duration: ${duration} | Cost: ${cost}`;
  }
  return null;
}

/**
 * Format tool calls for display
 */
function formatToolCall(toolBlock: unknown): string {
  // Type guard to ensure toolBlock is an object with expected properties
  if (!toolBlock || typeof toolBlock !== 'object') {
    return '🔧 Tool Call: [Invalid tool block]';
  }

  const tool = toolBlock as Record<string, unknown>;
  const toolName = (tool.name as string) || 'Unknown';
  const toolId = (tool.id as string) || '';

  // Show tool input in a readable format
  let inputPreview = '';
  if (tool.input && typeof tool.input === 'object') {
    // Show first few key-value pairs
    const inputObj = tool.input as Record<string, unknown>;
    const keys = Object.keys(inputObj).slice(0, 3);
    inputPreview = keys
      .map((key) => {
        const value = String(inputObj[key]);
        const truncated = value.length > 50 ? `${value.substring(0, 50)}...` : value;
        return `${key}: ${truncated}`;
      })
      .join(', ');
  }

  return `🔧 Tool Call: ${toolName}(${inputPreview}) [${toolId}]`;
}

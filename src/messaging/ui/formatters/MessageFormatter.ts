import type {
  SDKAssistantMessage,
  SDKMessage,
  SDKResultMessage,
  SDKSystemMessage,
  SDKUserMessage,
} from '@anthropic-ai/claude-code';

import { displayAssistantMessage } from '~/messaging/ui/components/MessageCard.js';
import { displayToolResultSummary } from '~/messaging/ui/components/ResultSummary.js';
import { displaySessionSummary } from '~/messaging/ui/components/SessionSummary.js';
import { displayTodoTable } from '~/messaging/ui/components/TodoTable.js';
import { displayToolCallCard } from '~/messaging/ui/components/ToolCallCard.js';

/**
 * Enhanced display options for component-based rendering
 */
export interface ComponentDisplayOptions {
  showToolCalls?: boolean;
  showTimestamps?: boolean;
  verbose?: boolean;
  useComponents?: boolean; // Enable/disable new UI
  terminalWidth?: number; // Override terminal detection
  compact?: boolean; // Compact vs full component display
}

/**
 * Tool use block interface matching Claude SDK types
 */
interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Text block interface matching Claude SDK types
 */
interface TextBlock {
  type: 'text';
  text: string;
}

/**
 * Tool result block interface matching Claude SDK types
 */
interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string | Record<string, unknown>[];
  is_error?: boolean;
}

/**
 * Enhanced message formatter using component-based UI system
 *
 * Replaces simple text formatting with rich, bordered components
 * that provide better visual hierarchy and information density.
 */
export function formatMessage(
  message: SDKMessage,
  options: ComponentDisplayOptions = {}
): string | null {
  // Early return if components disabled
  if (options.useComponents === false) {
    return null;
  }

  switch (message.type) {
    case 'assistant':
      return formatAssistantMessage(message as SDKAssistantMessage, options);
    case 'user':
      return formatUserMessage(message as SDKUserMessage, options);
    case 'system':
      return formatSystemMessage(message as SDKSystemMessage, options);
    case 'result':
      return formatResultMessage(message as SDKResultMessage, options);
    default:
      return options.verbose ? `Unknown message type: ${JSON.stringify(message, null, 2)}` : null;
  }
}

/**
 * Format assistant messages with components
 */
function formatAssistantMessage(
  message: SDKAssistantMessage,
  options: ComponentDisplayOptions
): string | null {
  const content = message.message.content;
  const parts: string[] = [];

  if (typeof content === 'string') {
    const formatted = displayAssistantMessage(content);
    if (formatted) parts.push(formatted);
  } else if (Array.isArray(content)) {
    for (const block of content) {
      if (block && typeof block === 'object' && 'type' in block) {
        if (block.type === 'text' && 'text' in block) {
          const textBlock = block as TextBlock;
          const formatted = displayAssistantMessage(textBlock.text);
          if (formatted) parts.push(formatted);
        } else if (block.type === 'tool_use' && options.showToolCalls !== false) {
          const toolBlock = block as ToolUseBlock;

          // Special handling for TodoWrite/TodoRead - display table instead of card
          if (
            (toolBlock.name === 'TodoWrite' || toolBlock.name === 'TodoRead') &&
            toolBlock.input.todos &&
            Array.isArray(toolBlock.input.todos)
          ) {
            const formatted = displayTodoTable(toolBlock.input.todos);
            if (formatted) parts.push(formatted);
          } else {
            const formatted = displayToolCallCard(toolBlock);
            if (formatted) parts.push(formatted);
          }
        }
      }
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : null;
}

/**
 * Format user messages with components
 */
function formatUserMessage(
  message: SDKUserMessage,
  _options: ComponentDisplayOptions
): string | null {
  const content = message.message.content;
  const parts: string[] = [];

  if (typeof content === 'string') {
    const formatted = displayAssistantMessage(content);
    if (formatted) parts.push(formatted);
  } else if (Array.isArray(content)) {
    for (const block of content) {
      if (block && typeof block === 'object' && 'type' in block) {
        if (block.type === 'tool_result' && 'content' in block) {
          const resultBlock = block as ToolResultBlock;
          const formatted = displayToolResultSummary(resultBlock);
          if (formatted) parts.push(formatted);
        } else if (block.type === 'text' && 'text' in block) {
          const textBlock = block as TextBlock;
          const formatted = displayAssistantMessage(textBlock.text);
          if (formatted) parts.push(formatted);
        }
      }
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : null;
}

/**
 * Format system messages with components
 */
function formatSystemMessage(
  message: SDKSystemMessage,
  options: ComponentDisplayOptions
): string | null {
  if (options.verbose) {
    return displaySessionSummary(message);
  }
  return null; // Don't show system messages by default
}

/**
 * Format result messages with components
 */
function formatResultMessage(
  message: SDKResultMessage,
  _options: ComponentDisplayOptions
): string | null {
  return displaySessionSummary(message);
}

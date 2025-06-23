import type { SDKMessage } from '@anthropic-ai/claude-code';
import { type ComponentDisplayOptions, formatMessage } from './MessageFormatter.js';

/**
 * Tool use block interface for tracking
 */
interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Tool result block interface for pairing
 */
interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string | Record<string, unknown>[];
  is_error?: boolean;
}

/**
 * Enhanced message stream renderer with tool tracking
 *
 * Provides real-time component-based rendering of Claude SDK messages
 * with deduplication, tool call pairing, and enhanced result display.
 */
export class ComponentMessageStreamRenderer {
  private processedMessages: Set<string> = new Set();
  private toolCallMap: Map<string, ToolUseBlock> = new Map();
  private options: ComponentDisplayOptions;

  constructor(options: ComponentDisplayOptions = {}) {
    this.options = {
      useComponents: true,
      showToolCalls: true,
      ...options,
    };
  }

  /**
   * Process a single message and return formatted output
   *
   * Handles deduplication and provides enhanced tool result display
   * by pairing tool calls with their results for better context.
   */
  processMessage(message: SDKMessage): string | null {
    const messageKey = this.getMessageKey(message);

    if (this.processedMessages.has(messageKey)) {
      return null;
    }

    this.processedMessages.add(messageKey);

    // Store tool calls for pairing with results
    if (message.type === 'assistant') {
      const toolCalls = this.extractToolCalls(message);
      toolCalls.forEach((call) => {
        this.toolCallMap.set(call.id, call);
      });
    }

    // Enhanced result display with tool context
    if (
      message.type === 'user' &&
      message.message.content &&
      Array.isArray(message.message.content)
    ) {
      const parts: string[] = [];

      for (const block of message.message.content) {
        if (block.type === 'tool_result') {
          const resultBlock = block as ToolResultBlock;
          const toolCall = this.toolCallMap.get(resultBlock.tool_use_id);
          const _toolName = toolCall?.name;

          // Use enhanced result display with tool context
          const formatted = formatMessage(
            {
              type: 'user',
              message: {
                role: 'user',
                content: [resultBlock],
              },
              session_id: message.session_id,
              parent_tool_use_id: null,
            } as SDKUserMessage,
            this.options
          );

          if (formatted) parts.push(formatted);
        }
      }

      return parts.length > 0 ? parts.join('\n\n') : null;
    }

    return formatMessage(message, this.options);
  }

  /**
   * Process message and output to console
   */
  processAndLog(message: SDKMessage): boolean {
    const formatted = this.processMessage(message);
    if (formatted) {
      console.log(formatted);
      return true;
    }
    return false;
  }

  /**
   * Extract tool calls from assistant messages
   */
  private extractToolCalls(message: SDKMessage): ToolUseBlock[] {
    if (message.type !== 'assistant') return [];

    const toolCalls: ToolUseBlock[] = [];
    const content = message.message.content;

    if (Array.isArray(content)) {
      content.forEach((block) => {
        if (block && typeof block === 'object' && 'type' in block && block.type === 'tool_use') {
          toolCalls.push(block as ToolUseBlock);
        }
      });
    }

    return toolCalls;
  }

  /**
   * Reset renderer state for new sessions
   */
  reset(): void {
    this.processedMessages.clear();
    this.toolCallMap.clear();
  }

  /**
   * Update display options
   */
  updateOptions(options: Partial<ComponentDisplayOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Generate unique message key for deduplication
   */
  private getMessageKey(message: SDKMessage): string {
    switch (message.type) {
      case 'system':
        return `system-${message.subtype}-${message.session_id}`;
      case 'assistant':
      case 'user': {
        // Create key from content hash for uniqueness
        const contentStr = JSON.stringify(message.message);
        return `${message.type}-${contentStr.length}-${message.session_id}`;
      }
      case 'result':
        return `result-${message.subtype}-${message.session_id}`;
      default:
        return `unknown-${Date.now()}`;
    }
  }
}

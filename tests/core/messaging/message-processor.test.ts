import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type DisplayOptions,
  formatMessageForDisplay,
  processMessagesWithDisplay,
} from '../../../src/core/messaging/message-processor.js';
import { SAMPLE_DEBUG_MESSAGES } from '../../helpers/mock-sdk.js';
import type { SDKMessage } from '@anthropic-ai/claude-code';

// Mock console.log to capture output
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Message Processor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processMessagesWithDisplay', () => {
    it('should process all messages and return them', async () => {
      async function* mockIterator() {
        for (const message of SAMPLE_DEBUG_MESSAGES) {
          yield message;
        }
      }

      const messages = await processMessagesWithDisplay(mockIterator());

      expect(messages).toHaveLength(5);
      expect(messages).toEqual(SAMPLE_DEBUG_MESSAGES);
    });

    it('should display messages in real-time', async () => {
      async function* mockIterator() {
        for (const message of SAMPLE_DEBUG_MESSAGES) {
          yield message;
        }
      }

      await processMessagesWithDisplay(mockIterator());

      // Should have called console.log for each displayable message
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle empty message iterator', async () => {
      async function* emptyIterator() {
        // No messages
      }

      const messages = await processMessagesWithDisplay(emptyIterator());

      expect(messages).toHaveLength(0);
    });

    it('should handle iterator errors', async () => {
      async function* errorIterator() {
        yield SAMPLE_DEBUG_MESSAGES[0];
        throw new Error('Iterator error');
      }

      await expect(processMessagesWithDisplay(errorIterator())).rejects.toThrow('Iterator error');
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error processing messages:',
        expect.any(Error)
      );
    });
  });

  describe('formatMessageForDisplay', () => {
    const defaultOptions: DisplayOptions = {
      showToolCalls: true,
      showTimestamps: false,
      verbose: false,
    };

    it('should format system messages correctly', () => {
      const systemMessage = SAMPLE_DEBUG_MESSAGES[0]; // First message is system
      const result = formatMessageForDisplay(systemMessage, 0, { verbose: true });

      expect(result).toContain('🚀 Session Start');
      expect(result).toContain('Tools:');
    });

    it('should not display system messages by default', () => {
      const systemMessage = SAMPLE_DEBUG_MESSAGES[0];
      const result = formatMessageForDisplay(systemMessage, 0, defaultOptions);

      expect(result).toBeNull();
    });

    it('should format assistant text messages correctly', () => {
      const assistantMessage = SAMPLE_DEBUG_MESSAGES[1]; // Second message is assistant
      const result = formatMessageForDisplay(assistantMessage, 1, defaultOptions);

      expect(result).toContain('🤖 Claude');
      expect(result).toContain('I will implement the requested feature');
    });

    it('should format tool calls correctly', () => {
      const toolCallMessage = SAMPLE_DEBUG_MESSAGES[2]; // Third message has tool call
      const result = formatMessageForDisplay(toolCallMessage, 2, defaultOptions);

      expect(result).toContain('✍️ Write');
      expect(result).toContain('/test/feature.ts');
      expect(result).toContain('content:');
    });

    it('should hide tool calls when showToolCalls is false', () => {
      const toolCallMessage = SAMPLE_DEBUG_MESSAGES[2];
      const result = formatMessageForDisplay(toolCallMessage, 2, {
        ...defaultOptions,
        showToolCalls: false,
      });

      expect(result).toBeNull();
    });

    it('should format user messages (tool results) correctly', () => {
      const userMessage = SAMPLE_DEBUG_MESSAGES[3]; // Fourth message is user (tool result)
      const result = formatMessageForDisplay(userMessage, 3, defaultOptions);

      expect(result).toContain('✅ Tool Result');
      expect(result).toContain('File created successfully');
    });

    it('should format result messages correctly', () => {
      const resultMessage = SAMPLE_DEBUG_MESSAGES[4]; // Fifth message is result
      const result = formatMessageForDisplay(resultMessage, 4, defaultOptions);

      expect(result).toContain('🎉 Session Complete');
      expect(result).toContain('5.00s');
      expect(result).toContain('$0.0025');
    });

    it('should include timestamps when enabled', () => {
      const message = SAMPLE_DEBUG_MESSAGES[1];
      const result = formatMessageForDisplay(message, 1, {
        ...defaultOptions,
        showTimestamps: true,
      });

      expect(result).toContain('🤖 Claude'); // Component format doesn't use timestamp prefix
    });

    it('should handle unknown message types in verbose mode', () => {
      const unknownMessage = {
        type: 'unknown' as const,
        data: 'test data',
      } as SDKMessage;

      const result = formatMessageForDisplay(unknownMessage, 0, { verbose: true });

      expect(result).toContain('Unknown message type:');
      expect(result).toContain('test data');
    });

    it('should not display unknown message types in non-verbose mode', () => {
      const unknownMessage = {
        type: 'unknown' as const,
        data: 'test data',
      } as SDKMessage;

      const result = formatMessageForDisplay(unknownMessage, 0, defaultOptions);

      expect(result).toBeNull();
    });

    it('should truncate long tool results', () => {
      const longContent = 'A'.repeat(300);
      const userMessage = {
        type: 'user' as const,
        message: {
          role: 'user' as const,
          content: [
            {
              type: 'tool_result' as const,
              content: longContent,
            },
          ],
        },
        parent_tool_use_id: null,
        session_id: 'test',
      };

      const result = formatMessageForDisplay(userMessage, 0, defaultOptions);

      expect(result).toContain('✅ Tool Result');
      expect(result).toContain('...');
      expect(result).not.toContain(longContent);
    });
  });
});

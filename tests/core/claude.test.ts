import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runAgent, runClaudeWithSDK } from '../../src/core/claude.js';
import { AgentExecutionError } from '../../src/shared/errors.js';
import type { ClaudeMaxOptions, SDKMessage } from '../../src/shared/types.js';

// Mock Claude Code SDK
vi.mock('@anthropic-ai/claude-code', () => ({
  runClaudeWithCode: vi.fn(),
}));

// Mock forceSubscriptionAuth
vi.mock('../../src/lib.js', () => ({
  forceSubscriptionAuth: vi.fn(),
}));

const mockRunClaudeWithCode = vi.mocked(
  await import('@anthropic-ai/claude-code')
).runClaudeWithCode;
const mockForceSubscriptionAuth = vi.mocked(await import('../../src/lib.js')).forceSubscriptionAuth;

describe('Claude SDK Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runAgent', () => {
    const mockOptions: ClaudeMaxOptions = {
      prompt: 'Test prompt',
      cwd: '/test/dir',
      maxTurns: 3,
    };

    const mockSDKMessages: SDKMessage[] = [
      {
        role: 'user',
        content: 'Test prompt',
      },
      {
        role: 'assistant',
        content: 'Assistant response',
      },
    ];

    it('should execute Claude SDK and return agent result', async () => {
      mockRunClaudeWithCode.mockResolvedValue({
        messages: mockSDKMessages,
      });

      const result = await runAgent(mockOptions);

      expect(mockForceSubscriptionAuth).toHaveBeenCalled();
      expect(mockRunClaudeWithCode).toHaveBeenCalledWith({
        prompt: 'Test prompt',
        cwd: '/test/dir',
        maxTurns: 3,
      });

      expect(result).toEqual({
        finalResponse: 'Assistant response',
        messages: mockSDKMessages,
      });
    });

    it('should use default options when not provided', async () => {
      const minimalOptions: ClaudeMaxOptions = {
        prompt: 'Test prompt',
      };

      mockRunClaudeWithCode.mockResolvedValue({
        messages: mockSDKMessages,
      });

      await runAgent(minimalOptions);

      expect(mockRunClaudeWithCode).toHaveBeenCalledWith({
        prompt: 'Test prompt',
        cwd: process.cwd(),
        maxTurns: 5, // default
      });
    });

    it('should extract final response from string content', async () => {
      const messagesWithString: SDKMessage[] = [
        { role: 'user', content: 'User message' },
        { role: 'assistant', content: 'First response' },
        { role: 'user', content: 'Follow up' },
        { role: 'assistant', content: 'Final response' },
      ];

      mockRunClaudeWithCode.mockResolvedValue({
        messages: messagesWithString,
      });

      const result = await runAgent(mockOptions);

      expect(result.finalResponse).toBe('Final response');
    });

    it('should extract final response from complex content array', async () => {
      const messagesWithArray: SDKMessage[] = [
        { role: 'user', content: 'User message' },
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'First part' },
            { type: 'text', text: 'Second part' },
          ],
        },
      ];

      mockRunClaudeWithCode.mockResolvedValue({
        messages: messagesWithArray,
      });

      const result = await runAgent(mockOptions);

      expect(result.finalResponse).toBe('First part\nSecond part');
    });

    it('should handle mixed content types in array', async () => {
      const messagesWithMixed: SDKMessage[] = [
        { role: 'user', content: 'User message' },
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Text content' },
            { type: 'image', source: 'image_data' }, // Non-text content should be ignored
            { type: 'text', text: 'More text' },
          ],
        },
      ];

      mockRunClaudeWithCode.mockResolvedValue({
        messages: messagesWithMixed,
      });

      const result = await runAgent(mockOptions);

      expect(result.finalResponse).toBe('Text content\nMore text');
    });

    it('should skip user messages when finding final response', async () => {
      const messagesWithUserLast: SDKMessage[] = [
        { role: 'assistant', content: 'Assistant response' },
        { role: 'user', content: 'User follow-up' },
      ];

      mockRunClaudeWithCode.mockResolvedValue({
        messages: messagesWithUserLast,
      });

      const result = await runAgent(mockOptions);

      expect(result.finalResponse).toBe('Assistant response');
    });

    it('should throw error when no assistant response found', async () => {
      const messagesNoAssistant: SDKMessage[] = [
        { role: 'user', content: 'User message' },
        { role: 'user', content: 'Another user message' },
      ];

      mockRunClaudeWithCode.mockResolvedValue({
        messages: messagesNoAssistant,
      });

      await expect(runAgent(mockOptions)).rejects.toThrow(AgentExecutionError);
      await expect(runAgent(mockOptions)).rejects.toThrow(
        'No assistant response found in Claude SDK result'
      );
    });

    it('should throw error when assistant content is empty array', async () => {
      const messagesEmptyContent: SDKMessage[] = [
        { role: 'user', content: 'User message' },
        { role: 'assistant', content: [] },
      ];

      mockRunClaudeWithCode.mockResolvedValue({
        messages: messagesEmptyContent,
      });

      await expect(runAgent(mockOptions)).rejects.toThrow(AgentExecutionError);
    });

    it('should throw error when assistant content has no text parts', async () => {
      const messagesNoText: SDKMessage[] = [
        { role: 'user', content: 'User message' },
        {
          role: 'assistant',
          content: [
            { type: 'image', source: 'image_data' },
            { type: 'other', data: 'non-text' },
          ],
        },
      ];

      mockRunClaudeWithCode.mockResolvedValue({
        messages: messagesNoText,
      });

      await expect(runAgent(mockOptions)).rejects.toThrow(AgentExecutionError);
    });

    it('should wrap Claude SDK errors in AgentExecutionError', async () => {
      const sdkError = new Error('Claude SDK failed');
      mockRunClaudeWithCode.mockRejectedValue(sdkError);

      await expect(runAgent(mockOptions)).rejects.toThrow(AgentExecutionError);
      await expect(runAgent(mockOptions)).rejects.toThrow(
        'Claude SDK execution failed: Error: Claude SDK failed'
      );
    });

    it('should handle subscription auth failures', async () => {
      const authError = new Error('Subscription required');
      mockForceSubscriptionAuth.mockImplementation(() => {
        throw authError;
      });

      await expect(runAgent(mockOptions)).rejects.toThrow(AgentExecutionError);
    });

    it('should handle string errors from Claude SDK', async () => {
      mockRunClaudeWithCode.mockRejectedValue('String error');

      await expect(runAgent(mockOptions)).rejects.toThrow(AgentExecutionError);
      await expect(runAgent(mockOptions)).rejects.toThrow(
        'Claude SDK execution failed: String error'
      );
    });
  });

  describe('runClaudeWithSDK (legacy compatibility)', () => {
    it('should provide backward compatibility interface', async () => {
      const mockMessages: SDKMessage[] = [
        { role: 'user', content: 'Test' },
        { role: 'assistant', content: 'Response' },
      ];

      mockRunClaudeWithCode.mockResolvedValue({
        messages: mockMessages,
      });

      const options: ClaudeMaxOptions = {
        prompt: 'Test prompt',
      };

      const result = await runClaudeWithSDK(options);

      expect(result).toEqual({
        messages: mockMessages,
      });
    });

    it('should propagate errors from runAgent', async () => {
      mockRunClaudeWithCode.mockRejectedValue(new Error('SDK failed'));

      const options: ClaudeMaxOptions = {
        prompt: 'Test prompt',
      };

      await expect(runClaudeWithSDK(options)).rejects.toThrow(AgentExecutionError);
    });
  });

  describe('edge cases', () => {
    const mockOptions: ClaudeMaxOptions = {
      prompt: 'Test prompt',
      cwd: '/test/dir',
      maxTurns: 3,
    };

    it('should handle empty messages array', async () => {
      mockRunClaudeWithCode.mockResolvedValue({
        messages: [],
      });

      await expect(runAgent(mockOptions)).rejects.toThrow(AgentExecutionError);
    });

    it('should handle undefined content in assistant message', async () => {
      const messagesUndefinedContent: SDKMessage[] = [
        { role: 'user', content: 'User message' },
        { role: 'assistant', content: undefined as unknown as string },
      ];

      mockRunClaudeWithCode.mockResolvedValue({
        messages: messagesUndefinedContent,
      });

      await expect(runAgent(mockOptions)).rejects.toThrow(AgentExecutionError);
    });

    it('should handle malformed text content objects', async () => {
      const messagesMalformed: SDKMessage[] = [
        { role: 'user', content: 'User message' },
        {
          role: 'assistant',
          content: [
            { type: 'text' }, // Missing text property
            { type: 'text', text: 'Valid text' },
          ],
        },
      ];

      mockRunClaudeWithCode.mockResolvedValue({
        messages: messagesMalformed,
      });

      const result = await runAgent(mockOptions);
      expect(result.finalResponse).toBe('Valid text');
    });

    it('should handle very long conversation history', async () => {
      const longConversation: SDKMessage[] = [];

      // Create 100 messages
      for (let i = 0; i < 50; i++) {
        longConversation.push(
          { role: 'user', content: `User message ${i}` },
          { role: 'assistant', content: `Assistant response ${i}` }
        );
      }

      mockRunClaudeWithCode.mockResolvedValue({
        messages: longConversation,
      });

      const result = await runAgent(mockOptions);

      expect(result.finalResponse).toBe('Assistant response 49');
      expect(result.messages).toHaveLength(100);
    });
  });
});

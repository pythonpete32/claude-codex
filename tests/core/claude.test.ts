import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentExecutionError } from '../../src/shared/errors.js';
import type { SDKAssistantMessage, SDKMessage, SDKResultMessage } from '../../src/shared/types.js';

// Mock Claude Code SDK
const mockQuery = vi.fn();
vi.mock('@anthropic-ai/claude-code', () => ({
  query: mockQuery,
}));

// Mock lib.ts
const mockForceSubscriptionAuth = vi.fn();
vi.mock('../../src/lib.js', () => ({
  forceSubscriptionAuth: mockForceSubscriptionAuth,
}));

// Import after mocking
const { runAgent, extractMessageText } = await import('../../src/core/claude.js');

describe('Claude SDK Wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('runAgent', () => {
    it('should call forceSubscriptionAuth before execution', async () => {
      const mockMessages: SDKMessage[] = [
        {
          type: 'assistant',
          message: { content: 'Hello world', role: 'assistant' },
          parent_tool_use_id: null,
          session_id: 'test-session',
        },
      ];

      mockQuery.mockImplementation(async function* () {
        yield* mockMessages;
      });

      await runAgent({ prompt: 'Test prompt' });

      expect(mockForceSubscriptionAuth).toHaveBeenCalledOnce();
      expect(mockForceSubscriptionAuth).toHaveBeenCalledBefore(
        mockQuery as vi.MockedFunction<typeof mockQuery>
      );
    });

    it('should execute Claude query with correct parameters', async () => {
      const mockMessages: SDKMessage[] = [
        {
          type: 'assistant',
          message: { content: 'Response', role: 'assistant' },
          parent_tool_use_id: null,
          session_id: 'test-session',
        },
      ];

      mockQuery.mockImplementation(async function* () {
        yield* mockMessages;
      });

      const options = {
        prompt: 'Test prompt',
        maxTurns: 3,
        cwd: '/test/path',
      };

      await runAgent(options);

      expect(mockQuery).toHaveBeenCalledWith({
        prompt: 'Test prompt',
        abortController: undefined,
        options: {
          maxTurns: 3,
          cwd: '/test/path',
          permissionMode: 'bypassPermissions',
        },
      });
    });

    it('should extract final response from string content', async () => {
      const mockMessages: SDKMessage[] = [
        {
          type: 'user',
          message: { role: 'user', content: 'Question' },
          parent_tool_use_id: null,
          session_id: 'test-session',
        },
        {
          type: 'assistant',
          message: { content: 'First response', role: 'assistant' },
          parent_tool_use_id: null,
          session_id: 'test-session',
        },
        {
          type: 'assistant',
          message: { content: 'Final response', role: 'assistant' },
          parent_tool_use_id: null,
          session_id: 'test-session',
        },
      ];

      mockQuery.mockImplementation(async function* () {
        yield* mockMessages;
      });

      const result = await runAgent({ prompt: 'Test' });

      expect(result.finalResponse).toBe('Final response');
      expect(result.messages).toEqual(mockMessages);
      expect(result.success).toBe(true);
    });

    it('should extract text from complex content structure', async () => {
      const mockMessages: SDKMessage[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'text', text: 'Hello ' },
              { type: 'text', text: 'world!' },
              { type: 'image', data: 'image-data' },
            ],
          },
          parent_tool_use_id: null,
          session_id: 'test-session',
        },
      ];

      mockQuery.mockImplementation(async function* () {
        yield* mockMessages;
      });

      const result = await runAgent({ prompt: 'Test' });

      expect(result.finalResponse).toBe('Hello world!');
    });

    it('should handle mixed content with non-text blocks', async () => {
      const mockMessages: SDKMessage[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'image', data: 'image-data' },
              { type: 'text', text: 'Text content' },
              { type: 'other', value: 'other-data' },
            ],
          },
          parent_tool_use_id: null,
          session_id: 'test-session',
        },
      ];

      mockQuery.mockImplementation(async function* () {
        yield* mockMessages;
      });

      const result = await runAgent({ prompt: 'Test' });

      expect(result.finalResponse).toBe('Text content');
    });

    it('should track execution duration', async () => {
      const startTime = Date.now();
      vi.setSystemTime(startTime);

      const mockMessages: SDKMessage[] = [
        {
          type: 'assistant',
          message: { content: 'Response', role: 'assistant' },
          parent_tool_use_id: null,
          session_id: 'test-session',
        },
      ];

      mockQuery.mockImplementation(async function* () {
        vi.advanceTimersByTime(1500); // Simulate 1.5 second execution
        yield* mockMessages;
      });

      const result = await runAgent({ prompt: 'Test' });

      expect(result.duration).toBe(1500);
    });

    it('should handle abort controller', async () => {
      const abortController = new AbortController();
      const mockMessages: SDKMessage[] = [
        {
          type: 'assistant',
          message: { content: 'Response', role: 'assistant' },
          parent_tool_use_id: null,
          session_id: 'test-session',
        },
      ];

      mockQuery.mockImplementation(async function* () {
        yield* mockMessages;
      });

      await runAgent({
        prompt: 'Test',
        abortController,
      });

      expect(mockQuery).toHaveBeenCalledWith({
        prompt: 'Test',
        abortController,
        options: {
          maxTurns: 1,
          cwd: undefined,
          permissionMode: 'bypassPermissions',
        },
      });
    });

    it('should throw AgentExecutionError on SDK failure', async () => {
      const sdkError = new Error('SDK connection failed');
      mockQuery.mockImplementation(() => {
        throw sdkError;
      });

      await expect(runAgent({ prompt: 'Test' })).rejects.toThrow(AgentExecutionError);
      await expect(runAgent({ prompt: 'Test' })).rejects.toThrow('SDK connection failed');
    });

    it('should handle empty message stream', async () => {
      mockQuery.mockImplementation(async function* () {
        // Empty generator
      });

      const result = await runAgent({ prompt: 'Test' });

      expect(result.messages).toEqual([]);
      expect(result.finalResponse).toBe('');
      expect(result.success).toBe(true);
    });

    it('should use default maxTurns when not specified', async () => {
      const mockMessages: SDKMessage[] = [
        {
          type: 'assistant',
          message: { content: 'Response', role: 'assistant' },
          parent_tool_use_id: null,
          session_id: 'test-session',
        },
      ];

      mockQuery.mockImplementation(async function* () {
        yield* mockMessages;
      });

      await runAgent({ prompt: 'Test prompt' });

      expect(mockQuery).toHaveBeenCalledWith({
        prompt: 'Test prompt',
        abortController: undefined,
        options: {
          maxTurns: 1,
          cwd: undefined,
          permissionMode: 'bypassPermissions',
        },
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockQuery.mockImplementation(() => {
        throw 'String error';
      });

      await expect(runAgent({ prompt: 'Test' })).rejects.toThrow(AgentExecutionError);
      await expect(runAgent({ prompt: 'Test' })).rejects.toThrow(
        'Unknown error during agent execution'
      );
    });

    it('should extract cost and success from result messages', async () => {
      const mockMessages: SDKMessage[] = [
        {
          type: 'assistant',
          message: { content: 'Response', role: 'assistant' },
          parent_tool_use_id: null,
          session_id: 'test-session',
        },
        {
          type: 'result',
          subtype: 'success',
          duration_ms: 1500,
          duration_api_ms: 800,
          is_error: false,
          num_turns: 1,
          result: 'Success',
          session_id: 'test-session',
          total_cost_usd: 0.05,
          usage: {
            input_tokens: 100,
            output_tokens: 50,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
          },
        } as SDKResultMessage,
      ];

      mockQuery.mockImplementation(async function* () {
        yield* mockMessages;
      });

      const result = await runAgent({ prompt: 'Test' });

      expect(result.cost).toBe(0.05);
      expect(result.success).toBe(true);
    });
  });

  describe('extractMessageText', () => {
    it('should extract text from string content', () => {
      const message: SDKAssistantMessage = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: 'Simple text content',
        },
        parent_tool_use_id: null,
        session_id: 'test-session',
      };

      const result = extractMessageText(message);
      expect(result).toBe('Simple text content');
    });

    it('should extract and concatenate text blocks from array content', () => {
      const message: SDKAssistantMessage = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'text', text: 'First part ' },
            { type: 'text', text: 'second part' },
            { type: 'image', data: 'image-data' },
          ],
        },
        parent_tool_use_id: null,
        session_id: 'test-session',
      };

      const result = extractMessageText(message);
      expect(result).toBe('First part second part');
    });

    it('should handle array content with no text blocks', () => {
      const message: SDKAssistantMessage = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'image', data: 'image-data' },
            { type: 'code', content: 'console.log("test")' },
          ],
        },
        parent_tool_use_id: null,
        session_id: 'test-session',
      };

      const result = extractMessageText(message);
      expect(result).toBe('');
    });

    it('should handle empty array content', () => {
      const message: SDKAssistantMessage = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [],
        },
        parent_tool_use_id: null,
        session_id: 'test-session',
      };

      const result = extractMessageText(message);
      expect(result).toBe('');
    });

    it('should handle null/undefined content', () => {
      const message: SDKAssistantMessage = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: null as unknown,
        },
        parent_tool_use_id: null,
        session_id: 'test-session',
      };

      const result = extractMessageText(message);
      expect(result).toBe(''); // String(null || '') is ''
    });

    it('should handle malformed content blocks', () => {
      const message: SDKAssistantMessage = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Valid text' },
            { type: 'text' }, // Missing text property
            { notType: 'invalid' } as unknown,
            null as unknown,
          ],
        },
        parent_tool_use_id: null,
        session_id: 'test-session',
      };

      const result = extractMessageText(message);
      expect(result).toBe('Valid text');
    });

    it('should return empty string for non-assistant messages', () => {
      const userMessage: SDKMessage = {
        type: 'user',
        message: { role: 'user', content: 'User question' },
        parent_tool_use_id: null,
        session_id: 'test-session',
      };

      const result = extractMessageText(userMessage);
      expect(result).toBe('');
    });
  });
});

import type { SDKMessage } from '@anthropic-ai/claude-code';
import type { DebugLog } from '../../src/messaging/debug-logger.js';

/**
 * Create a mock query function that yields debug messages
 *
 * This allows us to test with real Claude interaction data
 * without making expensive API calls during testing.
 */
export function createMockQuery(debugMessages: SDKMessage[]): () => AsyncGenerator<SDKMessage> {
  return async function* mockQuery() {
    for (const message of debugMessages) {
      yield message;
    }
  };
}

/**
 * Create a mock query from debug log data
 */
export function createMockQueryFromDebugLog(debugLog: DebugLog): () => AsyncGenerator<SDKMessage> {
  return createMockQuery(debugLog.messages);
}

/**
 * Sample debug messages for testing when no real debug data is available
 */
export const SAMPLE_DEBUG_MESSAGES: SDKMessage[] = [
  {
    type: 'system',
    subtype: 'init',
    cwd: '/test/dir',
    session_id: 'test-session',
    tools: ['Bash', 'Read', 'Write'],
    mcp_servers: [],
    model: 'claude-sonnet-4-20250514',
    permissionMode: 'bypassPermissions',
    apiKeySource: 'none',
  },
  {
    type: 'assistant',
    message: {
      id: 'msg_test_1',
      type: 'message',
      role: 'assistant',
      model: 'claude-sonnet-4-20250514',
      content: [
        {
          type: 'text',
          text: 'I will implement the requested feature using Test-Driven Development.',
        },
      ],
      stop_reason: null,
      stop_sequence: null,
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        service_tier: 'standard',
      },
    },
    parent_tool_use_id: null,
    session_id: 'test-session',
  },
  {
    type: 'assistant',
    message: {
      id: 'msg_test_2',
      type: 'message',
      role: 'assistant',
      model: 'claude-sonnet-4-20250514',
      content: [
        {
          type: 'tool_use',
          id: 'tool_test_1',
          name: 'Write',
          input: {
            file_path: '/test/feature.ts',
            content: 'export function testFeature() { return "Hello World"; }',
          },
        },
      ],
      stop_reason: 'tool_use',
      stop_sequence: null,
      usage: {
        input_tokens: 150,
        output_tokens: 75,
        service_tier: 'standard',
      },
    },
    parent_tool_use_id: null,
    session_id: 'test-session',
  },
  {
    type: 'user',
    message: {
      role: 'user',
      content: [
        {
          tool_use_id: 'tool_test_1',
          type: 'tool_result',
          content: 'File created successfully at: /test/feature.ts',
        },
      ],
    },
    parent_tool_use_id: 'tool_test_1',
    session_id: 'test-session',
  },
  {
    type: 'result',
    subtype: 'success',
    duration_ms: 5000,
    duration_api_ms: 3000,
    is_error: false,
    num_turns: 1,
    result: 'Feature implemented successfully with comprehensive tests.',
    session_id: 'test-session',
    total_cost_usd: 0.0025,
    usage: {
      input_tokens: 250,
      output_tokens: 125,
      service_tier: 'standard',
    },
  },
];

/**
 * Sample debug log for testing
 */
export const SAMPLE_DEBUG_LOG: DebugLog = {
  taskId: 'test-task-123',
  timestamp: '2025-01-22T10:00:00.000Z',
  finalResponse: 'Feature implemented successfully with comprehensive tests.',
  success: true,
  cost: 0.0025,
  duration: 5000,
  messagesCount: 5,
  messages: SAMPLE_DEBUG_MESSAGES,
  options: {
    prompt: 'Implement a test feature',
    permissionMode: 'bypassPermissions',
  },
};

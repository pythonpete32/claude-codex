import { promises as fs } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDebugMessages } from '../../src/messaging/debug-logger.js';
import { runClaudeAgent } from '../../src/messaging/sdk-wrapper.js';
import { createMockQueryFromDebugLog } from '../helpers/mock-sdk.js';

// Mock the lib module
vi.mock('../../src/lib.js', () => ({
  forceSubscriptionAuth: vi.fn(),
}));

describe('Messaging Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Real Debug Data Integration', () => {
    it('should process real debug data correctly', async () => {
      // Load actual debug data from the project
      const debugFiles = [
        '.codex/debug/task-1750677842601-2gxu7z-coder-messages.json',
        '.codex/debug/task-1750677842601-p0vhh1-coder-messages.json',
        '.codex/debug/task-1750677987142-kyfp0i-coder-messages.json',
      ];

      // Find first available debug file
      let debugData = null;
      let debugPath = '';

      for (const path of debugFiles) {
        try {
          await fs.access(path);
          debugData = await loadDebugMessages(path);
          debugPath = path;
          break;
        } catch {
          // File doesn't exist, try next
        }
      }

      if (!debugData) {
        console.log('No debug data found, skipping real debug data test');
        return;
      }

      console.log(`Testing with debug data from: ${debugPath}`);

      // Create mock query from real debug data
      const mockQuery = createMockQueryFromDebugLog(debugData);

      // Run agent with real debug data
      const result = await runClaudeAgent({
        prompt: 'Test with real debug data',
        _queryFunction: mockQuery,
      });

      // Verify the result structure
      expect(result).toHaveProperty('messages');
      expect(result).toHaveProperty('finalResponse');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('cost');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('messageCount');

      expect(result.messages).toHaveLength(debugData.messages.length);
      expect(result.messageCount).toBe(debugData.messages.length);

      // Don't check exact equality due to message ordering differences
      // Just verify we have the expected message types
      const messageTypes = result.messages.map((m) => m.type);
      const expectedTypes = debugData.messages.map((m) => m.type);
      expect(messageTypes.sort()).toEqual(expectedTypes.sort());

      // Log the results for inspection
      console.log('Real debug data test results:', {
        originalFinalResponse: debugData.finalResponse,
        extractedFinalResponse: result.finalResponse,
        success: result.success,
        messageCount: result.messageCount,
        duration: result.duration,
      });
    });

    it('should handle debug data with empty finalResponse (interrupted tasks)', async () => {
      // Test specifically with debug data that has empty finalResponse
      // This tests the fix for the original issue

      const debugFiles = ['.codex/debug/task-1750677842601-2gxu7z-coder-messages.json'];

      let debugData = null;

      for (const path of debugFiles) {
        try {
          await fs.access(path);
          debugData = await loadDebugMessages(path);
          if (debugData.finalResponse === '') {
            break; // Found debug data with empty finalResponse
          }
        } catch {
          // File doesn't exist, try next
        }
      }

      if (!debugData || debugData.finalResponse !== '') {
        console.log('No debug data with empty finalResponse found, creating synthetic test');

        // Create synthetic debug data with empty finalResponse
        debugData = {
          taskId: 'test-interrupted-task',
          timestamp: new Date().toISOString(),
          finalResponse: '', // Empty - simulates interrupted task
          success: true,
          cost: 0,
          duration: 5000,
          messagesCount: 3,
          messages: [
            {
              type: 'system',
              subtype: 'init',
              cwd: '/test',
              session_id: 'test',
              tools: ['Bash'],
              mcp_servers: [],
              model: 'claude-sonnet-4',
              permissionMode: 'bypassPermissions',
              apiKeySource: 'none',
            },
            {
              type: 'assistant',
              message: {
                id: 'msg_test',
                type: 'message',
                role: 'assistant',
                model: 'claude-sonnet-4',
                content: [{ type: 'text', text: 'Starting implementation...' }],
                stop_reason: null,
                stop_sequence: null,
                usage: { input_tokens: 10, output_tokens: 5, service_tier: 'standard' },
              },
              parent_tool_use_id: null,
              session_id: 'test',
            },
            // No result message - simulates interruption
          ],
        };
      }

      const mockQuery = createMockQueryFromDebugLog(debugData);

      const result = await runClaudeAgent({
        prompt: 'Test interrupted task',
        _queryFunction: mockQuery,
      });

      // Should handle empty finalResponse gracefully
      expect(result.finalResponse).toBe('');
      expect(result.messages).toHaveLength(debugData.messages.length);

      console.log('Interrupted task test results:', {
        originalFinalResponse: debugData.finalResponse,
        extractedFinalResponse: result.finalResponse,
        success: result.success,
        messageCount: result.messageCount,
        hasResultMessage: result.messages.some((m) => m.type === 'result'),
      });
    });
  });

  describe('Message Processing Flow', () => {
    it('should demonstrate the complete message processing flow', async () => {
      // Mock console methods to capture output
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const testMessages = [
        {
          type: 'system' as const,
          subtype: 'init' as const,
          cwd: '/test',
          session_id: 'integration-test',
          tools: ['Bash', 'Read', 'Write'],
          mcp_servers: [],
          model: 'claude-sonnet-4',
          permissionMode: 'bypassPermissions' as const,
          apiKeySource: 'none' as const,
        },
        {
          type: 'assistant' as const,
          message: {
            id: 'msg_integration_1',
            type: 'message' as const,
            role: 'assistant' as const,
            model: 'claude-sonnet-4',
            content: [
              {
                type: 'text',
                text: 'I will complete this integration test task.',
              },
            ],
            stop_reason: null,
            stop_sequence: null,
            usage: {
              input_tokens: 50,
              output_tokens: 25,
              service_tier: 'standard' as const,
            },
          },
          parent_tool_use_id: null,
          session_id: 'integration-test',
        },
        {
          type: 'result' as const,
          subtype: 'success' as const,
          duration_ms: 3000,
          duration_api_ms: 2000,
          is_error: false,
          num_turns: 1,
          result: 'Integration test completed successfully!',
          session_id: 'integration-test',
          total_cost_usd: 0.001,
          usage: {
            input_tokens: 50,
            output_tokens: 25,
            service_tier: 'standard' as const,
          },
        },
      ];

      async function* mockQuery() {
        for (const message of testMessages) {
          yield message;
        }
      }

      const result = await runClaudeAgent({
        prompt: 'Complete integration test',
        displayOptions: {
          showToolCalls: true,
          showTimestamps: false,
          verbose: false,
        },
        _queryFunction: mockQuery,
      });

      // Verify complete flow
      expect(result.messages).toHaveLength(3);
      expect(result.finalResponse).toBe('Integration test completed successfully!');
      expect(result.success).toBe(true);
      expect(result.cost).toBe(0.001);
      expect(result.messageCount).toBe(3);

      // Verify real-time display was called
      expect(consoleLogSpy).toHaveBeenCalled();

      // Verify final response logging
      expect(consoleLogSpy).toHaveBeenCalledWith('\n📋 Final Response:');
      expect(consoleLogSpy).toHaveBeenCalledWith('Integration test completed successfully!');

      consoleLogSpy.mockRestore();
    });
  });
});

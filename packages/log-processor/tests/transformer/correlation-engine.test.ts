// import { ParserRegistry } from '@claude-codex/core';

import type { ParserRegistry } from '@claude-codex/core';
import type { LogEntry } from '@claude-codex/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CorrelationEngine } from '../../src/transformer/correlation-engine.js';
import type { CorrelationEngineEvents } from '../../src/types.js';

describe('CorrelationEngine', () => {
  let engine: CorrelationEngine;
  let mockParserRegistry: ParserRegistry;

  beforeEach(() => {
    // Create a complete mock parser registry matching the ParserRegistry interface
    const mockParser = {
      parse: vi.fn().mockResolvedValue({
        toolName: 'Mock Tool',
        status: 'completed',
      }),
      canParse: vi.fn().mockReturnValue(true),
      getMetadata: vi.fn().mockReturnValue({
        name: 'MockParser',
        version: '1.0.0',
        toolType: 'test',
      }),
    };

    mockParserRegistry = {
      // Required properties from ParserRegistry interface
      parsers: new Map([['bash', mockParser]]),
      mcpParser: mockParser,
      register: vi.fn(),
      get: vi.fn().mockReturnValue(mockParser),
      getForEntry: vi.fn().mockReturnValue(mockParser),
      list: vi.fn().mockReturnValue([mockParser.getMetadata()]),
      parse: vi.fn().mockReturnValue({
        toolName: 'Mock Tool',
        status: 'completed',
      }),
      canParse: vi.fn().mockReturnValue(true),
      extractToolName: vi.fn().mockReturnValue('Bash'),
    } as unknown as ParserRegistry;

    engine = new CorrelationEngine(mockParserRegistry, {
      timeoutMs: 100, // 100ms for testing
      cleanupIntervalMs: 50, // 50ms for testing
    });
    engine.start();
  });

  afterEach(() => {
    engine.stop();
  });

  describe('processEntry', () => {
    it('should correlate tool_use with tool_result', async () => {
      const toolCall: LogEntry = {
        uuid: 'call-001',
        type: 'assistant',
        timestamp: '2024-01-01T00:00:00Z',
        isSidechain: false,
        content: [
          {
            type: 'tool_use',
            id: 'tool_001',
            name: 'Bash',
            input: { command: 'ls' },
          },
        ],
      };

      const toolResult: LogEntry = {
        uuid: 'result-001',
        parentUuid: 'call-001',
        type: 'user',
        timestamp: '2024-01-01T00:00:01Z',
        isSidechain: false,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'tool_001',
            content: 'file1.txt\nfile2.txt',
          },
        ],
      };

      let emittedData:
        | Parameters<CorrelationEngineEvents['tool:completed']>[0]
        | null = null;
      engine.on('tool:completed', data => {
        emittedData = data;
      });

      // Process tool call
      await engine.processEntry(toolCall);
      expect(emittedData).toBeNull(); // No emission yet

      // Process tool result
      await engine.processEntry(toolResult);

      // Should emit completed event
      expect(emittedData).not.toBeNull();
      expect(emittedData!.toolName).toBe('Bash');
      expect(emittedData!.toolId).toBe('tool_001');
      expect(emittedData!.duration).toBeGreaterThan(0);
      expect(emittedData!.call).toEqual(toolCall);
      expect(emittedData!.result).toEqual(toolResult);
    });

    it('should handle multiple pending tool calls', async () => {
      const toolCall1: LogEntry = {
        uuid: 'call-001',
        type: 'assistant',
        timestamp: '2024-01-01T00:00:00Z',
        isSidechain: false,
        content: [
          {
            type: 'tool_use',
            id: 'tool_001',
            name: 'Read',
            input: { file_path: '/test.txt' },
          },
        ],
      };

      const toolCall2: LogEntry = {
        uuid: 'call-002',
        type: 'assistant',
        timestamp: '2024-01-01T00:00:00Z',
        isSidechain: false,
        content: [
          {
            type: 'tool_use',
            id: 'tool_002',
            name: 'Write',
            input: { file_path: '/output.txt', content: 'test' },
          },
        ],
      };

      const completedTools: string[] = [];
      engine.on('tool:completed', data => {
        completedTools.push(data.toolId);
      });

      // Process both tool calls
      await engine.processEntry(toolCall1);
      await engine.processEntry(toolCall2);

      // Process result for second call first
      const toolResult2: LogEntry = {
        uuid: 'result-002',
        type: 'user',
        timestamp: '2024-01-01T00:00:01Z',
        isSidechain: false,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'tool_002',
            content: 'File written successfully',
          },
        ],
      };

      await engine.processEntry(toolResult2);
      expect(completedTools).toEqual(['tool_002']);

      // Process result for first call
      const toolResult1: LogEntry = {
        uuid: 'result-001',
        type: 'user',
        timestamp: '2024-01-01T00:00:02Z',
        isSidechain: false,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'tool_001',
            content: 'File contents here',
          },
        ],
      };

      await engine.processEntry(toolResult1);
      expect(completedTools).toEqual(['tool_002', 'tool_001']);
    });

    it('should emit timeout event for orphaned tool calls', async () => {
      const toolCall: LogEntry = {
        uuid: 'call-001',
        type: 'assistant',
        timestamp: '2024-01-01T00:00:00Z',
        isSidechain: false,
        content: [
          {
            type: 'tool_use',
            id: 'tool_001',
            name: 'Bash',
            input: { command: 'sleep 10' },
          },
        ],
      };

      let timedOutTool:
        | Parameters<CorrelationEngineEvents['tool:timeout']>[0]
        | null = null;
      engine.on('tool:timeout', data => {
        timedOutTool = data;
      });

      await engine.processEntry(toolCall);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(timedOutTool).not.toBeNull();
      expect(timedOutTool!.toolName).toBe('Bash');
      expect(timedOutTool!.toolId).toBe('tool_001');
      expect(timedOutTool!.call).toEqual(toolCall);
    });

    it('should ignore non-tool entries', async () => {
      const userMessage: LogEntry = {
        uuid: 'msg-001',
        type: 'user',
        timestamp: '2024-01-01T00:00:00Z',
        isSidechain: false,
        content: [
          {
            type: 'text',
            text: 'Hello, how are you?',
          },
        ],
      };

      const assistantMessage: LogEntry = {
        uuid: 'msg-002',
        type: 'assistant',
        timestamp: '2024-01-01T00:00:01Z',
        isSidechain: false,
        content: [
          {
            type: 'text',
            text: 'I am doing well, thank you!',
          },
        ],
      };

      let emittedCount = 0;
      engine.on('tool:completed', () => emittedCount++);
      engine.on('tool:timeout', () => emittedCount++);

      await engine.processEntry(userMessage);
      await engine.processEntry(assistantMessage);

      expect(emittedCount).toBe(0);
    });
  });
});

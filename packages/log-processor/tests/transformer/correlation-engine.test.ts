import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CorrelationEngine } from '../../src/transformer/correlation-engine';
import { ParserRegistry } from '@claude-codex/core';
import type { LogEntry, ToolUse, ToolResult } from '@claude-codex/types';

// Mock the logger
vi.mock('@claude-codex/utils', () => ({
  createChildLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock parser
const mockParser = {
  parse: vi.fn(),
  canParse: vi.fn(),
  toolName: 'bash',
  toolType: 'bash_tool',
  version: '1.0.0',
  getMetadata: vi.fn(),
};

// Mock parser registry
const mockRegistry = {
  findParser: vi.fn(() => mockParser),
  register: vi.fn(),
  getAll: vi.fn(),
} as unknown as ParserRegistry;

describe('CorrelationEngine', () => {
  let engine: CorrelationEngine;
  let emitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    engine = new CorrelationEngine(mockRegistry, {
      timeoutMs: 1000, // 1 second for faster tests
      cleanupIntervalMs: 500,
    });
    emitSpy = vi.spyOn(engine, 'emit');
    vi.clearAllMocks();
  });

  afterEach(() => {
    engine.stop();
    vi.restoreAllMocks();
  });

  // Helper functions
  function createToolCallEntry(toolId: string, toolName: string): LogEntry {
    return {
      uuid: `call-${toolId}`,
      type: 'assistant',
      timestamp: new Date().toISOString(),
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: toolId,
            name: toolName,
            input: { command: 'echo test' },
          } as ToolUse,
        ],
      },
    } as LogEntry;
  }

  function createToolResultEntry(toolId: string, output?: any): LogEntry {
    return {
      uuid: `result-${toolId}`,
      type: 'user',
      timestamp: new Date(Date.now() + 100).toISOString(), // 100ms later
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolId,
            content: output || 'test output',
          } as ToolResult,
        ],
      },
    } as LogEntry;
  }

  describe('Correlation Matching', () => {
    it('should correlate tool call with subsequent result', async () => {
      const toolId = 'test-123';
      const callEntry = createToolCallEntry(toolId, 'bash');
      const resultEntry = createToolResultEntry(toolId);

      mockParser.parse.mockResolvedValueOnce({
        id: toolId,
        type: 'bash_tool',
        status: 'completed',
      });

      // Process call first
      const result1 = await engine.processEntry(callEntry);
      expect(result1).toBeNull(); // No result yet

      // Process result
      const result2 = await engine.processEntry(resultEntry);
      expect(result2).toBeTruthy();
      expect(mockParser.parse).toHaveBeenCalledWith(callEntry, resultEntry);

      // Should emit completion event
      expect(emitSpy).toHaveBeenCalledWith('tool:completed', {
        toolName: 'bash',
        toolId,
        duration: expect.any(Number),
        call: callEntry,
        result: resultEntry,
      });
    });

    it('should correlate when result arrives before call', async () => {
      const toolId = 'test-456';
      const callEntry = createToolCallEntry(toolId, 'edit');
      const resultEntry = createToolResultEntry(toolId);

      mockParser.parse.mockResolvedValueOnce({
        id: toolId,
        type: 'edit_tool',
        status: 'completed',
      });

      // Process result first
      const result1 = await engine.processEntry(resultEntry);
      expect(result1).toBeNull(); // No call yet

      // Process call
      const result2 = await engine.processEntry(callEntry);
      expect(result2).toBeTruthy();
      expect(mockParser.parse).toHaveBeenCalledWith(callEntry, resultEntry);
    });

    it('should handle multiple concurrent tool calls', async () => {
      const toolId1 = 'tool-1';
      const toolId2 = 'tool-2';

      const call1 = createToolCallEntry(toolId1, 'bash');
      const call2 = createToolCallEntry(toolId2, 'read');
      const result1 = createToolResultEntry(toolId1);
      const result2 = createToolResultEntry(toolId2);

      mockParser.parse
        .mockResolvedValueOnce({ id: toolId1, type: 'bash_tool' })
        .mockResolvedValueOnce({ id: toolId2, type: 'read_tool' });

      // Process all calls first
      await engine.processEntry(call1);
      await engine.processEntry(call2);

      // Process results in reverse order
      const parsed2 = await engine.processEntry(result2);
      const parsed1 = await engine.processEntry(result1);

      expect(parsed1).toBeTruthy();
      expect(parsed2).toBeTruthy();
      expect(mockParser.parse).toHaveBeenCalledTimes(2);
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout orphaned tool calls', async () => {
      vi.useFakeTimers();

      const toolId = 'timeout-test';
      const callEntry = createToolCallEntry(toolId, 'bash');

      engine.start();

      // Process call
      await engine.processEntry(callEntry);

      // Advance time past timeout
      vi.advanceTimersByTime(1500); // 1.5 seconds

      // Should emit timeout event
      expect(emitSpy).toHaveBeenCalledWith('tool:timeout', {
        toolName: 'bash',
        toolId,
        call: callEntry,
      });

      // Verify call was removed from pending
      const stats = engine.getStats();
      expect(stats.pendingCalls).toBe(0);

      vi.useRealTimers();
    });

    it('should clean up orphaned results', async () => {
      vi.useFakeTimers();

      const toolId = 'orphan-result';
      const resultEntry = createToolResultEntry(toolId);

      engine.start();

      // Process result without matching call
      await engine.processEntry(resultEntry);

      // Advance time past timeout
      vi.advanceTimersByTime(1500);

      // Verify result was cleaned up
      const stats = engine.getStats();
      expect(stats.pendingResults).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should handle parser not found', async () => {
      const toolId = 'no-parser';
      const callEntry = createToolCallEntry(toolId, 'unknown-tool');
      const resultEntry = createToolResultEntry(toolId);

      vi.mocked(mockRegistry.findParser).mockReturnValueOnce(null);

      await engine.processEntry(callEntry);
      const result = await engine.processEntry(resultEntry);

      expect(result).toBeNull();
      expect(emitSpy).not.toHaveBeenCalledWith(
        'tool:completed',
        expect.anything()
      );
    });

    it('should handle parser errors', async () => {
      const toolId = 'parser-error';
      const callEntry = createToolCallEntry(toolId, 'bash');
      const resultEntry = createToolResultEntry(toolId);

      mockParser.parse.mockRejectedValueOnce(new Error('Parse failed'));

      await engine.processEntry(callEntry);
      const result = await engine.processEntry(resultEntry);

      expect(result).toBeNull();
      // Parser error prevents emission of completed event
      expect(emitSpy).not.toHaveBeenCalledWith(
        'tool:completed',
        expect.anything()
      );
    });

    it('should handle malformed log entries', async () => {
      const malformedEntries = [
        { uuid: '1', type: 'user' }, // No message
        { uuid: '2', type: 'assistant', message: {} }, // No content
        { uuid: '3', type: 'assistant', message: { content: 'string' } }, // String content
        { uuid: '4', type: 'user', message: { content: [{ type: 'text' }] } }, // No tool
      ] as LogEntry[];

      for (const entry of malformedEntries) {
        const result = await engine.processEntry(entry);
        expect(result).toBeNull();
      }
    });
  });

  describe('Statistics', () => {
    it('should track pending correlations', async () => {
      const toolId1 = 'stats-1';
      const toolId2 = 'stats-2';

      const call1 = createToolCallEntry(toolId1, 'bash');
      const result2 = createToolResultEntry(toolId2);

      await engine.processEntry(call1);
      await engine.processEntry(result2);

      const stats = engine.getStats();
      expect(stats.pendingCalls).toBe(1);
      expect(stats.pendingResults).toBe(1);
      expect(stats.oldestPendingMs).not.toBeNull();
      expect(stats.oldestPendingMs).toBeGreaterThanOrEqual(0);
    });

    it('should return null for oldestPendingMs when no pending items', () => {
      const stats = engine.getStats();
      expect(stats.pendingCalls).toBe(0);
      expect(stats.pendingResults).toBe(0);
      expect(stats.oldestPendingMs).toBeNull();
    });
  });

  describe('Lifecycle', () => {
    it('should start and stop cleanly', () => {
      expect(() => engine.start()).not.toThrow();
      expect(() => engine.start()).not.toThrow(); // Should handle duplicate start
      expect(() => engine.stop()).not.toThrow();
      expect(() => engine.stop()).not.toThrow(); // Should handle duplicate stop
    });

    it('should clear pending items on stop', async () => {
      const toolId = 'lifecycle-test';
      const callEntry = createToolCallEntry(toolId, 'bash');

      await engine.processEntry(callEntry);

      let stats = engine.getStats();
      expect(stats.pendingCalls).toBe(1);

      engine.stop();

      stats = engine.getStats();
      expect(stats.pendingCalls).toBe(0);
      expect(stats.pendingResults).toBe(0);
    });
  });

  describe('Event Types', () => {
    it('should have type-safe event emitters', () => {
      const toolCompleteHandler = vi.fn();
      const toolTimeoutHandler = vi.fn();

      engine.on('tool:completed', toolCompleteHandler);
      engine.on('tool:timeout', toolTimeoutHandler);

      // TypeScript should enforce correct parameter types
      engine.emit('tool:completed', {
        toolName: 'test',
        toolId: 'test-id',
        duration: 100,
        call: {} as LogEntry,
        result: {} as LogEntry,
      });

      engine.emit('tool:timeout', {
        toolName: 'test',
        toolId: 'test-id',
        call: {} as LogEntry,
      });

      expect(toolCompleteHandler).toHaveBeenCalled();
      expect(toolTimeoutHandler).toHaveBeenCalled();

      engine.off('tool:completed', toolCompleteHandler);
      engine.off('tool:timeout', toolTimeoutHandler);
    });
  });
});

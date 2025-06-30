import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileMonitor } from '../../src/monitor/file-monitor';
import { CorrelationEngine } from '../../src/transformer/correlation-engine';
import { ParserRegistry } from '@claude-codex/core';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { LogEntry } from '@claude-codex/types';

// Mock the logger
vi.mock('@claude-codex/utils', () => ({
  createChildLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('Log Processing Pipeline E2E', () => {
  let monitor: FileMonitor;
  let correlator: CorrelationEngine;
  let parserRegistry: ParserRegistry;
  let testDir: string;
  let projectDir: string;

  beforeEach(async () => {
    // Set up test directory
    testDir = join(tmpdir(), `log-pipeline-e2e-${Date.now()}`);
    projectDir = join(testDir, '-Users-test-e2e-project');
    await fs.mkdir(projectDir, { recursive: true });

    // Initialize components
    parserRegistry = new ParserRegistry();

    // Register a mock parser for testing
    parserRegistry.register('bash', {
      toolName: 'bash',
      toolType: 'bash_tool',
      version: '1.0.0',
      canParse: (entry: LogEntry) => {
        if (entry.type !== 'assistant') return false;
        const content = Array.isArray(entry.message?.content)
          ? entry.message.content
          : [];
        return content.some(
          (c: any) => c.type === 'tool_use' && c.name === 'bash'
        );
      },
      parse: async (call: LogEntry, result?: LogEntry) => ({
        id: 'test-id',
        type: 'bash_tool',
        toolType: 'bash_tool',
        status: result ? 'completed' : 'pending',
        timestamp: call.timestamp,
        command: 'echo test',
        output: result ? 'test output' : undefined,
      }),
      getMetadata: () => ({
        toolName: 'bash',
        version: '1.0.0',
        features: { streaming: false },
      }),
    });

    monitor = new FileMonitor({
      projectsPath: testDir,
      activeThresholdMs: 1000,
    });

    correlator = new CorrelationEngine(parserRegistry, {
      timeoutMs: 5000,
    });
  });

  afterEach(async () => {
    if (monitor) await monitor.stopWatching();
    if (correlator) correlator.stop();
    if (testDir)
      await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  it('should process a complete tool interaction flow', async () => {
    const logFile = join(projectDir, 'session-e2e.jsonl');

    // Track emitted events
    const events = {
      entries: [] as LogEntry[],
      completed: [] as any[],
      sessions: [] as any[],
    };

    monitor.on('entry', entry => events.entries.push(entry));
    monitor.on('session:new', session => events.sessions.push(session));
    correlator.on('tool:completed', data => events.completed.push(data));

    // Start monitoring
    await monitor.startWatching();
    correlator.start();

    // Connect monitor to correlator
    monitor.on('entry', async entry => {
      await correlator.processEntry(entry);
    });

    // Simulate tool call
    const toolCallEntry: LogEntry = {
      uuid: 'call-123',
      type: 'assistant',
      timestamp: new Date().toISOString(),
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'tool-e2e-123',
            name: 'bash',
            input: { command: 'echo test' },
          },
        ],
      },
    };

    await fs.writeFile(logFile, JSON.stringify(toolCallEntry) + '\n');

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify call was processed
    expect(events.entries).toHaveLength(1);
    expect(events.sessions).toHaveLength(1);
    expect(correlator.getStats().pendingCalls).toBe(1);

    // Simulate tool result
    const toolResultEntry: LogEntry = {
      uuid: 'result-123',
      type: 'user',
      timestamp: new Date(Date.now() + 50).toISOString(),
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'tool-e2e-123',
            content: 'test output',
          },
        ],
      },
    };

    await fs.appendFile(logFile, JSON.stringify(toolResultEntry) + '\n');

    // Wait for correlation
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify completion
    expect(events.entries).toHaveLength(2);
    expect(events.completed).toHaveLength(1);
    expect(events.completed[0]).toMatchObject({
      toolName: 'bash',
      toolId: 'tool-e2e-123',
      duration: expect.any(Number),
    });
    expect(correlator.getStats().pendingCalls).toBe(0);
  });

  it('should handle multiple concurrent tools', async () => {
    const logFile = join(projectDir, 'concurrent-tools.jsonl');

    const completedTools: string[] = [];
    correlator.on('tool:completed', data => {
      completedTools.push(data.toolId);
    });

    await monitor.startWatching();
    correlator.start();

    monitor.on('entry', async entry => {
      await correlator.processEntry(entry);
    });

    // Write multiple tool calls
    const toolCalls = [
      { id: 'tool-1', name: 'bash', command: 'ls' },
      { id: 'tool-2', name: 'bash', command: 'pwd' },
      { id: 'tool-3', name: 'bash', command: 'date' },
    ];

    const entries: string[] = [];

    // Add all tool calls
    for (const tool of toolCalls) {
      const entry: LogEntry = {
        uuid: `call-${tool.id}`,
        type: 'assistant',
        timestamp: new Date().toISOString(),
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: tool.id,
              name: tool.name,
              input: { command: tool.command },
            },
          ],
        },
      };
      entries.push(JSON.stringify(entry));
    }

    await fs.writeFile(logFile, entries.join('\n') + '\n');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Add results in different order
    const resultOrder = ['tool-2', 'tool-3', 'tool-1'];
    for (const toolId of resultOrder) {
      const result: LogEntry = {
        uuid: `result-${toolId}`,
        type: 'user',
        timestamp: new Date().toISOString(),
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolId,
              content: `output for ${toolId}`,
            },
          ],
        },
      };
      await fs.appendFile(logFile, JSON.stringify(result) + '\n');
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Verify all tools completed
    expect(completedTools).toHaveLength(3);
    expect(completedTools.sort()).toEqual(['tool-1', 'tool-2', 'tool-3']);
  });

  it('should handle tool timeouts', async () => {
    vi.useFakeTimers();

    const logFile = join(projectDir, 'timeout-test.jsonl');

    const timedOutTools: string[] = [];
    correlator.on('tool:timeout', data => {
      timedOutTools.push(data.toolId);
    });

    // Use shorter timeout for testing
    correlator.stop();
    correlator = new CorrelationEngine(parserRegistry, {
      timeoutMs: 1000,
      cleanupIntervalMs: 500,
    });

    await monitor.startWatching();
    correlator.start();

    monitor.on('entry', async entry => {
      await correlator.processEntry(entry);
    });

    // Write tool call without result
    const toolCall: LogEntry = {
      uuid: 'timeout-call',
      type: 'assistant',
      timestamp: new Date().toISOString(),
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'tool-timeout',
            name: 'bash',
            input: { command: 'sleep 999' },
          },
        ],
      },
    };

    await fs.writeFile(logFile, JSON.stringify(toolCall) + '\n');

    // Advance real time for file monitoring
    await vi.runOnlyPendingTimersAsync();

    // Advance past timeout
    vi.advanceTimersByTime(1500);

    expect(timedOutTools).toContain('tool-timeout');
    expect(correlator.getStats().pendingCalls).toBe(0);

    vi.useRealTimers();
  });

  it('should process historical logs on startup', async () => {
    const logFile = join(projectDir, 'historical.jsonl');

    // Write complete tool interaction before starting monitor
    const historicalEntries = [
      {
        uuid: 'hist-call-1',
        type: 'assistant',
        timestamp: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'hist-tool-1',
              name: 'bash',
              input: { command: 'echo historical' },
            },
          ],
        },
      },
      {
        uuid: 'hist-result-1',
        type: 'user',
        timestamp: '2024-01-01T00:00:01Z',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'hist-tool-1',
              content: 'historical output',
            },
          ],
        },
      },
    ];

    await fs.writeFile(
      logFile,
      historicalEntries.map(e => JSON.stringify(e)).join('\n') + '\n'
    );

    const processedEntries: LogEntry[] = [];

    // Process historical data
    for await (const entry of monitor.readAll()) {
      processedEntries.push(entry);
      await correlator.processEntry(entry);
    }

    expect(processedEntries).toHaveLength(2);

    // Should have correlated the historical tool
    const stats = correlator.getStats();
    expect(stats.pendingCalls).toBe(0);
    expect(stats.pendingResults).toBe(0);
  });

  it('should handle multiple sessions across projects', async () => {
    // Create second project
    const project2Dir = join(testDir, '-Users-another-project');
    await fs.mkdir(project2Dir, { recursive: true });

    const sessions: any[] = [];
    monitor.on('session:new', session => sessions.push(session));

    await monitor.startWatching();

    // Create sessions in both projects
    await fs.writeFile(
      join(projectDir, 'session1.jsonl'),
      JSON.stringify({ uuid: '1', type: 'user' }) + '\n'
    );

    await fs.writeFile(
      join(project2Dir, 'session2.jsonl'),
      JSON.stringify({ uuid: '2', type: 'user' }) + '\n'
    );

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(sessions).toHaveLength(2);

    const projects = sessions.map(s => s.project).sort();
    expect(projects).toEqual([
      '/Users/another/project',
      '/Users/test/e2e/project',
    ]);
  });
});

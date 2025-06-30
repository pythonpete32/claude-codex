import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileMonitor } from '../../src/monitor/file-monitor';
import { CorrelationEngine } from '../../src/transformer/correlation-engine';
import { ParserRegistry } from '@claude-codex/core';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { RawLogEntry } from '../../src/types';

describe('Simple E2E Pipeline', () => {
  let monitor: FileMonitor;
  let correlator: CorrelationEngine;
  let parserRegistry: ParserRegistry;
  let testDir: string;
  let projectDir: string;

  beforeEach(async () => {
    // Set up test directory
    testDir = join(tmpdir(), `simple-e2e-${Date.now()}`);
    projectDir = join(testDir, '-test-project');
    await fs.mkdir(projectDir, { recursive: true });

    // Use the default ParserRegistry which already has all parsers registered
    parserRegistry = new ParserRegistry();

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

  it('should process a bash tool call and result', async () => {
    const logFile = join(projectDir, 'test-session.jsonl');

    // Create realistic log entries
    const toolCallEntry: RawLogEntry = {
      uuid: 'call-123',
      type: 'assistant',
      timestamp: '2024-01-01T00:00:00Z',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'toolu_test123',
            name: 'Bash',
            input: {
              command: 'echo "Hello, World!"',
              description: 'Test echo command',
            },
          },
        ],
      },
    };

    const toolResultEntry: RawLogEntry = {
      uuid: 'result-123',
      type: 'user',
      timestamp: '2024-01-01T00:00:01Z',
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_test123',
            output: {
              stdout: 'Hello, World!\n',
              stderr: '',
              exit_code: 0,
            },
          },
        ],
      },
    };

    // Write the log file
    const logContent =
      [JSON.stringify(toolCallEntry), JSON.stringify(toolResultEntry)].join(
        '\n'
      ) + '\n';

    await fs.writeFile(logFile, logContent);

    // Process the logs
    const entries = [];
    const parsedResults = [];

    for await (const entry of monitor.readAll()) {
      entries.push(entry);
      const result = await correlator.processEntry(entry);
      if (result) {
        parsedResults.push(result);
      }
    }

    // Verify
    expect(entries).toHaveLength(2);
    expect(parsedResults).toHaveLength(1);

    const parsed = parsedResults[0];
    expect(parsed).toBeDefined();
    expect(parsed.command).toBe('echo "Hello, World!"');
    expect(parsed.output).toBe('Hello, World!\n');
    expect(parsed.status.normalized).toBe('completed');
  });

  it('should handle multiple tools in sequence', async () => {
    const logFile = join(projectDir, 'multi-tool.jsonl');

    // Create multiple tool interactions
    const logs: RawLogEntry[] = [
      // First bash tool
      {
        uuid: 'call-1',
        type: 'assistant',
        timestamp: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'tool1',
              name: 'Bash',
              input: { command: 'pwd' },
            },
          ],
        },
      },
      {
        uuid: 'result-1',
        type: 'user',
        timestamp: '2024-01-01T00:00:01Z',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'tool1',
              output: {
                stdout: '/home/user\n',
                stderr: '',
                exit_code: 0,
              },
            },
          ],
        },
      },
      // Second bash tool
      {
        uuid: 'call-2',
        type: 'assistant',
        timestamp: '2024-01-01T00:00:02Z',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'tool2',
              name: 'Bash',
              input: { command: 'ls' },
            },
          ],
        },
      },
      {
        uuid: 'result-2',
        type: 'user',
        timestamp: '2024-01-01T00:00:03Z',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'tool2',
              output: {
                stdout: 'file1.txt\nfile2.txt\n',
                stderr: '',
                exit_code: 0,
              },
            },
          ],
        },
      },
    ];

    // Write log file
    const logContent = logs.map(l => JSON.stringify(l)).join('\n') + '\n';
    await fs.writeFile(logFile, logContent);

    // Process
    const parsedResults = [];
    for await (const entry of monitor.readAll()) {
      const result = await correlator.processEntry(entry);
      if (result) {
        parsedResults.push(result);
      }
    }

    // Verify
    expect(parsedResults).toHaveLength(2);
    expect(parsedResults[0].command).toBe('pwd');
    expect(parsedResults[0].output).toBe('/home/user\n');
    expect(parsedResults[1].command).toBe('ls');
    expect(parsedResults[1].output).toBe('file1.txt\nfile2.txt\n');
  });

  it('should handle tool call without result (timeout scenario)', async () => {
    const logFile = join(projectDir, 'timeout.jsonl');

    // Only write the tool call, no result
    const toolCall: RawLogEntry = {
      uuid: 'orphan-call',
      type: 'assistant',
      timestamp: '2024-01-01T00:00:00Z',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'orphan-tool',
            name: 'Bash',
            input: { command: 'sleep 999' },
          },
        ],
      },
    };

    await fs.writeFile(logFile, JSON.stringify(toolCall) + '\n');

    // Process and check pending state
    correlator.start();

    for await (const entry of monitor.readAll()) {
      await correlator.processEntry(entry);
    }

    const stats = correlator.getStats();
    expect(stats.pendingCalls).toBe(1);
    expect(stats.pendingResults).toBe(0);
  });
});

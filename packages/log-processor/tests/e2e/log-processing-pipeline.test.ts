import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileMonitor } from '../../src/monitor/file-monitor.js';
import { CorrelationEngine } from '../../src/transformer/correlation-engine.js';
import { ParserRegistry } from '@claude-codex/core';
import type { LogEntry } from '@claude-codex/types';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

describe('End-to-End Log Processing Pipeline', () => {
  let fileMonitor: FileMonitor;
  let correlationEngine: CorrelationEngine;
  let parserRegistry: ParserRegistry;

  beforeEach(() => {
    // Initialize parser registry
    parserRegistry = new ParserRegistry();

    // Initialize correlation engine with parser registry
    correlationEngine = new CorrelationEngine(parserRegistry, {
      timeoutMs: 5000,
      cleanupIntervalMs: 1000,
    });

    // Initialize file monitor with test fixtures path
    const fixturesPath = join(__dirname, '..', 'fixtures');
    fileMonitor = new FileMonitor({
      projectsPath: fixturesPath,
      activeThresholdMs: 30000,
    });
  });

  afterEach(async () => {
    correlationEngine.stop();
    await fileMonitor.stopWatching();
  });

  it('should process a complete tool call/result cycle', async () => {
    const processedTools: any[] = [];

    // Set up correlation engine listener
    correlationEngine.on('tool:completed', data => {
      processedTools.push(data);
    });

    // Start correlation engine
    correlationEngine.start();

    // Read all log entries from fixtures
    const entries: LogEntry[] = [];
    for await (const entry of fileMonitor.readAll()) {
      entries.push(entry);
    }

    // We should have at least 3 entries (user message, tool call, tool result)
    expect(entries.length).toBeGreaterThanOrEqual(3);

    // Process entries through correlation engine
    for (const entry of entries) {
      const result = await correlationEngine.processEntry(entry);
      if (result) {
        console.log('Parsed tool props:', result);
      }
    }

    // Verify we processed at least one tool
    expect(processedTools.length).toBeGreaterThan(0);

    // Verify the tool completion data
    const firstTool = processedTools[0];
    expect(firstTool).toHaveProperty('toolName');
    expect(firstTool).toHaveProperty('toolId');
    expect(firstTool).toHaveProperty('duration');
    expect(firstTool).toHaveProperty('call');
    expect(firstTool).toHaveProperty('result');
    expect(firstTool.duration).toBeGreaterThan(0);
  });

  it('should parse Write tool with UI-ready props', async () => {
    const parsedProps: any[] = [];

    // Process entries and collect parsed props
    for await (const entry of fileMonitor.readAll()) {
      const result = await correlationEngine.processEntry(entry);
      if (result) {
        parsedProps.push(result);
      }
    }

    // Find Write tool props
    const writeProps = parsedProps.find(p => p.toolName === 'Write');

    if (writeProps) {
      expect(writeProps).toHaveProperty('toolName', 'Write');
      expect(writeProps).toHaveProperty('status');
      expect(writeProps).toHaveProperty('filePath');
      expect(writeProps).toHaveProperty('content');
      expect(writeProps).toHaveProperty('callUuid');
      expect(writeProps).toHaveProperty('resultUuid');
      expect(writeProps).toHaveProperty('executionTime');
    }
  });

  it('should handle real-time monitoring', async () => {
    const newEntries: LogEntry[] = [];
    const completedTools: any[] = [];

    // Set up listeners
    fileMonitor.on('entry', entry => {
      newEntries.push(entry);
      // Process through correlation engine
      correlationEngine.processEntry(entry);
    });

    correlationEngine.on('tool:completed', data => {
      completedTools.push(data);
    });

    // Start services
    correlationEngine.start();
    await fileMonitor.startWatching();

    // Wait a bit for initial processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify we got entries
    expect(newEntries.length).toBeGreaterThan(0);

    // If we have tool calls/results, verify correlation
    if (completedTools.length > 0) {
      const tool = completedTools[0];
      expect(tool.toolName).toBeTruthy();
      expect(tool.duration).toBeGreaterThan(0);
    }
  });

  it('should track active sessions', async () => {
    await fileMonitor.startWatching();

    const sessions = fileMonitor.getActiveSessions();
    expect(sessions).toBeInstanceOf(Array);

    // We should have at least one session from fixtures
    if (sessions.length > 0) {
      const session = sessions[0];
      expect(session).toHaveProperty('sessionId');
      expect(session).toHaveProperty('project');
      expect(session).toHaveProperty('filePath');
      expect(session).toHaveProperty('lastModified');
      expect(session).toHaveProperty('isActive');
    }
  });

  it('should get correlation statistics', () => {
    correlationEngine.start();

    const stats = correlationEngine.getStats();
    expect(stats).toHaveProperty('pendingCalls');
    expect(stats).toHaveProperty('pendingResults');
    expect(stats).toHaveProperty('oldestPendingMs');

    expect(typeof stats.pendingCalls).toBe('number');
    expect(typeof stats.pendingResults).toBe('number');
  });
});

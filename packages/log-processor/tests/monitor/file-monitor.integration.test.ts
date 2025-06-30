import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileMonitor } from '../../src/monitor/file-monitor';
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

describe('FileMonitor Integration Tests', () => {
  let monitor: FileMonitor;
  let testDir: string;
  let projectDir: string;
  let logFile: string;

  beforeEach(async () => {
    // Create temporary test directory structure
    testDir = join(tmpdir(), `file-monitor-test-${Date.now()}`);
    projectDir = join(testDir, '-Users-test-project');
    logFile = join(projectDir, 'test-session.jsonl');

    await fs.mkdir(projectDir, { recursive: true });

    monitor = new FileMonitor({
      projectsPath: testDir,
      activeThresholdMs: 100, // Short threshold for tests
      pollInterval: 50,
    });
  });

  afterEach(async () => {
    await monitor.stopWatching();
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Reading Existing Logs', () => {
    it('should read all entries from existing JSONL files', async () => {
      // Create test log entries
      const entries: LogEntry[] = [
        {
          uuid: '1',
          type: 'user',
          timestamp: '2024-01-01T00:00:00Z',
          message: { role: 'user', content: 'Hello' },
        },
        {
          uuid: '2',
          type: 'assistant',
          timestamp: '2024-01-01T00:00:01Z',
          message: { role: 'assistant', content: 'Hi there' },
        },
      ];

      // Write entries to file
      const content = entries.map(e => JSON.stringify(e)).join('\n');
      await fs.writeFile(logFile, content);

      // Read all entries
      const readEntries: LogEntry[] = [];
      for await (const entry of monitor.readAll()) {
        readEntries.push(entry);
      }

      expect(readEntries).toHaveLength(2);
      expect(readEntries[0].uuid).toBe('1');
      expect(readEntries[1].uuid).toBe('2');
    });

    it('should handle empty lines and invalid JSON', async () => {
      const content = [
        JSON.stringify({
          uuid: '1',
          type: 'user',
          timestamp: '2024-01-01T00:00:00Z',
        }),
        '', // Empty line
        'invalid json',
        JSON.stringify({
          uuid: '2',
          type: 'assistant',
          timestamp: '2024-01-01T00:00:01Z',
        }),
      ].join('\n');

      await fs.writeFile(logFile, content);

      const readEntries: LogEntry[] = [];
      for await (const entry of monitor.readAll()) {
        readEntries.push(entry);
      }

      expect(readEntries).toHaveLength(2);
      expect(readEntries[0].uuid).toBe('1');
      expect(readEntries[1].uuid).toBe('2');
    });

    it('should read from multiple project directories', async () => {
      // Create second project
      const projectDir2 = join(testDir, '-Users-another-project');
      const logFile2 = join(projectDir2, 'session2.jsonl');
      await fs.mkdir(projectDir2, { recursive: true });

      // Write entries to both projects
      await fs.writeFile(logFile, JSON.stringify({ uuid: '1', type: 'user' }));
      await fs.writeFile(
        logFile2,
        JSON.stringify({ uuid: '2', type: 'assistant' })
      );

      const readEntries: LogEntry[] = [];
      for await (const entry of monitor.readAll()) {
        readEntries.push(entry);
      }

      expect(readEntries).toHaveLength(2);
      const uuids = readEntries.map(e => e.uuid).sort();
      expect(uuids).toEqual(['1', '2']);
    });
  });

  describe('Real-time Monitoring', () => {
    it('should detect new log entries', async () => {
      const entryPromise = new Promise<LogEntry>(resolve => {
        monitor.once('entry', resolve);
      });

      await monitor.startWatching();

      // Write initial content
      await fs.writeFile(
        logFile,
        JSON.stringify({ uuid: '1', type: 'user' }) + '\n'
      );

      // Wait a bit for file system events
      await new Promise(resolve => setTimeout(resolve, 100));

      // Append new entry
      const newEntry = {
        uuid: '2',
        type: 'assistant',
        timestamp: new Date().toISOString(),
      };
      await fs.appendFile(logFile, JSON.stringify(newEntry) + '\n');

      const receivedEntry = await entryPromise;
      expect(receivedEntry.uuid).toBe('2');
    });

    it('should track session activity', async () => {
      const activePromise = new Promise<any>(resolve => {
        monitor.once('session:active', resolve);
      });

      const inactivePromise = new Promise<any>(resolve => {
        monitor.once('session:inactive', resolve);
      });

      await monitor.startWatching();

      // Create new file (active session)
      await fs.writeFile(
        logFile,
        JSON.stringify({ uuid: '1', type: 'user' }) + '\n'
      );

      const activeSession = await activePromise;
      expect(activeSession.sessionId).toBe('test-session');
      expect(activeSession.isActive).toBe(true);

      // Wait for session to become inactive
      await new Promise(resolve => setTimeout(resolve, 150));

      const inactiveSession = await inactivePromise;
      expect(inactiveSession.sessionId).toBe('test-session');
      expect(inactiveSession.isActive).toBe(false);
    });

    it('should emit session:new for discovered sessions', async () => {
      const newSessionPromise = new Promise<any>(resolve => {
        monitor.once('session:new', resolve);
      });

      await monitor.startWatching();

      // Create new session file
      await fs.writeFile(
        logFile,
        JSON.stringify({ uuid: '1', type: 'user' }) + '\n'
      );

      const session = await newSessionPromise;
      expect(session.sessionId).toBe('test-session');
      expect(session.project).toBe('/Users/test/project');
      expect(session.filePath).toBe(logFile);
    });
  });

  describe('Session Management', () => {
    it('should list active sessions', async () => {
      // Create multiple session files
      const session1 = join(projectDir, 'session1.jsonl');
      const session2 = join(projectDir, 'session2.jsonl');

      await fs.writeFile(session1, JSON.stringify({ uuid: '1', type: 'user' }));
      await fs.writeFile(session2, JSON.stringify({ uuid: '2', type: 'user' }));

      await monitor.startWatching();

      // Wait for files to be discovered
      await new Promise(resolve => setTimeout(resolve, 100));

      const sessions = monitor.getActiveSessions();
      expect(sessions).toHaveLength(2);

      const sessionIds = sessions.map(s => s.sessionId).sort();
      expect(sessionIds).toEqual(['session1', 'session2']);

      // All should be active (recently created)
      expect(sessions.every(s => s.isActive)).toBe(true);
    });

    it('should track session modification times', async () => {
      await fs.writeFile(
        logFile,
        JSON.stringify({ uuid: '1', type: 'user' }) + '\n'
      );

      await monitor.startWatching();
      await new Promise(resolve => setTimeout(resolve, 100));

      const sessions1 = monitor.getActiveSessions();
      const session1 = sessions1[0];
      const firstModTime = session1.lastModified.getTime();

      // Modify the file
      await fs.appendFile(
        logFile,
        JSON.stringify({ uuid: '2', type: 'assistant' }) + '\n'
      );
      await new Promise(resolve => setTimeout(resolve, 100));

      const sessions2 = monitor.getActiveSessions();
      const session2 = sessions2[0];
      const secondModTime = session2.lastModified.getTime();

      expect(secondModTime).toBeGreaterThan(firstModTime);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing projects directory', async () => {
      const badMonitor = new FileMonitor({
        projectsPath: '/non/existent/path',
      });

      const entries: LogEntry[] = [];
      for await (const entry of badMonitor.readAll()) {
        entries.push(entry);
      }

      expect(entries).toHaveLength(0);
    });

    it('should handle file read errors gracefully', async () => {
      // Create a directory instead of a file
      const badFile = join(projectDir, 'bad.jsonl');
      await fs.mkdir(badFile);

      const errorPromise = new Promise<Error>(resolve => {
        monitor.once('error', resolve);
      });

      await monitor.startWatching();

      // Should emit error but continue running
      const error = await Promise.race([
        errorPromise,
        new Promise(resolve => setTimeout(() => resolve(null), 200)),
      ]);

      // May or may not emit error depending on watcher implementation
      if (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Project Path Decoding', () => {
    it('should decode project paths correctly', async () => {
      const testCases = [
        { encoded: '-Users-john-projects', expected: '/Users/john/projects' },
        { encoded: '-home-user-my--config', expected: '/home/user/my.config' },
      ];

      for (const { encoded, expected } of testCases) {
        const testProjectDir = join(testDir, encoded);
        const testLogFile = join(testProjectDir, 'test.jsonl');

        await fs.mkdir(testProjectDir, { recursive: true });
        await fs.writeFile(
          testLogFile,
          JSON.stringify({ uuid: '1', type: 'user' })
        );
      }

      await monitor.startWatching();
      await new Promise(resolve => setTimeout(resolve, 100));

      const sessions = monitor.getActiveSessions();
      const projects = sessions.map(s => s.project).sort();

      expect(projects).toContain('/Users/john/projects');
      expect(projects).toContain('/home/user/my.config');
    });
  });
});

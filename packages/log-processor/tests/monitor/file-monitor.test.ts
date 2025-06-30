import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileMonitor } from '../../src/monitor/file-monitor';
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

describe('FileMonitor Unit Tests', () => {
  let monitor: FileMonitor;

  beforeEach(() => {
    monitor = new FileMonitor({
      projectsPath: '/test/projects',
      activeThresholdMs: 1000,
    });
  });

  describe('Session Extraction', () => {
    it('should extract session ID from file path', () => {
      // Access private method through any type casting for testing
      const extractSessionId = (monitor as any).extractSessionId.bind(monitor);

      expect(extractSessionId('/test/projects/project/session-123.jsonl')).toBe(
        'session-123'
      );
      expect(extractSessionId('/path/to/abc-def-456.jsonl')).toBe(
        'abc-def-456'
      );
      expect(extractSessionId('test.jsonl')).toBe('test');
    });

    it('should extract and decode project from file path', () => {
      const extractProject = (monitor as any).extractProject.bind(monitor);

      expect(
        extractProject('/test/projects/-Users-john-project/session.jsonl')
      ).toBe('/Users/john/project');

      expect(
        extractProject('/test/projects/-home-user-my--config/log.jsonl')
      ).toBe('/home/user/my.config');

      expect(extractProject('/some/path/unknown/file.jsonl')).toBe('unknown');
    });
  });

  describe('Project Path Decoding', () => {
    it('should decode various path patterns correctly', () => {
      const decodeProjectPath = (monitor as any).decodeProjectPath.bind(
        monitor
      );

      const testCases = [
        { encoded: '-Users-john-projects', expected: '/Users/john/projects' },
        { encoded: '-home-user-my--config', expected: '/home/user/my.config' },
        { encoded: 'C--Users-jane-work', expected: 'C:/Users/jane/work' },
        {
          encoded: '-var-www-my--awesome--project',
          expected: '/var/www/my.awesome.project',
        },
      ];

      for (const { encoded, expected } of testCases) {
        expect(decodeProjectPath(encoded)).toBe(expected);
      }
    });
  });

  describe('Session Activity', () => {
    it('should determine if session is active', () => {
      const isSessionActive = (monitor as any).isSessionActive.bind(monitor);

      const recentSession = {
        lastModified: new Date(),
      };

      const oldSession = {
        lastModified: new Date(Date.now() - 2000), // 2 seconds ago
      };

      expect(isSessionActive(recentSession)).toBe(true);
      expect(isSessionActive(oldSession)).toBe(false);
    });
  });

  describe('Lifecycle', () => {
    it('should handle multiple start calls gracefully', async () => {
      await expect(monitor.startWatching()).resolves.toBeUndefined();
      await expect(monitor.startWatching()).resolves.toBeUndefined();
    });

    it('should handle multiple stop calls gracefully', async () => {
      await monitor.startWatching();
      await expect(monitor.stopWatching()).resolves.toBeUndefined();
      await expect(monitor.stopWatching()).resolves.toBeUndefined();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid JSON entries gracefully', () => {
      // This would be tested in integration tests with real file I/O
      expect(() => monitor.getActiveSessions()).not.toThrow();
    });
  });
});

import { promises as fs } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type DebugMetadata,
  generateDebugFileName,
  loadDebugMessages,
  logDebugMessages,
} from '../../../src/core/messaging/debug-logger.js';
import { SAMPLE_DEBUG_LOG, SAMPLE_DEBUG_MESSAGES } from '../../helpers/mock-sdk.js';

// Mock console methods
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Debug Logger', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    originalCwd = process.cwd();
    tempDir = await mkdtemp(join(tmpdir(), 'debug-logger-test-'));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('logDebugMessages', () => {
    it('should create debug log file with correct structure', async () => {
      const metadata: DebugMetadata = {
        taskId: 'test-task-123',
        finalResponse: 'Test response',
        success: true,
        cost: 0.0025,
        duration: 5000,
        messagesCount: 5,
      };

      await logDebugMessages(SAMPLE_DEBUG_MESSAGES, metadata);

      const debugPath = join('.codex', 'debug', 'test-task-123-messages.json');
      const exists = await fs
        .access(debugPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(debugPath, 'utf-8');
      const debugLog = JSON.parse(content);

      expect(debugLog).toMatchObject({
        taskId: 'test-task-123',
        finalResponse: 'Test response',
        success: true,
        cost: 0.0025,
        duration: 5000,
        messagesCount: 5,
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        messages: SAMPLE_DEBUG_MESSAGES,
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(`🐛 Debug log saved: ${debugPath}`);
    });

    it('should create debug directory if it does not exist', async () => {
      const metadata: DebugMetadata = {
        taskId: 'test-task-456',
        finalResponse: '',
        success: false,
        cost: 0,
        duration: 1000,
        messagesCount: 3,
      };

      await logDebugMessages(SAMPLE_DEBUG_MESSAGES, metadata);

      const debugDir = join('.codex', 'debug');
      const dirExists = await fs
        .access(debugDir)
        .then(() => true)
        .catch(() => false);
      expect(dirExists).toBe(true);
    });

    it('should use custom debug path when provided', async () => {
      const metadata: DebugMetadata = {
        taskId: 'test-task-789',
        finalResponse: 'Custom path test',
        success: true,
        cost: 0.001,
        duration: 2000,
        messagesCount: 4,
      };

      const customPath = join('custom', 'debug', 'custom-debug.json');

      await logDebugMessages(SAMPLE_DEBUG_MESSAGES, metadata, {
        debugPath: customPath,
      });

      const exists = await fs
        .access(customPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      expect(mockConsoleLog).toHaveBeenCalledWith(`🐛 Debug log saved: ${customPath}`);
    });

    it('should include options in debug log when provided', async () => {
      const metadata: DebugMetadata = {
        taskId: 'test-task-with-options',
        finalResponse: 'Test with options',
        success: true,
        cost: 0.002,
        duration: 3000,
        messagesCount: 6,
        options: {
          prompt: 'Test prompt',
          maxTurns: 5,
          permissionMode: 'bypassPermissions',
        },
      };

      await logDebugMessages(SAMPLE_DEBUG_MESSAGES, metadata);

      const debugPath = join('.codex', 'debug', 'test-task-with-options-messages.json');
      const content = await fs.readFile(debugPath, 'utf-8');
      const debugLog = JSON.parse(content);

      expect(debugLog.options).toEqual({
        prompt: 'Test prompt',
        maxTurns: 5,
        permissionMode: 'bypassPermissions',
      });
    });

    it('should handle file write errors gracefully', async () => {
      const metadata: DebugMetadata = {
        taskId: 'test-task-error',
        finalResponse: 'Error test',
        success: true,
        cost: 0.001,
        duration: 1000,
        messagesCount: 2,
      };

      // Create a file with the same name as the directory we want to create
      const conflictPath = join('.codex');
      await fs.writeFile(conflictPath, 'conflict file');

      // This should fail to create the debug directory but not throw
      await expect(logDebugMessages(SAMPLE_DEBUG_MESSAGES, metadata)).resolves.not.toThrow();

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '⚠️  Failed to save debug log:',
        expect.any(Error)
      );
    });
  });

  describe('generateDebugFileName', () => {
    it('should generate correct debug file name format', () => {
      const taskId = 'task-1234567890-abcdef';
      const fileName = generateDebugFileName(taskId);

      expect(fileName).toBe('task-1234567890-abcdef-messages.json');
    });

    it('should handle simple task IDs', () => {
      const taskId = 'simple-task';
      const fileName = generateDebugFileName(taskId);

      expect(fileName).toBe('simple-task-messages.json');
    });
  });

  describe('loadDebugMessages', () => {
    it('should load debug messages from file', async () => {
      // Create a debug file
      const debugPath = join('.codex', 'debug', 'test-load-messages.json');
      await fs.mkdir(dirname(debugPath), { recursive: true });
      await fs.writeFile(debugPath, JSON.stringify(SAMPLE_DEBUG_LOG), 'utf-8');

      const debugLog = await loadDebugMessages(debugPath);

      expect(debugLog).toEqual(SAMPLE_DEBUG_LOG);
    });

    it('should throw error for non-existent file', async () => {
      const nonExistentPath = join('.codex', 'debug', 'non-existent.json');

      await expect(loadDebugMessages(nonExistentPath)).rejects.toThrow(
        `Failed to load debug messages from ${nonExistentPath}`
      );
    });

    it('should throw error for invalid JSON', async () => {
      const invalidJsonPath = join('.codex', 'debug', 'invalid.json');
      await fs.mkdir(dirname(invalidJsonPath), { recursive: true });
      await fs.writeFile(invalidJsonPath, 'invalid json content', 'utf-8');

      await expect(loadDebugMessages(invalidJsonPath)).rejects.toThrow(
        `Failed to load debug messages from ${invalidJsonPath}`
      );
    });
  });
});

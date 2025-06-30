import { describe, expect, test } from 'vitest';
import type { LogEntry } from '@claude-codex/types';
import { BashToolParser } from '../../src/parsers/bash-parser';

// Sample log entries based on legacy fixtures
const sampleToolUseEntry: LogEntry = {
  uuid: '49aa294a-2f12-4197-8478-127f9fc9d4b7',
  timestamp: '2025-06-25T18:20:11.465Z',
  parentUuid: 'dde3c669-70e7-46b7-8a83-8b4f9c26fad4',
  type: 'assistant',
  content: [
    {
      type: 'tool_use',
      id: 'toolu_01GPL8y2muQwUayJUmd8x2yz',
      name: 'Bash',
      input: {
        command: 'git log -1 --oneline',
        description: 'Check the most recent commit',
      },
    },
  ],
};

const sampleToolResultSuccess: LogEntry = {
  uuid: '2c1ad171-3778-4dcc-a644-1aea39b35d33',
  parentUuid: '49aa294a-2f12-4197-8478-127f9fc9d4b7',
  timestamp: '2025-06-25T18:20:11.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_01GPL8y2muQwUayJUmd8x2yz',
      output: {
        stdout:
          '5e122ce Merge dev into main: Template path resolution fix and release prep',
        stderr: '',
        exit_code: 0,
        interrupted: false,
      },
      is_error: false,
    },
  ],
};

const sampleToolResultError: LogEntry = {
  uuid: '4f513711-42e5-4898-9dbb-227ef091bc89',
  parentUuid: '680fa633-4de5-45b8-b282-5b365cd4ee46',
  timestamp: '2025-06-25T18:25:19.401Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_01CudWr2ghPSscWdhe6aZkUj',
      output: '(eval):cd:1: no such file or directory: claude-log-processor',
      is_error: true,
    },
  ],
};

describe('BashToolParser', () => {
  const parser = new BashToolParser();

  describe('canParse', () => {
    test('should identify bash tool use entries', () => {
      expect(parser.canParse(sampleToolUseEntry)).toBe(true);
    });

    test('should reject non-bash tool entries', () => {
      const nonBashEntry: LogEntry = {
        ...sampleToolUseEntry,
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'Edit',
            input: { file_path: 'test.ts' },
          },
        ],
      };
      expect(parser.canParse(nonBashEntry)).toBe(false);
    });

    test('should reject user messages', () => {
      const userEntry: LogEntry = {
        ...sampleToolUseEntry,
        type: 'user',
        content: 'Hello world',
      };
      expect(parser.canParse(userEntry)).toBe(false);
    });
  });

  describe('parse', () => {
    test('should parse successful command execution', () => {
      const result = parser.parse(sampleToolUseEntry, sampleToolResultSuccess);

      // Check base props
      expect(result.id).toBe('toolu_01GPL8y2muQwUayJUmd8x2yz');
      expect(result.uuid).toBe('49aa294a-2f12-4197-8478-127f9fc9d4b7');
      expect(result.timestamp).toBe('2025-06-25T18:20:11.465Z');

      // Check command props
      expect(result.command).toBe('git log -1 --oneline');
      expect(result.promptText).toBe('Check the most recent commit');
      expect(result.status.normalized).toBe('completed');
      expect(result.output).toContain(
        '5e122ce Merge dev into main: Template path resolution fix and release prep'
      );
      expect(result.exitCode).toBe(0);

      // Check UI props
      expect(result.showCopyButton).toBe(true);
      expect(result.showPrompt).toBe(true);
    });

    test('should parse failed command execution', () => {
      const errorEntry: LogEntry = {
        ...sampleToolUseEntry,
        content: [
          {
            type: 'tool_use',
            id: 'toolu_01CudWr2ghPSscWdhe6aZkUj',
            name: 'Bash',
            input: {
              command: 'cd claude-log-processor && bun install',
              description: 'Install dependencies',
            },
          },
        ],
      };

      const result = parser.parse(errorEntry, sampleToolResultError);

      expect(result.status.normalized).toBe('failed');
      expect(result.exitCode).toBe(1);
      expect(result.errorOutput).toBe(
        '(eval):cd:1: no such file or directory: claude-log-processor'
      );
    });

    test('should handle pending status when no result', () => {
      const result = parser.parse(sampleToolUseEntry);

      expect(result.status.normalized).toBe('pending');
      expect(result.output).toBeUndefined();
    });

    test('should handle timeout parameter', () => {
      const entryWithTimeout: LogEntry = {
        ...sampleToolUseEntry,
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'Bash',
            input: {
              command: 'sleep 5',
              description: 'Sleep for 5 seconds',
              timeout: 10000,
            },
          },
        ],
      };

      const result = parser.parse(entryWithTimeout);
      // Timeout is commented out in parser for now
      expect(result.command).toBe('sleep 5');
    });

    test('should handle string content normalization', () => {
      const stringContentEntry: LogEntry = {
        ...sampleToolUseEntry,
        content: 'Just a string',
      };

      expect(parser.canParse(stringContentEntry)).toBe(false);
    });

    test('should handle single object content normalization', () => {
      const singleObjectEntry: LogEntry = {
        ...sampleToolUseEntry,
        content: {
          type: 'tool_use',
          id: 'test-id',
          name: 'Bash',
          input: { command: 'ls' },
        },
      };

      expect(parser.canParse(singleObjectEntry)).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle missing description', () => {
      const noDescEntry: LogEntry = {
        ...sampleToolUseEntry,
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'Bash',
            input: {
              command: 'pwd',
            },
          },
        ],
      };

      const result = parser.parse(noDescEntry);
      expect(result.promptText).toBeUndefined();
    });

    test('should handle malformed output', () => {
      const malformedResult: LogEntry = {
        ...sampleToolResultSuccess,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_01GPL8y2muQwUayJUmd8x2yz',
            output: null,
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleToolUseEntry, malformedResult);
      expect(result.output).toContain('Unknown output format');
      expect(result.exitCode).toBe(1);
    });
  });

  describe('interrupted status handling', () => {
    test('should handle interrupted command execution', () => {
      const toolCall: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-tool-id',
            name: 'Bash',
            input: {
              command: 'sleep 30',
              description: 'Long running command that gets interrupted',
            },
          },
        ],
      };

      const toolResult: LogEntry = {
        uuid: 'result-uuid',
        parentUuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:12.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-tool-id',
            output: {
              stdout: '',
              stderr: 'Process interrupted',
              exit_code: 130, // Common exit code for interrupted processes
              interrupted: true,
            },
            is_error: true,
          },
        ],
      };

      const result = parser.parse(toolCall, toolResult);

      // Check that interrupted status is properly set
      expect(result.status.normalized).toBe('interrupted');
      expect(result.status.details?.interrupted).toBe(true);
      expect(result.interrupted).toBe(true);
      expect(result.exitCode).toBe(130);
      expect(result.errorOutput).toBe('Process interrupted');
    });

    test('should handle tools with no input gracefully', () => {
      const toolCall: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-tool-id',
            name: 'Bash',
            input: undefined, // No input
          },
        ],
      };

      const result = parser.parse(toolCall);

      // Should not throw, just have undefined values
      expect(result.command).toBeUndefined();
      expect(result.promptText).toBeUndefined();
      expect(result.status.normalized).toBe('pending');
    });

    test('should distinguish between failed and interrupted', () => {
      const toolCall: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-tool-id',
            name: 'Bash',
            input: {
              command: 'exit 1',
            },
          },
        ],
      };

      const failedResult: LogEntry = {
        uuid: 'result-uuid',
        parentUuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:12.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-tool-id',
            output: {
              stdout: '',
              stderr: 'Command failed',
              exit_code: 1,
              interrupted: false,
            },
            is_error: true,
          },
        ],
      };

      const result = parser.parse(toolCall, failedResult);

      // Should be failed, not interrupted
      expect(result.status.normalized).toBe('failed');
      expect(result.interrupted).toBe(false);
      expect(result.exitCode).toBe(1);
    });
  });
});

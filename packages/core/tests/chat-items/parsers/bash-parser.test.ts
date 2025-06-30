import { describe, expect, test } from 'bun:test';
import type { LogEntry } from '@claude-codex/types';
import { BashToolParser } from '../../../src/chat-items/parsers/bash-parser';

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

      expect(result.type).toBe('bash_tool');
      expect(result.id).toBe('toolu_01GPL8y2muQwUayJUmd8x2yz');
      expect(result.timestamp).toBe('2025-06-25T18:20:11.465Z');
      expect(result.content.command).toBe('git log -1 --oneline');
      expect(result.content.description).toBe('Check the most recent commit');
      expect(result.content.status).toBe('completed');
      expect(result.content.output).toEqual({
        stdout:
          '5e122ce Merge dev into main: Template path resolution fix and release prep',
        stderr: '',
        exitCode: 0,
        isError: false,
        interrupted: false,
      });
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

      expect(result.type).toBe('bash_tool');
      expect(result.content.status).toBe('failed');
      expect(result.content.output?.isError).toBe(true);
      expect(result.content.output?.stderr).toBe(
        '(eval):cd:1: no such file or directory: claude-log-processor'
      );
    });

    test('should handle pending status when no result', () => {
      const result = parser.parse(sampleToolUseEntry);

      expect(result.content.status).toBe('pending');
      expect(result.content.output).toBeUndefined();
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
      expect(result.content.timeout).toBe(10000);
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
      expect(result.content.description).toBeUndefined();
    });

    test('should handle malformed output', () => {
      const malformedResult: LogEntry = {
        ...sampleToolResultSuccess,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-id',
            output: null,
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleToolUseEntry, malformedResult);
      expect(result.content.output).toEqual({
        stdout: '',
        stderr: 'Unknown output format',
        exitCode: 1,
        isError: true,
        interrupted: false,
      });
    });
  });
});

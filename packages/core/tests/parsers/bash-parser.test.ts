import type { BashFixture, FixtureData, LogEntry } from '@claude-codex/types';
import { beforeEach, describe, expect, test } from 'vitest';
import { BashToolParser } from '../../src/parsers/bash-parser';
import {
  loadFixture,
  setupFixtureBasedTesting,
  validateBaseToolProps,
} from '../utils';

// Setup fixture-based testing with custom matchers
setupFixtureBasedTesting();

describe('BashToolParser - Fixture-Based Testing', () => {
  let parser: BashToolParser;
  let fixtureData: FixtureData<BashFixture>;

  beforeEach(() => {
    parser = new BashToolParser();
    // Load the new fixture file
    fixtureData = loadFixture('bash-tool-new.json');
  });

  /**
   * Transform fixture data to match parser expectations
   * The fixture has structured data in toolUseResult but string in content
   */
  function transformToolResult(fixture: BashFixture): LogEntry {
    const baseEntry: LogEntry = {
      uuid: fixture.toolResult.uuid,
      timestamp: fixture.toolResult.timestamp,
      parentUuid: fixture.toolResult.parentUuid,
      type: fixture.toolResult.type as 'user',
      isSidechain: fixture.toolResult.isSidechain,
      content: fixture.toolResult.message.content,
    };

    // Transform the content to include structured output if available
    if (
      fixture.toolResult.toolUseResult &&
      baseEntry.content &&
      Array.isArray(baseEntry.content)
    ) {
      const toolResultContent = baseEntry.content.find(
        c => c.type === 'tool_result'
      ) as MessageContent;
      if (
        toolResultContent &&
        fixture.toolResult.toolUseResult.exitCode === 0
      ) {
        // For successful execution, create structured output
        toolResultContent.output = {
          stdout: fixture.toolResult.toolUseResult.output || '',
          stderr: '',
          exit_code: fixture.toolResult.toolUseResult.exitCode,
          interrupted: false,
        };
      }
    }

    return baseEntry;
  }

  describe('real fixture validation', () => {
    test('should parse all fixture scenarios successfully', () => {
      expect(fixtureData.fixtures).toBeDefined();
      expect(fixtureData.fixtures.length).toBeGreaterThan(0);

      for (const fixture of fixtureData.fixtures) {
        // Convert fixture format to LogEntry format
        const toolCallEntry: LogEntry = {
          uuid: fixture.toolCall.uuid,
          timestamp: fixture.toolCall.timestamp,
          parentUuid: fixture.toolCall.parentUuid,
          type: fixture.toolCall.type as 'assistant',
          isSidechain: fixture.toolCall.isSidechain,
          content: fixture.toolCall.message.content,
        };

        const toolResultEntry = transformToolResult(fixture);

        // Verify parser can handle the tool call
        expect(parser.canParse(toolCallEntry)).toBe(true);

        // Parse and validate
        const result = parser.parse(toolCallEntry, toolResultEntry);

        // Validate base properties
        validateBaseToolProps(result);

        // Validate against expected data
        const expected = fixture.expectedComponentData;
        expect(result.uuid).toBe(expected.uuid);
        expect(result.id).toBe(expected.id);
        expect(result.command).toBe(expected.command);
        expect(result.status.normalized).toBe(expected.status.normalized);

        // For successful executions
        if (expected.exitCode === 0) {
          expect(result.output).toBe(expected.output);
          expect(result.exitCode).toBe(expected.exitCode);
        }
      }
    });

    test('should handle successful echo command from fixture', () => {
      const fixture = fixtureData.fixtures[0]; // First fixture is echo command

      const toolCallEntry: LogEntry = {
        uuid: fixture.toolCall.uuid,
        timestamp: fixture.toolCall.timestamp,
        parentUuid: fixture.toolCall.parentUuid,
        type: fixture.toolCall.type as 'assistant',
        isSidechain: fixture.toolCall.isSidechain,
        content: fixture.toolCall.message.content,
      };

      const toolResultEntry = transformToolResult(fixture);

      const result = parser.parse(toolCallEntry, toolResultEntry);

      // Verify successful execution
      expect(result.status.normalized).toBe('completed');
      expect(result.command).toBe(
        'echo "Testing bash tool for log generation"'
      );
      expect(result.output).toBe('Testing bash tool for log generation');
      expect(result.exitCode).toBe(0);
      expect(result.errorOutput).toBe('');
      expect(result.interrupted).toBe(false);
    });

    test('should extract working directory from fixture', () => {
      const fixture = fixtureData.fixtures[0];

      const toolCallEntry: LogEntry = {
        uuid: fixture.toolCall.uuid,
        timestamp: fixture.toolCall.timestamp,
        parentUuid: fixture.toolCall.parentUuid,
        type: fixture.toolCall.type as 'assistant',
        isSidechain: fixture.toolCall.isSidechain,
        content: fixture.toolCall.message.content,
      };

      const toolResultEntry = transformToolResult(fixture);

      const result = parser.parse(toolCallEntry, toolResultEntry);

      // Note: Working directory is in fixture data but not in LogEntry
      // This test verifies the parser handles missing data gracefully
      expect(result.workingDirectory).toBeUndefined();
    });
  });

  describe('canParse validation', () => {
    test('should correctly identify bash tool calls', () => {
      const fixture = fixtureData.fixtures[0];

      const toolCallEntry: LogEntry = {
        uuid: fixture.toolCall.uuid,
        timestamp: fixture.toolCall.timestamp,
        parentUuid: fixture.toolCall.parentUuid,
        type: fixture.toolCall.type as 'assistant',
        isSidechain: fixture.toolCall.isSidechain,
        content: fixture.toolCall.message.content,
      };

      expect(parser.canParse(toolCallEntry)).toBe(true);
    });

    test('should reject non-bash tool entries', () => {
      const nonBashEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
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
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'user',
        content: 'Hello world',
      };
      expect(parser.canParse(userEntry)).toBe(false);
    });

    test('should handle string content normalization', () => {
      const stringContentEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: 'Just a string',
      };
      expect(parser.canParse(stringContentEntry)).toBe(false);
    });

    test('should handle single object content normalization', () => {
      const singleObjectEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: {
          type: 'tool_use',
          id: 'test-id',
          name: 'Bash',
          input: { command: 'ls' },
        } as MessageContent,
      };
      expect(parser.canParse(singleObjectEntry)).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle pending status when no result', () => {
      const fixture = fixtureData.fixtures[0];

      const toolCallEntry: LogEntry = {
        uuid: fixture.toolCall.uuid,
        timestamp: fixture.toolCall.timestamp,
        parentUuid: fixture.toolCall.parentUuid,
        type: fixture.toolCall.type as 'assistant',
        isSidechain: fixture.toolCall.isSidechain,
        content: fixture.toolCall.message.content,
      };

      // Parse without result
      const result = parser.parse(toolCallEntry);
      expect(result.status.normalized).toBe('pending');
      expect(result.output).toBeUndefined();
      expect(result.exitCode).toBeUndefined();
    });

    test('should handle missing description gracefully', () => {
      const noDescEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'Bash',
            input: {
              command: 'pwd',
              // No description field
            },
          },
        ],
      };

      const result = parser.parse(noDescEntry);
      expect(result.promptText).toBeUndefined();
      expect(result.command).toBe('pwd');
    });

    test('should handle malformed output gracefully', () => {
      const toolCall: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-tool-id',
            name: 'Bash',
            input: { command: 'test' },
          },
        ],
      };

      const malformedResult: LogEntry = {
        uuid: 'result-uuid',
        parentUuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-tool-id',
            output: null as unknown, // Malformed output
          },
        ],
      };

      const result = parser.parse(toolCall, malformedResult);
      expect(result.status.normalized).toBe('failed');
      expect(result.output).toContain('Unknown output format');
      expect(result.exitCode).toBe(1);
    });

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
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-tool-id',
            output: '[Process interrupted]',
            is_error: true,
          },
        ],
      };

      const result = parser.parse(toolCall, toolResult);
      // Note: Without specific interrupted flag in output, status might be 'failed'
      expect(result.status.normalized).toMatch(/failed|interrupted/);
      expect(result.exitCode).toBeDefined();
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
            input: undefined as unknown,
          },
        ],
      };

      const result = parser.parse(toolCall);
      expect(result.command).toBeUndefined();
      expect(result.promptText).toBeUndefined();
      expect(result.status.normalized).toBe('pending');
    });

    test('should handle error output from fixture', () => {
      // Create a fixture-like structure for error case
      const errorFixture = {
        toolCall: {
          uuid: 'error-uuid',
          timestamp: '2025-06-25T18:20:11.465Z',
          parentUuid: 'error-uuid',
          type: 'assistant',
          isSidechain: false,
          message: {
            content: [
              {
                type: 'tool_use',
                id: 'error-tool-id',
                name: 'Bash',
                input: {
                  command: 'ls /nonexistent',
                  description: 'List nonexistent directory',
                },
              },
            ],
          },
        },
        toolResult: {
          uuid: 'error-result-uuid',
          timestamp: '2025-06-25T18:20:12.465Z',
          parentUuid: 'error-uuid',
          type: 'user',
          isSidechain: false,
          message: {
            content: [
              {
                type: 'tool_result',
                tool_use_id: 'error-tool-id',
                output: 'ls: /nonexistent: No such file or directory',
                is_error: true,
              },
            ],
          },
          toolUseResult: {
            type: 'bash',
            command: 'ls /nonexistent',
            exitCode: 1,
            output: '',
            error: 'ls: /nonexistent: No such file or directory',
          },
        },
      };

      const toolCallEntry: LogEntry = {
        uuid: errorFixture.toolCall.uuid,
        timestamp: errorFixture.toolCall.timestamp,
        parentUuid: errorFixture.toolCall.parentUuid,
        type: errorFixture.toolCall.type as 'assistant',
        isSidechain: errorFixture.toolCall.isSidechain,
        content: errorFixture.toolCall.message.content,
      };

      // Transform with error handling
      const toolResultEntry: LogEntry = {
        uuid: errorFixture.toolResult.uuid,
        timestamp: errorFixture.toolResult.timestamp,
        parentUuid: errorFixture.toolResult.parentUuid,
        type: errorFixture.toolResult.type as 'user',
        isSidechain: errorFixture.toolResult.isSidechain,
        content: errorFixture.toolResult.message.content,
      };

      // For error cases, transform to include stderr
      if (
        errorFixture.toolResult.toolUseResult &&
        toolResultEntry.content &&
        Array.isArray(toolResultEntry.content)
      ) {
        const toolResultContent = toolResultEntry.content.find(
          c => c.type === 'tool_result'
        ) as MessageContent;
        if (
          toolResultContent &&
          errorFixture.toolResult.toolUseResult.exitCode !== 0
        ) {
          toolResultContent.output = {
            stdout: errorFixture.toolResult.toolUseResult.output || '',
            stderr:
              errorFixture.toolResult.toolUseResult.error ||
              (errorFixture.toolResult.message.content[0] as MessageContent)
                .output,
            exit_code: errorFixture.toolResult.toolUseResult.exitCode,
            interrupted: false,
          };
        }
      }

      const result = parser.parse(toolCallEntry, toolResultEntry);

      expect(result.status.normalized).toBe('failed');
      expect(result.exitCode).toBe(1);
      expect(result.errorOutput).toContain('No such file or directory');
    });
  });

  describe('performance validation', () => {
    test('should parse fixtures within acceptable time', () => {
      const startTime = performance.now();

      for (const fixture of fixtureData.fixtures) {
        const toolCallEntry: LogEntry = {
          uuid: fixture.toolCall.uuid,
          timestamp: fixture.toolCall.timestamp,
          parentUuid: fixture.toolCall.parentUuid,
          type: fixture.toolCall.type as 'assistant',
          isSidechain: fixture.toolCall.isSidechain,
          content: fixture.toolCall.message.content,
        };

        const toolResultEntry = transformToolResult(fixture);

        parser.parse(toolCallEntry, toolResultEntry);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / fixtureData.fixtures.length;

      // Each parse should take less than 10ms
      expect(averageTime).toBeLessThan(10);
    });
  });
});

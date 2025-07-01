import type { LogEntry, MessageContent } from '@claude-codex/types';
import { beforeEach, describe, expect, test } from 'vitest';
import { ReadToolParser } from '../../src/parsers/read-parser';
import {
  loadFixture,
  setupFixtureBasedTesting,
  validateBaseToolProps,
} from '../utils';

// Setup fixture-based testing with custom matchers
setupFixtureBasedTesting();

interface ReadFixture {
  toolCall: {
    uuid: string;
    timestamp: string;
    parentUuid: string;
    type: string;
    isSidechain: boolean;
    message: {
      content: MessageContent[];
    };
  };
  toolResult: {
    uuid: string;
    timestamp: string;
    parentUuid: string;
    type: string;
    isSidechain: boolean;
    message: {
      content: MessageContent[];
    };
    toolUseResult?: {
      type: string;
      file: {
        filePath: string;
        content: string;
        numLines: number;
        startLine: number;
        totalLines: number;
      };
    };
  };
  expectedComponentData: {
    id: string;
    uuid: string;
    parentUuid: string;
    timestamp: string;
    status: {
      normalized: string;
      original: string;
    };
    filePath: string;
    content: string;
    totalLines: number;
    fileType: string;
    truncated: boolean;
    language: string;
  };
}

interface ReadFixtureData {
  fixtures: ReadFixture[];
}

describe('ReadToolParser - Fixture-Based Testing', () => {
  let parser: ReadToolParser;
  let fixtureData: ReadFixtureData;

  beforeEach(() => {
    parser = new ReadToolParser();
    // Load the new fixture file
    fixtureData = loadFixture('read-tool-new.json');
  });

  /**
   * Transform fixture data to match parser expectations
   */
  function transformToolCall(fixture: ReadFixture): LogEntry {
    return {
      uuid: fixture.toolCall.uuid,
      timestamp: fixture.toolCall.timestamp,
      parentUuid: fixture.toolCall.parentUuid,
      type: fixture.toolCall.type as 'assistant',
      isSidechain: fixture.toolCall.isSidechain,
      content: fixture.toolCall.message.content,
    };
  }

  function transformToolResult(fixture: ReadFixture): LogEntry {
    const baseEntry: LogEntry = {
      uuid: fixture.toolResult.uuid,
      timestamp: fixture.toolResult.timestamp,
      parentUuid: fixture.toolResult.parentUuid,
      type: fixture.toolResult.type as 'user',
      isSidechain: fixture.toolResult.isSidechain,
      content: fixture.toolResult.message.content,
    };

    return baseEntry;
  }

  describe('real fixture validation', () => {
    test('should parse all fixture scenarios successfully', () => {
      expect(fixtureData.fixtures).toBeDefined();
      expect(fixtureData.fixtures.length).toBeGreaterThan(0);

      for (const fixture of fixtureData.fixtures) {
        // Convert fixture format to LogEntry format
        const toolCallEntry = transformToolCall(fixture);
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
        expect(result.status.normalized).toBe(expected.status.normalized);

        // Validate file properties
        expect(result.filePath).toBe(expected.filePath);
        // Content might have extra newline at end, so trim for comparison
        expect(result.content.trim()).toBe(expected.content.trim());
        expect(result.totalLines).toBe(expected.totalLines);
        // Parser maps txt to plaintext
        if (expected.fileType === 'txt') {
          expect(result.fileType).toBe('plaintext');
        } else {
          expect(result.fileType).toBe(expected.fileType);
        }
        expect(result.truncated).toBe(expected.truncated);
      }
    });

    test('should parse successful read operation from fixture', () => {
      const fixture = fixtureData.fixtures[0];
      const toolCallEntry = transformToolCall(fixture);
      const toolResultEntry = transformToolResult(fixture);

      const result = parser.parse(toolCallEntry, toolResultEntry);

      expect(result.filePath).toBe(
        '/Users/abuusama/Desktop/temp/test-data/sample.txt'
      );
      expect(result.content).toContain(
        'This is a sample text file for testing'
      );
      expect(result.content).toContain('End of test file.');
      expect(result.totalLines).toBe(12);
      expect(result.fileType).toBe('plaintext');
      expect(result.status.normalized).toBe('completed');
    });

    test('should handle line-numbered content from fixture', () => {
      const fixture = fixtureData.fixtures[0];
      const toolCallEntry = transformToolCall(fixture);
      const toolResultEntry = transformToolResult(fixture);

      const result = parser.parse(toolCallEntry, toolResultEntry);

      // The fixture has line numbers in the tool result content
      // Parser should strip them
      expect(result.content).not.toContain('     1→');
      expect(result.content).toContain(
        'This is a sample text file for testing'
      );
    });
  });

  describe('canParse validation', () => {
    test('should correctly identify Read tool calls', () => {
      const entry: LogEntry = {
        type: 'assistant',
        uuid: 'test-uuid',
        timestamp: '2025-01-01T00:00:00Z',
        content: [
          {
            type: 'tool_use',
            id: 'test-tool-id',
            name: 'Read',
            input: { file_path: '/path/to/file.txt' },
          },
        ],
      };

      expect(parser.canParse(entry)).toBe(true);
    });

    test('should reject non-Read tool entries', () => {
      const entry: LogEntry = {
        type: 'assistant',
        uuid: 'test-uuid',
        timestamp: '2025-01-01T00:00:00Z',
        content: [
          {
            type: 'tool_use',
            id: 'test-tool-id',
            name: 'Write',
            input: { file_path: '/path/to/file.txt', content: 'data' },
          },
        ],
      };

      expect(parser.canParse(entry)).toBe(false);
    });

    test('should reject user messages', () => {
      const entry: LogEntry = {
        type: 'user',
        uuid: 'test-uuid',
        timestamp: '2025-01-01T00:00:00Z',
        content: 'Read the file please',
      };

      expect(parser.canParse(entry)).toBe(false);
    });

    test('should handle string content normalization', () => {
      const entry: LogEntry = {
        type: 'assistant',
        uuid: 'test-uuid',
        timestamp: '2025-01-01T00:00:00Z',
        content: 'I will read the file',
      };

      expect(parser.canParse(entry)).toBe(false);
    });

    test('should handle single object content normalization', () => {
      const entry: LogEntry = {
        type: 'assistant',
        uuid: 'test-uuid',
        timestamp: '2025-01-01T00:00:00Z',
        content: {
          type: 'tool_use',
          id: 'test-tool-id',
          name: 'Read',
          input: { file_path: '/test.txt' },
        } as MessageContent,
      };

      expect(parser.canParse(entry)).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle pending status when no result', () => {
      const fixture = fixtureData.fixtures[0];
      const toolCallEntry = transformToolCall(fixture);

      const result = parser.parse(toolCallEntry);

      expect(result.status.normalized).toBe('pending');
      expect(result.content).toBe('');
    });

    test('should handle missing file path parameter', () => {
      const entry: LogEntry = {
        type: 'assistant',
        uuid: 'test-uuid',
        timestamp: '2025-01-01T00:00:00Z',
        content: [
          {
            type: 'tool_use',
            id: 'test-tool-id',
            name: 'Read',
            input: {},
          },
        ],
      };

      const result = parser.parse(entry);
      expect(result.filePath).toBe('');
    });

    test('should handle tools with no input gracefully', () => {
      const entry: LogEntry = {
        type: 'assistant',
        uuid: 'test-uuid',
        timestamp: '2025-01-01T00:00:00Z',
        content: [
          {
            type: 'tool_use',
            id: 'test-tool-id',
            name: 'Read',
            input: undefined,
          },
        ],
      };

      const result = parser.parse(entry);
      expect(result.filePath).toBe('');
    });

    test('should handle error output', () => {
      const toolCall: LogEntry = {
        type: 'assistant',
        uuid: 'test-uuid',
        timestamp: '2025-01-01T00:00:00Z',
        content: [
          {
            type: 'tool_use',
            id: 'test-tool-id',
            name: 'Read',
            input: { file_path: '/nonexistent/file.txt' },
          },
        ],
      };

      const toolResult: LogEntry = {
        type: 'user',
        uuid: 'result-uuid',
        timestamp: '2025-01-01T00:00:01Z',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-tool-id',
            is_error: true,
            text: 'Error: File not found',
          },
        ],
      };

      const result = parser.parse(toolCall, toolResult);
      expect(result.status.normalized).toBe('failed');
      expect(result.errorMessage).toBe('Error: File not found');
    });

    test('should handle file with no lines', () => {
      const toolCall: LogEntry = {
        type: 'assistant',
        uuid: 'test-uuid',
        timestamp: '2025-01-01T00:00:00Z',
        content: [
          {
            type: 'tool_use',
            id: 'test-tool-id',
            name: 'Read',
            input: { file_path: '/empty.txt' },
          },
        ],
      };

      const toolResult: LogEntry = {
        type: 'user',
        uuid: 'result-uuid',
        timestamp: '2025-01-01T00:00:01Z',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-tool-id',
            text: '',
          },
        ],
      };

      const result = parser.parse(toolCall, toolResult);
      expect(result.content).toBe('');
      expect(result.totalLines).toBe(0);
    });

    test('should parse line-numbered output format', () => {
      const toolCall: LogEntry = {
        type: 'assistant',
        uuid: 'test-uuid',
        timestamp: '2025-01-01T00:00:00Z',
        content: [
          {
            type: 'tool_use',
            id: 'test-tool-id',
            name: 'Read',
            input: { file_path: '/test.py' },
          },
        ],
      };

      const toolResult: LogEntry = {
        type: 'user',
        uuid: 'result-uuid',
        timestamp: '2025-01-01T00:00:01Z',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-tool-id',
            text:
              '     1→def hello():\n     2→    print("Hello")\n     3→\n     4→hello()',
          },
        ],
      };

      const result = parser.parse(toolCall, toolResult);
      expect(result.content).toBe(
        'def hello():\n    print("Hello")\n\nhello()'
      );
      expect(result.totalLines).toBe(4);
      expect(result.fileType).toBe('python');
    });
  });

  describe('file type inference', () => {
    test('should correctly infer various file types', () => {
      const testCases = [
        { path: '/test.js', expected: 'javascript' },
        { path: '/test.ts', expected: 'typescript' },
        { path: '/test.py', expected: 'python' },
        { path: '/test.md', expected: 'markdown' },
        { path: '/test.json', expected: 'json' },
        { path: '/test.unknown', expected: 'plaintext' },
        { path: '/test', expected: 'plaintext' },
      ];

      for (const { path, expected } of testCases) {
        const entry: LogEntry = {
          type: 'assistant',
          uuid: 'test-uuid',
          timestamp: '2025-01-01T00:00:00Z',
          content: [
            {
              type: 'tool_use',
              id: 'test-tool-id',
              name: 'Read',
              input: { file_path: path },
            },
          ],
        };

        const result = parser.parse(entry);
        expect(result.fileType).toBe(expected);
      }
    });
  });

  describe('feature support', () => {
    test('should declare supported features', () => {
      const metadata = parser.getMetadata();
      expect(metadata.supportedFeatures).toContain('basic-parsing');
      expect(metadata.supportedFeatures).toContain('status-mapping');
      expect(metadata.supportedFeatures).toContain('file-type-inference');
      expect(metadata.supportedFeatures).toContain('line-counting');
    });
  });

  describe('performance validation', () => {
    test('should parse fixtures within acceptable time', () => {
      const fixture = fixtureData.fixtures[0];
      const toolCallEntry = transformToolCall(fixture);
      const toolResultEntry = transformToolResult(fixture);

      const startTime = performance.now();
      parser.parse(toolCallEntry, toolResultEntry);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // Should parse in under 10ms
    });
  });
});

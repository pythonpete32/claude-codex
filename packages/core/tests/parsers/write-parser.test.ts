import type { LogEntry, MessageContent } from '@claude-codex/types';
import { beforeEach, describe, expect, test } from 'vitest';
import { WriteToolParser } from '../../src/parsers/write-parser';
import {
  loadFixture,
  setupFixtureBasedTesting,
  validateBaseToolProps,
} from '../utils';

// Setup fixture-based testing with custom matchers
setupFixtureBasedTesting();

interface WriteFixture {
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
      filePath: string;
      content: string;
      structuredPatch: unknown[]; // SOT compliant: was any[]
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
    created: boolean;
    overwritten: boolean;
    fileType: string;
  };
}

interface WriteFixtureData {
  fixtures: WriteFixture[];
}

describe('WriteToolParser - Fixture-Based Testing', () => {
  let parser: WriteToolParser;
  let fixtureData: WriteFixtureData;

  beforeEach(() => {
    parser = new WriteToolParser();
    // Load the new fixture file
    fixtureData = loadFixture('write-tool-new.json');
  });

  /**
   * Transform fixture data to match parser expectations
   */
  function transformToolCall(fixture: WriteFixture): LogEntry {
    return {
      uuid: fixture.toolCall.uuid,
      timestamp: fixture.toolCall.timestamp,
      parentUuid: fixture.toolCall.parentUuid,
      type: fixture.toolCall.type as 'assistant',
      isSidechain: fixture.toolCall.isSidechain,
      content: fixture.toolCall.message.content,
    };
  }

  function transformToolResult(fixture: WriteFixture): LogEntry {
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
        // Content comparison - fixture might have truncated content
        expect(result.content).toContain('# Claude Code Tools Documentation');
        expect(result.created).toBe(expected.created);
        expect(result.overwritten).toBe(expected.overwritten);
        // Parser maps md to markdown
        if (expected.fileType === 'md') {
          expect(result.fileType).toBe('markdown');
        } else {
          expect(result.fileType).toBe(expected.fileType);
        }
      }
    });

    test('should parse successful write operation from fixture', () => {
      const fixture = fixtureData.fixtures[0];
      const toolCallEntry = transformToolCall(fixture);
      const toolResultEntry = transformToolResult(fixture);

      const result = parser.parse(toolCallEntry, toolResultEntry);

      expect(result.filePath).toBe(
        '/Users/abuusama/Desktop/temp/test-data/claude-tools-documentation.md'
      );
      expect(result.content).toContain('# Claude Code Tools Documentation');
      expect(result.content).toContain('## Built-in Tools');
      expect(result.created).toBe(true);
      expect(result.overwritten).toBe(false);
      expect(result.fileType).toBe('markdown');
      expect(result.status.normalized).toBe('completed');
    });

    test('should extract operation info from result message', () => {
      const fixture = fixtureData.fixtures[0];
      const toolCallEntry = transformToolCall(fixture);
      const toolResultEntry = transformToolResult(fixture);

      const result = parser.parse(toolCallEntry, toolResultEntry);

      // Parser should extract created status from result message
      expect(result.created).toBe(true);
      expect(result.overwritten).toBe(false);
    });
  });

  describe('canParse validation', () => {
    test('should correctly identify Write tool calls', () => {
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

      expect(parser.canParse(entry)).toBe(true);
    });

    test('should reject non-Write tool entries', () => {
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

      expect(parser.canParse(entry)).toBe(false);
    });

    test('should reject user messages', () => {
      const entry: LogEntry = {
        type: 'user',
        uuid: 'test-uuid',
        timestamp: '2025-01-01T00:00:00Z',
        content: 'Write the file please',
      };

      expect(parser.canParse(entry)).toBe(false);
    });

    test('should handle string content normalization', () => {
      const entry: LogEntry = {
        type: 'assistant',
        uuid: 'test-uuid',
        timestamp: '2025-01-01T00:00:00Z',
        content: 'I will write the file',
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
          name: 'Write',
          input: { file_path: '/test.txt', content: 'data' },
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
      expect(result.created).toBe(false);
      expect(result.overwritten).toBe(false);
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
            name: 'Write',
            input: { content: 'data' },
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
            name: 'Write',
            input: undefined,
          },
        ],
      };

      const result = parser.parse(entry);
      expect(result.filePath).toBe('');
      expect(result.content).toBe('');
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
            name: 'Write',
            input: { file_path: '/readonly/file.txt', content: 'data' },
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
            text: 'Error: Permission denied',
          },
        ],
      };

      const result = parser.parse(toolCall, toolResult);
      expect(result.status.normalized).toBe('failed');
      expect(result.errorMessage).toBe('Error: Permission denied');
    });

    test('should parse created file message', () => {
      const toolCall: LogEntry = {
        type: 'assistant',
        uuid: 'test-uuid',
        timestamp: '2025-01-01T00:00:00Z',
        content: [
          {
            type: 'tool_use',
            id: 'test-tool-id',
            name: 'Write',
            input: { file_path: '/new.txt', content: 'data' },
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
            text: 'File created successfully at: /new.txt',
          },
        ],
      };

      const result = parser.parse(toolCall, toolResult);
      expect(result.created).toBe(true);
      expect(result.overwritten).toBe(false);
    });

    test('should parse overwritten file message', () => {
      const toolCall: LogEntry = {
        type: 'assistant',
        uuid: 'test-uuid',
        timestamp: '2025-01-01T00:00:00Z',
        content: [
          {
            type: 'tool_use',
            id: 'test-tool-id',
            name: 'Write',
            input: { file_path: '/existing.txt', content: 'new data' },
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
            text: 'File updated successfully at: /existing.txt',
          },
        ],
      };

      const result = parser.parse(toolCall, toolResult);
      expect(result.created).toBe(false);
      expect(result.overwritten).toBe(true);
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
              name: 'Write',
              input: { file_path: path, content: 'data' },
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
      expect(metadata.supportedFeatures).toContain(
        'create-overwrite-detection'
      );
      expect(metadata.supportedFeatures).toContain('file-type-inference');
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

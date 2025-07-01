import type {
  EditFixture,
  FixtureData,
  LogEntry,
  MessageContent,
} from '@claude-codex/types';
import { beforeEach, describe, expect, test } from 'vitest';
import { EditToolParser } from '../../src/parsers/edit-parser';
import {
  loadFixture,
  setupFixtureBasedTesting,
  validateBaseToolProps,
} from '../utils';

// Setup fixture-based testing with custom matchers
setupFixtureBasedTesting();

describe('EditToolParser - Fixture-Based Testing', () => {
  let parser: EditToolParser;
  let fixtureData: FixtureData<EditFixture>;

  beforeEach(() => {
    parser = new EditToolParser();
    // Load the new fixture file
    fixtureData = loadFixture('edit-tool-new.json');
  });

  /**
   * Transform fixture data to match parser expectations
   * The fixture has detailed metadata that needs proper transformation
   */
  function transformToolCall(fixture: EditFixture): LogEntry {
    return {
      uuid: fixture.toolCall.uuid,
      timestamp: fixture.toolCall.timestamp,
      parentUuid: fixture.toolCall.parentUuid,
      type: fixture.toolCall.type as 'assistant',
      isSidechain: fixture.toolCall.isSidechain,
      content: fixture.toolCall.message.content,
    };
  }

  function transformToolResult(fixture: EditFixture): LogEntry {
    return {
      uuid: fixture.toolResult.uuid,
      timestamp: fixture.toolResult.timestamp,
      parentUuid: fixture.toolResult.parentUuid,
      type: fixture.toolResult.type as 'user',
      isSidechain: fixture.toolResult.isSidechain,
      content: fixture.toolResult.message.content,
    };
  }

  describe('real fixture validation', () => {
    test('should parse all fixture scenarios successfully', () => {
      expect(fixtureData.fixtures).toBeDefined();
      expect(fixtureData.fixtures.length).toBeGreaterThan(0);

      for (const fixture of fixtureData.fixtures) {
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
        expect(result.filePath).toBe(expected.filePath);
        expect(result.status.normalized).toBe(expected.status.normalized);
        // Note: mapFromError returns 'success' for original when no error, not 'completed'
        expect(result.status.original).toBe('success');
      }
    });

    test('should parse successful edit operation from fixture', () => {
      const fixture = fixtureData.fixtures[0]; // First fixture is a successful edit

      const toolCallEntry = transformToolCall(fixture);
      const toolResultEntry = transformToolResult(fixture);

      const result = parser.parse(toolCallEntry, toolResultEntry);

      // Verify successful execution
      expect(result.status.normalized).toBe('completed');
      expect(result.filePath).toBe(
        '/Users/abuusama/Desktop/temp/test-data/sample.txt'
      );
      expect(result.oldContent).toBe('This is a sample text file for testing.');
      expect(result.newContent).toBe(
        'This is a sample text file for testing tools and operations.'
      );

      // Verify diff is generated
      expect(result.diff).toBeDefined();
      expect(Array.isArray(result.diff)).toBe(true);
      expect(result.diff!.length).toBeGreaterThan(0);
    });

    test('should extract all edit details from fixture', () => {
      const fixture = fixtureData.fixtures[0];

      const toolCallEntry = transformToolCall(fixture);
      const toolResultEntry = transformToolResult(fixture);

      const result = parser.parse(toolCallEntry, toolResultEntry);

      // Verify file type inference
      expect(result.fileType).toBe('plaintext'); // .txt file

      // Verify UI helpers
      expect(result.showLineNumbers).toBe(true);
      expect(result.wordWrap).toBe(false);
    });
  });

  describe('canParse validation', () => {
    test('should correctly identify Edit tool calls', () => {
      const fixture = fixtureData.fixtures[0];
      const toolCallEntry = transformToolCall(fixture);
      expect(parser.canParse(toolCallEntry)).toBe(true);
    });

    test('should reject non-Edit tool entries', () => {
      const nonEditEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'MultiEdit',
            input: { file_path: 'test.ts' },
          },
        ],
      };
      expect(parser.canParse(nonEditEntry)).toBe(false);
    });

    test('should reject user messages', () => {
      const userEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'user',
        content: 'Edit this file',
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
          name: 'Edit',
          input: {
            file_path: 'test.ts',
            old_string: 'old',
            new_string: 'new',
          },
        } as MessageContent,
      };
      expect(parser.canParse(singleObjectEntry)).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle pending status when no result', () => {
      const fixture = fixtureData.fixtures[0];
      const toolCallEntry = transformToolCall(fixture);

      // Parse without result
      const result = parser.parse(toolCallEntry);
      expect(result.status.normalized).toBe('pending');
      expect(result.filePath).toBe(
        '/Users/abuusama/Desktop/temp/test-data/sample.txt'
      );
      expect(result.content).toBe(
        'This is a sample text file for testing tools and operations.'
      );
    });

    test('should handle missing file path gracefully', () => {
      const noPathEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'Edit',
            input: {
              old_string: 'old',
              new_string: 'new',
            },
          },
        ],
      };

      const result = parser.parse(noPathEntry);
      expect(result.filePath).toBeUndefined();
      expect(result.oldContent).toBe('old');
      expect(result.newContent).toBe('new');
      expect(result.fileType).toBe('plaintext'); // default when no path
    });

    test('should handle missing old/new strings gracefully', () => {
      const missingStringsEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'Edit',
            input: {
              file_path: '/test/file.ts',
            },
          },
        ],
      };

      const result = parser.parse(missingStringsEntry);
      expect(result.oldContent).toBeUndefined();
      expect(result.newContent).toBeUndefined();
      expect(result.diff).toBeDefined(); // Should still generate a diff even with empty content
      expect(result.fileType).toBe('typescript'); // inferred from .ts extension
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
            name: 'Edit',
            input: undefined as any,
          },
        ],
      };

      const result = parser.parse(toolCall);
      expect(result.filePath).toBeUndefined();
      expect(result.oldContent).toBeUndefined();
      expect(result.newContent).toBeUndefined();
      expect(result.status.normalized).toBe('pending');
    });

    test('should handle error cases from fixture-like structure', () => {
      // Create a fixture-like structure for error case
      const errorFixture: EditFixture = {
        toolCall: {
          uuid: 'error-uuid',
          timestamp: '2025-06-25T18:20:11.465Z',
          parentUuid: 'error-uuid',
          type: 'assistant',
          isSidechain: false,
          content: [
            {
              type: 'tool_use' as const,
              id: 'error-tool-id',
              name: 'Edit',
              input: {
                file_path: '/nonexistent/file.ts',
                old_string: 'old text',
                new_string: 'new text',
              },
            },
          ],
        },
        toolResult: {
          uuid: 'error-result-uuid',
          timestamp: '2025-06-25T18:20:12.465Z',
          parentUuid: 'error-uuid',
          type: 'user',
          isSidechain: false,
          content: [
            {
              type: 'tool_result' as const,
              tool_use_id: 'error-tool-id',
              output: 'File not found: /nonexistent/file.ts',
              is_error: true,
            },
          ],
        },
        expectedComponentData: {
          id: 'error-tool-id',
          uuid: 'error-uuid',
          parentUuid: 'error-uuid',
          timestamp: '2025-06-25T18:20:11.465Z',
          status: {
            normalized: 'failed',
            original: 'error',
          },
          filePath: '/nonexistent/file.ts',
          oldContent: 'old text',
          newContent: 'new text',
          diff: [],
        },
      };

      const toolCallEntry = transformToolCall(errorFixture);
      const toolResultEntry = transformToolResult(errorFixture);

      const result = parser.parse(toolCallEntry, toolResultEntry);

      expect(result.status.normalized).toBe('failed');
      expect(result.filePath).toBe('/nonexistent/file.ts');
      expect(result.oldContent).toBe('old text');
      expect(result.newContent).toBe('new text');
    });
  });

  describe('diff generation', () => {
    test('should generate accurate diff for changes', () => {
      const fixture = fixtureData.fixtures[0];
      const toolCallEntry = transformToolCall(fixture);
      const toolResultEntry = transformToolResult(fixture);

      const result = parser.parse(toolCallEntry, toolResultEntry);

      expect(result.diff).toBeDefined();
      expect(Array.isArray(result.diff)).toBe(true);
      expect(result.diff!.length).toBeGreaterThan(0);

      // Check that diff contains both removed and added lines
      const removedLines = result.diff!.filter(line => line.type === 'removed');
      const addedLines = result.diff!.filter(line => line.type === 'added');
      const unchangedLines = result.diff!.filter(
        line => line.type === 'unchanged'
      );

      expect(removedLines.length).toBeGreaterThan(0);
      expect(addedLines.length).toBeGreaterThan(0);
      expect(unchangedLines.length).toBe(0); // Single line change, no context
    });

    test('should handle multi-line content in diff', () => {
      const multiLineEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'Edit',
            input: {
              file_path: '/test/file.ts',
              old_string: 'line1\nline2\nline3',
              new_string: 'line1\nmodified2\nline3\nline4',
            },
          },
        ],
      };

      const result = parser.parse(multiLineEntry);
      expect(result.diff).toBeDefined();
      expect(result.diff!.length).toBeGreaterThan(3); // At least 4 lines in diff
    });
  });

  describe('file type inference', () => {
    test('should correctly infer TypeScript file type', () => {
      const tsFile: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'Edit',
            input: {
              file_path: '/test/component.tsx',
              old_string: 'old',
              new_string: 'new',
            },
          },
        ],
      };

      const result = parser.parse(tsFile);
      expect(result.fileType).toBe('typescriptreact');
    });

    test('should correctly infer various file types', () => {
      const fileTypes = [
        { path: '/test/file.py', expected: 'python' },
        { path: '/test/file.rs', expected: 'rust' },
        { path: '/test/file.go', expected: 'go' },
        { path: '/test/file.java', expected: 'java' },
        { path: '/test/file.md', expected: 'markdown' },
        { path: '/test/file.json', expected: 'json' },
        { path: '/test/file.yaml', expected: 'yaml' },
        { path: '/test/file.unknown', expected: 'plaintext' },
      ];

      for (const { path, expected } of fileTypes) {
        const entry: LogEntry = {
          uuid: 'test-uuid',
          timestamp: '2025-06-25T18:20:11.465Z',
          type: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'test-id',
              name: 'Edit',
              input: {
                file_path: path,
                old_string: 'old',
                new_string: 'new',
              },
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
      const features = (parser as any).getSupportedFeatures();
      expect(features).toContain('basic-parsing');
      expect(features).toContain('status-mapping');
      expect(features).toContain('diff-generation');
      expect(features).toContain('file-type-inference');
      // Note: replace-all feature is not currently implemented
    });
  });

  describe('performance validation', () => {
    test('should parse fixtures within acceptable time', () => {
      const startTime = performance.now();

      for (const fixture of fixtureData.fixtures) {
        const toolCallEntry = transformToolCall(fixture);
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

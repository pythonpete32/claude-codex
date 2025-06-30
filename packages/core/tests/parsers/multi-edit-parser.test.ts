import type { LogEntry, MessageContent, EditOperation } from '@claude-codex/types';
import { beforeEach, describe, expect, test } from 'vitest';
import { MultiEditToolParser } from '../../src/parsers/multi-edit-parser';
import {
  loadFixture,
  setupFixtureBasedTesting,
  validateBaseToolProps,
} from '../utils';

// Setup fixture-based testing with custom matchers
setupFixtureBasedTesting();

interface MultiEditFixture {
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
      filePath: string;
      edits: EditOperation[];
      originalFileContents: string;
      structuredPatch: any[];
      userModified: boolean;
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
    input: {
      filePath: string;
      edits: EditOperation[];
    };
    results: {
      message: string;
      editsApplied: number;
      totalEdits: number;
      allSuccessful: boolean;
      editDetails: Array<{
        index: number;
        success: boolean;
        oldString: string;
        newString: string;
      }>;
    };
    ui: {
      totalEdits: number;
      successfulEdits: number;
      failedEdits: number;
      changeSummary: string;
    };
  };
}

interface MultiEditFixtureData {
  fixtures: MultiEditFixture[];
}

describe('MultiEditToolParser - Fixture-Based Testing', () => {
  let parser: MultiEditToolParser;
  let fixtureData: MultiEditFixtureData;

  beforeEach(() => {
    parser = new MultiEditToolParser();
    // Load the new fixture file
    fixtureData = loadFixture('multiedit-tool-new.json');
  });

  /**
   * Transform fixture data to match parser expectations
   */
  function transformToolCall(fixture: MultiEditFixture): LogEntry {
    return {
      uuid: fixture.toolCall.uuid,
      timestamp: fixture.toolCall.timestamp,
      parentUuid: fixture.toolCall.parentUuid,
      type: fixture.toolCall.type as 'assistant',
      isSidechain: fixture.toolCall.isSidechain,
      content: fixture.toolCall.message.content,
    };
  }

  function transformToolResult(fixture: MultiEditFixture): LogEntry {
    const baseEntry: LogEntry = {
      uuid: fixture.toolResult.uuid,
      timestamp: fixture.toolResult.timestamp,
      parentUuid: fixture.toolResult.parentUuid,
      type: fixture.toolResult.type as 'user',
      isSidechain: fixture.toolResult.isSidechain,
      content: fixture.toolResult.message.content,
    };

    // Add toolUseResult if it exists (for parser to extract)
    if (fixture.toolResult.toolUseResult) {
      (baseEntry as any).toolUseResult = fixture.toolResult.toolUseResult;
    }

    return baseEntry;
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
        expect(result.status.normalized).toBe(expected.status.normalized);
        expect(result.status.original).toBeDefined();
        expect(result.input.filePath).toBe(expected.input.filePath);
        expect(result.input.edits.length).toBe(expected.input.edits.length);
      }
    });

    test('should parse successful multi-edit operation from fixture', () => {
      const fixture = fixtureData.fixtures[0]; // First fixture is a successful multi-edit

      const toolCallEntry = transformToolCall(fixture);
      const toolResultEntry = transformToolResult(fixture);

      const result = parser.parse(toolCallEntry, toolResultEntry);

      // Verify successful execution
      expect(result.status.normalized).toBe('completed');
      expect(result.results).toBeDefined();
      expect(result.results?.editsApplied).toBe(2);
      expect(result.results?.totalEdits).toBe(2);
      expect(result.results?.allSuccessful).toBe(true);
      
      // Check the message format
      expect(result.results?.message).toContain('Applied 2 edits');
      expect(result.results?.message).toContain('/Users/abuusama/Desktop/temp/test-data/subdir/nested.py');
      
      // Verify edit details
      expect(result.results?.editDetails).toHaveLength(2);
      expect(result.results?.editDetails[0].success).toBe(true);
      expect(result.results?.editDetails[1].success).toBe(true);
      
      // Verify UI helpers
      expect(result.ui.totalEdits).toBe(2);
      expect(result.ui.successfulEdits).toBe(2);
      expect(result.ui.failedEdits).toBe(0);
      expect(result.ui.changeSummary).toContain('Applied 2 edits');
    });
  });

  describe('canParse validation', () => {
    test('should correctly identify MultiEdit tool calls', () => {
      const fixture = fixtureData.fixtures[0];
      const toolCallEntry = transformToolCall(fixture);
      expect(parser.canParse(toolCallEntry)).toBe(true);
    });

    test('should reject non-MultiEdit tool entries', () => {
      const nonMultiEditEntry: LogEntry = {
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
      expect(parser.canParse(nonMultiEditEntry)).toBe(false);
    });

    test('should reject user messages', () => {
      const userEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'user',
        content: 'Edit multiple lines',
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
          name: 'MultiEdit',
          input: { file_path: 'test.ts', edits: [] },
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
      expect(result.results?.editsApplied).toBe(0);
      expect(result.results?.allSuccessful).toBe(false);
      expect(result.results?.errorMessage).toBeUndefined();
    });

    test('should handle error result', () => {
      const errorResult: LogEntry = {
        uuid: 'result-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        parentUuid: 'test-uuid',
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-id',
            output: 'File not found: /Users/test/project/nonexistent.ts',
            is_error: true,
          },
        ],
      };

      const toolCall: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'MultiEdit',
            input: {
              file_path: '/Users/test/project/nonexistent.ts',
              edits: [],
            },
          },
        ],
      };

      const result = parser.parse(toolCall, errorResult);
      expect(result.status.normalized).toBe('failed');
      expect(result.results?.errorMessage).toBe('File not found: /Users/test/project/nonexistent.ts');
      expect(result.results?.editsApplied).toBe(0);
      expect(result.results?.allSuccessful).toBe(false);
      expect(result.results?.editDetails).toEqual([]);
    });

    test('should handle interrupted operations', () => {
      const interruptedResult: LogEntry = {
        uuid: 'result-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        parentUuid: 'test-uuid',
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-id',
            output: {
              interrupted: true,
              editsApplied: 1,
            },
            is_error: false,
          },
        ],
      };

      const toolCall: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'MultiEdit',
            input: {
              file_path: '/test/file.ts',
              edits: [{ old_string: 'old', new_string: 'new' }],
            },
          },
        ],
      };

      const result = parser.parse(toolCall, interruptedResult);
      expect(result.status.normalized).toBe('interrupted');
      expect(result.results?.editsApplied).toBe(1);
      expect(result.results?.allSuccessful).toBe(false);
      expect(result.results?.message).toBe('Operation interrupted');
    });

    test('should handle missing file path', () => {
      const noPathEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'MultiEdit',
            input: {
              edits: [{ old_string: 'old', new_string: 'new' }],
            },
          },
        ],
      };

      const result = parser.parse(noPathEntry);
      expect(result.input.filePath).toBeUndefined();
      expect(result.input.edits).toHaveLength(1);
    });

    test('should handle missing edits array', () => {
      const noEditsEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'MultiEdit',
            input: {
              file_path: '/test/file.ts',
            },
          },
        ],
      };

      const result = parser.parse(noEditsEntry);
      expect(result.input.edits).toEqual([]);
      expect(result.ui.totalEdits).toBe(0);
    });

    test('should extract numbers from string messages', () => {
      const numberExtractionResult: LogEntry = {
        uuid: 'result-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        parentUuid: 'test-uuid',
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-id',
            output: 'Applied 3 edits successfully to the file',
            is_error: false,
          },
        ],
      };

      const toolCall: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'MultiEdit',
            input: {
              file_path: '/test/file.ts',
              edits: [{ old_string: 'a', new_string: 'b' }],
            },
          },
        ],
      };

      const result = parser.parse(toolCall, numberExtractionResult);
      expect(result.results?.editsApplied).toBe(3);
      expect(result.results?.allSuccessful).toBe(true);
      expect(result.results?.message).toContain('Applied 3 edits');
    });
  });

  describe('feature support', () => {
    test('should declare supported features', () => {
      const features = parser.getSupportedFeatures();
      expect(features).toContain('basic-parsing');
      expect(features).toContain('status-mapping');
      expect(features).toContain('batch-operations');
      expect(features).toContain('edit-tracking');
      expect(features).toContain('interrupted-support');
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

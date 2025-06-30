import { describe, expect, test } from 'vitest';
import type { LogEntry, EditOperation } from '@claude-codex/types';
import { MultiEditToolParser } from '../../src/parsers/multi-edit-parser';

// Sample test data based on multiedit-tool-fixtures.json structure
const sampleEdits: EditOperation[] = [
  {
    old_string: 'const oldFunction = () => {',
    new_string: 'const newFunction = () => {',
    replace_all: false,
  },
  {
    old_string: 'console.log("debug");',
    new_string: 'console.log("info");',
    replace_all: true,
  },
];

const sampleMultiEditToolCall: LogEntry = {
  uuid: 'multiedit-call-uuid',
  timestamp: '2025-06-25T18:20:11.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_use',
      id: 'toolu_multiedit_test',
      name: 'MultiEdit',
      input: {
        file_path: '/Users/test/project/src/utils.ts',
        edits: sampleEdits,
      },
    },
  ],
};

const sampleMultiEditSuccessResult: LogEntry = {
  uuid: 'multiedit-result-uuid',
  parentUuid: 'multiedit-call-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_multiedit_test',
      output:
        'Successfully applied 2 edits to /Users/test/project/src/utils.ts',
      is_error: false,
    },
  ],
};

const sampleMultiEditPartialResult: LogEntry = {
  uuid: 'multiedit-partial-uuid',
  parentUuid: 'multiedit-call-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_multiedit_test',
      output: {
        edits_applied: 1,
        all_successful: false,
        edit_details: [
          {
            operation: sampleEdits[0],
            success: true,
            replacements_made: 1,
          },
          {
            operation: sampleEdits[1],
            success: false,
            replacements_made: 0,
            error: 'Pattern not found: console.log("debug");',
          },
        ],
      },
      is_error: false,
    },
  ],
};

const sampleMultiEditWithToolUseResult: LogEntry = {
  uuid: 'multiedit-result-uuid',
  parentUuid: 'multiedit-call-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_multiedit_test',
      output: 'File updated successfully',
      is_error: false,
    },
  ],
  toolUseResult: {
    output: {
      edits_applied: 2,
      all_successful: true,
      edit_details: [
        {
          operation: sampleEdits[0],
          success: true,
          replacements_made: 1,
        },
        {
          operation: sampleEdits[1],
          success: true,
          replacements_made: 3,
        },
      ],
      message: 'All edits applied successfully',
    },
  },
};

const sampleMultiEditErrorResult: LogEntry = {
  uuid: 'multiedit-error-uuid',
  parentUuid: 'multiedit-call-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_multiedit_test',
      output: 'File not found: /Users/test/project/nonexistent.ts',
      is_error: true,
    },
  ],
};

describe('MultiEditToolParser', () => {
  const parser = new MultiEditToolParser();

  describe('canParse', () => {
    test('should identify MultiEdit tool use entries', () => {
      expect(parser.canParse(sampleMultiEditToolCall)).toBe(true);
    });

    test('should reject non-MultiEdit tool entries', () => {
      const nonMultiEditEntry: LogEntry = {
        ...sampleMultiEditToolCall,
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
        ...sampleMultiEditToolCall,
        type: 'user',
        content: 'Edit multiple lines',
      };
      expect(parser.canParse(userEntry)).toBe(false);
    });
  });

  describe('parse', () => {
    test('should parse successful multi-edit operation', () => {
      const result = parser.parse(
        sampleMultiEditToolCall,
        sampleMultiEditSuccessResult
      );

      // Check base props
      expect(result.id).toBe('toolu_multiedit_test');
      expect(result.uuid).toBe('multiedit-call-uuid');
      expect(result.timestamp).toBe('2025-06-25T18:20:11.465Z');

      // Check input structure
      expect(result.input.filePath).toBe('/Users/test/project/src/utils.ts');
      expect(result.input.edits).toEqual(sampleEdits);

      // Check parsed results
      expect(result.status.normalized).toBe('completed');
      expect(result.results?.message).toContain('Successfully applied 2 edits');
      expect(result.results?.editsApplied).toBe(2);
      expect(result.results?.allSuccessful).toBe(true);
      expect(result.results?.errorMessage).toBeUndefined();

      // Check UI helpers
      expect(result.ui.totalEdits).toBe(2);
      expect(result.ui.successfulEdits).toBe(2);
      expect(result.ui.failedEdits).toBe(0);
      expect(result.ui.changeSummary).toContain('Successfully applied 2 edits');
    });

    test('should parse partial success with detailed results', () => {
      const result = parser.parse(
        sampleMultiEditToolCall,
        sampleMultiEditPartialResult
      );

      expect(result.status.normalized).toBe('completed');
      expect(result.results?.editsApplied).toBe(1);
      expect(result.results?.allSuccessful).toBe(false);
      expect(result.results?.editDetails).toHaveLength(2);

      // Check first edit (success)
      expect(result.results?.editDetails[0].success).toBe(true);
      expect(result.results?.editDetails[0].replacements_made).toBe(1);
      expect(result.results?.editDetails[0].operation).toEqual(sampleEdits[0]);

      // Check second edit (failure)
      expect(result.results?.editDetails[1].success).toBe(false);
      expect(result.results?.editDetails[1].replacements_made).toBe(0);
      expect(result.results?.editDetails[1].error).toContain(
        'Pattern not found'
      );

      // Check UI helpers
      expect(result.ui.successfulEdits).toBe(1);
      expect(result.ui.failedEdits).toBe(1);
    });

    test('should parse toolUseResult format from fixtures', () => {
      const result = parser.parse(
        sampleMultiEditToolCall,
        sampleMultiEditWithToolUseResult
      );

      expect(result.status.normalized).toBe('completed');
      expect(result.results?.editsApplied).toBe(2);
      expect(result.results?.allSuccessful).toBe(true);
      expect(result.results?.message).toBe('All edits applied successfully');
      expect(result.results?.editDetails).toHaveLength(2);

      // Check replacements made
      expect(result.results?.editDetails[0].replacements_made).toBe(1);
      expect(result.results?.editDetails[1].replacements_made).toBe(3);
    });

    test('should parse error result', () => {
      const result = parser.parse(
        sampleMultiEditToolCall,
        sampleMultiEditErrorResult
      );

      expect(result.status.normalized).toBe('failed');
      expect(result.results?.errorMessage).toBe(
        'File not found: /Users/test/project/nonexistent.ts'
      );
      expect(result.results?.editsApplied).toBe(0);
      expect(result.results?.allSuccessful).toBe(false);
      expect(result.results?.editDetails).toEqual([]);
    });

    test('should handle pending status when no result', () => {
      const result = parser.parse(sampleMultiEditToolCall);

      expect(result.status.normalized).toBe('pending');
      expect(result.results?.editsApplied).toBe(0);
      expect(result.results?.allSuccessful).toBe(false);
      expect(result.results?.errorMessage).toBeUndefined();
    });

    test('should handle interrupted operations', () => {
      const interruptedResult: LogEntry = {
        ...sampleMultiEditSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_multiedit_test',
            output: {
              interrupted: true,
              editsApplied: 1,
            },
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleMultiEditToolCall, interruptedResult);

      expect(result.status.normalized).toBe('interrupted');
      expect(result.results?.editsApplied).toBe(1);
      expect(result.results?.allSuccessful).toBe(false);
      expect(result.results?.message).toBe('Operation interrupted');
    });
  });

  describe('edge cases', () => {
    test('should handle missing file path', () => {
      const noPathEntry: LogEntry = {
        ...sampleMultiEditToolCall,
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'MultiEdit',
            input: {
              edits: sampleEdits,
            },
          },
        ],
      };

      const result = parser.parse(noPathEntry);
      expect(result.input.filePath).toBeUndefined();
      expect(result.input.edits).toEqual(sampleEdits);
    });

    test('should handle missing edits array', () => {
      const noEditsEntry: LogEntry = {
        ...sampleMultiEditToolCall,
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

    test('should handle malformed edit details', () => {
      const malformedResult: LogEntry = {
        ...sampleMultiEditSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_multiedit_test',
            output: {
              edit_details: [
                { success: true }, // missing fields
                { operation: null, success: false, error: 'Failed' },
              ],
            },
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleMultiEditToolCall, malformedResult);

      expect(result.results?.editDetails).toHaveLength(2);
      expect(result.results?.editDetails[0].success).toBe(true);
      expect(result.results?.editDetails[0].replacements_made).toBe(0);
      expect(result.results?.editDetails[1].operation).toEqual({
        old_string: '',
        new_string: '',
      });
    });

    test('should extract numbers from string messages', () => {
      const numberExtractionResult: LogEntry = {
        ...sampleMultiEditSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_multiedit_test',
            output: 'Applied 3 edits successfully to the file',
            is_error: false,
          },
        ],
      };

      const result = parser.parse(
        sampleMultiEditToolCall,
        numberExtractionResult
      );

      expect(result.results?.editsApplied).toBe(3);
      expect(result.results?.allSuccessful).toBe(true);
      expect(result.results?.message).toContain('Applied 3 edits');
    });

    test('should handle complex fixture-style results', () => {
      const complexResult: LogEntry = {
        ...sampleMultiEditSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_multiedit_test',
            output: 'Complex operation completed',
            is_error: false,
          },
        ],
        toolUseResult: {
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'toolu_multiedit_test',
              output: {
                edits_applied: 5,
                all_successful: true,
                edit_details: [],
              },
            },
          ],
        },
      };

      const result = parser.parse(sampleMultiEditToolCall, complexResult);

      expect(result.results?.editsApplied).toBe(5);
      expect(result.results?.allSuccessful).toBe(true);
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
});

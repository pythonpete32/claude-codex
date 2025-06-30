import { describe, expect, test } from 'vitest';
import type { LogEntry } from '@claude-codex/types';
import { EditToolParser } from '../../src/parsers/edit-parser';

// Sample test data based on edit-tool-fixtures.json structure
const sampleEditToolCall: LogEntry = {
  uuid: 'edit-call-uuid',
  timestamp: '2025-06-25T18:20:11.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_use',
      id: 'toolu_edit_test',
      name: 'Edit',
      input: {
        file_path: '/Users/test/project/src/utils.ts',
        old_string: 'const oldFunction = () => {',
        new_string: 'const newFunction = () => {',
        replace_all: false,
      },
    },
  ],
};

const sampleEditSuccessResult: LogEntry = {
  uuid: 'edit-result-uuid',
  parentUuid: 'edit-call-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_edit_test',
      output: `File updated successfully. Here's the updated content:

1→import { createLogger } from './logger';
2→
3→const newFunction = () => {
4→  return 'Hello World';
5→};
6→
7→export { newFunction };`,
      is_error: false,
    },
  ],
};

const sampleEditReplaceAllCall: LogEntry = {
  uuid: 'edit-replace-all-uuid',
  timestamp: '2025-06-25T18:20:11.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_use',
      id: 'toolu_edit_replace_all',
      name: 'Edit',
      input: {
        file_path: '/Users/test/project/src/debug.ts',
        old_string: 'console.log',
        new_string: 'console.debug',
        replace_all: true,
      },
    },
  ],
};

const sampleEditReplaceAllResult: LogEntry = {
  uuid: 'edit-replace-all-result',
  parentUuid: 'edit-replace-all-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_edit_replace_all',
      output: 'Successfully replaced 3 occurrences of "console.log" with "console.debug" in /Users/test/project/src/debug.ts',
      is_error: false,
    },
  ],
};

const sampleEditErrorResult: LogEntry = {
  uuid: 'edit-error-uuid',
  parentUuid: 'edit-call-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_edit_test',
      output: 'File not found: /Users/test/project/nonexistent.ts',
      is_error: true,
    },
  ],
};

const sampleEditNotFoundResult: LogEntry = {
  uuid: 'edit-not-found-uuid',
  parentUuid: 'edit-call-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_edit_test',
      output: 'String not found: "const oldFunction = () => {" in /Users/test/project/src/utils.ts',
      is_error: true,
    },
  ],
};

describe('EditToolParser', () => {
  const parser = new EditToolParser();

  describe('canParse', () => {
    test('should identify Edit tool use entries', () => {
      expect(parser.canParse(sampleEditToolCall)).toBe(true);
    });

    test('should reject non-Edit tool entries', () => {
      const nonEditEntry: LogEntry = {
        ...sampleEditToolCall,
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
        ...sampleEditToolCall,
        type: 'user',
        content: 'Edit this file',
      };
      expect(parser.canParse(userEntry)).toBe(false);
    });
  });

  describe('parse', () => {
    test('should parse successful single edit operation', () => {
      const result = parser.parse(sampleEditToolCall, sampleEditSuccessResult);

      // Check base props
      expect(result.id).toBe('toolu_edit_test');
      expect(result.uuid).toBe('edit-call-uuid');
      expect(result.timestamp).toBe('2025-06-25T18:20:11.465Z');

      // Check file props
      expect(result.filePath).toBe('/Users/test/project/src/utils.ts');
      expect(result.oldContent).toBe('const oldFunction = () => {');
      expect(result.newContent).toBe('const newFunction = () => {');

      // Check parsed results
      expect(result.status.normalized).toBe('completed');
      expect(result.content).toBe('const newFunction = () => {');
      expect(result.diff).toBeDefined();
      expect(Array.isArray(result.diff)).toBe(true);
    });

    test('should parse replace all operation', () => {
      const result = parser.parse(sampleEditReplaceAllCall, sampleEditReplaceAllResult);

      expect(result.status.normalized).toBe('completed');
      expect(result.oldContent).toBe('console.log');
      expect(result.newContent).toBe('console.debug');
      expect(result.diff).toBeDefined();
    });

    test('should parse file not found error', () => {
      const result = parser.parse(sampleEditToolCall, sampleEditErrorResult);

      expect(result.status.normalized).toBe('failed');
      expect(result.filePath).toBe('/Users/test/project/src/utils.ts');
    });

    test('should parse string not found error', () => {
      const result = parser.parse(sampleEditToolCall, sampleEditNotFoundResult);

      expect(result.status.normalized).toBe('failed');
      expect(result.filePath).toBe('/Users/test/project/src/utils.ts');
    });

    test('should handle pending status when no result', () => {
      const result = parser.parse(sampleEditToolCall);

      expect(result.status.normalized).toBe('pending');
      expect(result.filePath).toBe('/Users/test/project/src/utils.ts');
    });

  });


  describe('edge cases', () => {
    test('should handle missing file path', () => {
      const noPathEntry: LogEntry = {
        ...sampleEditToolCall,
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

    test('should handle missing old/new strings', () => {
      const missingStringsEntry: LogEntry = {
        ...sampleEditToolCall,
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

    test('should generate diff for changes', () => {
      const result = parser.parse(sampleEditToolCall, sampleEditSuccessResult);
      expect(result.diff).toBeDefined();
      expect(Array.isArray(result.diff)).toBe(true);
    });
  });

  describe('feature support', () => {
    test('should declare supported features', () => {
      const features = parser.getSupportedFeatures();
      expect(features).toContain('basic-parsing');
      expect(features).toContain('status-mapping');
      expect(features).toContain('diff-generation');
      expect(features).toContain('file-type-inference');
      expect(features).toContain('replace-all');
    });
  });
});
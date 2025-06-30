import { describe, expect, test } from 'vitest';
import type { LogEntry } from '@claude-codex/types';
import { LsToolParser } from '../../src/parsers/ls-parser';

// Sample test data based on ls-tool-fixtures.json structure
const sampleLsToolCall: LogEntry = {
  uuid: 'ls-call-uuid',
  timestamp: '2025-06-25T18:20:11.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_use',
      id: 'toolu_ls_test',
      name: 'LS',
      input: {
        path: '/Users/test/project',
        ignore: ['.git', 'node_modules'],
      },
    },
  ],
};

const sampleLsSuccessResult: LogEntry = {
  uuid: 'ls-result-uuid',
  parentUuid: 'ls-call-uuid',
  timestamp: '2025-06-25T18:20:11.565Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_ls_test',
      output: {
        entries: [
          {
            name: 'package.json',
            type: 'file',
            size: 1024,
            permissions: '-rw-r--r--',
            lastModified: '2025-06-25T10:00:00Z',
          },
          {
            name: 'src',
            type: 'directory',
            size: 4096,
            permissions: 'drwxr-xr-x',
            lastModified: '2025-06-25T12:00:00Z',
          },
          {
            name: '.env',
            type: 'file',
            size: 256,
            permissions: '-rw-------',
            lastModified: '2025-06-24T15:30:00Z',
          },
        ],
        totalSize: 5376,
        entryCount: 3,
      },
      is_error: false,
    },
  ],
};

const sampleLsErrorResult: LogEntry = {
  uuid: 'ls-error-uuid',
  parentUuid: 'ls-call-uuid',
  timestamp: '2025-06-25T18:20:11.565Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_ls_test',
      output: 'Permission denied: /root/private',
      is_error: true,
    },
  ],
};

// Test with toolUseResult structure from fixtures
const sampleLsWithToolUseResult: LogEntry = {
  uuid: 'ls-result-uuid',
  parentUuid: 'ls-call-uuid',
  timestamp: '2025-06-25T18:20:11.565Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_ls_test',
      output: 'Listed 5 entries in /Users/test/project',
      is_error: false,
    },
  ],
  toolUseResult: {
    entries: [
      {
        name: 'README.md',
        type: 'file',
        size: 2048,
        permissions: '-rw-r--r--',
        modified: '2025-06-25T08:00:00Z',
      },
      {
        name: 'tests',
        type: 'directory',
        size: 4096,
        permissions: 'drwxr-xr-x',
        modified: '2025-06-25T14:00:00Z',
      },
    ],
    totalSize: 6144,
    entryCount: 2,
  },
};

describe('LsToolParser', () => {
  const parser = new LsToolParser();

  describe('canParse', () => {
    test('should identify LS tool use entries', () => {
      expect(parser.canParse(sampleLsToolCall)).toBe(true);
    });

    test('should reject non-LS tool entries', () => {
      const nonLsEntry: LogEntry = {
        ...sampleLsToolCall,
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'Bash',
            input: { command: 'ls' },
          },
        ],
      };
      expect(parser.canParse(nonLsEntry)).toBe(false);
    });

    test('should reject user messages', () => {
      const userEntry: LogEntry = {
        ...sampleLsToolCall,
        type: 'user',
        content: 'List files',
      };
      expect(parser.canParse(userEntry)).toBe(false);
    });
  });

  describe('parse', () => {
    test('should parse successful directory listing', () => {
      const result = parser.parse(sampleLsToolCall, sampleLsSuccessResult);

      // Check base props
      expect(result.id).toBe('toolu_ls_test');
      expect(result.uuid).toBe('ls-call-uuid');
      expect(result.timestamp).toBe('2025-06-25T18:20:11.465Z');

      // Check input structure
      expect(result.input.path).toBe('/Users/test/project');
      expect(result.input.ignore).toEqual(['.git', 'node_modules']);
      expect(result.input.showHidden).toBe(true);
      expect(result.input.recursive).toBe(false);

      // Check parsed entries
      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({
        name: 'package.json',
        type: 'file',
        size: 1024,
        permissions: '-rw-r--r--',
        lastModified: '2025-06-25T10:00:00Z',
        isHidden: false,
      });
      expect(result.results[2]).toEqual({
        name: '.env',
        type: 'file',
        size: 256,
        permissions: '-rw-------',
        lastModified: '2025-06-24T15:30:00Z',
        isHidden: true, // starts with dot
      });

      // Check status and metadata
      expect(result.status.normalized).toBe('completed');
      expect(result.entryCount).toBe(3);
      expect(result.errorMessage).toBeUndefined();

      // Check UI helpers
      expect(result.ui.totalFiles).toBe(2);
      expect(result.ui.totalDirectories).toBe(1);
      expect(result.ui.totalSize).toBe(5376);
    });

    test('should parse error result', () => {
      const result = parser.parse(sampleLsToolCall, sampleLsErrorResult);

      expect(result.status.normalized).toBe('failed');
      expect(result.errorMessage).toBe('Permission denied: /root/private');
      expect(result.results).toEqual([]);
      expect(result.entryCount).toBe(0);
    });

    test('should handle pending status when no result', () => {
      const result = parser.parse(sampleLsToolCall);

      expect(result.status.normalized).toBe('pending');
      expect(result.results).toEqual([]);
      expect(result.errorMessage).toBeUndefined();
    });

    test('should parse toolUseResult format from fixtures', () => {
      const result = parser.parse(sampleLsToolCall, sampleLsWithToolUseResult);

      expect(result.status.normalized).toBe('completed');
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        name: 'README.md',
        type: 'file',
        size: 2048,
        permissions: '-rw-r--r--',
        lastModified: '2025-06-25T08:00:00Z',
        isHidden: false,
      });
      expect(result.ui.totalSize).toBe(6144);
      expect(result.entryCount).toBe(2);
    });

    test('should handle string output format', () => {
      const stringOutputResult: LogEntry = {
        ...sampleLsSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_ls_test',
            output: 'package.json 1024 file 2025-06-25T10:00:00Z\nsrc 4096 directory 2025-06-25T12:00:00Z',
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleLsToolCall, stringOutputResult);

      expect(result.status.normalized).toBe('completed');
      expect(result.results).toHaveLength(2);
      expect(result.results[0].name).toBe('package.json');
      expect(result.results[0].size).toBe(1024);
      expect(result.results[1].type).toBe('directory');
    });

    test('should handle interrupted operations', () => {
      const interruptedResult: LogEntry = {
        ...sampleLsSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_ls_test',
            output: { interrupted: true },
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleLsToolCall, interruptedResult);

      expect(result.status.normalized).toBe('interrupted');
      expect(result.results).toEqual([]);
    });
  });

  describe('edge cases', () => {
    test('should handle missing path parameter', () => {
      const noPathEntry: LogEntry = {
        ...sampleLsToolCall,
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'LS',
            input: {},
          },
        ],
      };

      const result = parser.parse(noPathEntry);
      expect(result.input.path).toBeUndefined();
      expect(result.input.ignore).toBeUndefined();
    });

    test('should handle malformed entry data', () => {
      const malformedResult: LogEntry = {
        ...sampleLsSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_ls_test',
            output: {
              entries: [
                { filename: 'test.txt' }, // missing standard fields
                { name: 'valid.txt', type: 'file', size: 100 },
              ],
            },
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleLsToolCall, malformedResult);

      expect(result.results).toHaveLength(2);
      expect(result.results[0].name).toBe('test.txt'); // filename → name
      expect(result.results[0].type).toBe('file'); // default
      expect(result.results[1].name).toBe('valid.txt');
    });

    test('should infer file types from names', () => {
      const typeInferenceResult: LogEntry = {
        ...sampleLsSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_ls_test',
            output: {
              entries: [
                { name: 'folder/' }, // ends with slash
                { name: '.hidden' }, // hidden dir pattern
                { name: 'file.txt' }, // regular file
              ],
            },
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleLsToolCall, typeInferenceResult);

      expect(result.results[0].type).toBe('directory');
      expect(result.results[1].type).toBe('directory');
      expect(result.results[2].type).toBe('file');
    });
  });

  describe('feature support', () => {
    test('should declare supported features', () => {
      const features = parser.getSupportedFeatures();
      expect(features).toContain('basic-parsing');
      expect(features).toContain('status-mapping');
      expect(features).toContain('file-info-parsing');
      expect(features).toContain('interrupted-support');
    });
  });
});
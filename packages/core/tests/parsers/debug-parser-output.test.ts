import type { LogEntry } from '@claude-codex/types';
import { describe, expect, test } from 'vitest';
import { LsToolParser } from '../../src/parsers/ls-parser';
import { McpToolParser } from '../../src/parsers/mcp-parser';
import { MultiEditToolParser } from '../../src/parsers/multi-edit-parser';

// Debug what parsers actually output vs what tests expect
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
        edits: [
          { old_string: 'old1', new_string: 'new1', replace_all: false },
          { old_string: 'old2', new_string: 'new2', replace_all: true },
        ],
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

describe('Debug Parser Outputs', () => {
  test('MultiEditToolParser actual output structure', () => {
    const parser = new MultiEditToolParser();
    const result = parser.parse(
      sampleMultiEditToolCall,
      sampleMultiEditSuccessResult
    );

    console.log('MultiEditToolParser output:', JSON.stringify(result, null, 2));

    // Log what we're actually getting
    console.log('editsApplied value:', result.results?.editsApplied);
    console.log('message value:', result.results?.message);
    console.log('input structure:', result.input);
    console.log('ui structure:', result.ui);

    // Basic structure test
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('uuid');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('input');
    expect(result).toHaveProperty('ui');
  });

  test('LsToolParser actual output structure', () => {
    const sampleLsCall: LogEntry = {
      uuid: 'ls-call-uuid',
      timestamp: '2025-06-25T18:20:11.465Z',
      type: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'toolu_ls_test',
          name: 'LS',
          input: { path: '/Users/test/project' },
        },
      ],
    };

    const sampleLsResult: LogEntry = {
      uuid: 'ls-result-uuid',
      parentUuid: 'ls-call-uuid',
      timestamp: '2025-06-25T18:20:12.465Z',
      type: 'assistant',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'toolu_ls_test',
          output: 'file1.txt\nfile2.js\ndir1/',
          is_error: false,
        },
      ],
    };

    const parser = new LsToolParser();
    const result = parser.parse(sampleLsCall, sampleLsResult);

    console.log('LsToolParser output:', JSON.stringify(result, null, 2));

    // Basic structure test
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('uuid');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('input');
    expect(result).toHaveProperty('results');
    expect(result).toHaveProperty('ui');
  });

  test('McpToolParser actual output structure', () => {
    const sampleMcpCall: LogEntry = {
      uuid: 'mcp-call-uuid',
      timestamp: '2025-06-25T18:20:11.465Z',
      type: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'toolu_mcp_test',
          name: 'mcp__puppeteer__navigate',
          input: { url: 'https://example.com' },
        },
      ],
    };

    const sampleMcpResult: LogEntry = {
      uuid: 'mcp-result-uuid',
      parentUuid: 'mcp-call-uuid',
      timestamp: '2025-06-25T18:20:12.465Z',
      type: 'assistant',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'toolu_mcp_test',
          output: { success: true, url: 'https://example.com' },
          is_error: false,
        },
      ],
    };

    const parser = new McpToolParser();
    const result = parser.parse(sampleMcpCall, sampleMcpResult);

    console.log('McpToolParser output:', JSON.stringify(result, null, 2));

    // Basic structure test
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('uuid');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('input');
    expect(result).toHaveProperty('results');
    expect(result).toHaveProperty('ui');
  });
});

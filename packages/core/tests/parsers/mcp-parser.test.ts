import { describe, expect, test } from 'vitest';
import type { LogEntry } from '@claude-codex/types';
import { McpToolParser } from '../../src/parsers/mcp-parser';

// Sample test data based on mcp-puppeteer-fixtures.json and mcp-context7-fixtures.json
const sampleMcpPuppeteerToolCall: LogEntry = {
  uuid: 'mcp-puppeteer-uuid',
  timestamp: '2025-06-25T18:20:11.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_use',
      id: 'toolu_mcp_puppeteer_test',
      name: 'mcp__puppeteer__puppeteer_navigate',
      input: {
        url: 'https://example.com',
        launchOptions: {
          headless: true,
          width: 1280,
          height: 720,
        },
        allowDangerous: false,
      },
    },
  ],
};

const sampleMcpContext7ToolCall: LogEntry = {
  uuid: 'mcp-context7-uuid',
  timestamp: '2025-06-25T18:20:11.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_use',
      id: 'toolu_mcp_context7_test',
      name: 'mcp__context7__resolve-library-id',
      input: {
        libraryName: 'react',
      },
    },
  ],
};

const sampleMcpPuppeteerSuccessResult: LogEntry = {
  uuid: 'mcp-puppeteer-result-uuid',
  parentUuid: 'mcp-puppeteer-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_mcp_puppeteer_test',
      output: {
        success: true,
        url: 'https://example.com',
        title: 'Example Domain',
        navigationTime: 1250,
        loadTime: 2100,
      },
      is_error: false,
    },
  ],
};

const sampleMcpContext7SuccessResult: LogEntry = {
  uuid: 'mcp-context7-result-uuid',
  parentUuid: 'mcp-context7-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_mcp_context7_test',
      output: {
        libraries: [
          {
            id: '/facebook/react',
            name: 'React',
            description: 'A JavaScript library for building user interfaces',
            trustScore: 9.8,
            codeSnippetCount: 15420,
            platforms: ['web', 'mobile'],
          },
          {
            id: '/facebook/react/v18.2.0',
            name: 'React v18.2.0',
            description: 'React version 18.2.0 with concurrent features',
            trustScore: 9.9,
            codeSnippetCount: 12850,
            platforms: ['web'],
          },
        ],
        selectedLibraryId: '/facebook/react',
      },
      is_error: false,
    },
  ],
};

const sampleMcpStringResult: LogEntry = {
  uuid: 'mcp-string-result-uuid',
  parentUuid: 'mcp-puppeteer-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_mcp_puppeteer_test',
      output: 'Successfully navigated to https://example.com',
      is_error: false,
    },
  ],
};

const sampleMcpJsonStringResult: LogEntry = {
  uuid: 'mcp-json-result-uuid',
  parentUuid: 'mcp-puppeteer-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_mcp_puppeteer_test',
      output: '{"status":"success","screenshot":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==","timestamp":"2025-06-25T18:20:12.465Z"}',
      is_error: false,
    },
  ],
};

const sampleMcpErrorResult: LogEntry = {
  uuid: 'mcp-error-result-uuid',
  parentUuid: 'mcp-puppeteer-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_mcp_puppeteer_test',
      output: {
        error: 'TIMEOUT_ERROR',
        message: 'Navigation timeout after 30000ms',
        details: {
          url: 'https://slow-site.example',
          timeout: 30000,
          actualTime: 30001,
        },
      },
      is_error: true,
    },
  ],
};

const sampleMcpUnderscoreToolCall: LogEntry = {
  uuid: 'mcp-underscore-uuid',
  timestamp: '2025-06-25T18:20:11.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_use',
      id: 'toolu_mcp_underscore_test',
      name: 'mcp_puppeteer_screenshot',
      input: {
        name: 'homepage',
        width: 1920,
        height: 1080,
      },
    },
  ],
};

describe('McpToolParser', () => {
  const parser = new McpToolParser();

  describe('canParse', () => {
    test('should identify MCP tool use entries with double underscore format', () => {
      expect(parser.canParse(sampleMcpPuppeteerToolCall)).toBe(true);
      expect(parser.canParse(sampleMcpContext7ToolCall)).toBe(true);
    });

    test('should identify MCP tool use entries with single underscore format', () => {
      expect(parser.canParse(sampleMcpUnderscoreToolCall)).toBe(true);
    });

    test('should reject non-MCP tool entries', () => {
      const nonMcpEntry: LogEntry = {
        ...sampleMcpPuppeteerToolCall,
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'Bash',
            input: { command: 'ls' },
          },
        ],
      };
      expect(parser.canParse(nonMcpEntry)).toBe(false);
    });

    test('should reject user messages', () => {
      const userEntry: LogEntry = {
        ...sampleMcpPuppeteerToolCall,
        type: 'user',
        content: 'Take a screenshot',
      };
      expect(parser.canParse(userEntry)).toBe(false);
    });
  });

  describe('server and method extraction', () => {
    test('should extract server and method from double underscore format', () => {
      const result = parser.parse(sampleMcpPuppeteerToolCall, sampleMcpPuppeteerSuccessResult);

      expect(result.ui.toolName).toBe('mcp__puppeteer__puppeteer_navigate');
      expect(result.ui.serverName).toBe('puppeteer');
      expect(result.ui.methodName).toBe('puppeteer_navigate');
    });

    test('should extract server and method from Context7 format', () => {
      const result = parser.parse(sampleMcpContext7ToolCall, sampleMcpContext7SuccessResult);

      expect(result.ui.toolName).toBe('mcp__context7__resolve-library-id');
      expect(result.ui.serverName).toBe('context7');
      expect(result.ui.methodName).toBe('resolve-library-id');
    });

    test('should extract server and method from single underscore format', () => {
      const result = parser.parse(sampleMcpUnderscoreToolCall);

      expect(result.ui.toolName).toBe('mcp_puppeteer_screenshot');
      expect(result.ui.serverName).toBe('puppeteer');
      expect(result.ui.methodName).toBe('screenshot');
    });

    test('should handle unknown format gracefully', () => {
      const unknownFormatCall: LogEntry = {
        ...sampleMcpPuppeteerToolCall,
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'mcp__unknown',
            input: {},
          },
        ],
      };

      const result = parser.parse(unknownFormatCall);

      expect(result.ui.serverName).toBe('unknown');
      expect(result.ui.methodName).toBe('mcp__unknown');
    });
  });

  describe('parse', () => {
    test('should parse successful Puppeteer MCP operation', () => {
      const result = parser.parse(sampleMcpPuppeteerToolCall, sampleMcpPuppeteerSuccessResult);

      // Check base props
      expect(result.id).toBe('toolu_mcp_puppeteer_test');
      expect(result.uuid).toBe('mcp-puppeteer-uuid');
      expect(result.timestamp).toBe('2025-06-25T18:20:11.465Z');

      // Check input structure
      expect(result.input.parameters).toEqual({
        url: 'https://example.com',
        launchOptions: {
          headless: true,
          width: 1280,
          height: 720,
        },
        allowDangerous: false,
      });

      // Check results
      expect(result.status.normalized).toBe('completed');
      expect(result.results.output).toEqual({
        success: true,
        url: 'https://example.com',
        title: 'Example Domain',
        navigationTime: 1250,
        loadTime: 2100,
      });
      expect(result.results.errorMessage).toBeUndefined();

      // Check UI helpers
      expect(result.ui.displayMode).toBe('json');
      expect(result.ui.isStructured).toBe(true);
      expect(result.ui.hasNestedData).toBe(false);
      expect(result.ui.keyCount).toBe(5);
      expect(result.ui.showRawJson).toBe(false);
      expect(result.ui.collapsible).toBe(false);
    });

    test('should parse successful Context7 MCP operation', () => {
      const result = parser.parse(sampleMcpContext7ToolCall, sampleMcpContext7SuccessResult);

      expect(result.status.normalized).toBe('completed');
      expect(result.results.output).toEqual({
        libraries: expect.arrayContaining([
          expect.objectContaining({
            id: '/facebook/react',
            name: 'React',
            trustScore: 9.8,
          }),
        ]),
        selectedLibraryId: '/facebook/react',
      });

      // Check output analysis for complex nested data
      expect(result.ui.displayMode).toBe('json');
      expect(result.ui.hasNestedData).toBe(true);
      expect(result.ui.isComplex).toBe(true);
    });

    test('should parse string output', () => {
      const result = parser.parse(sampleMcpPuppeteerToolCall, sampleMcpStringResult);

      expect(result.status.normalized).toBe('completed');
      expect(result.results.output).toBe('Successfully navigated to https://example.com');
      expect(result.ui.displayMode).toBe('text');
      expect(result.ui.isStructured).toBe(false);
      expect(result.ui.isLarge).toBe(false);
    });

    test('should parse JSON string output', () => {
      const result = parser.parse(sampleMcpPuppeteerToolCall, sampleMcpJsonStringResult);

      expect(result.status.normalized).toBe('completed');
      expect(result.results.output).toEqual({
        status: 'success',
        screenshot: expect.stringContaining('data:image/png;base64,'),
        timestamp: '2025-06-25T18:20:12.465Z',
      });
      expect(result.ui.displayMode).toBe('json');
      expect(result.ui.isStructured).toBe(true);
    });

    test('should parse error result', () => {
      const result = parser.parse(sampleMcpPuppeteerToolCall, sampleMcpErrorResult);

      expect(result.status.normalized).toBe('failed');
      expect(result.results.errorMessage).toBe('TIMEOUT_ERROR');
      expect(result.results.output).toEqual({
        error: 'TIMEOUT_ERROR',
        message: 'Navigation timeout after 30000ms',
        details: {
          url: 'https://slow-site.example',
          timeout: 30000,
          actualTime: 30001,
        },
      });
    });

    test('should handle pending status when no result', () => {
      const result = parser.parse(sampleMcpPuppeteerToolCall);

      expect(result.status.normalized).toBe('pending');
      expect(result.results.output).toBeUndefined();
      expect(result.results.errorMessage).toBeUndefined();
    });

    test('should handle interrupted operations', () => {
      const interruptedResult: LogEntry = {
        ...sampleMcpPuppeteerSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_mcp_puppeteer_test',
            output: { interrupted: true },
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleMcpPuppeteerToolCall, interruptedResult);

      expect(result.status.normalized).toBe('interrupted');
    });
  });

  describe('output analysis', () => {
    test('should analyze empty output', () => {
      const emptyResult: LogEntry = {
        ...sampleMcpPuppeteerSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_mcp_puppeteer_test',
            output: null,
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleMcpPuppeteerToolCall, emptyResult);

      expect(result.ui.displayMode).toBe('empty');
      expect(result.ui.isStructured).toBe(false);
      expect(result.ui.keyCount).toBe(0);
    });

    test('should analyze array output', () => {
      const arrayResult: LogEntry = {
        ...sampleMcpPuppeteerSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_mcp_puppeteer_test',
            output: [
              { id: 1, name: 'Item 1' },
              { id: 2, name: 'Item 2' },
              { id: 3, name: 'Item 3' },
            ],
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleMcpPuppeteerToolCall, arrayResult);

      expect(result.ui.displayMode).toBe('table');
      expect(result.ui.isStructured).toBe(true);
      expect(result.ui.hasNestedData).toBe(true);
      expect(result.ui.keyCount).toBe(3);
    });

    test('should analyze simple array output', () => {
      const simpleArrayResult: LogEntry = {
        ...sampleMcpPuppeteerSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_mcp_puppeteer_test',
            output: ['item1', 'item2', 'item3'],
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleMcpPuppeteerToolCall, simpleArrayResult);

      expect(result.ui.displayMode).toBe('list');
      expect(result.ui.hasNestedData).toBe(false);
    });

    test('should analyze large content', () => {
      const largeStringResult: LogEntry = {
        ...sampleMcpPuppeteerSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_mcp_puppeteer_test',
            output: 'x'.repeat(1500), // Large string
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleMcpPuppeteerToolCall, largeStringResult);

      expect(result.ui.displayMode).toBe('text');
      expect(result.ui.isLarge).toBe(true);
    });

    test('should analyze complex object', () => {
      const complexResult: LogEntry = {
        ...sampleMcpPuppeteerSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_mcp_puppeteer_test',
            output: {
              data: { nested: { deeply: { value: 'test' } } },
              metadata: { count: 100, timestamp: '2025-06-25' },
              items: [1, 2, 3, 4, 5],
              config: { setting1: true, setting2: false },
              // 25+ keys to trigger isLarge
              ...Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`key${i}`, `value${i}`])),
            },
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleMcpPuppeteerToolCall, complexResult);

      expect(result.ui.displayMode).toBe('json');
      expect(result.ui.hasNestedData).toBe(true);
      expect(result.ui.isComplex).toBe(true);
      expect(result.ui.isLarge).toBe(true);
      expect(result.ui.showRawJson).toBe(true);
      expect(result.ui.collapsible).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle missing input parameters', () => {
      const noInputEntry: LogEntry = {
        ...sampleMcpPuppeteerToolCall,
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'mcp__test__action',
            input: undefined,
          },
        ],
      };

      const result = parser.parse(noInputEntry);
      expect(result.input.parameters).toEqual({});
    });

    test('should handle malformed JSON in string output', () => {
      const malformedJsonResult: LogEntry = {
        ...sampleMcpPuppeteerSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_mcp_puppeteer_test',
            output: '{ invalid json }',
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleMcpPuppeteerToolCall, malformedJsonResult);

      expect(result.results.output).toBe('{ invalid json }');
      expect(result.ui.displayMode).toBe('text');
    });

    test('should handle primitive output types', () => {
      const primitiveResult: LogEntry = {
        ...sampleMcpPuppeteerSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_mcp_puppeteer_test',
            output: 42,
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleMcpPuppeteerToolCall, primitiveResult);

      expect(result.results.output).toBe(42);
      expect(result.ui.displayMode).toBe('text');
      expect(result.ui.isStructured).toBe(false);
    });

    test('should extract error from structured output', () => {
      const structuredErrorResult: LogEntry = {
        ...sampleMcpErrorResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_mcp_puppeteer_test',
            output: {
              message: 'Custom error message',
              details: 'Additional context',
            },
            is_error: true,
          },
        ],
      };

      const result = parser.parse(sampleMcpPuppeteerToolCall, structuredErrorResult);

      expect(result.results.errorMessage).toBe('Custom error message');
    });
  });

  describe('feature support', () => {
    test('should declare supported features', () => {
      const features = parser.getSupportedFeatures();
      expect(features).toContain('basic-parsing');
      expect(features).toContain('status-mapping');
      expect(features).toContain('generic-mcp-handling');
      expect(features).toContain('output-analysis');
      expect(features).toContain('display-mode-detection');
      expect(features).toContain('server-extraction');
      expect(features).toContain('method-extraction');
      expect(features).toContain('interrupted-support');
    });
  });
});
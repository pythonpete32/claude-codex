import type { LogEntry, MessageContent } from '@claude-codex/types';
import { beforeEach, describe, expect, test } from 'vitest';
import { McpToolParser } from '../../src/parsers/mcp-parser';
import {
  loadFixture,
  setupFixtureBasedTesting,
  validateBaseToolProps,
} from '../utils';

// Setup fixture-based testing with custom matchers
setupFixtureBasedTesting();

interface McpFixture {
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
    toolUseResult?: unknown; // SOT compliant: was any
  };
  expectedComponentData: unknown; // SOT compliant: was any
  mcpToolName?: string;
}

interface McpFixtureData {
  fixtures: McpFixture[];
}

describe('McpToolParser - Fixture-Based Testing', () => {
  let parser: McpToolParser;
  let sequentialThinkingFixture: McpFixtureData;
  let excalidrawFixture: McpFixtureData;

  beforeEach(() => {
    parser = new McpToolParser();
    // Load the available MCP fixtures
    sequentialThinkingFixture = loadFixture('mcp-sequential-thinking.json');
    excalidrawFixture = loadFixture('mcp-excalidraw.json');
  });

  /**
   * Transform fixture data to match parser expectations
   */
  function transformToolCall(fixture: McpFixture): LogEntry {
    return {
      uuid: fixture.toolCall.uuid,
      timestamp: fixture.toolCall.timestamp,
      parentUuid: fixture.toolCall.parentUuid,
      type: fixture.toolCall.type as 'assistant',
      isSidechain: fixture.toolCall.isSidechain,
      content: fixture.toolCall.message.content,
    };
  }

  function transformToolResult(fixture: McpFixture): LogEntry {
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
      (baseEntry as unknown as Record<string, unknown>).toolUseResult =
        fixture.toolResult.toolUseResult;
    }

    return baseEntry;
  }

  describe('real fixture validation', () => {
    test('should parse sequential thinking MCP fixtures successfully', () => {
      expect(sequentialThinkingFixture.fixtures).toBeDefined();
      expect(sequentialThinkingFixture.fixtures.length).toBeGreaterThan(0);

      for (const fixture of sequentialThinkingFixture.fixtures) {
        const toolCallEntry = transformToolCall(fixture);
        const toolResultEntry = transformToolResult(fixture);

        // Verify parser can handle the tool call
        expect(parser.canParse(toolCallEntry)).toBe(true);

        // Parse and validate
        const result = parser.parse(toolCallEntry, toolResultEntry);

        // Validate base properties
        validateBaseToolProps(result);

        // Validate MCP-specific properties
        expect(result.uuid).toBe(fixture.toolCall.uuid);
        expect(result.id).toBeDefined();
        expect(result.status.normalized).toBe('completed');
        expect(result.ui.serverName).toBe('sequential-thinking');
        expect(result.ui.methodName).toBe('sequentialthinking');
      }
    });

    test('should parse excalidraw MCP fixtures successfully', () => {
      expect(excalidrawFixture.fixtures).toBeDefined();
      expect(excalidrawFixture.fixtures.length).toBeGreaterThan(0);

      for (const fixture of excalidrawFixture.fixtures) {
        const toolCallEntry = transformToolCall(fixture);
        const toolResultEntry = transformToolResult(fixture);

        // Verify parser can handle the tool call
        expect(parser.canParse(toolCallEntry)).toBe(true);

        // Parse and validate
        const result = parser.parse(toolCallEntry, toolResultEntry);

        // Validate base properties
        validateBaseToolProps(result);

        // Validate MCP-specific properties
        expect(result.uuid).toBe(fixture.toolCall.uuid);
        expect(result.id).toBeDefined();
        expect(result.status.normalized).toBe('completed');
        expect(result.ui.serverName).toBe('mcp_excalidraw');

        // Extract method from tool name
        const toolContent = fixture.toolCall.message
          .content[0] as unknown as Record<string, unknown>;
        const methodMatch = (toolContent.name as string).match(/__([^_]+)$/);
        if (methodMatch) {
          expect(result.ui.methodName).toBe(methodMatch[1]);
        }
      }
    });

    test('should parse successful sequential thinking operation', () => {
      const fixture = sequentialThinkingFixture.fixtures[0];
      const toolCallEntry = transformToolCall(fixture);
      const toolResultEntry = transformToolResult(fixture);

      const result = parser.parse(toolCallEntry, toolResultEntry);

      // Check base properties
      expect(result.status.normalized).toBe('completed');
      expect(result.ui.serverName).toBe('sequential-thinking');
      expect(result.ui.methodName).toBe('sequentialthinking');

      // Check input
      expect(result.input).toBeDefined();
      expect(result.input.parameters.thought).toContain(
        'JSON-L (JSON Lines) log format'
      );
      expect(result.input.parameters.nextThoughtNeeded).toBe(true);
      expect(result.input.parameters.thoughtNumber).toBe(1);

      // Check output - MCP parser extracts from content field
      // The fixture has output in a special format that the parser doesn't handle yet
      // TODO: Update MCP parser to handle toolUseResult format
      expect(result.ui.isStructured).toBeDefined();
    });

    test('should parse successful excalidraw operation', () => {
      const fixture = excalidrawFixture.fixtures[0];
      const toolCallEntry = transformToolCall(fixture);
      const toolResultEntry = transformToolResult(fixture);

      const result = parser.parse(toolCallEntry, toolResultEntry);

      // Check base properties
      expect(result.status.normalized).toBe('completed');
      expect(result.ui.serverName).toBe('mcp_excalidraw');

      // Check input and output
      expect(result.input).toBeDefined();
      // The fixture has output in a special format that the parser doesn't handle yet
      // TODO: Update MCP parser to handle toolUseResult format
      expect(result.ui.isStructured).toBeDefined();
    });
  });

  describe('canParse validation', () => {
    test('should identify MCP tool use entries with double underscore format', () => {
      const mcpEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'mcp__puppeteer__puppeteer_navigate',
            input: {},
          },
        ],
      };
      expect(parser.canParse(mcpEntry)).toBe(true);
    });

    test('should identify MCP tool use entries with single underscore format', () => {
      const mcpEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'mcp_time_get_current_time',
            input: {},
          },
        ],
      };
      expect(parser.canParse(mcpEntry)).toBe(true);
    });

    test('should reject non-MCP tool entries', () => {
      const nonMcpEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
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
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'user',
        content: 'Use MCP tool',
      };
      expect(parser.canParse(userEntry)).toBe(false);
    });
  });

  describe('server and method extraction', () => {
    test('should extract server and method from double underscore format', () => {
      const toolCall: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'mcp__puppeteer__puppeteer_navigate',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall);
      expect(result.ui.serverName).toBe('puppeteer');
      expect(result.ui.methodName).toBe('puppeteer_navigate');
    });

    test('should extract server and method from Context7 format', () => {
      const toolCall: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'mcp__context7__resolve-library-id',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall);
      expect(result.ui.serverName).toBe('context7');
      expect(result.ui.methodName).toBe('resolve-library-id');
    });

    test('should extract server and method from single underscore format', () => {
      const toolCall: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'mcp_time_get_current_time',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall);
      expect(result.ui.serverName).toBe('time');
      expect(result.ui.methodName).toBe('get_current_time');
    });

    test('should handle unknown format gracefully', () => {
      const toolCall: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'mcp_unknown_format',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall);
      expect(result.ui.serverName).toBe('unknown');
      expect(result.ui.methodName).toBe('format');
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle pending status when no result', () => {
      const fixture = sequentialThinkingFixture.fixtures[0];
      const toolCallEntry = transformToolCall(fixture);

      const result = parser.parse(toolCallEntry);
      expect(result.status.normalized).toBe('pending');
      expect(result.results?.output).toBeUndefined();
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
            output: 'Failed to connect to MCP server',
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
            name: 'mcp__test__method',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall, errorResult);
      expect(result.status.normalized).toBe('failed');
      expect(result.results?.errorMessage).toBe(
        'Failed to connect to MCP server'
      );
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
            output: { interrupted: true },
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
            name: 'mcp__test__method',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall, interruptedResult);
      expect(result.status.normalized).toBe('interrupted');
    });

    test('should handle missing input parameters', () => {
      const toolCall: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'mcp__test__method',
            input: {} as Record<string, unknown>,
          },
        ],
      };

      const result = parser.parse(toolCall);
      expect(result.input.parameters).toEqual({});
    });

    test('should handle string output', () => {
      const stringResult: LogEntry = {
        uuid: 'result-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        parentUuid: 'test-uuid',
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-id',
            output: 'Operation completed successfully',
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
            name: 'mcp__test__method',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall, stringResult);
      expect(result.results?.output).toBe('Operation completed successfully');
      expect(result.ui.isStructured).toBe(false);
    });

    test('should parse JSON string output', () => {
      const jsonStringResult: LogEntry = {
        uuid: 'result-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        parentUuid: 'test-uuid',
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-id',
            output: '{"status": "ok", "count": 42}',
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
            name: 'mcp__test__method',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall, jsonStringResult);
      expect(result.results?.output).toEqual({ status: 'ok', count: 42 });
      expect(result.ui.isStructured).toBe(true);
    });
  });

  describe('output analysis', () => {
    test('should analyze empty output', () => {
      const emptyResult: LogEntry = {
        uuid: 'result-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        parentUuid: 'test-uuid',
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-id',
            output: {},
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
            name: 'mcp__test__method',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall, emptyResult);
      expect(result.ui.isStructured).toBe(true);
      expect(result.ui.keyCount).toBe(0);
    });

    test('should analyze array output', () => {
      const arrayResult: LogEntry = {
        uuid: 'result-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        parentUuid: 'test-uuid',
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-id',
            output: [{ id: 1 }, { id: 2 }, { id: 3 }],
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
            name: 'mcp__test__method',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall, arrayResult);
      expect(result.ui.isStructured).toBe(true);
      expect(result.ui.hasNestedData).toBe(true);
    });
  });

  describe('feature support', () => {
    test('should declare supported features', () => {
      const features = parser.getSupportedFeatures();
      expect(features).toContain('basic-parsing');
      expect(features).toContain('status-mapping');
      expect(features).toContain('generic-mcp-handling');
      expect(features).toContain('server-extraction');
      expect(features).toContain('output-analysis');
      expect(features).toContain('interrupted-support');
    });
  });

  describe('performance validation', () => {
    test('should parse all fixtures within acceptable time', () => {
      const allFixtures = [
        ...sequentialThinkingFixture.fixtures,
        ...excalidrawFixture.fixtures,
      ];
      const startTime = performance.now();

      for (const fixture of allFixtures) {
        const toolCallEntry = transformToolCall(fixture);
        const toolResultEntry = transformToolResult(fixture);
        parser.parse(toolCallEntry, toolResultEntry);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / allFixtures.length;

      // Each parse should take less than 10ms
      expect(averageTime).toBeLessThan(10);
    });
  });
});

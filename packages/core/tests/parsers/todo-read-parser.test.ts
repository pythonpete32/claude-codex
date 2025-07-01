import type { LogEntry, MessageContent, TodoItem } from '@claude-codex/types';
import { beforeEach, describe, expect, test } from 'vitest';
import { TodoReadToolParser } from '../../src/parsers/todo-read-parser';
import {
  loadFixture,
  setupFixtureBasedTesting,
  validateBaseToolProps,
} from '../utils';

// Setup fixture-based testing with custom matchers
setupFixtureBasedTesting();

interface TodoReadFixture {
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
    toolUseResult?: TodoItem[];
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
    todos: Array<{
      id: string;
      content: string;
      status: string;
      priority: string;
    }>;
    statusCounts: {
      pending: number;
      in_progress: number;
      completed: number;
    };
    priorityCounts: {
      high: number;
      medium: number;
      low: number;
    };
    ui: {
      totalTodos: number;
      completedTodos: number;
      pendingTodos: number;
      inProgressTodos: number;
    };
  };
}

interface TodoReadFixtureData {
  fixtures: TodoReadFixture[];
}

describe('TodoReadToolParser - Fixture-Based Testing', () => {
  let parser: TodoReadToolParser;
  let fixtureData: TodoReadFixtureData;

  beforeEach(() => {
    parser = new TodoReadToolParser();
    // Load the new fixture file
    fixtureData = loadFixture('todoread-tool-new.json');
  });

  /**
   * Transform fixture data to match parser expectations
   */
  function transformToolCall(fixture: TodoReadFixture): LogEntry {
    return {
      uuid: fixture.toolCall.uuid,
      timestamp: fixture.toolCall.timestamp,
      parentUuid: fixture.toolCall.parentUuid,
      type: fixture.toolCall.type as 'assistant',
      isSidechain: fixture.toolCall.isSidechain,
      content: fixture.toolCall.message.content,
    };
  }

  function transformToolResult(fixture: TodoReadFixture): LogEntry {
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
        // Note: mapFromError returns 'success' for original when no error
        expect(result.status.original).toBe('success');
        expect(result.todos.length).toBe(expected.todos.length);
      }
    });

    test('should parse successful todo read operation from fixture', () => {
      const fixture = fixtureData.fixtures[0]; // First fixture is a successful read

      const toolCallEntry = transformToolCall(fixture);
      const toolResultEntry = transformToolResult(fixture);

      const result = parser.parse(toolCallEntry, toolResultEntry);

      // Verify successful execution
      expect(result.status.normalized).toBe('completed');
      expect(result.todos).toBeDefined();
      expect(result.todos.length).toBe(6);

      // Check some specific todos
      const firstTodo = result.todos.find(t => t.id === '1');
      expect(firstTodo).toBeDefined();
      expect(firstTodo?.content).toBe(
        'Create comprehensive checklist of all tools and functions'
      );
      expect(firstTodo?.status).toBe('completed');
      expect(firstTodo?.priority).toBe('high');

      const inProgressTodo = result.todos.find(t => t.status === 'in_progress');
      expect(inProgressTodo).toBeDefined();
      expect(inProgressTodo?.content).toBe(
        'Systematically call all safe built-in tools to generate logs'
      );

      // Verify counts
      expect(result.statusCounts).toBeDefined();
      expect(result.statusCounts?.completed).toBe(4);
      expect(result.statusCounts?.in_progress).toBe(1);
      expect(result.statusCounts?.pending).toBe(1);

      // Verify UI helpers
      expect(result.ui.totalTodos).toBe(6);
      expect(result.ui.completedTodos).toBe(4);
      expect(result.ui.pendingTodos).toBe(1);
      expect(result.ui.inProgressTodos).toBe(1);
    });

    test('should parse string content from fixture', () => {
      const fixture = fixtureData.fixtures[0];

      const toolCallEntry = transformToolCall(fixture);
      const toolResultEntry = transformToolResult(fixture);

      // The fixture has JSON string in content field
      const result = parser.parse(toolCallEntry, toolResultEntry);

      expect(result.status.normalized).toBe('completed');
      expect(result.todos.length).toBe(6);
    });
  });

  describe('canParse validation', () => {
    test('should correctly identify TodoRead tool calls', () => {
      const fixture = fixtureData.fixtures[0];
      const toolCallEntry = transformToolCall(fixture);
      expect(parser.canParse(toolCallEntry)).toBe(true);
    });

    test('should reject non-TodoRead tool entries', () => {
      const nonTodoReadEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'TodoWrite',
            input: { todos: [] },
          },
        ],
      };
      expect(parser.canParse(nonTodoReadEntry)).toBe(false);
    });

    test('should reject user messages', () => {
      const userEntry: LogEntry = {
        uuid: 'test-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        type: 'user',
        content: 'Show my todos',
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
          name: 'TodoRead',
          input: {},
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
      expect(result.todos).toEqual([]);
      expect(result.errorMessage).toBeUndefined();
    });

    test('should handle empty todo list', () => {
      const emptyResult: LogEntry = {
        uuid: 'result-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        parentUuid: 'test-uuid',
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-id',
            output: { todos: [] },
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
            name: 'TodoRead',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall, emptyResult);
      expect(result.status.normalized).toBe('completed');
      expect(result.todos).toEqual([]);
      expect(result.ui.totalTodos).toBe(0);
    });

    test('should handle error output', () => {
      const errorResult: LogEntry = {
        uuid: 'result-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        parentUuid: 'test-uuid',
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-id',
            output: 'Failed to access todo storage',
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
            name: 'TodoRead',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall, errorResult);
      expect(result.status.normalized).toBe('failed');
      expect(result.errorMessage).toBe('Failed to access todo storage');
      expect(result.todos).toEqual([]);
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
            name: 'TodoRead',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall, interruptedResult);
      expect(result.status.normalized).toBe('interrupted');
      expect(result.todos).toEqual([]);
    });

    test('should parse string output format (markdown)', () => {
      const markdownResult: LogEntry = {
        uuid: 'result-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        parentUuid: 'test-uuid',
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-id',
            output: `- [ ] Implement user authentication (priority: high)
- [x] Write unit tests for API (priority: medium)
- [x] Deploy to production (priority: high)`,
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
            name: 'TodoRead',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall, markdownResult);
      expect(result.status.normalized).toBe('completed');
      expect(result.todos).toHaveLength(3);

      // Check parsed todos from markdown
      expect(result.todos[0].content).toBe('Implement user authentication');
      expect(result.todos[0].status).toBe('pending');
      expect(result.todos[0].priority).toBe('high');

      expect(result.todos[1].content).toBe('Write unit tests for API');
      expect(result.todos[1].status).toBe('completed');
      expect(result.todos[1].priority).toBe('medium');
    });
  });

  describe('todo parsing edge cases', () => {
    test('should normalize different status formats', () => {
      const variousStatusResult: LogEntry = {
        uuid: 'result-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        parentUuid: 'test-uuid',
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-id',
            output: {
              todos: [
                { id: '1', content: 'Task 1', status: 'IN_PROGRESS' },
                { id: '2', content: 'Task 2', status: 'done' },
                { id: '3', content: 'Task 3', status: 'pending' },
                { id: '4', content: 'Task 4', state: 'completed' },
              ],
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
            name: 'TodoRead',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall, variousStatusResult);

      expect(result.todos[0].status).toBe('in_progress');
      expect(result.todos[1].status).toBe('completed');
      expect(result.todos[2].status).toBe('pending');
      expect(result.todos[3].status).toBe('completed');
    });

    test('should normalize different priority formats', () => {
      const variousPriorityResult: LogEntry = {
        uuid: 'result-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        parentUuid: 'test-uuid',
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-id',
            output: {
              todos: [
                { id: '1', content: 'Task 1', priority: '1' },
                { id: '2', content: 'Task 2', priority: 'HIGH' },
                { id: '3', content: 'Task 3', priority: '3' },
                { id: '4', content: 'Task 4', priority: 'invalid' },
              ],
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
            name: 'TodoRead',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall, variousPriorityResult);

      expect(result.todos[0].priority).toBe('high');
      expect(result.todos[1].priority).toBe('high');
      expect(result.todos[2].priority).toBe('low');
      expect(result.todos[3].priority).toBe('medium'); // default
    });

    test('should handle alternative field names', () => {
      const alternativeFieldsResult: LogEntry = {
        uuid: 'result-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        parentUuid: 'test-uuid',
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-id',
            output: {
              items: [
                {
                  id: 'alt-1',
                  text: 'Alternative content field',
                  state: 'pending',
                  created: '2025-06-25T10:00:00Z',
                },
                {
                  id: 'alt-2',
                  task: 'Another content field',
                  status: 'completed',
                  updated: '2025-06-25T12:00:00Z',
                  completed: '2025-06-25T15:00:00Z',
                },
              ],
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
            name: 'TodoRead',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall, alternativeFieldsResult);

      expect(result.todos).toHaveLength(2);
      expect(result.todos[0].content).toBe('Alternative content field');
      expect(result.todos[0].createdAt).toBe('2025-06-25T10:00:00Z');
      expect(result.todos[1].content).toBe('Another content field');
      expect(result.todos[1].updatedAt).toBe('2025-06-25T12:00:00Z');
      expect(result.todos[1].completedAt).toBe('2025-06-25T15:00:00Z');
    });

    test('should parse numbered format from string output', () => {
      const numberedResult: LogEntry = {
        uuid: 'result-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        parentUuid: 'test-uuid',
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-id',
            output: `1. Implement authentication (priority: high)
2. Write tests (priority: medium)
3. Deploy application`,
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
            name: 'TodoRead',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall, numberedResult);

      expect(result.todos).toHaveLength(3);
      expect(result.todos[0].content).toBe('Implement authentication');
      expect(result.todos[0].priority).toBe('high');
      expect(result.todos[1].content).toBe('Write tests');
      expect(result.todos[1].priority).toBe('medium');
      expect(result.todos[2].content).toBe('Deploy application');
      expect(result.todos[2].priority).toBe('medium'); // default
    });

    test('should handle tags in todo items', () => {
      const tagsResult: LogEntry = {
        uuid: 'result-uuid',
        timestamp: '2025-06-25T18:20:11.465Z',
        parentUuid: 'test-uuid',
        type: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'test-id',
            output: {
              todos: [
                {
                  id: 'tagged-1',
                  content: 'Task with tags',
                  status: 'pending',
                  priority: 'high',
                  tags: ['frontend', 'urgent', 123], // mixed types
                },
                {
                  id: 'tagged-2',
                  content: 'Task without tags',
                  status: 'pending',
                  priority: 'medium',
                },
              ],
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
            name: 'TodoRead',
            input: {},
          },
        ],
      };

      const result = parser.parse(toolCall, tagsResult);

      expect(result.todos[0].tags).toEqual(['frontend', 'urgent']); // filtered strings only
      expect(result.todos[1].tags).toBeUndefined(); // no tags field in source data
    });
  });

  describe('feature support', () => {
    test('should declare supported features', () => {
      const features = parser.getSupportedFeatures();
      expect(features).toContain('basic-parsing');
      expect(features).toContain('status-mapping');
      expect(features).toContain('no-input-tool');
      expect(features).toContain('markdown-parsing');
      expect(features).toContain('priority-extraction');
      expect(features).toContain('statistics');
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

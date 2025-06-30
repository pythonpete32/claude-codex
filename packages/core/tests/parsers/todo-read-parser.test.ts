import { describe, expect, test } from 'vitest';
import type { LogEntry, TodoItem } from '@claude-codex/types';
import { TodoReadToolParser } from '../../src/parsers/todo-read-parser';

// Sample test data based on todoread-tool-fixtures.json structure
const sampleTodoReadToolCall: LogEntry = {
  uuid: 'todoread-call-uuid',
  timestamp: '2025-06-25T18:20:11.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_use',
      id: 'toolu_todoread_test',
      name: 'TodoRead',
      input: {}, // TodoRead has no input parameters
    },
  ],
};

const sampleTodos: TodoItem[] = [
  {
    id: 'todo-1',
    content: 'Implement user authentication',
    status: 'pending',
    priority: 'high',
    createdAt: '2025-06-25T10:00:00Z',
  },
  {
    id: 'todo-2',
    content: 'Write unit tests for API',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2025-06-25T11:00:00Z',
    updatedAt: '2025-06-25T12:00:00Z',
  },
  {
    id: 'todo-3',
    content: 'Deploy to production',
    status: 'completed',
    priority: 'high',
    createdAt: '2025-06-25T09:00:00Z',
    completedAt: '2025-06-25T15:00:00Z',
  },
];

const sampleTodoReadSuccessResult: LogEntry = {
  uuid: 'todoread-result-uuid',
  parentUuid: 'todoread-call-uuid',
  timestamp: '2025-06-25T18:20:11.565Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_todoread_test',
      output: {
        todos: sampleTodos,
        statusCounts: { pending: 1, in_progress: 1, completed: 1 },
        priorityCounts: { high: 2, medium: 1, low: 0 },
      },
      is_error: false,
    },
  ],
};

const sampleTodoReadWithToolUseResult: LogEntry = {
  uuid: 'todoread-result-uuid',
  parentUuid: 'todoread-call-uuid',
  timestamp: '2025-06-25T18:20:11.565Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_todoread_test',
      output: 'Found 3 todos in your list',
      is_error: false,
    },
  ],
  toolUseResult: {
    output: {
      todos: sampleTodos,
      statusCounts: { pending: 1, in_progress: 1, completed: 1 },
      priorityCounts: { high: 2, medium: 1, low: 0 },
    },
  },
};

const sampleTodoReadStringResult: LogEntry = {
  uuid: 'todoread-string-uuid',
  parentUuid: 'todoread-call-uuid',
  timestamp: '2025-06-25T18:20:11.565Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_todoread_test',
      output: `- [ ] Implement user authentication (priority: high)
- [x] Write unit tests for API (priority: medium)
- [x] Deploy to production (priority: high)`,
      is_error: false,
    },
  ],
};

const sampleTodoReadEmptyResult: LogEntry = {
  uuid: 'todoread-empty-uuid',
  parentUuid: 'todoread-call-uuid',
  timestamp: '2025-06-25T18:20:11.565Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_todoread_test',
      output: { todos: [] },
      is_error: false,
    },
  ],
};

const sampleTodoReadErrorResult: LogEntry = {
  uuid: 'todoread-error-uuid',
  parentUuid: 'todoread-call-uuid',
  timestamp: '2025-06-25T18:20:11.565Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_todoread_test',
      output: 'Failed to access todo storage',
      is_error: true,
    },
  ],
};

describe('TodoReadToolParser', () => {
  const parser = new TodoReadToolParser();

  describe('canParse', () => {
    test('should identify TodoRead tool use entries', () => {
      expect(parser.canParse(sampleTodoReadToolCall)).toBe(true);
    });

    test('should reject non-TodoRead tool entries', () => {
      const nonTodoReadEntry: LogEntry = {
        ...sampleTodoReadToolCall,
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
        ...sampleTodoReadToolCall,
        type: 'user',
        content: 'Show my todos',
      };
      expect(parser.canParse(userEntry)).toBe(false);
    });
  });

  describe('parse', () => {
    test('should parse successful todo list retrieval', () => {
      const result = parser.parse(
        sampleTodoReadToolCall,
        sampleTodoReadSuccessResult
      );

      // Check base props
      expect(result.id).toBe('toolu_todoread_test');
      expect(result.uuid).toBe('todoread-call-uuid');
      expect(result.timestamp).toBe('2025-06-25T18:20:11.465Z');

      // Check todos array
      expect(result.todos).toHaveLength(3);
      expect(result.todos[0]).toEqual({
        id: 'todo-1',
        content: 'Implement user authentication',
        status: 'pending',
        priority: 'high',
        createdAt: '2025-06-25T10:00:00Z',
      });

      // Check status and priority counts
      expect(result.statusCounts).toEqual({
        pending: 1,
        in_progress: 1,
        completed: 1,
      });
      expect(result.priorityCounts).toEqual({
        high: 2,
        medium: 1,
        low: 0,
      });

      // Check status
      expect(result.status.normalized).toBe('completed');
      expect(result.errorMessage).toBeUndefined();

      // Check UI helpers
      expect(result.ui.totalTodos).toBe(3);
      expect(result.ui.completedTodos).toBe(1);
      expect(result.ui.pendingTodos).toBe(1);
      expect(result.ui.inProgressTodos).toBe(1);
    });

    test('should parse toolUseResult format from fixtures', () => {
      const result = parser.parse(
        sampleTodoReadToolCall,
        sampleTodoReadWithToolUseResult
      );

      expect(result.status.normalized).toBe('completed');
      expect(result.todos).toHaveLength(3);
      expect(result.statusCounts).toEqual({
        pending: 1,
        in_progress: 1,
        completed: 1,
      });
      expect(result.ui.totalTodos).toBe(3);
    });

    test('should parse string output format (markdown)', () => {
      const result = parser.parse(
        sampleTodoReadToolCall,
        sampleTodoReadStringResult
      );

      expect(result.status.normalized).toBe('completed');
      expect(result.todos).toHaveLength(3);

      // Check parsed todos from markdown
      expect(result.todos[0].content).toBe('Implement user authentication');
      expect(result.todos[0].status).toBe('pending');
      expect(result.todos[0].priority).toBe('high');

      expect(result.todos[1].content).toBe('Write unit tests for API');
      expect(result.todos[1].status).toBe('completed');
      expect(result.todos[1].priority).toBe('medium');

      // Check calculated counts
      expect(result.statusCounts?.pending).toBe(1);
      expect(result.statusCounts?.completed).toBe(2);
      expect(result.priorityCounts?.high).toBe(2);
    });

    test('should handle empty todo list', () => {
      const result = parser.parse(
        sampleTodoReadToolCall,
        sampleTodoReadEmptyResult
      );

      expect(result.status.normalized).toBe('completed');
      expect(result.todos).toEqual([]);
      expect(result.ui.totalTodos).toBe(0);
      expect(result.ui.completedTodos).toBe(0);
      expect(result.ui.pendingTodos).toBe(0);
      expect(result.ui.inProgressTodos).toBe(0);
    });

    test('should parse error result', () => {
      const result = parser.parse(
        sampleTodoReadToolCall,
        sampleTodoReadErrorResult
      );

      expect(result.status.normalized).toBe('failed');
      expect(result.errorMessage).toBe('Failed to access todo storage');
      expect(result.todos).toEqual([]);
      expect(result.ui.totalTodos).toBe(0);
    });

    test('should handle pending status when no result', () => {
      const result = parser.parse(sampleTodoReadToolCall);

      expect(result.status.normalized).toBe('pending');
      expect(result.todos).toEqual([]);
      expect(result.errorMessage).toBeUndefined();
    });

    test('should handle interrupted operations', () => {
      const interruptedResult: LogEntry = {
        ...sampleTodoReadSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_todoread_test',
            output: { interrupted: true },
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleTodoReadToolCall, interruptedResult);

      expect(result.status.normalized).toBe('interrupted');
      expect(result.todos).toEqual([]);
    });
  });

  describe('todo parsing edge cases', () => {
    test('should normalize different status formats', () => {
      const variousStatusResult: LogEntry = {
        ...sampleTodoReadSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_todoread_test',
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

      const result = parser.parse(sampleTodoReadToolCall, variousStatusResult);

      expect(result.todos[0].status).toBe('in_progress');
      expect(result.todos[1].status).toBe('completed');
      expect(result.todos[2].status).toBe('pending');
      expect(result.todos[3].status).toBe('completed');
    });

    test('should normalize different priority formats', () => {
      const variousPriorityResult: LogEntry = {
        ...sampleTodoReadSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_todoread_test',
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

      const result = parser.parse(
        sampleTodoReadToolCall,
        variousPriorityResult
      );

      expect(result.todos[0].priority).toBe('high');
      expect(result.todos[1].priority).toBe('high');
      expect(result.todos[2].priority).toBe('low');
      expect(result.todos[3].priority).toBe('medium'); // default
    });

    test('should handle alternative field names', () => {
      const alternativeFieldsResult: LogEntry = {
        ...sampleTodoReadSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_todoread_test',
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

      const result = parser.parse(
        sampleTodoReadToolCall,
        alternativeFieldsResult
      );

      expect(result.todos).toHaveLength(2);
      expect(result.todos[0].content).toBe('Alternative content field');
      expect(result.todos[0].createdAt).toBe('2025-06-25T10:00:00Z');
      expect(result.todos[1].content).toBe('Another content field');
      expect(result.todos[1].updatedAt).toBe('2025-06-25T12:00:00Z');
      expect(result.todos[1].completedAt).toBe('2025-06-25T15:00:00Z');
    });

    test('should parse numbered format from string output', () => {
      const numberedResult: LogEntry = {
        ...sampleTodoReadStringResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_todoread_test',
            output: `1. Implement authentication (priority: high)
2. Write tests (priority: medium)
3. Deploy application`,
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleTodoReadToolCall, numberedResult);

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
        ...sampleTodoReadSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_todoread_test',
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

      const result = parser.parse(sampleTodoReadToolCall, tagsResult);

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
});

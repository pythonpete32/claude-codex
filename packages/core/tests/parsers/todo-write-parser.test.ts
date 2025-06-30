import { describe, expect, test } from 'vitest';
import type { LogEntry, TodoItem } from '@claude-codex/types';
import { TodoWriteToolParser } from '../../src/parsers/todo-write-parser';

// Sample test data based on todowrite-tool-fixtures.json structure
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

const sampleTodoWriteToolCall: LogEntry = {
  uuid: 'todowrite-call-uuid',
  timestamp: '2025-06-25T18:20:11.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_use',
      id: 'toolu_todowrite_test',
      name: 'TodoWrite',
      input: {
        todos: sampleTodos,
      },
    },
  ],
};

const sampleTodoWriteSuccessResult: LogEntry = {
  uuid: 'todowrite-result-uuid',
  parentUuid: 'todowrite-call-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_todowrite_test',
      output: 'Successfully wrote 3 todos to your list',
      is_error: false,
    },
  ],
};

const sampleTodoWriteDetailedResult: LogEntry = {
  uuid: 'todowrite-detailed-uuid',
  parentUuid: 'todowrite-call-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_todowrite_test',
      output: {
        writtenCount: 3,
        addedCount: 2,
        updatedCount: 1,
        removedCount: 0,
      },
      is_error: false,
    },
  ],
};

const sampleTodoWritePartialResult: LogEntry = {
  uuid: 'todowrite-partial-uuid',
  parentUuid: 'todowrite-call-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_todowrite_test',
      output: 'Added 2 todos, updated 1 todo, failed to process 1 todo',
      is_error: false,
    },
  ],
};

const sampleTodoWriteEmptyCall: LogEntry = {
  uuid: 'todowrite-empty-uuid',
  timestamp: '2025-06-25T18:20:11.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_use',
      id: 'toolu_todowrite_empty',
      name: 'TodoWrite',
      input: {
        todos: [],
      },
    },
  ],
};

const sampleTodoWriteErrorResult: LogEntry = {
  uuid: 'todowrite-error-uuid',
  parentUuid: 'todowrite-call-uuid',
  timestamp: '2025-06-25T18:20:12.465Z',
  type: 'assistant',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_todowrite_test',
      output: 'Failed to access todo storage: Permission denied',
      is_error: true,
    },
  ],
};

describe('TodoWriteToolParser', () => {
  const parser = new TodoWriteToolParser();

  describe('canParse', () => {
    test('should identify TodoWrite tool use entries', () => {
      expect(parser.canParse(sampleTodoWriteToolCall)).toBe(true);
    });

    test('should reject non-TodoWrite tool entries', () => {
      const nonTodoWriteEntry: LogEntry = {
        ...sampleTodoWriteToolCall,
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'TodoRead',
            input: {},
          },
        ],
      };
      expect(parser.canParse(nonTodoWriteEntry)).toBe(false);
    });

    test('should reject user messages', () => {
      const userEntry: LogEntry = {
        ...sampleTodoWriteToolCall,
        type: 'user',
        content: 'Save my todos',
      };
      expect(parser.canParse(userEntry)).toBe(false);
    });
  });

  describe('parse', () => {
    test('should parse successful todo write operation', () => {
      const result = parser.parse(sampleTodoWriteToolCall, sampleTodoWriteSuccessResult);

      // Check base props
      expect(result.id).toBe('toolu_todowrite_test');
      expect(result.uuid).toBe('todowrite-call-uuid');
      expect(result.timestamp).toBe('2025-06-25T18:20:11.465Z');

      // Check input structure
      expect(result.todos).toEqual(sampleTodos);
      expect(result.changes).toHaveLength(3); // Should create changes for all todos

      // Check status
      expect(result.status.normalized).toBe('completed');
      expect(result.errorMessage).toBeUndefined();

      // Check operation type determination
      expect(result.operation).toBe('create'); // All new todos

      // Check UI helpers
      expect(result.ui.totalTodos).toBe(3);
      expect(result.ui.writtenCount).toBe(0); // No structured data available
      expect(result.ui.addedCount).toBe(0); // No structured data available
      expect(result.ui.modifiedCount).toBe(0);
      expect(result.ui.deletedCount).toBe(0);
    });

    test('should parse detailed result with counts', () => {
      const result = parser.parse(sampleTodoWriteToolCall, sampleTodoWriteDetailedResult);

      expect(result.status.normalized).toBe('completed');
      expect(result.ui.writtenCount).toBe(3);
      expect(result.ui.addedCount).toBe(2);
      expect(result.ui.modifiedCount).toBe(1);
      expect(result.ui.deletedCount).toBe(0);

      // Check change tracking
      expect(result.changes).toHaveLength(3); // 2 added + 1 updated
      expect(result.changes.filter(c => c.type === 'add')).toHaveLength(2);
      expect(result.changes.filter(c => c.type === 'update')).toHaveLength(1);
    });

    test('should NOT extract counts from string messages (avoid anti-pattern)', () => {
      const result = parser.parse(sampleTodoWriteToolCall, sampleTodoWritePartialResult);

      expect(result.status.normalized).toBe('completed');
      // Parser correctly avoids brittle string parsing - counts should be 0
      expect(result.ui.addedCount).toBe(0);
      expect(result.ui.modifiedCount).toBe(0);
      expect(result.ui.deletedCount).toBe(0);
      // But should preserve the message for display
      expect(result.message).toBe('Added 2 todos, updated 1 todo, failed to process 1 todo');
    });

    test('should handle empty todo list (clear operation)', () => {
      const emptyResult: LogEntry = {
        ...sampleTodoWriteSuccessResult,
        parentUuid: 'todowrite-empty-uuid',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_todowrite_empty',
            output: 'Cleared todo list',
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleTodoWriteEmptyCall, emptyResult);

      expect(result.operation).toBe('clear');
      expect(result.todos).toEqual([]);
      expect(result.ui.totalTodos).toBe(0);
      expect(result.changes).toEqual([]);
    });

    test('should parse error result', () => {
      const result = parser.parse(sampleTodoWriteToolCall, sampleTodoWriteErrorResult);

      expect(result.status.normalized).toBe('failed');
      expect(result.errorMessage).toBe('Failed to access todo storage: Permission denied');
      expect(result.ui.writtenCount).toBe(0);
    });

    test('should handle pending status when no result', () => {
      const result = parser.parse(sampleTodoWriteToolCall);

      expect(result.status.normalized).toBe('pending');
      expect(result.ui.writtenCount).toBe(0);
      expect(result.errorMessage).toBeUndefined();
    });

    test('should handle interrupted operations', () => {
      const interruptedResult: LogEntry = {
        ...sampleTodoWriteSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_todowrite_test',
            output: {
              interrupted: true,
              writtenCount: 1,
            },
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleTodoWriteToolCall, interruptedResult);

      expect(result.status.normalized).toBe('interrupted');
      expect(result.ui.writtenCount).toBe(1);
    });
  });

  describe('operation type detection', () => {
    test('should detect create operation for new todos', () => {
      const newTodos: TodoItem[] = [
        {
          id: 'temp-1',
          content: 'New task 1',
          status: 'pending',
          priority: 'medium',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'temp-2',
          content: 'New task 2',
          status: 'pending',
          priority: 'low',
          createdAt: new Date().toISOString(),
        },
      ];

      const createCall: LogEntry = {
        ...sampleTodoWriteToolCall,
        content: [
          {
            type: 'tool_use',
            id: 'toolu_create_test',
            name: 'TodoWrite',
            input: { todos: newTodos },
          },
        ],
      };

      const result = parser.parse(createCall); // No result needed for operation detection
      expect(result.operation).toBe('create');
    });

    test('should detect update operation for existing todos', () => {
      const existingTodos: TodoItem[] = [
        {
          id: 'existing-1',
          content: 'Updated task',
          status: 'in_progress',
          priority: 'high',
          createdAt: '2025-06-25T10:00:00Z',
          updatedAt: new Date().toISOString(),
        },
      ];

      const updateCall: LogEntry = {
        ...sampleTodoWriteToolCall,
        content: [
          {
            type: 'tool_use',
            id: 'toolu_update_test',
            name: 'TodoWrite',
            input: { todos: existingTodos },
          },
        ],
      };

      const result = parser.parse(updateCall); // No result needed for operation detection
      expect(result.operation).toBe('update');
    });

    test('should detect replace operation for mixed todos', () => {
      const mixedTodos: TodoItem[] = [
        {
          id: 'existing-1',
          content: 'Existing task',
          status: 'completed',
          priority: 'medium',
          createdAt: '2025-06-25T10:00:00Z',
        },
        {
          id: 'new-task',
          content: 'Brand new task',
          status: 'pending',
          priority: 'high',
          createdAt: new Date().toISOString(),
        },
      ];

      const replaceCall: LogEntry = {
        ...sampleTodoWriteToolCall,
        content: [
          {
            type: 'tool_use',
            id: 'toolu_replace_test',
            name: 'TodoWrite',
            input: { todos: mixedTodos },
          },
        ],
      };

      const result = parser.parse(replaceCall); // No result needed for operation detection  
      expect(result.operation).toBe('replace');
    });
  });

  describe('change tracking', () => {
    test('should create synthetic changes for add operations', () => {
      const result = parser.parse(sampleTodoWriteToolCall, sampleTodoWriteDetailedResult);

      const addChanges = result.changes.filter(c => c.type === 'add');
      expect(addChanges).toHaveLength(2);
      expect(addChanges[0].newValue).toEqual(sampleTodos[0]);
      expect(addChanges[0].todoId).toBe('todo-1');
    });

    test('should create synthetic changes for update operations', () => {
      const result = parser.parse(sampleTodoWriteToolCall, sampleTodoWriteDetailedResult);

      const updateChanges = result.changes.filter(c => c.type === 'update');
      expect(updateChanges).toHaveLength(1);
      expect(updateChanges[0].newValue).toEqual(sampleTodos[2]); // 3rd todo (index 2 after 2 adds)
      expect(updateChanges[0].oldValue?.content).toBe('Previous content');
    });

    test('should create synthetic changes for delete operations', () => {
      const deleteResult: LogEntry = {
        ...sampleTodoWriteDetailedResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_todowrite_test',
            output: {
              writtenCount: 2,
              addedCount: 0,
              updatedCount: 0,
              removedCount: 2,
            },
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleTodoWriteToolCall, deleteResult);

      const deleteChanges = result.changes.filter(c => c.type === 'delete');
      expect(deleteChanges).toHaveLength(2);
      expect(deleteChanges[0].todoId).toBe('removed-0');
      expect(deleteChanges[0].oldValue?.content).toBe('Removed item');
    });
  });

  describe('edge cases', () => {
    test('should handle missing todos input', () => {
      const noTodosEntry: LogEntry = {
        ...sampleTodoWriteToolCall,
        content: [
          {
            type: 'tool_use',
            id: 'test-id',
            name: 'TodoWrite',
            input: {},
          },
        ],
      };

      const result = parser.parse(noTodosEntry);
      expect(result.todos).toEqual([]);
      expect(result.ui.totalTodos).toBe(0);
      expect(result.operation).toBe('clear');
    });

    test('should handle malformed structured output', () => {
      const malformedResult: LogEntry = {
        ...sampleTodoWriteDetailedResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_todowrite_test',
            output: {
              written: 5, // alternative field name
              added: 2,   // alternative field name
            },
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleTodoWriteToolCall, malformedResult);

      expect(result.ui.writtenCount).toBe(5);
      expect(result.ui.addedCount).toBe(2);
      expect(result.ui.modifiedCount).toBe(0); // missing
    });

    test('should NOT handle complex count extraction patterns (avoid anti-pattern)', () => {
      const complexMessageResult: LogEntry = {
        ...sampleTodoWriteSuccessResult,
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_todowrite_test',
            output: 'Operation completed: 5 todos written, 3 todos added, 2 todos updated, 1 todo removed',
            is_error: false,
          },
        ],
      };

      const result = parser.parse(sampleTodoWriteToolCall, complexMessageResult);

      // Parser correctly avoids brittle string parsing - counts should be 0
      expect(result.ui.writtenCount).toBe(0);
      expect(result.ui.addedCount).toBe(0);
      expect(result.ui.modifiedCount).toBe(0);
      expect(result.ui.deletedCount).toBe(0);
      // But should preserve the message for display
      expect(result.message).toBe('Operation completed: 5 todos written, 3 todos added, 2 todos updated, 1 todo removed');
    });
  });

  describe('feature support', () => {
    test('should declare supported features', () => {
      const features = parser.getSupportedFeatures();
      expect(features).toContain('basic-parsing');
      expect(features).toContain('status-mapping');
      expect(features).toContain('batch-operations');
      expect(features).toContain('operation-detection');
      expect(features).toContain('change-tracking');
      expect(features).toContain('statistics');
      expect(features).toContain('interrupted-support');
    });
  });
});
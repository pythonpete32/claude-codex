import type {
  LogEntry,
  MessageContent,
  ParseConfig,
  ParsedToolOutput,
  RawLogEntry,
  RawToolResult,
  TodoChange,
  TodoItem,
  TodoWriteToolProps,
} from '@claude-codex/types';
import { StatusMapper } from '@claude-codex/types';
import { BaseToolParser } from './base-parser';

/**
 * TodoWrite tool parser - outputs structured props for todo list updates
 * Complex tool with structured format from hybrid schema architecture
 */
export class TodoWriteToolParser extends BaseToolParser<TodoWriteToolProps> {
  readonly toolName = 'TodoWrite';
  readonly toolType = 'other';
  readonly version = '1.0.0';

  parse(
    toolCall: LogEntry,
    toolResult?: LogEntry,
    config?: ParseConfig
  ): TodoWriteToolProps {
    // Extract base props for correlation
    const baseProps = this.extractBaseProps(toolCall, toolResult, config);

    // Extract tool input using optional chaining
    const toolUse = this.extractToolUse(toolCall);
    const todos = toolUse.input?.todos as TodoItem[] | undefined;

    // Initialize result data
    let writtenCount = 0;
    let addedCount = 0;
    let updatedCount = 0;
    let removedCount = 0;
    let message: string | undefined = undefined;
    let errorMessage: string | undefined = undefined;
    let interrupted = false;
    let status = StatusMapper.mapFromError(false, !toolResult);

    if (toolResult) {
      const result = this.extractToolResult(toolResult, toolUse.id!);

      if (!result.is_error) {
        // Parse successful output
        const output = this.parseOutput(result, toolResult);
        writtenCount = output.writtenCount;
        addedCount = output.addedCount;
        updatedCount = output.updatedCount;
        removedCount = output.removedCount;
        message = output.message;
        interrupted = output.interrupted || false;
      } else {
        // Extract error message from toolUseResult
        const rawResult = this.extractRawToolResult(toolResult);
        errorMessage = this.extractErrorMessage(rawResult);
      }

      // Map status including interrupted state
      status = StatusMapper.mapFromError(result.is_error, false, interrupted);
    }

    // Calculate operation type
    const operation = this.determineOperation(todos, writtenCount);

    // Create change tracking
    const changes: TodoChange[] = this.createChanges(
      todos || [],
      addedCount,
      updatedCount,
      removedCount
    );

    // Return structured props for UI consumption
    return {
      // Base props
      ...baseProps,
      status,

      // Todos and changes
      todos: todos || [],
      changes,

      // Operation details from fixtures
      operation,
      message,
      errorMessage,

      // UI helpers with statistics
      ui: {
        totalTodos: todos?.length || 0,
        addedCount,
        modifiedCount: updatedCount,
        deletedCount: removedCount,
        writtenCount,
      },
    };
  }

  private parseOutput(
    result: MessageContent & { type: 'tool_result' },
    _toolResult?: LogEntry
  ): {
    writtenCount: number;
    addedCount: number;
    updatedCount: number;
    removedCount: number;
    message?: string;
    interrupted?: boolean;
  } {
    // Handle string output (success message)
    if (typeof result.output === 'string') {
      // Try to extract counts from message
      const writtenMatch = result.output.match(/(\d+)\s*todos?\s*written/i);
      const addedMatch = result.output.match(/(\d+)\s*todos?\s*added/i);
      const updatedMatch = result.output.match(/(\d+)\s*todos?\s*updated/i);
      const removedMatch = result.output.match(/(\d+)\s*todos?\s*removed/i);

      const writtenCount = writtenMatch
        ? Number.parseInt(writtenMatch[1], 10)
        : 0;

      return {
        writtenCount,
        addedCount: addedMatch ? Number.parseInt(addedMatch[1], 10) : 0,
        updatedCount: updatedMatch ? Number.parseInt(updatedMatch[1], 10) : 0,
        removedCount: removedMatch ? Number.parseInt(removedMatch[1], 10) : 0,
        interrupted: false,
      };
    }

    // Handle structured output
    if (result.output && typeof result.output === 'object') {
      const output = result.output as ParsedToolOutput;

      // Check for interrupted flag
      if (output.interrupted === true) {
        return {
          writtenCount:
            typeof output.writtenCount === 'number' ? output.writtenCount : 0,
          addedCount: 0,
          updatedCount: 0,
          removedCount: 0,
          interrupted: true,
        };
      }

      return {
        writtenCount:
          typeof output.writtenCount === 'number'
            ? output.writtenCount
            : typeof output.written === 'number'
              ? output.written
              : typeof output.count === 'number'
                ? output.count
                : 0,
        addedCount:
          typeof output.addedCount === 'number'
            ? output.addedCount
            : typeof output.added === 'number'
              ? output.added
              : 0,
        updatedCount:
          typeof output.updatedCount === 'number'
            ? output.updatedCount
            : typeof output.updated === 'number'
              ? output.updated
              : 0,
        removedCount:
          typeof output.removedCount === 'number'
            ? output.removedCount
            : typeof output.removed === 'number'
              ? output.removed
              : 0,
        interrupted: false,
      };
    }

    // Default to no items written
    return {
      writtenCount: 0,
      addedCount: 0,
      updatedCount: 0,
      removedCount: 0,
      interrupted: false,
    };
  }

  private determineOperation(
    todos: TodoItem[] | undefined,
    writtenCount: number
  ): 'create' | 'update' | 'replace' | 'clear' {
    if (!todos || todos.length === 0) {
      return 'clear'; // Empty todo list
    }

    if (writtenCount === 0) {
      return 'update'; // No successful writes yet
    }

    // Check if all todos are new (no existing IDs)
    const hasExistingIds = todos.some(
      todo => todo.id && !todo.id.startsWith('temp-')
    );

    if (!hasExistingIds) {
      return 'create'; // All new todos
    }

    // Check if this is a full replacement
    const hasOnlyNewAndExisting = todos.every(
      todo => !todo.id || todo.id.startsWith('temp-') || !!todo.updatedAt
    );

    return hasOnlyNewAndExisting ? 'update' : 'replace';
  }

  // calculateStats method removed - not used in current implementation

  private extractRawToolResult(toolResult?: LogEntry): RawToolResult | null {
    if (!toolResult) return null;

    // Look for toolUseResult in the log entry
    const entry = toolResult as unknown as RawLogEntry;
    return entry.toolUseResult || null;
  }

  private extractErrorMessage(rawResult: RawToolResult | null): string {
    if (typeof rawResult === 'string') {
      return rawResult;
    }

    if (rawResult && typeof rawResult === 'object') {
      return (
        rawResult.errorMessage ||
        rawResult.error ||
        rawResult.message ||
        'Failed to write todos'
      );
    }

    return 'TodoWrite operation failed';
  }

  private createChanges(
    todos: TodoItem[],
    addedCount: number,
    updatedCount: number,
    removedCount: number
  ): TodoChange[] {
    const changes: TodoChange[] = [];

    // Create synthetic changes based on counts
    // In a real implementation, we'd track actual changes

    // Added items
    for (let i = 0; i < addedCount && i < todos.length; i++) {
      changes.push({
        type: 'add',
        todoId: todos[i].id,
        newValue: todos[i],
      });
    }

    // Updated items
    for (let i = 0; i < updatedCount && i + addedCount < todos.length; i++) {
      const todo = todos[i + addedCount];
      changes.push({
        type: 'update',
        todoId: todo.id,
        oldValue: { ...todo, content: 'Previous content' } as TodoItem,
        newValue: todo,
      });
    }

    // Removed items
    for (let i = 0; i < removedCount; i++) {
      changes.push({
        type: 'delete',
        todoId: `removed-${i}`,
        oldValue: {
          id: `removed-${i}`,
          content: 'Removed item',
          status: 'completed',
          priority: 'low',
          createdAt: new Date().toISOString(),
        } as TodoItem,
      });
    }

    return changes;
  }

  protected getSupportedFeatures(): string[] {
    // Declare parser capabilities
    return [
      'basic-parsing',
      'status-mapping',
      'correlation',
      'structured-output',
      'batch-operations',
      'operation-detection',
      'change-tracking',
      'statistics',
      'interrupted-support',
    ];
  }
}

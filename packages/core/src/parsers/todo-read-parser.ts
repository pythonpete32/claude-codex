import type {
  LogEntry,
  MessageContent,
  ParseConfig,
  ParsedToolOutput,
  RawLogEntry,
  RawToolResult,
  TodoItem,
  TodoReadToolProps,
} from '@claude-codex/types';
import { mapFromError } from '@claude-codex/types';
import { BaseToolParser } from './base-parser';

/**
 * TodoRead tool parser - outputs structured props for todo list display
 * Complex tool with structured format from hybrid schema architecture
 * Note: TodoRead has no input parameters
 */
export class TodoReadToolParser extends BaseToolParser<TodoReadToolProps> {
  readonly toolName = 'TodoRead';
  readonly toolType = 'other';
  readonly version = '1.0.0';

  parse(
    toolCall: LogEntry,
    toolResult?: LogEntry,
    config?: ParseConfig
  ): TodoReadToolProps {
    // Extract base props for correlation
    const baseProps = this.extractBaseProps(toolCall, toolResult, config);

    // TodoRead has no input - verify this
    const toolUse = this.extractToolUse(toolCall);
    // No input to extract - tool takes no parameters

    // Initialize result data
    let items: TodoItem[] = [];
    let errorMessage: string | undefined;
    let statusCounts:
      | { pending: number; in_progress: number; completed: number }
      | undefined;
    let priorityCounts:
      | { high: number; medium: number; low: number }
      | undefined;
    let interrupted = false;
    let status = mapFromError(false, !toolResult);

    if (toolResult) {
      const result = this.extractToolResult(toolResult, toolUse.id!);

      if (!result.is_error) {
        // Parse successful output
        const output = this.parseOutput(result, toolResult);
        items = output.items;
        statusCounts = output.statusCounts;
        priorityCounts = output.priorityCounts;
        interrupted = output.interrupted || false;
      } else {
        // Extract error message from toolUseResult
        const rawResult = this.extractRawToolResult(toolResult);
        errorMessage = this.extractErrorMessage(rawResult);
      }

      // Map status including interrupted state
      status = mapFromError(result.is_error, false, interrupted);
    }

    // Calculate statistics
    const stats = this.calculateStats(items);

    // Return structured props for UI consumption
    return {
      // Base props
      ...baseProps,
      status,

      // Todos array
      todos: items,

      // Additional metadata from fixtures
      statusCounts,
      priorityCounts,
      errorMessage,

      // UI helpers with statistics
      ui: {
        totalTodos: items.length,
        completedTodos: stats.completed,
        pendingTodos: stats.pending,
        inProgressTodos: stats.inProgress,
      },
    };
  }

  private parseOutput(
    result: MessageContent & { type: 'tool_result' },
    toolResult?: LogEntry
  ): {
    items: TodoItem[];
    statusCounts?: { pending: number; in_progress: number; completed: number };
    priorityCounts?: { high: number; medium: number; low: number };
    interrupted?: boolean;
  } {
    // First try to get toolUseResult from the log entry
    const rawResult = this.extractRawToolResult(toolResult);

    if (rawResult && typeof rawResult === 'object') {
      // Check if rawResult is directly an array of todos (fixture format)
      if (Array.isArray(rawResult)) {
        const items = rawResult.map(this.parseTodoItem);
        const stats = this.calculateStats(items);
        return {
          items,
          statusCounts: {
            pending: stats.pending,
            in_progress: stats.inProgress,
            completed: stats.completed,
          },
          priorityCounts: {
            high: stats.highPriority,
            medium: items.filter(i => i.priority === 'medium').length,
            low: items.filter(i => i.priority === 'low').length,
          },
          interrupted: false,
        };
      }

      // Parse fixture-style output
      const output = rawResult.output || rawResult;

      if (typeof output === 'object' && output !== null) {
        const outputObj = output as Record<string, unknown>;
        if (outputObj.todos && Array.isArray(outputObj.todos)) {
          return {
            items: outputObj.todos.map(this.parseTodoItem),
            statusCounts:
              typeof outputObj.statusCounts === 'object' &&
              outputObj.statusCounts !== null
                ? (outputObj.statusCounts as {
                    pending: number;
                    in_progress: number;
                    completed: number;
                  })
                : undefined,
            priorityCounts:
              typeof outputObj.priorityCounts === 'object' &&
              outputObj.priorityCounts !== null
                ? (outputObj.priorityCounts as {
                    high: number;
                    medium: number;
                    low: number;
                  })
                : undefined,
            interrupted: false,
          };
        }
      }
    }

    // Handle string output (check content, text, and output fields)
    const stringOutput =
      typeof result.output === 'string'
        ? result.output
        : result.content || result.text || null;

    if (stringOutput) {
      const items = this.parseStringTodos(stringOutput);
      const stats = this.calculateStats(items);
      return {
        items,
        statusCounts: {
          pending: stats.pending,
          in_progress: stats.inProgress,
          completed: stats.completed,
        },
        priorityCounts: {
          high: stats.highPriority,
          medium: items.filter(i => i.priority === 'medium').length,
          low: items.filter(i => i.priority === 'low').length,
        },
        interrupted: false,
      };
    }

    // Handle structured output
    if (result.output && typeof result.output === 'object') {
      const output = result.output as ParsedToolOutput;

      // Check for interrupted flag
      if (output.interrupted === true) {
        return {
          items: [],
          interrupted: true,
        };
      }

      // Handle todos array
      if (Array.isArray(output.todos)) {
        return {
          items: output.todos.map(this.parseTodoItem),
          interrupted: false,
        };
      }

      // Handle items array (alternative format)
      if (Array.isArray(output.items)) {
        return {
          items: output.items.map(this.parseTodoItem),
          interrupted: false,
        };
      }

      // Handle direct array output
      if (Array.isArray(output)) {
        return {
          items: output.map(this.parseTodoItem),
          interrupted: false,
        };
      }
    }

    // Default empty result
    return {
      items: [],
      statusCounts: { pending: 0, in_progress: 0, completed: 0 },
      priorityCounts: { high: 0, medium: 0, low: 0 },
      interrupted: false,
    };
  }

  private parseStringTodos(output: string): TodoItem[] {
    // Parse markdown-style todo list
    const lines = output.trim().split('\n');
    const items: TodoItem[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Parse checkbox format: - [ ] or - [x]
      const checkboxMatch = trimmed.match(/^-\s*\[([ x])\]\s*(.+)/i);
      if (checkboxMatch) {
        const [, checked, content] = checkboxMatch;
        const [text, priority] = this.extractPriority(content);

        items.push({
          id: `todo-${items.length + 1}`,
          content: text,
          status: checked === 'x' ? 'completed' : 'pending',
          priority: priority || 'medium',
          createdAt: new Date().toISOString(),
        });
        continue;
      }

      // Parse numbered format: 1. Task (priority: high)
      const numberedMatch = trimmed.match(/^\d+\.\s*(.+)/);
      if (numberedMatch) {
        const [, content] = numberedMatch;
        const [text, priority] = this.extractPriority(content);

        items.push({
          id: `todo-${items.length + 1}`,
          content: text,
          status: 'pending',
          priority: priority || 'medium',
          createdAt: new Date().toISOString(),
        });
      }
    }

    return items;
  }

  private parseTodoItem = (item: Record<string, unknown>): TodoItem => {
    // Normalize various todo formats - only include optional fields if they exist
    const todoItem: TodoItem = {
      id: typeof item.id === 'string' ? item.id : `todo-${Date.now()}`,
      content:
        typeof item.content === 'string'
          ? item.content
          : typeof item.text === 'string'
            ? item.text
            : typeof item.task === 'string'
              ? item.task
              : '',
      status: this.normalizeStatus(item.status || item.state),
      priority: this.normalizePriority(item.priority),
      createdAt:
        typeof item.createdAt === 'string'
          ? item.createdAt
          : typeof item.created === 'string'
            ? item.created
            : new Date().toISOString(),
    };

    // Only add optional fields if they exist in the source data
    if (
      typeof item.updatedAt === 'string' ||
      typeof item.updated === 'string'
    ) {
      todoItem.updatedAt =
        typeof item.updatedAt === 'string'
          ? item.updatedAt
          : (item.updated as string);
    }

    if (
      typeof item.completedAt === 'string' ||
      typeof item.completed === 'string'
    ) {
      todoItem.completedAt =
        typeof item.completedAt === 'string'
          ? item.completedAt
          : (item.completed as string);
    }

    // Only add tags if they exist in the source data
    if (Array.isArray(item.tags)) {
      todoItem.tags = item.tags.filter(
        tag => typeof tag === 'string'
      ) as string[];
    }

    return todoItem;
  };

  private normalizeStatus(status: unknown): TodoItem['status'] {
    const s = String(status).toLowerCase();
    if (s.includes('progress') || s === 'in_progress') return 'in_progress';
    if (s.includes('complete') || s === 'done') return 'completed';
    return 'pending';
  }

  private normalizePriority(priority: unknown): TodoItem['priority'] {
    const p = String(priority).toLowerCase();
    if (p === 'high' || p === '1') return 'high';
    if (p === 'low' || p === '3') return 'low';
    return 'medium';
  }

  private extractPriority(
    content: string
  ): [string, TodoItem['priority'] | null] {
    // Extract priority from content like "Task (priority: high)"
    const match = content.match(/(.+?)\s*\(priority:\s*(high|medium|low)\)/i);
    if (match) {
      const [, text, priority] = match;
      return [text.trim(), priority.toLowerCase() as TodoItem['priority']];
    }

    // Check for priority prefixes like "[HIGH]"
    const prefixMatch = content.match(/^\[(HIGH|MEDIUM|LOW)\]\s*(.+)/i);
    if (prefixMatch) {
      const [, priority, text] = prefixMatch;
      return [text.trim(), priority.toLowerCase() as TodoItem['priority']];
    }

    return [content, null];
  }

  private calculateStats(items: TodoItem[]) {
    return {
      completed: items.filter(item => item.status === 'completed').length,
      pending: items.filter(item => item.status === 'pending').length,
      inProgress: items.filter(item => item.status === 'in_progress').length,
      highPriority: items.filter(item => item.priority === 'high').length,
    };
  }

  private extractRawToolResult(toolResult?: LogEntry): RawToolResult | null {
    if (!toolResult) return null;

    // Look for toolUseResult in the log entry
    const entry = toolResult as unknown as RawLogEntry;

    // First check if there's a toolUseResult field
    if (entry.toolUseResult) {
      return entry.toolUseResult;
    }

    // Then check content array for tool_result
    const content = entry.content;
    if (Array.isArray(content)) {
      const toolResultContent = content.find(c => c.type === 'tool_result');
      if (toolResultContent) {
        return toolResultContent;
      }
    }

    return null;
  }

  private extractErrorMessage(rawResult: RawToolResult | null): string {
    if (typeof rawResult === 'string') {
      return rawResult;
    }

    if (rawResult && typeof rawResult === 'object') {
      // Check if rawResult itself has the error message (for LogEntry.content format)
      if (typeof rawResult.output === 'string') {
        return rawResult.output;
      }

      const output = rawResult.output || rawResult;
      if (typeof output === 'object' && output !== null) {
        const outputObj = output as Record<string, unknown>;
        return typeof outputObj.error === 'string'
          ? outputObj.error
          : typeof outputObj.message === 'string'
            ? outputObj.message
            : 'Failed to read todos';
      }

      // Check for direct error fields
      if (typeof rawResult.error === 'string') {
        return rawResult.error;
      }
      if (typeof rawResult.message === 'string') {
        return rawResult.message;
      }
    }

    return 'TodoRead operation failed';
  }

  public getSupportedFeatures(): string[] {
    // Declare parser capabilities
    return [
      'basic-parsing',
      'status-mapping',
      'correlation',
      'structured-output',
      'no-input-tool',
      'markdown-parsing',
      'priority-extraction',
      'statistics',
      'interrupted-support',
    ];
  }
}

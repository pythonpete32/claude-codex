import type {
  BaseToolProps,
  LogEntry,
  MessageContent,
  ParseConfig,
  ParseErrorCode,
  ParserMetadata,
  ToolParser,
  ValidationResult,
} from '@claude-codex/types';
import { ParseErrorImpl } from '@claude-codex/types';

/**
 * Abstract base parser that implements common functionality for all tool parsers.
 * Handles content normalization, tool extraction, and correlation data.
 */
export abstract class BaseToolParser<TProps extends BaseToolProps>
  implements ToolParser<TProps>
{
  abstract readonly toolName: string;
  abstract readonly toolType: string;
  abstract readonly version: string;

  /**
   * Parse log entries into UI-ready props
   */
  abstract parse(
    toolCall: LogEntry,
    toolResult?: LogEntry,
    config?: ParseConfig
  ): TProps;

  /**
   * Check if this parser can handle the given log entry
   */
  canParse(entry: LogEntry): boolean {
    if (entry.type !== 'assistant') return false;

    const content = this.normalizeContent(entry.content);
    return content.some(
      block => block.type === 'tool_use' && block.name === this.toolName
    );
  }

  /**
   * Validate log entries before parsing
   */
  validate(entry: LogEntry): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check entry type
    if (entry.type !== 'assistant') {
      errors.push('Entry must be of type "assistant"');
    }

    // Check for UUID
    if (!entry.uuid) {
      errors.push('Entry missing required UUID');
    }

    // Check for timestamp
    if (!entry.timestamp) {
      errors.push('Entry missing required timestamp');
    }

    // Check for tool_use block
    const content = this.normalizeContent(entry.content);
    const toolUse = content.find(
      block => block.type === 'tool_use' && block.name === this.toolName
    );

    if (!toolUse) {
      errors.push(`No tool_use block found for ${this.toolName}`);
    } else {
      // Validate tool_use block
      if (!toolUse.id) {
        errors.push('tool_use block missing required id');
      }
      if (!toolUse.input) {
        errors.push('tool_use block missing required input');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      fixable: false,
    };
  }

  /**
   * Get parser metadata
   */
  getMetadata(): ParserMetadata {
    return {
      toolName: this.toolName,
      toolType: this.toolType,
      version: this.version,
      supportedFeatures: this.getSupportedFeatures(),
    };
  }

  /**
   * Override to specify supported features
   */
  protected getSupportedFeatures(): string[] {
    return ['basic-parsing', 'status-mapping', 'correlation'];
  }

  /**
   * Normalize content to array format
   */
  protected normalizeContent(
    content: string | MessageContent | MessageContent[]
  ): MessageContent[] {
    if (typeof content === 'string') {
      return [{ type: 'text', text: content }];
    }
    if (Array.isArray(content)) {
      return content;
    }
    if (content && typeof content === 'object') {
      return [content];
    }
    return [];
  }

  /**
   * Extract tool_use block from entry
   */
  protected extractToolUse(
    entry: LogEntry
  ): MessageContent & { type: 'tool_use' } {
    const content = this.normalizeContent(entry.content);
    const toolUse = content.find(
      block => block.type === 'tool_use' && block.name === this.toolName
    );

    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new ParseErrorImpl(
        `No tool_use block found for ${this.toolName}`,
        'MISSING_REQUIRED_FIELD',
        entry
      );
    }

    return toolUse as MessageContent & { type: 'tool_use' };
  }

  /**
   * Extract tool_result block from entry
   */
  protected extractToolResult(
    entry: LogEntry,
    toolUseId: string
  ): MessageContent & { type: 'tool_result' } {
    const content = this.normalizeContent(entry.content);
    const toolResult = content.find(
      block => block.type === 'tool_result' && block.tool_use_id === toolUseId
    );

    if (!toolResult || toolResult.type !== 'tool_result') {
      throw new ParseErrorImpl(
        `No matching tool_result found for tool_use_id ${toolUseId}`,
        'MISSING_CORRELATION_DATA',
        entry
      );
    }

    return toolResult as MessageContent & { type: 'tool_result' };
  }

  /**
   * Extract base props common to all tools
   */
  protected extractBaseProps(
    toolCall: LogEntry,
    toolResult?: LogEntry,
    config?: ParseConfig
  ): Pick<
    BaseToolProps,
    'id' | 'uuid' | 'parentUuid' | 'timestamp' | 'duration'
  > {
    const toolUse = this.extractToolUse(toolCall);

    // Calculate duration if result is provided
    let duration: number | undefined;
    if (toolResult && config?.preserveTimestamps !== false) {
      const start = new Date(toolCall.timestamp);
      const end = new Date(toolResult.timestamp);
      duration = end.getTime() - start.getTime();
    }

    return {
      id: toolUse.id!,
      uuid: toolCall.uuid,
      parentUuid: toolCall.parentUuid,
      timestamp: toolCall.timestamp,
      duration,
    };
  }

  /**
   * Throw a parse error with context
   */
  protected throwParseError(
    message: string,
    code: ParseErrorCode,
    context?: Record<string, unknown>
  ): never {
    throw new ParseErrorImpl(message, code, undefined, context);
  }
}

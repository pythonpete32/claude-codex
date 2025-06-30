import type {
  BaseToolProps,
  ParserRegistry as IParserRegistry,
  LogEntry,
  ParserMetadata,
  ToolParser,
  ToolProps,
} from '@claude-codex/types';
import { BashToolParser } from './bash-parser';
import { EditToolParser } from './edit-parser';
import { GlobToolParser } from './glob-parser';
import { GrepToolParser } from './grep-parser';
import { LsToolParser } from './ls-parser';
import { McpToolParser } from './mcp-parser';
import { MultiEditToolParser } from './multi-edit-parser';
import { ReadToolParser } from './read-parser';
import { TodoReadToolParser } from './todo-read-parser';
import { TodoWriteToolParser } from './todo-write-parser';
import { WriteToolParser } from './write-parser';

/**
 * Registry for all available parsers.
 * Manages parser registration and selection based on tool names.
 */
export class ParserRegistry implements IParserRegistry {
  private parsers = new Map<string, ToolParser<BaseToolProps>>();
  private mcpParser: McpToolParser;

  constructor() {
    // Register all available parsers
    this.register('Bash', new BashToolParser());
    this.register('Edit', new EditToolParser());
    this.register('Read', new ReadToolParser());
    this.register('Grep', new GrepToolParser());
    this.register('Write', new WriteToolParser());
    this.register('Glob', new GlobToolParser());
    this.register('LS', new LsToolParser());
    this.register('MultiEdit', new MultiEditToolParser());
    this.register('TodoRead', new TodoReadToolParser());
    this.register('TodoWrite', new TodoWriteToolParser());

    // Initialize generic MCP parser for all MCP tools
    this.mcpParser = new McpToolParser();
  }

  /**
   * Register a parser for a specific tool
   */
  register<T extends BaseToolProps>(
    toolName: string,
    parser: ToolParser<T>
  ): void {
    this.parsers.set(toolName.toLowerCase(), parser);
  }

  /**
   * Get a parser by tool name
   */
  get<T extends BaseToolProps>(toolName: string): ToolParser<T> | undefined {
    return this.parsers.get(toolName.toLowerCase()) as
      | ToolParser<T>
      | undefined;
  }

  /**
   * Get the appropriate parser for a log entry
   */
  getForEntry<T extends BaseToolProps>(
    entry: LogEntry
  ): ToolParser<T> | undefined {
    // Extract tool name from entry
    const toolName = this.extractToolName(entry);
    if (!toolName) return undefined;

    // Check if it's an MCP tool first
    if (toolName.startsWith('mcp__') || toolName.startsWith('mcp_')) {
      if (this.mcpParser.canParse(entry)) {
        return this.mcpParser as unknown as ToolParser<T>;
      }
    }

    // Find parser that can handle this entry
    for (const parser of this.parsers.values()) {
      if (parser.canParse(entry)) {
        return parser as ToolParser<T>;
      }
    }

    return undefined;
  }

  /**
   * List all registered parsers
   */
  list(): ParserMetadata[] {
    return Array.from(this.parsers.values()).map(parser =>
      parser.getMetadata()
    );
  }

  /**
   * Parse a log entry using the appropriate parser
   */
  parse(toolCall: LogEntry, toolResult?: LogEntry): ToolProps | null {
    const parser = this.getForEntry(toolCall);
    if (!parser) return null;

    try {
      return parser.parse(toolCall, toolResult) as ToolProps;
    } catch (error) {
      console.error(`Failed to parse tool: ${error}`);
      return null;
    }
  }

  /**
   * Check if any parser can handle the entry
   */
  canParse(entry: LogEntry): boolean {
    return this.getForEntry(entry) !== undefined;
  }

  /**
   * Extract tool name from log entry
   */
  private extractToolName(entry: LogEntry): string | null {
    if (entry.type !== 'assistant') return null;

    const content = Array.isArray(entry.content)
      ? entry.content
      : typeof entry.content === 'object'
        ? [entry.content]
        : [];

    for (const block of content) {
      if (block.type === 'tool_use' && block.name) {
        return block.name;
      }
    }

    return null;
  }

  /**
   * Get list of registered tool names
   */
  getRegisteredTools(): string[] {
    return Array.from(this.parsers.keys());
  }
}

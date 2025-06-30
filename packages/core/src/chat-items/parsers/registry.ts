import type { ChatItem, LogEntry } from '@claude-codex/types';
import type { BaseToolParser } from './base';
import { BashToolParser } from './bash-parser';
import { EditToolParser } from './edit-parser';
import { ReadToolParser } from './read-parser';

export class ParserRegistry {
  private toolParsers = new Map<string, BaseToolParser<ChatItem>>();

  constructor() {
    // Register all tool parsers
    this.registerTool(new BashToolParser());
    this.registerTool(new EditToolParser());
    this.registerTool(new ReadToolParser());
    // TODO: Add remaining parsers
    // this.registerTool(new WriteToolParser());
    // this.registerTool(new GlobToolParser());
    // this.registerTool(new GrepToolParser());
    // this.registerTool(new LsToolParser());
    // this.registerTool(new MultiEditToolParser());
    // this.registerTool(new TodoReadToolParser());
    // this.registerTool(new TodoWriteToolParser());
    // this.registerTool(new McpSequentialThinkingParser());
    // this.registerTool(new McpContext7Parser());
    // this.registerTool(new McpPuppeteerParser());
  }

  private registerTool(parser: BaseToolParser<ChatItem>) {
    this.toolParsers.set(parser.toolName.toLowerCase(), parser);
  }

  canParse(entry: LogEntry): boolean {
    // Check if any parser can handle this entry
    for (const parser of this.toolParsers.values()) {
      if (parser.canParse(entry)) {
        return true;
      }
    }
    return false;
  }

  parse(entry: LogEntry, result?: LogEntry): ChatItem | null {
    // Find the appropriate parser
    const toolName = this.extractToolName(entry);
    if (!toolName) return null;

    const parser = this.toolParsers.get(toolName.toLowerCase());
    if (!parser) return null;

    return parser.parse(entry, result);
  }

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

  getRegisteredTools(): string[] {
    return Array.from(this.toolParsers.keys());
  }
}

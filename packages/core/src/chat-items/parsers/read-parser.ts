import type {
  ChatItem,
  LogEntry,
  MessageContent,
  ReadToolContent,
} from '@claude-codex/types';
import { BaseToolParser } from './base';

export interface ReadToolChatItem extends ChatItem {
  type: 'read_tool';
  content: ReadToolContent;
}

export class ReadToolParser extends BaseToolParser<ReadToolChatItem> {
  toolName = 'Read';

  parse(entry: LogEntry, result?: LogEntry): ReadToolChatItem {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : null;

    return {
      id: toolUse.id!,
      type: 'read_tool',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        filePath: toolUse.input.file_path,
        limit: toolUse.input.limit,
        offset: toolUse.input.offset,
        output: toolResult
          ? {
              content: this.extractFileContent(toolResult),
              lineCount: this.countLines(toolResult),
              error: toolResult.is_error
                ? this.extractErrorMessage(toolResult)
                : undefined,
            }
          : undefined,
        status: this.determineStatus(toolResult),
      },
    };
  }

  private extractFileContent(
    result: MessageContent & { type: 'tool_result' }
  ): string {
    if (result.is_error) return '';
    if (typeof result.output === 'string') return result.output;
    if (result.output?.content) return result.output.content;
    return '';
  }

  private countLines(result: MessageContent & { type: 'tool_result' }): number {
    const content = this.extractFileContent(result);
    if (!content) return 0;
    return content.split('\n').length;
  }

  private extractErrorMessage(
    result: MessageContent & { type: 'tool_result' }
  ): string {
    if (typeof result.output === 'string') return result.output;
    if (result.output?.error) return result.output.error;
    return 'Read failed';
  }
}

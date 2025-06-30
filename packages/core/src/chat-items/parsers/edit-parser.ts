import type {
  ChatItem,
  EditToolContent,
  LogEntry,
  MessageContent,
} from '@claude-codex/types';
import { BaseToolParser } from './base';

export interface EditToolChatItem extends ChatItem {
  type: 'edit_tool';
  content: EditToolContent;
}

export class EditToolParser extends BaseToolParser<EditToolChatItem> {
  toolName = 'Edit';

  parse(entry: LogEntry, result?: LogEntry): EditToolChatItem {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : null;

    return {
      id: toolUse.id!,
      type: 'edit_tool',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        filePath: toolUse.input.file_path,
        oldString: toolUse.input.old_string,
        newString: toolUse.input.new_string,
        replaceAll: toolUse.input.replace_all || false,
        output: toolResult
          ? {
              success: !toolResult.is_error,
              error: toolResult.is_error
                ? this.extractErrorMessage(toolResult)
                : undefined,
            }
          : undefined,
        status: this.determineStatus(toolResult),
      },
    };
  }

  private extractErrorMessage(
    result: MessageContent & { type: 'tool_result' }
  ): string {
    if (typeof result.output === 'string') {
      return result.output;
    }
    return 'Edit failed';
  }
}

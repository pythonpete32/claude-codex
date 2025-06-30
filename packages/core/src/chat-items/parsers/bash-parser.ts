import type {
  BashToolContent,
  ChatItem,
  LogEntry,
  MessageContent,
} from '@claude-codex/types';
import { BaseToolParser } from './base';

export interface BashToolChatItem extends ChatItem {
  type: 'bash_tool';
  content: BashToolContent;
}

export class BashToolParser extends BaseToolParser<BashToolChatItem> {
  toolName = 'Bash';

  parse(entry: LogEntry, result?: LogEntry): BashToolChatItem {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : null;

    return {
      id: toolUse.id!,
      type: 'bash_tool',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        command: toolUse.input.command,
        description: toolUse.input.description,
        timeout: toolUse.input.timeout,
        output: toolResult ? this.parseOutput(toolResult) : undefined,
        status: this.determineStatus(toolResult),
      },
    };
  }

  private parseOutput(
    result: MessageContent & { type: 'tool_result' }
  ): BashToolContent['output'] {
    // Handle string output (simple case)
    if (typeof result.output === 'string') {
      return {
        stdout: result.is_error ? '' : result.output,
        stderr: result.is_error ? result.output : '',
        exitCode: result.is_error ? 1 : 0,
        isError: result.is_error || false,
        interrupted: false,
      };
    }

    // Handle structured output
    if (result.output && typeof result.output === 'object') {
      return {
        stdout: result.output.stdout || '',
        stderr: result.output.stderr || '',
        exitCode: result.output.exit_code || 0,
        isError: result.is_error || false,
        interrupted: result.output.interrupted || false,
      };
    }

    // Fallback
    return {
      stdout: '',
      stderr: 'Unknown output format',
      exitCode: 1,
      isError: true,
      interrupted: false,
    };
  }
}

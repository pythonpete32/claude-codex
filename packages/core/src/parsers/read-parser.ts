import type {
  LogEntry,
  MessageContent,
  ParseConfig,
  ReadToolProps,
} from '@claude-codex/types';
import { StatusMapper } from '@claude-codex/types';
import { BaseToolParser } from './base-parser';

/**
 * Read tool parser - outputs flat props for file reading
 * Simple tool with flat structure from hybrid schema architecture
 */
export class ReadToolParser extends BaseToolParser<ReadToolProps> {
  readonly toolName = 'Read';
  readonly toolType = 'file';
  readonly version = '1.0.0';

  parse(
    toolCall: LogEntry,
    toolResult?: LogEntry,
    config?: ParseConfig
  ): ReadToolProps {
    // 1. Extract base props
    const baseProps = this.extractBaseProps(toolCall, toolResult, config);

    // 2. Extract tool_use data
    const toolUse = this.extractToolUse(toolCall);
    const filePath = toolUse.input?.file_path as string;
    const limit = toolUse.input?.limit as number | undefined;
    // const offset = toolUse.input?.offset as number | undefined; // TODO: Implement offset support

    // 3. Parse result
    let content = '';
    let truncated = false;
    let totalLines: number | undefined;
    let fileSize: number | undefined;
    let status = StatusMapper.mapFromError(false, !toolResult);

    if (toolResult) {
      const result = this.extractToolResult(toolResult, toolUse.id!);

      if (!result.is_error) {
        content = this.extractFileContent(result);
        totalLines = this.countLines(content);
        fileSize = this.estimateFileSize(content);

        // Check if content was truncated
        if (limit && totalLines && totalLines > limit) {
          truncated = true;
        }
      }

      status = StatusMapper.mapFromError(result.is_error);
    }

    // 4. Return flat props
    return {
      // Base props
      ...baseProps,
      status,

      // File props
      filePath,
      content,
      fileType: this.inferFileType(filePath),
      fileSize,
      totalLines,

      // Read-specific props
      truncated,
      language: this.inferFileType(filePath),

      // UI helpers
      showLineNumbers: true,
      wordWrap: false,
      maxHeight: '600px',
      onFileClick: undefined, // Will be injected by UI
    };
  }

  private extractFileContent(
    result: MessageContent & { type: 'tool_result' }
  ): string {
    if (typeof result.output === 'string') {
      return result.output;
    }

    if (result.output && typeof result.output === 'object') {
      const output = result.output as { content?: string };
      return output.content || '';
    }

    return '';
  }

  private countLines(content: string): number {
    if (!content) return 0;
    const lines = content.split('\n');
    // Don't count the last empty line if it exists
    return lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
  }

  private estimateFileSize(content: string): number {
    // Estimate size in bytes (rough approximation)
    return new TextEncoder().encode(content).length;
  }

  private inferFileType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();

    const typeMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescriptreact',
      js: 'javascript',
      jsx: 'javascriptreact',
      py: 'python',
      rs: 'rust',
      go: 'go',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      rb: 'ruby',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
      scala: 'scala',
      r: 'r',
      sql: 'sql',
      sh: 'bash',
      yaml: 'yaml',
      yml: 'yaml',
      json: 'json',
      xml: 'xml',
      html: 'html',
      css: 'css',
      scss: 'scss',
      less: 'less',
      md: 'markdown',
      mdx: 'mdx',
      txt: 'plaintext',
      log: 'log',
      conf: 'properties',
      ini: 'ini',
      toml: 'toml',
    };

    return typeMap[ext || ''] || 'plaintext';
  }

  protected getSupportedFeatures(): string[] {
    return [
      'basic-parsing',
      'status-mapping',
      'correlation',
      'file-type-inference',
      'line-counting',
      'size-estimation',
      'truncation-detection',
      'offset-limit',
    ];
  }
}

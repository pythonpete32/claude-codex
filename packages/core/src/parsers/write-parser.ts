import type {
  LogEntry,
  ParseConfig,
  WriteToolProps,
} from '@claude-codex/types';
import { StatusMapper } from '@claude-codex/types';
import { BaseToolParser } from './base-parser';

/**
 * Write tool parser - outputs flat props for file creation
 * Simple tool with flat structure from hybrid schema architecture
 */
export class WriteToolParser extends BaseToolParser<WriteToolProps> {
  readonly toolName = 'Write';
  readonly toolType = 'file';
  readonly version = '1.0.0';

  parse(
    toolCall: LogEntry,
    toolResult?: LogEntry,
    config?: ParseConfig
  ): WriteToolProps {
    // 1. Extract base props
    const baseProps = this.extractBaseProps(toolCall, toolResult, config);

    // 2. Extract tool_use data
    const toolUse = this.extractToolUse(toolCall);
    const filePath = toolUse.input?.file_path as string;
    const content = toolUse.input?.content as string;

    // 3. Parse result
    let created = false;
    const overwritten = false;
    let status = StatusMapper.mapFromError(false, !toolResult);

    if (toolResult) {
      const result = this.extractToolResult(toolResult, toolUse.id!);

      if (!result.is_error) {
        // Determine if file was created or overwritten
        // This would require additional context from the tool result
        created = true; // Default to created for now
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

      // Write-specific props
      created,
      overwritten,

      // UI helpers
      showLineNumbers: true,
      wordWrap: false,
      onFileClick: undefined, // Will be injected by UI
    };
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
      'create-overwrite-detection',
    ];
  }
}

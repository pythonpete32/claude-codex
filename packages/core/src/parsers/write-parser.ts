import type {
  LogEntry,
  ParseConfig,
  WriteToolProps,
} from '@claude-codex/types';
import { mapFromError } from '@claude-codex/types';
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
    const filePath = (toolUse.input?.file_path as string) || '';
    const content = (toolUse.input?.content as string) || '';

    // 3. Parse result
    let created = false;
    let overwritten = false;
    let errorMessage: string | undefined;
    let status = mapFromError(false, !toolResult);

    if (toolResult) {
      const result = this.extractToolResult(toolResult, toolUse.id!);

      if (!result.is_error) {
        // Parse the result message to determine if created or overwritten
        const resultContent =
          result.content ||
          result.text ||
          (typeof result.output === 'string' ? result.output : '');
        if (resultContent.includes('created successfully')) {
          created = true;
          overwritten = false;
        } else if (resultContent.includes('updated successfully')) {
          created = false;
          overwritten = true;
        } else {
          // Default to created for backward compatibility
          created = true;
        }
      } else {
        // Extract error message from content, text, or output field
        errorMessage =
          result.content ||
          result.text ||
          (typeof result.output === 'string' ? result.output : undefined);
      }

      status = mapFromError(result.is_error);
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
      errorMessage,

      // UI helpers
      showLineNumbers: true,
      wordWrap: false,
      onFileClick: undefined, // Will be injected by UI
    };
  }

  private inferFileType(filePath: string): string {
    if (!filePath) return 'text';
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

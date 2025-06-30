import type {
  DiffLine,
  EditToolProps,
  LogEntry,
  ParseConfig,
} from '@claude-codex/types';
import { StatusMapper } from '@claude-codex/types';
import { BaseToolParser } from './base-parser';

/**
 * Edit tool parser - outputs flat props for file editing
 * Uses FileToolProps base with edit-specific extensions
 */
export class EditToolParser extends BaseToolParser<EditToolProps> {
  readonly toolName = 'Edit';
  readonly toolType = 'file';
  readonly version = '1.0.0';

  parse(
    toolCall: LogEntry,
    toolResult?: LogEntry,
    config?: ParseConfig
  ): EditToolProps {
    // 1. Extract base props
    const baseProps = this.extractBaseProps(toolCall, toolResult, config);

    // 2. Extract tool_use data
    const toolUse = this.extractToolUse(toolCall);
    const filePath = toolUse.input?.file_path as string;
    const oldContent = toolUse.input?.old_string as string;
    const newContent = toolUse.input?.new_string as string;
    // const replaceAll = (toolUse.input?.replace_all as boolean) || false; // TODO: Implement replace_all support

    // 3. Determine status
    let status = StatusMapper.mapFromError(false, !toolResult);

    if (toolResult) {
      const result = this.extractToolResult(toolResult, toolUse.id!);
      status = StatusMapper.mapFromError(result.is_error);
    }

    // 4. Generate diff (simplified for now)
    const diff = this.generateDiff(oldContent, newContent);

    // 5. Return flat props
    return {
      // Base props
      ...baseProps,
      status,

      // File props
      filePath,
      content: newContent, // The new content
      fileType: this.inferFileType(filePath),

      // Edit-specific props
      oldContent,
      newContent,
      diff,

      // UI helpers
      showLineNumbers: true,
      wordWrap: false,
      onFileClick: undefined, // Will be injected by UI
    };
  }

  private generateDiff(oldContent: string, newContent: string): DiffLine[] {
    // Simplified diff generation - in production, use a proper diff library
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const diff: DiffLine[] = [];

    // Simple line-by-line comparison
    const maxLines = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLines; i++) {
      if (i >= oldLines.length) {
        // New lines added
        diff.push({
          type: 'added',
          content: newLines[i],
          newLineNumber: i + 1,
        });
      } else if (i >= newLines.length) {
        // Lines removed
        diff.push({
          type: 'removed',
          content: oldLines[i],
          oldLineNumber: i + 1,
        });
      } else if (oldLines[i] !== newLines[i]) {
        // Line changed
        diff.push({
          type: 'removed',
          content: oldLines[i],
          oldLineNumber: i + 1,
        });
        diff.push({
          type: 'added',
          content: newLines[i],
          newLineNumber: i + 1,
        });
      } else {
        // Line unchanged
        diff.push({
          type: 'unchanged',
          content: oldLines[i],
          oldLineNumber: i + 1,
          newLineNumber: i + 1,
        });
      }
    }

    return diff;
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
    };

    return typeMap[ext || ''] || 'plaintext';
  }

  protected getSupportedFeatures(): string[] {
    return [
      'basic-parsing',
      'status-mapping',
      'correlation',
      'diff-generation',
      'file-type-inference',
      'replace-all',
    ];
  }
}

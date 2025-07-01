import type {
  FileInfo,
  LogEntry,
  LsToolProps,
  MessageContent,
  ParseConfig,
  ParsedToolOutput,
  RawLogEntry,
  RawToolResult,
} from '@claude-codex/types';
import { mapFromError } from '@claude-codex/types';
import { BaseToolParser } from './base-parser';

/**
 * Ls tool parser - outputs structured props for directory listing
 * Complex tool with structured format from hybrid schema architecture
 */
export class LsToolParser extends BaseToolParser<LsToolProps> {
  readonly toolName = 'LS';
  readonly toolType = 'file';
  readonly version = '1.0.0';

  parse(
    toolCall: LogEntry,
    toolResult?: LogEntry,
    config?: ParseConfig
  ): LsToolProps {
    // Extract base props for correlation
    const baseProps = this.extractBaseProps(toolCall, toolResult, config);

    // Extract tool input using optional chaining (tool may have no input)
    const toolUse = this.extractToolUse(toolCall);
    const path = toolUse.input?.path as string;
    const ignore = toolUse.input?.ignore as string[] | undefined;

    // Initialize result data
    let files: FileInfo[] = [];
    let totalSize = 0;
    let errorMessage: string | undefined;
    let entryCount = 0;
    let interrupted = false;
    let status = mapFromError(false, !toolResult);

    if (toolResult) {
      const result = this.extractToolResult(toolResult, toolUse.id!);

      if (!result.is_error) {
        // Parse successful output
        const output = this.parseOutput(result, toolResult);
        files = output.files;
        totalSize = output.totalSize;
        entryCount = output.entryCount;
        interrupted = output.interrupted || false;
      } else {
        // Extract error message from toolUseResult
        const rawResult = this.extractRawToolResult(toolResult);
        errorMessage = this.extractErrorMessage(rawResult);
      }

      // Map status including interrupted state
      status = mapFromError(result.is_error, false, interrupted);
    }

    // Return structured props for UI consumption
    return {
      // Base props
      ...baseProps,
      status,

      // Input structure
      input: {
        path,
        showHidden: true,
        recursive: false,
        ignore,
      },

      // Results - structured per SOT
      results: {
        entries: files.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size,
          permissions: file.permissions,
          lastModified: file.modified,
          isHidden: file.name.startsWith('.'),
        })),
        entryCount,
        errorMessage,
      },

      // UI helpers
      ui: {
        totalFiles: files.filter(f => f.type === 'file').length,
        totalDirectories: files.filter(f => f.type === 'directory').length,
        totalSize,
      },
    };
  }

  private parseOutput(
    result: MessageContent & { type: 'tool_result' },
    toolResult?: LogEntry
  ): {
    files: FileInfo[];
    totalSize: number;
    entryCount: number;
    interrupted?: boolean;
  } {
    // First try to get toolUseResult from the log entry
    const rawResult = this.extractRawToolResult(toolResult);

    if (rawResult && typeof rawResult === 'object') {
      // Parse fixture-style output
      const output = rawResult as RawToolResult;

      if (output.entries && Array.isArray(output.entries)) {
        return {
          files: output.entries.map(this.parseFileInfo),
          totalSize:
            typeof output.totalSize === 'number' ? output.totalSize : 0,
          entryCount: output.entryCount || output.entries.length,
          interrupted: false,
        };
      }
    }

    // Handle string output format (check content, text, and output fields)
    const stringOutput =
      typeof result.output === 'string'
        ? result.output
        : result.content || result.text || null;

    if (stringOutput) {
      return this.parseStringOutput(stringOutput);
    }

    // Handle structured output format
    if (result.output && typeof result.output === 'object') {
      const output = result.output as ParsedToolOutput;

      // Check for interrupted flag
      if (output.interrupted === true) {
        return {
          files: [],
          totalSize: 0,
          entryCount: 0,
          interrupted: true,
        };
      }

      // Handle files array
      if (Array.isArray(output.files)) {
        return {
          files: output.files.map(this.parseFileInfo),
          totalSize:
            typeof output.totalSize === 'number' ? output.totalSize : 0,
          entryCount: output.files.length,
          interrupted: false,
        };
      }

      // Handle entries array (main test data format)
      if (Array.isArray(output.entries)) {
        return {
          files: output.entries.map(this.parseFileInfo),
          totalSize:
            typeof output.totalSize === 'number' ? output.totalSize : 0,
          entryCount: output.entries.length,
          interrupted: false,
        };
      }
    }

    // Default empty result
    return {
      files: [],
      totalSize: 0,
      entryCount: 0,
      interrupted: false,
    };
  }

  private parseStringOutput(output: string): {
    files: FileInfo[];
    totalSize: number;
    entryCount: number;
    interrupted?: boolean;
  } {
    // Check if it's the tree-like format from Claude Code
    if (output.includes('  - ')) {
      return this.parseTreeOutput(output);
    }

    // Parse line-based output format
    const lines = output.trim().split('\n');
    const files: FileInfo[] = [];
    let totalSize = 0;

    for (const line of lines) {
      if (!line.trim()) continue;

      // Simple parsing - handle both "name size type modified" and simple filename formats
      const parts = line.split(/\s+/);
      if (parts.length >= 1) {
        const file: FileInfo = {
          name: parts[0],
          path: parts[0], // Relative path
          type: this.inferFileType(parts[0], parts[2]),
          size: parts.length >= 2 ? Number.parseInt(parts[1], 10) || 0 : 0,
          modified: parts[3] ? new Date(parts[3]).toISOString() : undefined,
        };
        files.push(file);
        totalSize += file.size || 0;
      }
    }

    return { files, totalSize, entryCount: files.length };
  }

  private parseTreeOutput(output: string): {
    files: FileInfo[];
    totalSize: number;
    entryCount: number;
  } {
    const lines = output.trim().split('\n');
    const files: FileInfo[] = [];
    const totalSize = 0;

    for (const line of lines) {
      // Skip empty lines and the root directory line
      if (!line.trim() || line.startsWith('- /')) continue;

      // Skip NOTE lines
      if (line.includes('NOTE:')) break;

      // Extract filename from tree format "  - filename" or "    - filename"
      const match = line.match(/^\s*-\s+(.+)$/);
      if (match) {
        // Check indentation level - skip deeply nested files (recursive=false)
        const indentLevel = (line.match(/^\s*/)?.[0].length || 0) / 2;
        if (indentLevel > 1) continue; // Skip files nested deeper than first level

        const filename = match[1].trim();
        const isDirectory = filename.endsWith('/');
        const name = isDirectory ? filename.slice(0, -1) : filename;

        const file: FileInfo = {
          name,
          path: name,
          type: isDirectory ? 'directory' : this.inferFileType(name),
          size: 0, // No size info in tree output
        };
        files.push(file);
      }
    }

    return { files, totalSize, entryCount: files.length };
  }

  private parseFileInfo = (entry: Record<string, unknown>): FileInfo => {
    // Normalize various file info formats
    const name =
      typeof entry.name === 'string'
        ? entry.name
        : typeof entry.filename === 'string'
          ? entry.filename
          : '';

    return {
      name,
      path: typeof entry.path === 'string' ? entry.path : name,
      type:
        typeof entry.type === 'string' &&
        ['file', 'directory', 'symlink'].includes(entry.type)
          ? (entry.type as 'file' | 'directory' | 'symlink')
          : entry.isDirectory
            ? 'directory'
            : this.inferFileType(name), // Use inference when no type provided
      size: typeof entry.size === 'number' ? entry.size : 0,
      permissions:
        typeof entry.permissions === 'string' ? entry.permissions : undefined,
      modified:
        typeof entry.modified === 'string'
          ? entry.modified
          : typeof entry.lastModified === 'string'
            ? entry.lastModified
            : typeof entry.mtime === 'string'
              ? entry.mtime
              : undefined,
      created:
        typeof entry.created === 'string'
          ? entry.created
          : typeof entry.ctime === 'string'
            ? entry.ctime
            : undefined,
      accessed:
        typeof entry.accessed === 'string'
          ? entry.accessed
          : typeof entry.atime === 'string'
            ? entry.atime
            : undefined,
    };
  };

  private inferFileType(
    name: string,
    typeHint?: string
  ): 'file' | 'directory' | 'symlink' {
    if (typeHint === 'directory' || typeHint === 'd') return 'directory';
    if (typeHint === 'symlink' || typeHint === 'l') return 'symlink';

    // Infer from name patterns
    if (name.endsWith('/')) return 'directory';

    // Hidden directories (starts with dot, no extension)
    if (name.startsWith('.') && !name.includes('.', 1)) return 'directory';

    return 'file';
  }

  private extractRawToolResult(toolResult?: LogEntry): RawToolResult | null {
    if (!toolResult) return null;

    // Look for toolUseResult in the log entry
    const entry = toolResult as unknown as RawLogEntry;

    // First check if there's a toolUseResult field
    if (entry.toolUseResult) {
      return entry.toolUseResult;
    }

    // Then check content array for tool_result
    const content = entry.content;
    if (Array.isArray(content)) {
      const toolResultContent = content.find(c => c.type === 'tool_result');
      if (toolResultContent) {
        return toolResultContent;
      }
    }

    return null;
  }

  private extractErrorMessage(rawResult: RawToolResult | null): string {
    if (typeof rawResult === 'string') {
      return rawResult;
    }

    if (rawResult && typeof rawResult === 'object') {
      // Check if rawResult itself has the error message (for LogEntry.content format)
      if (typeof rawResult.output === 'string') {
        return rawResult.output;
      }

      const output = rawResult.output || rawResult;
      if (typeof output === 'object' && output !== null) {
        const outputObj = output as Record<string, unknown>;
        return typeof outputObj.error === 'string'
          ? outputObj.error
          : typeof outputObj.message === 'string'
            ? outputObj.message
            : 'Failed to list directory';
      }

      // Check for direct error fields
      if (typeof rawResult.error === 'string') {
        return rawResult.error;
      }
      if (typeof rawResult.message === 'string') {
        return rawResult.message;
      }
    }

    return 'Failed to list directory';
  }

  public getSupportedFeatures(): string[] {
    // Declare parser capabilities
    return [
      'basic-parsing',
      'status-mapping',
      'correlation',
      'structured-output',
      'file-info-parsing',
      'size-calculation',
      'error-handling',
      'interrupted-support',
    ];
  }
}

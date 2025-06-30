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
import { StatusMapper } from '@claude-codex/types';
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
    let status = StatusMapper.mapFromError(false, !toolResult);

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
      status = StatusMapper.mapFromError(result.is_error, false, interrupted);
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

      // Results - use entries instead of files
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

    // Handle string output format
    if (typeof result.output === 'string') {
      return this.parseStringOutput(result.output);
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

      // Handle legacy format with entries
      if (Array.isArray(output.entries)) {
        return {
          files: output.entries.map(this.parseFileInfo),
          totalSize: 0,
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
    // Parse line-based output format
    const lines = output.trim().split('\n');
    const files: FileInfo[] = [];
    let totalSize = 0;

    for (const line of lines) {
      if (!line.trim()) continue;

      // Simple parsing - assumes "name size type modified" format
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const file: FileInfo = {
          name: parts[0],
          path: parts[0], // Relative path
          type: this.inferFileType(parts[0], parts[2]),
          size: Number.parseInt(parts[1], 10) || 0,
          modified: parts[3] ? new Date(parts[3]).toISOString() : undefined,
        };
        files.push(file);
        totalSize += file.size || 0;
      }
    }

    return { files, totalSize, entryCount: files.length };
  }

  private parseFileInfo = (entry: Record<string, unknown>): FileInfo => {
    // Normalize various file info formats
    return {
      name:
        typeof entry.name === 'string'
          ? entry.name
          : typeof entry.filename === 'string'
            ? entry.filename
            : '',
      path:
        typeof entry.path === 'string'
          ? entry.path
          : typeof entry.name === 'string'
            ? entry.name
            : '',
      type:
        typeof entry.type === 'string' &&
        ['file', 'directory', 'symlink'].includes(entry.type)
          ? (entry.type as 'file' | 'directory' | 'symlink')
          : entry.isDirectory
            ? 'directory'
            : 'file',
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
    if (name.startsWith('.') && !name.includes('.')) return 'directory'; // Hidden dirs

    return 'file';
  }

  private extractRawToolResult(toolResult?: LogEntry): RawToolResult | null {
    if (!toolResult) return null;

    // Look for toolUseResult in the log entry
    const entry = toolResult as unknown as RawLogEntry;
    return entry.toolUseResult || null;
  }

  private extractErrorMessage(rawResult: RawToolResult | null): string {
    if (typeof rawResult === 'string') {
      return rawResult;
    }

    if (rawResult && typeof rawResult === 'object') {
      return (
        rawResult.errorMessage ||
        rawResult.error ||
        rawResult.message ||
        'Unknown error'
      );
    }

    return 'Failed to list directory';
  }

  protected getSupportedFeatures(): string[] {
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

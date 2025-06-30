import type {
  GrepToolProps,
  LogEntry,
  MessageContent,
  ParseConfig,
  SearchMatch,
  SearchResult,
} from '@claude-codex/types';
import { mapFromError } from '@claude-codex/types';
import { BaseToolParser } from './base-parser';

/**
 * Grep tool parser - outputs structured props for complex search results
 * Demonstrates complex tool parsing pattern from hybrid schema architecture
 */
export class GrepToolParser extends BaseToolParser<GrepToolProps> {
  readonly toolName = 'Grep';
  readonly toolType = 'search';
  readonly version = '1.0.0';

  parse(
    toolCall: LogEntry,
    toolResult?: LogEntry,
    config?: ParseConfig
  ): GrepToolProps {
    // 1. Extract base props (same as simple tools)
    const baseProps = this.extractBaseProps(toolCall, toolResult, config);

    // 2. Extract search input (structured)
    const toolUse = this.extractToolUse(toolCall);
    const input = {
      pattern: toolUse.input?.pattern as string,
      searchPath: toolUse.input?.path as string | undefined,
      filePatterns: this.parseFilePatterns(
        toolUse.input?.include as string | undefined
      ),
      caseSensitive: !(toolUse.input?.flags as string | undefined)?.includes(
        'i'
      ),
      useRegex: true, // Grep always uses regex
    };

    // 3. Parse complex results (structured)
    let results: SearchResult[] = [];
    let status = mapFromError(false, !toolResult);

    if (toolResult) {
      const result = this.extractToolResult(toolResult, toolUse.id!);

      if (!result.is_error) {
        results = this.parseSearchResults(result);
      }

      status = mapFromError(result.is_error);
    }

    // 4. Calculate UI summary data
    const ui = {
      totalMatches: results.reduce((sum, r) => sum + r.matchCount, 0),
      filesWithMatches: results.length,
      searchTime: baseProps.duration || 0,
    };

    // 5. Return structured props
    return {
      ...baseProps,
      status,
      input,
      results,
      ui,
      // UI interactions
      onMatchClick: undefined, // Will be injected by UI
      onRefineSearch: undefined, // Will be injected by UI
    };
  }

  private parseFilePatterns(include?: string): string[] | undefined {
    if (!include) return undefined;

    // Split by comma and trim whitespace
    return include
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  private parseSearchResults(
    result: MessageContent & { type: 'tool_result' }
  ): SearchResult[] {
    if (!result.output || typeof result.output !== 'string') {
      return [];
    }

    // Group matches by file
    const fileGroups = new Map<string, SearchMatch[]>();
    const lines = result.output.split('\n').filter(line => line.trim());

    for (const line of lines) {
      // Parse format: filename:linenum:content
      const match = line.match(/^([^:]+):(\d+):(.*)$/);
      if (match) {
        const filePath = match[1];
        const lineNumber = Number.parseInt(match[2], 10);
        const lineContent = match[3];

        if (!fileGroups.has(filePath)) {
          fileGroups.set(filePath, []);
        }

        // Find match positions in the line
        const pattern = this.extractPatternFromLine(lineContent);

        fileGroups.get(filePath)!.push({
          lineNumber,
          lineContent,
          matchStart: pattern.start,
          matchEnd: pattern.end,
          context: undefined, // Could be enhanced with context lines
        });
      }
    }

    // Convert to SearchResult array
    return Array.from(fileGroups.entries()).map(([filePath, matches]) => ({
      filePath,
      matches,
      matchCount: matches.length,
    }));
  }

  private extractPatternFromLine(lineContent: string): {
    start: number;
    end: number;
  } {
    // For now, highlight the entire line
    // In a real implementation, we'd use the actual pattern to find match positions
    return {
      start: 0,
      end: lineContent.length,
    };
  }

  protected getSupportedFeatures(): string[] {
    return [
      'basic-parsing',
      'status-mapping',
      'correlation',
      'structured-results',
      'file-grouping',
      'match-counting',
      'pattern-options',
    ];
  }
}

# Hybrid Schema Architecture for Chat Items

## Executive Summary

This document outlines our final architectural decision for chat item schemas, incorporating insights from both unified schema analysis and RF.md recommendations. We're implementing a **hybrid approach** that uses flat props for simple tools and structured props for complex tools, while preserving essential correlation data and handling MCP extensibility.

## Core Principles

### 1. **Complexity-Appropriate Structure**
- **Simple tools**: Flat props for immediate UI consumption
- **Complex tools**: Structured props that scale with complexity
- **No artificial constraints**: Let tool complexity determine structure

### 2. **Preserve Essential Architecture**
- **UUID correlation**: Maintain tool call/result linking capability
- **Concurrent execution**: Support multiple tools running simultaneously
- **MCP extensibility**: Handle unknown tools gracefully

### 3. **UI-First Design**
- **Parser-centric**: Fix problems at the parser level, not schema level
- **Direct consumption**: Components get what they need without transformation
- **Performance priority**: Eliminate runtime data gymnastics

## Base Interface Architecture

### Core Foundation

```typescript
/**
 * Base properties that all tool components share.
 * Includes essential correlation data and standardized status.
 */
export interface BaseToolProps {
  // Correlation (ESSENTIAL - required for linking tool calls with results)
  id: string;              // tool_use_id for API correlation
  uuid: string;            // toolCall.uuid for internal correlation  
  parentUuid?: string;     // Links to parent call for nested operations
  
  // Core execution data
  timestamp: string;       // ISO timestamp
  duration?: number;       // Execution time in milliseconds
  
  // Harmonized status (handles MCP variability)
  status: ToolStatus;
  
  // Optional UI helpers
  className?: string;
  metadata?: ToolMetadata;
}

/**
 * Standardized status with MCP support.
 * Normalizes diverse status values while preserving originals.
 */
export interface ToolStatus {
  normalized: "pending" | "running" | "completed" | "failed" | "unknown";
  original?: string;       // Preserve original MCP status for debugging
  details?: {
    progress?: number;     // 0-100 for progress tracking
    substatus?: string;    // Additional status context
  };
}

/**
 * Optional metadata available for all tools
 */
export interface ToolMetadata {
  executionId?: string;    // For tracking across systems
  interactive?: boolean;   // Whether tool supports interactions
  metrics?: Record<string, number>;  // Performance metrics
}
```

### Categorical Base Interfaces

Following RF.md's insight, tools naturally cluster into categories:

```typescript
/**
 * Extended interface for tools that execute commands.
 * Used by: Bash, and other shell-based tools.
 */
export interface CommandToolProps extends BaseToolProps {
  command: string;                    // The command executed
  output?: string;                    // Combined stdout/stderr
  errorOutput?: string;               // Separate error output if needed
  exitCode?: number;                  // Command exit code
  workingDirectory?: string;          // Execution context
  environment?: Record<string, string>; // Environment variables
  
  // UI interactions
  showCopyButton?: boolean;
  onCopy?: () => void;
  onRerun?: () => void;
}

/**
 * Extended interface for tools that work with individual files.
 * Used by: Read, Write, Edit tools.
 */
export interface FileToolProps extends BaseToolProps {
  filePath: string;                   // Target file path
  content?: string;                   // File content
  fileSize?: number;                  // Size in bytes
  totalLines?: number;                // Line count
  fileType?: string;                  // For syntax highlighting
  encoding?: string;                  // File encoding
  
  // Display options
  showLineNumbers?: boolean;
  wordWrap?: boolean;
  maxHeight?: string;
  
  // UI interactions
  onFileClick?: (filePath: string) => void;
}

/**
 * Extended interface for tools that perform searches.
 * Used by: Grep, Glob, and other search tools.
 * Uses structured data due to complexity.
 */
export interface SearchToolProps extends BaseToolProps {
  input: {
    pattern: string;                  // Search pattern
    scope?: string;                   // Search scope/directory
    options?: Record<string, any>;    // Tool-specific options
  };
  
  results?: SearchResult[];           // Structured search results
  
  ui: {
    totalMatches: number;
    filesWithMatches: number;
    searchTime?: number;
  };
  
  // UI interactions
  onMatchClick?: (filePath: string, lineNumber?: number) => void;
  onRefineSearch?: (newPattern: string) => void;
}
```

## Tool-Specific Implementations

### Simple Tools (Flat Props)

Tools with atomic outputs use completely flat props:

```typescript
/**
 * Bash tool - Simple command execution
 * Uses flat props for immediate UI consumption
 */
export interface BashToolProps extends CommandToolProps {
  command: string;
  output?: string;
  elevated?: boolean;
  showPrompt?: boolean;
  promptText?: string;
}

/**
 * Read tool - Single file reading
 * Uses flat props for simple file display
 */
export interface ReadToolProps extends FileToolProps {
  filePath: string;
  content: string;
  truncated?: boolean;
  language?: string;        // For syntax highlighting
}

/**
 * Write tool - Single file creation
 * Uses flat props for simple operations
 */
export interface WriteToolProps extends FileToolProps {
  filePath: string;
  content: string;
  created?: boolean;
  overwritten?: boolean;
}
```

### Complex Tools (Structured Props)

Tools with relational or array data use structured props:

```typescript
/**
 * Grep tool - Complex search results
 * Uses structured props due to file/match relationships
 */
export interface GrepToolProps extends SearchToolProps {
  input: {
    pattern: string;
    searchPath?: string;
    filePatterns?: string[];
    caseSensitive?: boolean;
    useRegex?: boolean;
  };
  
  results?: SearchResult[];
  
  ui: {
    totalMatches: number;
    filesWithMatches: number;
    searchTime: number;
  };
}

/**
 * MultiEdit tool - Multiple file operations
 * Uses structured props for edit relationship tracking
 */
export interface MultiEditToolProps extends BaseToolProps {
  input: {
    operation: "edit" | "create" | "delete";
    description?: string;
  };
  
  edits: FileEdit[];
  
  ui: {
    totalEdits: number;
    successfulEdits: number;
    failedEdits: number;
    changeSummary?: string;
  };
  
  // UI interactions
  onFileReview?: (filePath: string) => void;
  onRevert?: (filePath: string) => void;
}

/**
 * LS tool - Directory listing with file metadata
 * Uses structured props for file relationships
 */
export interface LsToolProps extends BaseToolProps {
  input: {
    path: string;
    showHidden?: boolean;
    recursive?: boolean;
  };
  
  entries: FileEntry[];
  
  ui: {
    totalFiles: number;
    totalDirectories: number;
    totalSize?: number;
  };
  
  // UI interactions
  onEntryClick?: (entry: FileEntry) => void;
}
```

### Supporting Types

```typescript
/**
 * Search result structure for complex search tools
 */
export interface SearchResult {
  filePath: string;
  matches: SearchMatch[];
  matchCount: number;
}

export interface SearchMatch {
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
  context?: {
    before?: string[];
    after?: string[];
  };
}

/**
 * File edit structure for multi-file operations
 */
export interface FileEdit {
  filePath: string;
  operation: "create" | "modify" | "delete";
  oldContent?: string;
  newContent?: string;
  success: boolean;
  error?: string;
  diff?: DiffLine[];
}

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

/**
 * File entry structure for directory listings
 */
export interface FileEntry {
  name: string;
  type: "file" | "directory" | "symlink";
  size?: number;
  permissions?: string;
  lastModified?: string;
  isHidden?: boolean;
}
```

## MCP Tool Handling

### Status Harmonization Strategy

```typescript
/**
 * Centralized status mapping for MCP tools.
 * Maps diverse status values to normalized UI status.
 */
export class StatusMapper {
  
  private static readonly STATUS_MAPPINGS: Record<string, Record<string, string>> = {
    // Known MCP tools
    "mcp-puppeteer": {
      "success": "completed",
      "error": "failed",
      "partial": "running"
    },
    "mcp-context7": {
      "resolved": "completed", 
      "failed": "failed",
      "not_found": "failed"
    },
    "mcp-sequential-thinking": {
      "in_progress": "running",
      "completed": "completed",
      "failed": "failed"
    }
    // Add more as we encounter them
  };
  
  /**
   * Map tool status to normalized UI status.
   * Uses explicit mappings first, then pattern inference.
   */
  static mapStatus(toolType: string, originalStatus: string): ToolStatus {
    // 1. Check explicit mapping
    const mapping = this.STATUS_MAPPINGS[toolType];
    if (mapping?.[originalStatus]) {
      return {
        normalized: mapping[originalStatus] as any,
        original: originalStatus
      };
    }
    
    // 2. Pattern-based inference for unknown tools
    const normalized = this.inferStatus(originalStatus);
    
    // 3. Track unknown patterns for future improvement
    if (normalized === "unknown") {
      this.trackUnknownStatus(toolType, originalStatus);
    }
    
    return {
      normalized,
      original: originalStatus
    };
  }
  
  private static inferStatus(status: string): ToolStatus["normalized"] {
    const lower = status.toLowerCase();
    
    if (lower.includes('success') || lower.includes('ok') || lower.includes('complete')) {
      return 'completed';
    }
    if (lower.includes('error') || lower.includes('fail') || lower.includes('crash')) {
      return 'failed';
    }
    if (lower.includes('pending') || lower.includes('wait') || lower.includes('queue')) {
      return 'pending';
    }
    if (lower.includes('running') || lower.includes('progress') || lower.includes('partial')) {
      return 'running';
    }
    
    return 'unknown';
  }
  
  private static trackUnknownStatus(toolType: string, status: string) {
    console.warn(`Unknown status mapping: ${toolType}:${status} - consider adding explicit mapping`);
  }
}
```

### MCP Tool Examples

```typescript
/**
 * MCP Puppeteer - Web automation tool
 * Uses structured props due to complex operation data
 */
export interface MCPPuppeteerToolProps extends BaseToolProps {
  input: {
    operation: "navigate" | "screenshot" | "click" | "fill";
    url?: string;
    selector?: string;
    value?: string;
    options?: Record<string, any>;
  };
  
  output?: {
    screenshot?: string;      // Base64 or URL
    pageData?: {
      title: string;
      url: string;
      viewport: { width: number; height: number };
    };
    error?: {
      message: string;
      code?: string;
      selector?: string;
    };
  };
  
  ui: {
    title: string;
    description: string;
    category: "web_automation";
  };
}

/**
 * MCP Sequential Thinking - Complex workflow tool
 * Uses heavily structured props due to workflow complexity
 */
export interface MCPSequentialThinkingToolProps extends BaseToolProps {
  input: {
    workflow: string;
    context?: Record<string, any>;
  };
  
  workflow?: {
    steps: WorkflowStep[];
    currentStep: number;
    overallProgress: number;
    dependencies: StepDependency[];
  };
  
  ui: {
    title: string;
    description: string;
    estimatedTimeRemaining?: number;
    category: "workflow";
  };
}

export interface WorkflowStep {
  id: string;
  name: string;
  status: ToolStatus;
  progress: number;
  dependencies: string[];
  output?: any;
  error?: string;
}

export interface StepDependency {
  stepId: string;
  dependsOn: string[];
  type: "sequential" | "parallel";
}
```

## Parser Implementation Strategy

### Base Parser Interface

```typescript
/**
 * Base parser interface that all tool parsers implement.
 * Enforces consistent parsing patterns across all tools.
 */
export interface ToolParser<TFixture, TProps extends BaseToolProps> {
  /**
   * Parse raw fixture data into UI-ready props.
   * Handles status mapping and correlation data extraction.
   */
  parse(fixture: TFixture, config?: ParseConfig): TProps;
  
  /**
   * Validate fixture data before parsing.
   */
  validate(fixture: TFixture): ValidationResult;
  
  /**
   * Get parser metadata and capabilities.
   */
  getMetadata(): ParserMetadata;
}

export interface ParseConfig {
  preserveTimestamps?: boolean;
  maxContentLength?: number;
  validateOutput?: boolean;
  debug?: boolean;
}
```

### Example Parser Implementation

```typescript
/**
 * Bash tool parser - outputs flat props
 * Demonstrates simple tool parsing pattern
 */
export class BashToolParser implements ToolParser<BashFixtureData, BashToolProps> {
  
  parse(fixture: BashFixtureData, config: ParseConfig = {}): BashToolProps {
    // 1. Extract correlation data (preserve UUIDs)
    const uuid = fixture.toolCall.uuid;
    const id = fixture.toolCall.tool.id;
    const parentUuid = fixture.toolCall.parentUuid;
    
    // 2. Extract command from input
    const command = fixture.toolCall.tool.input.command;
    const description = fixture.toolCall.tool.input.description;
    
    // 3. Extract output and determine status
    const output = fixture.toolResult?.stdout || '';
    const errorOutput = fixture.toolResult?.stderr || '';
    const isError = fixture.toolResult?.isError || false;
    
    // 4. Map status using StatusMapper
    const status = StatusMapper.mapStatus('bash', isError ? 'failed' : 'completed');
    
    // 5. Extract timing data
    const timestamp = fixture.toolCall.timestamp;
    const duration = this.calculateDuration(fixture);
    
    // 6. Return flat props (no nested structures)
    return {
      // Base props
      id,
      uuid,
      parentUuid,
      timestamp,
      duration,
      status,
      
      // Command-specific props (flat)
      command,
      output: output + errorOutput,
      exitCode: isError ? 1 : 0,
      workingDirectory: fixture.toolCall.tool.input.workingDirectory,
      
      // UI helpers
      showCopyButton: true,
      showPrompt: true
    };
  }
  
  validate(fixture: BashFixtureData): ValidationResult {
    const errors: string[] = [];
    
    if (!fixture.toolCall?.tool?.input?.command) {
      errors.push('Missing required field: command');
    }
    
    if (!fixture.toolCall?.uuid) {
      errors.push('Missing correlation UUID');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings: []
    };
  }
  
  private calculateDuration(fixture: BashFixtureData): number | undefined {
    if (!fixture.toolResult?.timestamp) return undefined;
    
    const start = new Date(fixture.toolCall.timestamp);
    const end = new Date(fixture.toolResult.timestamp);
    return end.getTime() - start.getTime();
  }
}

/**
 * Grep tool parser - outputs structured props
 * Demonstrates complex tool parsing pattern
 */
export class GrepToolParser implements ToolParser<GrepFixtureData, GrepToolProps> {
  
  parse(fixture: GrepFixtureData, config: ParseConfig = {}): GrepToolProps {
    // 1. Extract correlation data (same as simple tools)
    const baseProps = this.extractBaseProps(fixture);
    
    // 2. Extract search input (structured)
    const input = {
      pattern: fixture.toolCall.tool.input.pattern,
      searchPath: fixture.toolCall.tool.input.path,
      filePatterns: fixture.toolCall.tool.input.include?.split(','),
      caseSensitive: !fixture.toolCall.tool.input.flags?.includes('i'),
      useRegex: fixture.toolCall.tool.input.flags?.includes('E')
    };
    
    // 3. Parse complex results (structured)
    const results = this.parseSearchResults(fixture.toolResult?.matches || []);
    
    // 4. Calculate UI summary data
    const ui = {
      totalMatches: results.reduce((sum, r) => sum + r.matchCount, 0),
      filesWithMatches: results.length,
      searchTime: baseProps.duration || 0
    };
    
    // 5. Return structured props
    return {
      ...baseProps,
      input,
      results,
      ui
    };
  }
  
  private parseSearchResults(matches: any[]): SearchResult[] {
    // Group matches by file and structure them
    const fileGroups = new Map<string, SearchMatch[]>();
    
    for (const match of matches) {
      const filePath = match.filePath;
      if (!fileGroups.has(filePath)) {
        fileGroups.set(filePath, []);
      }
      
      fileGroups.get(filePath)!.push({
        lineNumber: match.lineNumber,
        lineContent: match.lineContent,
        matchStart: match.matchStart,
        matchEnd: match.matchEnd
      });
    }
    
    return Array.from(fileGroups.entries()).map(([filePath, matches]) => ({
      filePath,
      matches,
      matchCount: matches.length
    }));
  }
}
```

## Migration Strategy

### Phase 1: Foundation (Week 1)
1. **Define base interfaces** - BaseToolProps, CommandToolProps, FileToolProps, SearchToolProps
2. **Implement StatusMapper** - Handle MCP status harmonization
3. **Create parser interface** - ToolParser with validation
4. **Set up testing framework** - Parser unit tests

### Phase 2: Simple Tool Migration (Week 2)
1. **Start with bash tool** - Flat props, straightforward parsing
2. **Migrate read/write tools** - File-based but simple
3. **Update stories** - Remove transformation logic
4. **Test UI compatibility** - Ensure no regressions

### Phase 3: Complex Tool Migration (Week 3)
1. **Migrate search tools** - Grep, Glob, LS with structured props
2. **Handle MultiEdit tool** - Complex edit relationships
3. **Update transformer** - Output new parser-compatible format
4. **Integration testing** - End-to-end validation

### Phase 4: MCP Integration (Week 4)
1. **Implement MCP parsers** - Handle complex workflows
2. **Test status mapping** - Verify unknown tool handling
3. **Performance testing** - Ensure no regressions
4. **Documentation** - Component usage examples

### Phase 5: Cleanup (Week 5)
1. **Remove old interfaces** - Clean up deprecated types
2. **Delete transformation code** - Stories no longer need it
3. **Update documentation** - New architecture guides
4. **Final testing** - Complete system validation

## Success Metrics

### Technical Metrics
- **Parser coverage**: 100% of tools have dedicated parsers
- **Status mapping**: 95%+ of MCP statuses correctly normalized
- **Performance**: No regression in component render times
- **Bundle size**: Maintain or reduce current size

### Developer Experience Metrics
- **Type errors**: 80%+ reduction in schema-related errors
- **Component simplicity**: Elimination of data transformation code
- **Documentation clarity**: Clear data flow examples
- **Maintenance effort**: Centralized parsing logic

## Error Handling Strategy

### Parser Error Types

```typescript
export class ParseError extends Error {
  constructor(
    message: string,
    public readonly code: ParseErrorCode,
    public readonly fixture?: any,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = "ParseError";
  }
}

export type ParseErrorCode =
  | "INVALID_FIXTURE_FORMAT"
  | "MISSING_CORRELATION_DATA"
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_FIELD_TYPE"
  | "CONTENT_TOO_LARGE"
  | "UNSUPPORTED_TOOL_TYPE"
  | "STATUS_MAPPING_FAILED"
  | "VALIDATION_FAILED";
```

### Graceful Degradation

```typescript
export interface FallbackOptions {
  useDefaults: boolean;        // Provide default values for missing fields
  skipValidation: boolean;     // Try to parse despite validation errors
  maxWarnings: number;         // Fail after too many warnings
  preserveOriginal: boolean;   // Keep original data for debugging
}
```

## Benefits of Hybrid Approach

### 1. **Complexity-Appropriate Design**
- **Simple tools get simple props** - No unnecessary structure overhead
- **Complex tools get rich structure** - Can handle relational data naturally
- **No artificial constraints** - Tools can evolve naturally

### 2. **Future-Proof Architecture**
- **Extensible base** - New tool categories can inherit appropriate base
- **MCP compatibility** - Unknown tools handled gracefully
- **Performance scalable** - Structure scales with complexity, not fixed overhead

### 3. **Developer Experience**
- **Intuitive patterns** - Tools feel natural to work with
- **Type safety** - Full TypeScript coverage with appropriate complexity
- **Maintainable** - Logic centralized in parsers, not scattered

### 4. **Preserved Functionality**
- **Correlation intact** - Tool call/result linking preserved
- **Concurrent execution** - Multiple tools supported
- **Real-time updates** - Status tracking maintained

This hybrid architecture gives us the best of both approaches: the simplicity of flat props where appropriate, the power of structured data where needed, and robust handling of the real-world complexity of MCP tools.
/**
 * UI-ready props for chat items based on hybrid schema architecture.
 * These props are output by parsers and directly consumed by UI components.
 */

// Base interfaces
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

export interface ToolStatus {
  normalized: "pending" | "running" | "completed" | "failed" | "interrupted" | "unknown";
  original?: string;       // Preserve original MCP status for debugging
  details?: {
    progress?: number;     // 0-100 for progress tracking
    substatus?: string;    // Additional status context
    interrupted?: boolean; // Whether the tool execution was interrupted
  };
}

export interface ToolMetadata {
  executionId?: string;    // For tracking across systems
  interactive?: boolean;   // Whether tool supports interactions
  metrics?: Record<string, number>;  // Performance metrics
}

// Categorical base interfaces
export interface CommandToolProps extends BaseToolProps {
  command: string;                    // The command executed
  output?: string;                    // Combined stdout/stderr
  errorOutput?: string;               // Separate error output if needed
  exitCode?: number;                  // Command exit code
  workingDirectory?: string;          // Execution context
  environment?: Record<string, string>; // Environment variables
  interrupted?: boolean;              // Whether execution was interrupted
  
  // UI interactions
  showCopyButton?: boolean;
  onCopy?: () => void;
  onRerun?: () => void;
}

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

// Simple tool props (flat)
export interface BashToolProps extends CommandToolProps {
  command: string;
  output?: string;
  elevated?: boolean;
  showPrompt?: boolean;
  promptText?: string;
}

export interface ReadToolProps extends FileToolProps {
  filePath: string;
  content: string;
  truncated?: boolean;
  language?: string;        // For syntax highlighting
}

export interface WriteToolProps extends FileToolProps {
  filePath: string;
  content: string;
  created?: boolean;
  overwritten?: boolean;
}

export interface EditToolProps extends FileToolProps {
  filePath: string;
  oldContent: string;
  newContent: string;
  diff?: DiffLine[];
}

// Complex tool props (structured)
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

export interface GlobToolProps extends BaseToolProps {
  input: {
    pattern: string;
    searchPath?: string;
  };
  
  matches: string[];
  
  ui: {
    totalMatches: number;
    matchTime: number;
  };
}

export interface MultiEditToolProps extends BaseToolProps {
  input: {
    filePath: string;  // From fixtures
    edits: EditOperation[];
  };
  
  // Results from fixtures
  message?: string;
  editsApplied?: number;
  allSuccessful?: boolean;
  editDetails?: EditDetail[];  // Detailed results per edit
  errorMessage?: string;
  
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

export interface LsToolProps extends BaseToolProps {
  input: {
    path: string;
    showHidden?: boolean;
    recursive?: boolean;
    ignore?: string[];  // Ignore patterns from fixtures
  };
  
  entries: FileEntry[];
  entryCount?: number;  // From fixture data
  errorMessage?: string;  // Error messages ARE in the data
  
  ui: {
    totalFiles: number;
    totalDirectories: number;
    totalSize?: number;
  };
  
  // UI interactions
  onEntryClick?: (entry: FileEntry) => void;
}

export interface TodoReadToolProps extends BaseToolProps {
  todos: TodoItem[];
  
  // Additional metadata from fixtures
  statusCounts?: {
    pending: number;
    in_progress: number;
    completed: number;
  };
  priorityCounts?: {
    high: number;
    medium: number;
    low: number;
  };
  errorMessage?: string;
  
  ui: {
    totalTodos: number;
    completedTodos: number;
    pendingTodos: number;
    inProgressTodos?: number;  // Add missing status
  };
}

export interface TodoWriteToolProps extends BaseToolProps {
  todos: TodoItem[];
  changes: TodoChange[];
  
  // Operation details from fixtures
  operation?: 'create' | 'update' | 'replace' | 'clear';
  message?: string;  // Success/error message
  errorMessage?: string;
  
  ui: {
    totalTodos: number;
    addedCount: number;
    modifiedCount: number;
    deletedCount: number;
    writtenCount?: number;  // Total written from fixtures
  };
}

// MCP tool props
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

export interface MCPContext7ToolProps extends BaseToolProps {
  input: {
    operation: "resolve-library-id" | "get-library-docs";
    libraryName?: string;
    libraryId?: string;
    topic?: string;
    tokens?: number;
  };
  
  output?: {
    libraries?: LibraryMatch[];
    documentation?: string;
    error?: string;
  };
  
  ui: {
    title: string;
    description: string;
    category: "documentation";
  };
}

// Supporting types
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

// EditOperation represents individual edits in MultiEdit
export interface EditOperation {
  old_string: string;
  new_string: string;
  replace_all?: boolean;
  lineNumber?: number;  // Added by parser
  isGlobal?: boolean;   // Added by parser
  index?: number;       // Added by parser
}

// EditDetail represents the result of each edit operation
export interface EditDetail {
  operation: EditOperation;
  success: boolean;
  replacements_made?: number;
  error?: string;
}

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

// FileInfo is an alias for FileEntry in LS context
export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size?: number;
  permissions?: string;
  modified?: string;
  created?: string;
  accessed?: string;
}

export interface FileEntry {
  name: string;
  type: "file" | "directory" | "symlink";
  size?: number;
  permissions?: string;
  lastModified?: string;
  isHidden?: boolean;
}

export interface TodoItem {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
  priority: "high" | "medium" | "low";
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
  tags?: string[];
}

export interface TodoChange {
  type: "add" | "update" | "delete";
  todoId: string;
  oldValue?: TodoItem;
  newValue?: TodoItem;
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

export interface LibraryMatch {
  id: string;
  name: string;
  description?: string;
  trustScore?: number;
  snippetCount?: number;
}

// Generic MCP tool props for unknown MCP tools
export interface McpToolProps extends BaseToolProps {
  input: {
    parameters: Record<string, any>;
  };
  
  results: {
    output?: unknown;
    errorMessage?: string;
  };
  
  ui: {
    toolName: string;
    serverName: string;
    methodName: string;
    displayMode: 'text' | 'json' | 'table' | 'list' | 'empty';
    isStructured: boolean;
    hasNestedData: boolean;
    keyCount: number;
    showRawJson?: boolean;
    collapsible?: boolean;
  };
}

// Union type for all tool props
export type ToolProps = 
  | BashToolProps
  | ReadToolProps
  | WriteToolProps
  | EditToolProps
  | GrepToolProps
  | GlobToolProps
  | MultiEditToolProps
  | LsToolProps
  | TodoReadToolProps
  | TodoWriteToolProps
  | MCPPuppeteerToolProps
  | MCPSequentialThinkingToolProps
  | MCPContext7ToolProps
  | McpToolProps;

// Tool type enum for discriminated unions
export enum ToolType {
  Bash = "bash",
  Read = "read",
  Write = "write",
  Edit = "edit",
  Grep = "grep",
  Glob = "glob",
  MultiEdit = "multi_edit",
  Ls = "ls",
  TodoRead = "todo_read",
  TodoWrite = "todo_write",
  MCPPuppeteer = "mcp_puppeteer",
  MCPSequentialThinking = "mcp_sequential_thinking",
  MCPContext7 = "mcp_context7"
}

// Message props
export interface UserMessageProps {
  uuid: string;
  timestamp: string;
  content: string;
  metadata?: {
    attachments?: string[];
    mentions?: string[];
  };
}

export interface AssistantMessageProps {
  uuid: string;
  timestamp: string;
  content: string;
  toolCalls?: string[];  // UUIDs of associated tool calls
}

export interface ThinkingBlockProps {
  uuid: string;
  timestamp: string;
  content: string;
  duration?: number;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

// === Raw Data Types for Parser Safety === //

export interface RawToolResult {
  output?: string | Record<string, unknown>;
  interrupted?: boolean;
  error?: string;
  message?: string;
  errorMessage?: string;
  edits_applied?: number;
  edit_details?: Record<string, unknown>[];
  all_successful?: boolean;
  entries?: Record<string, unknown>[];
  totalSize?: number;
  entryCount?: number;
  todos?: Record<string, unknown>[];
  statusCounts?: {
    pending: number;
    in_progress: number;
    completed: number;
  };
  priorityCounts?: {
    high: number;
    medium: number;
    low: number;
  };
  [key: string]: unknown;
}

export interface RawLogEntry extends Record<string, unknown> {
  toolUseResult?: RawToolResult;
  content?: unknown;
}

export interface ParsedToolOutput {
  [key: string]: unknown;
}

// Complete chat item union
export type ChatItemProps = 
  | UserMessageProps
  | AssistantMessageProps
  | ThinkingBlockProps
  | ToolProps;
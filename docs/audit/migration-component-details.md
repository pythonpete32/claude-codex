# Detailed Component Migration Guide

## Component-by-Component Field Mapping

### 🔧 BashTool

#### Current Props → Parser Output Mapping
```typescript
// Current UI Props
{
  command: string;              // → Keep as-is
  description?: string;         // → Use promptText from parser
  output?: string;             // → Keep as-is
  status?: string;             // → Use normalized status
  duration?: number;           // → Already provided by parser
  timestamp?: string;          // → Keep as-is
  showCopyButton?: boolean;    // → Keep (UI concern)
  animated?: boolean;          // → Keep (UI concern)
  onCopy?: () => void;        // → Keep (UI concern)
  onRun?: () => void;         // → Keep (UI concern)
}

// Additional fields from parser to add:
{
  uuid: string;                // New - for correlation
  parentUuid?: string;         // New - for correlation
  errorOutput?: string;        // New - separate stderr
  exitCode?: number;           // New - command exit code
  workingDirectory?: string;   // New - execution context
  interrupted?: boolean;       // New - interruption state
}
```

### ✏️ EditTool

#### Current Props → Parser Output Mapping
```typescript
// Current UI Props
{
  filePath: string;            // → Keep as-is
  oldContent?: string;         // → Keep as-is
  newContent?: string;         // → Keep as-is
  command?: string;            // → Keep as-is
  description?: string;        // → Keep as-is
  status?: string;             // → Use normalized status
  timestamp?: string;          // → Keep as-is
}

// Additional fields from parser to add:
{
  uuid: string;                // New - for correlation
  content: string;             // New - final file content
  fileType?: string;           // New - for syntax highlighting
  diff: DiffLine[];            // New - pre-calculated diff
  showLineNumbers?: boolean;   // New - UI helper
  wordWrap?: boolean;          // New - UI helper
}
```

### 🔍 GlobTool

#### Current Props → Parser Output Mapping
```typescript
// Current UI Props
{
  pattern: string;             // → Move to input.pattern
  matches: GlobMatch[];        // → Transform from results (string[])
  command?: string;            // → Keep as-is
  description?: string;        // → Keep as-is
  status?: string;             // → Use normalized status
  timestamp?: string;          // → Keep as-is
}

// New structure from parser:
{
  uuid: string;
  input: {
    pattern: string;
    searchPath?: string;
  };
  results: string[];           // Need to transform to GlobMatch[]
  ui: {
    totalMatches: number;
    filesWithMatches: number;
    searchTime?: number;
  };
}
```

### 🔎 GrepTool

#### Current Props → Parser Output Mapping
```typescript
// Current UI Props
{
  pattern: string;             // → Move to input.pattern
  searchPath: string;          // → Move to input.searchPath
  fileMatches: FileMatch[];    // → Map from results
  command?: string;            // → Keep as-is
  description?: string;        // → Keep as-is
  status?: string;             // → Use normalized status
  timestamp?: string;          // → Keep as-is
  onMatchClick?: () => void;   // → Keep (UI concern)
}

// New structure from parser:
{
  uuid: string;
  input: {
    pattern: string;
    searchPath?: string;
    filePatterns?: string[];
    caseSensitive?: boolean;
    useRegex?: boolean;
  };
  results: SearchResult[];     // Similar to FileMatch but different
  ui: {
    totalMatches: number;
    filesWithMatches: number;
    searchTime?: number;
  };
  onRefineSearch?: () => void; // New callback
}
```

### 📁 LsTool

#### Current Props → Parser Output Mapping
```typescript
// Current UI Props
{
  path: string;                // → Move to input.path
  files: FileItem[];           // → Map from results.entries
  command?: string;            // → Keep as-is
  description?: string;        // → Keep as-is
  status?: string;             // → Use normalized status
  timestamp?: string;          // → Keep as-is
  showHidden?: boolean;        // → Move to input.showHidden
  onPathClick?: () => void;    // → Keep (UI concern)
  onFileClick?: () => void;    // → Keep (UI concern)
}

// New structure from parser:
{
  uuid: string;
  input: {
    path: string;
    showHidden?: boolean;
    recursive?: boolean;
    ignore?: string[];
  };
  results: {
    entries: FileEntry[];      // Different type than FileItem
    entryCount: number;
    errorMessage?: string;
  };
  ui: {
    totalFiles: number;
    totalDirectories: number;
    totalSize?: number;
  };
}
```

### ✂️ MultiEditTool

#### Current Props → Parser Output Mapping
```typescript
// Current UI Props
{
  fileEdits: FileEdit[];       // → Derive from input + results
  command?: string;            // → Keep as-is
  description?: string;        // → Keep as-is
  status?: string;             // → Use normalized status
  timestamp?: string;          // → Keep as-is
}

// New structure from parser:
{
  uuid: string;
  input: {
    filePath: string;
    edits: Array<{
      oldString: string;
      newString: string;
      replaceAll?: boolean;
    }>;
  };
  results: {
    message: string;
    editsApplied: number;
    totalEdits: number;
    allSuccessful: boolean;
    editDetails: EditDetail[];
    errorMessage?: string;
  };
  ui: {
    successfulEdits: number;
    failedEdits: number;
    totalEdits: number;
  };
}
```

### 📖 ReadTool

#### Current Props → Parser Output Mapping
```typescript
// Current UI Props
{
  filePath: string;            // → Keep as-is
  content: string;             // → Keep as-is
  command?: string;            // → Keep as-is
  description?: string;        // → Keep as-is
  status?: string;             // → Use normalized status
  timestamp?: string;          // → Keep as-is
  totalLines?: number;         // → Keep as-is
  startLine?: number;          // → Keep as-is
  endLine?: number;            // → Keep as-is
  fileSize?: number;           // → Keep as-is
  isBinary?: boolean;          // → Keep as-is
  showLineNumbers?: boolean;   // → Keep as-is
}

// Additional fields from parser to add:
{
  uuid: string;
  fileType?: string;           // For syntax highlighting
  language?: string;           // Alternative to fileType
  truncated?: boolean;         // Important indicator
  errorMessage?: string;       // Error display
  maxHeight?: string;          // UI control
  wordWrap?: boolean;          // UI control
}
```

## Type Transformations Needed

### 1. GlobTool: `string[]` → `GlobMatch[]`
```typescript
// Parser gives us:
results: string[] = ["/path/to/file.ts", "/path/to/dir/"]

// UI expects:
matches: GlobMatch[] = [
  { filePath: "/path/to/file.ts", isDirectory: false },
  { filePath: "/path/to/dir/", isDirectory: true }
]

// Transform:
const matches = results.map(path => ({
  filePath: path,
  isDirectory: path.endsWith('/') || detectIsDirectory(path)
}));
```

### 2. GrepTool: `SearchResult[]` → `FileMatch[]`
```typescript
// Parser gives us:
results: SearchResult[] = [{
  filePath: "/file.ts",
  matches: [{
    line: 5,
    content: "const x = useState()",
    matchStart: 10,
    matchEnd: 18
  }],
  matchCount: 1
}]

// UI expects similar structure but might need field mapping
```

### 3. LsTool: `FileEntry[]` → `FileItem[]`
```typescript
// Parser gives us:
entries: FileEntry[] = [{
  name: "file.ts",
  type: "file",
  path: "/full/path/file.ts",
  size: 1234,
  permissions: "-rw-r--r--",
  modified: "2024-01-01",
  owner: "user",
  group: "group",
  isHidden: false,
  isSymlink: false,
  linkTarget: null,
  extension: "ts"
}]

// UI expects simpler:
files: FileItem[] = [{
  name: "file.ts",
  type: "file",
  size: 1234,
  permissions: "-rw-r--r--",
  modified: "2024-01-01",
  hidden: false,
  extension: "ts"
}]
```

## Status Mapping

All components need this mapping:
```typescript
// Parser normalized status → UI status
const statusMap = {
  'pending': 'pending',
  'running': 'running',      // Only BashTool supports
  'completed': 'completed',
  'failed': 'error',         // UI uses 'error'
  'interrupted': 'error',    // Map to error for now
  'unknown': 'pending'       // Map to pending for now
};
```

## Priority Fields to Add First

1. **All Components**: `uuid` for correlation tracking
2. **All Components**: Support for normalized status values
3. **BashTool**: `errorOutput`, `exitCode`, `interrupted`
4. **EditTool**: `diff` array (stop recalculating)
5. **GrepTool**: `ui` statistics object
6. **LsTool**: `results.entryCount` and `ui` statistics
7. **ReadTool**: `truncated` indicator
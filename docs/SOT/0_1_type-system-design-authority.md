# Type System Design Authority - Source of Truth

**STATUS**: AUTHORITATIVE - All type definitions MUST follow these rules  
**VERSION**: 1.0  
**CREATED**: 2025-06-30  
**LAST UPDATED**: 2025-06-30

## Overview

This document is the **single source of truth** for all type definitions in Claude Codex. Every type, interface, and data structure MUST conform to these rules. Deviations require approval and documentation.

## Core Principles

### 1. Type Safety First
- **NO `any` types** - use `unknown` and narrow with type guards
- **NO `Record<string, any>`** - define explicit interfaces
- **ALL props must be typed** - optional props use `?:`

### 2. Consistency Over Convenience
- **Same patterns everywhere** - no special cases without justification
- **Predictable naming** - developers should know field names without looking
- **Clear inheritance** - extends relationships must be logical

### 3. UI-First Design
- **Parsers output UI-ready props** - no runtime transformation needed
- **Components consume directly** - props match component needs exactly
- **Performance optimized** - minimal object creation/manipulation

## Architecture Hierarchy

```typescript
BaseToolProps
├── CommandToolProps      // Command execution tools
├── FileToolProps        // File operation tools  
├── SearchToolProps      // Search and discovery tools
└── MCPToolProps         // MCP server tools
```

## Field Naming Rules

### Rule 1: Output Field Naming (CRITICAL)

| Tool Category | Field Name | Type | Usage |
|---------------|------------|------|-------|
| **Simple Tools** | Direct properties | `string`, `number`, etc. | Flat data only |
| **Search Tools** | `results` | `SearchResult[]` | Search/discovery operations |
| **List Tools** | `results` | `Array<T>` | Any tool returning lists |
| **MCP Tools** | `results` | `object` | Structured MCP responses |

**EXAMPLES:**
```typescript
// ✅ CORRECT - Simple tools use direct properties
BashToolProps.output?: string;
ReadToolProps.content: string;

// ✅ CORRECT - Complex tools use "results"
GrepToolProps.results?: SearchResult[];
GlobToolProps.results?: string[];  
LsToolProps.results?: FileEntry[];

// ❌ WRONG - Inconsistent naming
GlobToolProps.matches: string[];     // Should be "results"
LsToolProps.entries: FileEntry[];    // Should be "results"
```

### Rule 2: Structure Patterns

#### Simple Tool Pattern (Flat)
```typescript
export interface SimpleToolProps extends CategoryBaseProps {
  // Input data (flattened from tool call)
  inputField1: string;
  inputField2?: number;
  
  // Output data (direct properties)
  output?: string;
  success?: boolean;
  errorMessage?: string;
  
  // UI helpers (minimal)
  showButton?: boolean;
  onAction?: () => void;
}
```

#### Complex Tool Pattern (Structured)
```typescript
export interface ComplexToolProps extends BaseToolProps {
  // Input section (structured)
  input: {
    parameter1: string;
    parameter2?: number;
    options?: ToolSpecificOptions;
  };
  
  // Results section (structured)
  results?: {
    data: ResultData[];
    metadata: ResultMetadata;
    errors?: string[];
  };
  
  // UI section (computed values)
  ui: {
    totalItems: number;
    displayMode: string;
    summary: string;
  };
}
```

### Rule 3: No Mixed Patterns

**❌ FORBIDDEN - Mixed flat and structured:**
```typescript
// This violates our hybrid schema
export interface BadToolProps extends BaseToolProps {
  input: { structured: true };  // Structured
  flatField: string;            // Flat - WRONG!
  ui: { computed: true };       // Structured
}
```

## Category Base Interfaces

### CommandToolProps
```typescript
export interface CommandToolProps extends BaseToolProps {
  command: string;                     // The command executed
  output?: string;                     // Combined stdout/stderr
  errorOutput?: string;                // Separate error output
  exitCode?: number;                   // Command exit code
  workingDirectory?: string;           // Execution context
  environment?: Record<string, string>; // Environment variables
  interrupted?: boolean;               // Execution interruption
  
  // UI interactions
  showCopyButton?: boolean;
  onCopy?: () => void;
  onRerun?: () => void;
}
```

### FileToolProps
```typescript
export interface FileToolProps extends BaseToolProps {
  filePath: string;                    // Target file path (required)
  content?: string;                    // File content
  fileSize?: number;                   // Size in bytes
  totalLines?: number;                 // Line count
  fileType?: string;                   // For syntax highlighting
  encoding?: string;                   // File encoding
  
  // Display options
  showLineNumbers?: boolean;
  wordWrap?: boolean;
  maxHeight?: string;
  
  // UI interactions
  onFileClick?: (filePath: string) => void;
}
```

### SearchToolProps
```typescript
export interface SearchToolProps extends BaseToolProps {
  input: {
    pattern: string;                   // Search pattern (required)
    scope?: string;                    // Search scope/directory
    options?: Record<string, unknown>; // Tool-specific options
  };
  
  results?: SearchResult[];            // Structured search results
  
  ui: {
    totalMatches: number;              // Total match count
    filesWithMatches: number;          // Files containing matches
    searchTime?: number;               // Search duration (ms)
  };
  
  // UI interactions
  onMatchClick?: (filePath: string, lineNumber?: number) => void;
  onRefineSearch?: (newPattern: string) => void;
}
```

### MCPToolProps
```typescript
export interface MCPToolProps extends BaseToolProps {
  input: {
    parameters: Record<string, unknown>; // MCP tool parameters
  };
  
  results?: {
    output?: unknown;                   // MCP response data
    errorMessage?: string;              // Error details
  };
  
  ui: {
    toolName: string;                   // Full tool name (mcp__server__method)
    serverName: string;                 // MCP server name
    methodName: string;                 // MCP method name
    displayMode: 'text' | 'json' | 'table' | 'list' | 'empty';
    isStructured: boolean;              // Has nested data
    hasNestedData: boolean;             // Contains objects/arrays
    keyCount: number;                   // Number of top-level keys
    showRawJson?: boolean;              // Show JSON view toggle
    collapsible?: boolean;              // Can collapse sections
    isComplex?: boolean;                // Complex data structure
    isLarge?: boolean;                  // Large data set
  };
}
```

## Specific Tool Type Rules

### Built-in Tools

#### Simple Tools (extend category bases)
```typescript
// Bash - extends CommandToolProps
export interface BashToolProps extends CommandToolProps {
  command: string;                     // Inherited + required
  elevated?: boolean;                  // Tool-specific
  showPrompt?: boolean;                // UI helper
  promptText?: string;                 // UI helper
}

// Read - extends FileToolProps  
export interface ReadToolProps extends FileToolProps {
  filePath: string;                    // Inherited + required
  content: string;                     // Inherited + required
  truncated?: boolean;                 // Tool-specific
  language?: string;                   // For syntax highlighting
}
```

#### Complex Tools (follow structured pattern)
```typescript
// Grep - extends SearchToolProps
export interface GrepToolProps extends SearchToolProps {
  input: {
    pattern: string;                   // Inherited + required
    searchPath?: string;               // Tool-specific
    filePatterns?: string[];           // Tool-specific
    caseSensitive?: boolean;           // Tool-specific
    useRegex?: boolean;                // Tool-specific
  };
  
  results?: SearchResult[];            // Inherited type
  
  ui: {
    totalMatches: number;              // Inherited + required
    filesWithMatches: number;          // Inherited + required
    searchTime: number;                // Inherited + required
  };
}

// Glob - extends SearchToolProps (FIXED)
export interface GlobToolProps extends SearchToolProps {
  input: {
    pattern: string;                   // Inherited + required
    searchPath?: string;               // Tool-specific
  };
  
  results?: string[];                  // File paths (simplified SearchResult)
  
  ui: {
    totalMatches: number;              // Inherited + required
    filesWithMatches: number;          // Inherited (same as totalMatches)
    searchTime?: number;               // Inherited
  };
}
```

### MCP Tools

#### Simple MCP Tools
```typescript
export interface ScreenshotToolProps extends MCPToolProps {
  input: {
    windowId?: number;                 // Tool-specific parameter
  };
  
  results?: {
    screenshot: string;                // Base64 image data
    metadata: {
      width: number;
      height: number;
      timestamp: string;
    };
  };
  
  ui: {
    toolName: string;                  // Inherited + required
    serverName: 'snap-happy';          // Tool-specific
    methodName: 'TakeScreenshot';      // Tool-specific
    displayMode: 'image';              // Tool-specific
    imagePreview: boolean;             // Tool-specific UI
  };
}
```

#### Complex MCP Tools
```typescript
export interface ExcalidrawCreateToolProps extends MCPToolProps {
  input: {
    elementType: 'rectangle' | 'ellipse' | 'diamond' | 'arrow' | 'text';
    position: { x: number; y: number; };
    dimensions: { width: number; height: number; };
    styling: {
      strokeColor?: string;
      backgroundColor?: string;
      strokeWidth?: number;
      opacity?: number;
    };
  };
  
  results?: {
    elementId: string;                 // Created element ID
    created: boolean;                  // Success flag
    scene: {                           // Updated scene info
      elements: number;
      lastModified: string;
    };
  };
  
  ui: {
    toolName: string;                  // Inherited + required
    serverName: 'excalidraw';          // Tool-specific
    methodName: 'create_element';      // Tool-specific
    displayMode: 'visual';             // Tool-specific
    previewData: {                     // Tool-specific UI
      elementPreview: boolean;
      showCoordinates: boolean;
    };
  };
}
```

## Supporting Types

### Required Supporting Types
```typescript
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

export interface FileEntry {
  name: string;
  type: 'file' | 'directory' | 'symlink';
  size?: number;
  permissions?: string;
  lastModified?: string;
  isHidden?: boolean;
}

export interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
  tags?: string[];
}
```

## Validation Rules

### Type Checking Requirements
1. **All interfaces must extend a base type** (BaseToolProps or category base)
2. **No duplicate field names** between inherited and tool-specific fields
3. **Consistent field types** across similar tools
4. **Required fields explicitly marked** (no `?:` on essential data)

### Naming Conventions
1. **Interface names**: `{ToolName}ToolProps` (e.g., `BashToolProps`)
2. **Field names**: camelCase, descriptive, consistent across tools
3. **Type names**: PascalCase, noun-based (e.g., `SearchResult`)
4. **Enum values**: lowercase with underscores (e.g., `'in_progress'`)

### Documentation Requirements
1. **Every interface must have a comment** describing its purpose
2. **Complex fields need inline comments** explaining their usage
3. **Examples required** for non-obvious field formats
4. **Version history** for breaking changes

## Migration Strategy

### For Existing Types
1. **Audit all current interfaces** against these rules
2. **Create deprecation notices** for inconsistent types
3. **Implement fixes incrementally** to avoid breaking changes
4. **Update all parsers and components** to use consistent types

### For New Types
1. **Follow this document exactly** - no exceptions without approval
2. **Create type definitions first** before implementing parsers
3. **Validate against real fixture data** before finalizing
4. **Review with team** before committing

## Approval Process

### Changes to This Document
1. **Major changes require team approval**
2. **Minor clarifications can be made directly**
3. **All changes must be documented** in version history
4. **Breaking changes require migration plan**

### New Type Additions
1. **Must follow established patterns**
2. **Require review of inheritance hierarchy**
3. **Must include supporting types if needed**
4. **Testing required before approval**

---

**This document is the authoritative source for all type definitions in Claude Codex. When in doubt, refer to this document. Consistency is more important than individual preferences.**
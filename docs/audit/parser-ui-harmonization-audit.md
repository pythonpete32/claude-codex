# Parser-UI Harmonization Audit

## Executive Summary

This audit identifies mismatches between our sophisticated parser outputs and the existing UI components from the previous project. The goal is to harmonize these components while maintaining the visual design quality and reducing code duplication.

## Key Findings

### 1. Major Architecture Misalignment

**Parser Output Structure:**
- Parsers follow a hybrid schema with structured data
- Include correlation IDs (uuid, parentUuid)
- Use normalized status mapping
- Provide rich metadata and UI helpers

**UI Component Expectations:**
- Simple, flat prop structures
- Missing correlation tracking
- Limited status options (no 'running', 'interrupted', 'unknown')
- No awareness of parser metadata

### 2. Status System Mismatch

**Parser Statuses (Normalized):**
- `pending`, `running`, `completed`, `failed`, `interrupted`, `unknown`

**UI Component Statuses:**
- Most components: `pending`, `completed`, `error`
- BashTool only: adds `running`

### 3. Component-Specific Mismatches

#### BashTool
| Parser Output | UI Component | Mismatch |
|--------------|--------------|----------|
| `promptText` | `description` | Field name |
| `errorOutput` | Not supported | Missing field |
| `exitCode` | Not supported | Missing field |
| `workingDirectory` | Not supported | Missing field |
| `interrupted` | Not supported | Missing field |
| Duration from base props | `duration` | Already aligned |

#### EditTool
| Parser Output | UI Component | Mismatch |
|--------------|--------------|----------|
| `diff` array with line objects | Calculates diff internally | UI does redundant work |
| `fileType` | Not used | Missing syntax highlighting info |
| `wordWrap` setting | Not supported | Missing UI control |
| Base props (uuid, etc.) | Not supported | Missing correlation |

#### GlobTool
| Parser Output | UI Component | Mismatch |
|--------------|--------------|----------|
| `input.pattern` | `pattern` | Nested vs flat |
| `results` (string array) | `matches` (object array) | Different structure |
| `ui.totalMatches` | Not supported | Missing metadata |
| `ui.searchTime` | Not supported | Missing performance info |

#### GrepTool
| Parser Output | UI Component | Mismatch |
|--------------|--------------|----------|
| `input` object | Flat `pattern`/`searchPath` | Nested vs flat |
| `results` with `SearchResult` | `fileMatches` | Similar but different types |
| `ui` statistics | Not supported | Missing summary data |
| `onRefineSearch` | Not supported | Missing interaction |

#### LsTool
| Parser Output | UI Component | Mismatch |
|--------------|--------------|----------|
| `input` object | Flat `path` | Nested vs flat |
| `results.entries` | `files` | Nested vs flat |
| `results.entryCount` | Not supported | Missing count |
| `ui` statistics | Not supported | Missing summary |
| `FileEntry` type | `FileItem` type | Different structures |

#### MultiEditTool
| Parser Output | UI Component | Mismatch |
|--------------|--------------|----------|
| `input.filePath` + `input.edits` | `fileEdits` array | Different organization |
| `results` object | Not supported | Missing detailed results |
| `ui` statistics | Not supported | Missing edit summary |
| Edit success/failure tracking | Not supported | Missing granular status |

#### ReadTool
| Parser Output | UI Component | Mismatch |
|--------------|--------------|----------|
| `language` | Not used | Missing syntax highlighting |
| `truncated` | Not supported | Missing truncation indicator |
| `errorMessage` | Not supported | Missing error display |
| `maxHeight` setting | Not supported | Missing UI control |

## Code Duplication Analysis

### 1. Shared Patterns

All components except BashTool use the `TerminalWindow` wrapper, which provides:
- Terminal header with traffic lights
- Status badge
- Command display with copy button
- Timestamp footer
- Collapsible content

### 2. Redundant Implementations

1. **Status Badge Logic**: Each component implements its own status color mapping
2. **Command Formatting**: Duplicated across components
3. **Animation Logic**: Similar motion animations in each component
4. **File Type Detection**: Multiple components detect file types independently

### 3. BashTool Anomaly

BashTool reimplements all TerminalWindow features independently:
- Custom terminal header
- Custom status badges
- Custom animations (typing effect)
- Unique features (run button, live output)

## Recommendations

### 1. Create Base Component Architecture

```typescript
// Base props aligned with parser output
interface BaseToolUIProps {
  // Correlation
  uuid: string;
  parentUuid?: string;
  
  // Core data
  command: string;
  description?: string;
  
  // Status
  status: NormalizedStatus;
  originalStatus?: string;
  
  // Metadata
  duration?: number;
  timestamp: string;
  error?: string;
  
  // UI controls
  className?: string;
  animated?: boolean;
  collapsible?: boolean;
}

// Tool-specific extensions
interface CommandToolUIProps extends BaseToolUIProps {
  output: string;
  errorOutput?: string;
  exitCode?: number;
  workingDirectory?: string;
  interrupted?: boolean;
  onRun?: () => void;
}
```

### 2. Refactor Component Hierarchy

```
TerminalWindow (shared wrapper)
├── BashTool (refactored to use wrapper)
├── EditTool
├── GlobTool
├── GrepTool
├── LsTool
├── MultiEditTool
└── ReadTool
```

### 3. Alignment Strategy

#### Phase 1: Type Alignment
1. Update UI component interfaces to match parser outputs
2. Create adapter types where needed for backwards compatibility
3. Add missing fields (correlation IDs, metadata, etc.)

#### Phase 2: Component Refactoring
1. Refactor BashTool to use TerminalWindow
2. Extract shared logic into hooks/utilities
3. Implement missing UI features (truncation, error display, etc.)

#### Phase 3: Parser Integration
1. Create direct parser-to-component mapping
2. Remove redundant transformations in UI
3. Add proper error boundaries and loading states

### 4. Specific Changes Per Component

#### BashTool
- Refactor to use TerminalWindow wrapper
- Add support for errorOutput, exitCode, workingDirectory
- Implement interrupted state visualization
- Keep typing animation as optional feature

#### EditTool
- Use parser-provided diff directly
- Add syntax highlighting based on fileType
- Implement wordWrap control
- Show correlation information in debug mode

#### GlobTool
- Adapt to nested input structure
- Display search statistics from ui field
- Show search time in header
- Handle empty results gracefully

#### GrepTool
- Support full input object structure
- Display ui statistics in header
- Implement onRefineSearch callback
- Add match highlighting in results

#### LsTool
- Use nested results structure
- Display entry counts and statistics
- Show total size in header
- Support all FileEntry fields

#### MultiEditTool
- Show detailed results per edit
- Display success/failure statistics
- Support interrupted state
- Show which edits failed and why

#### ReadTool
- Add syntax highlighting using language field
- Show truncation indicator
- Display file size in header
- Implement maxHeight control

### 5. Shared Utilities to Create

```typescript
// Status utilities
export const getStatusColor = (status: NormalizedStatus) => { /* ... */ }
export const getStatusIcon = (status: NormalizedStatus) => { /* ... */ }

// File utilities  
export const formatFileSize = (bytes: number) => { /* ... */ }
export const getFileIcon = (fileType: string) => { /* ... */ }

// Time utilities
export const formatDuration = (ms: number) => { /* ... */ }
export const formatTimestamp = (timestamp: string) => { /* ... */ }
```

## Implementation Priority

1. **High Priority**
   - Create base interfaces aligned with parser outputs
   - Update status system to support all normalized statuses
   - Refactor BashTool to use TerminalWindow

2. **Medium Priority**
   - Add missing metadata displays (statistics, counts, etc.)
   - Implement correlation ID tracking
   - Extract shared utilities

3. **Low Priority**
   - Add debug mode for correlation info
   - Implement advanced interactions (refine search, etc.)
   - Optimize for large data sets

## Success Metrics

- All UI components can directly consume parser outputs
- Zero runtime transformations needed
- Consistent visual design across all tools
- Reduced code duplication by 50%+
- Full status coverage (all 6 normalized statuses)
- Type safety with no `any` types

## Next Steps

1. Review and approve this audit
2. Create feature branch for refactoring
3. Implement base interfaces and types
4. Refactor components incrementally
5. Update stories and tests
6. Integrate with parser outputs
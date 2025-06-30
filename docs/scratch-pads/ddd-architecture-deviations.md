# DDD Architecture Deviations

This document tracks all deviations from the original FINAL-architecture-and-implementation-guide.md as we implement the Claude Codex system.

## 1. Hybrid Schema Architecture (Major Deviation)

**Original Plan**: Use generic ChatItem types with nested content structures
```typescript
// Original
export interface ChatItem {
  id: string;
  type: ChatItemType;
  timestamp: string;
  sessionId: string;
  content: unknown;  // Varies by type
}
```

**New Architecture**: UI-ready props with hybrid approach
```typescript
// New - Flat props for simple tools
export interface BashToolProps extends CommandToolProps {
  command: string;
  output?: string;
  interrupted?: boolean;
  // ... flat structure
}

// New - Structured props for complex tools  
export interface GrepToolProps extends SearchToolProps {
  input: { pattern: string; /* structured */ };
  results?: SearchResult[];
  ui: { totalMatches: number; /* UI data */ };
}
```

**Rationale**: 
- Eliminates runtime data transformation in UI components
- Better TypeScript support with discriminated unions
- Parsers output exactly what UI needs

## 2. Status Mapping with Interrupted State

**Original Plan**: Simple status types (pending, running, completed, failed)

**New Architecture**: Added "interrupted" status
```typescript
export interface ToolStatus {
  normalized: "pending" | "running" | "completed" | "failed" | "interrupted" | "unknown";
  original?: string;
  details?: {
    interrupted?: boolean;
  };
}
```

**Rationale**:
- Claude Code can be interrupted during tool execution
- Need to distinguish between failures and user interruptions
- Important for accurate status display and analytics

## 3. Parser Architecture Changes

**Original Plan**: Parsers output ChatItem types
```typescript
// Original
parse(entry: LogEntry, result?: LogEntry): BashToolChatItem
```

**New Architecture**: Parsers output UI-ready props
```typescript
// New
parse(toolCall: LogEntry, toolResult?: LogEntry, config?: ParseConfig): BashToolProps
```

**Rationale**:
- Direct UI consumption without transformation
- Better separation of concerns
- Parsers handle all data shaping

## 4. Tool Input Handling

**Original Plan**: Assumed all tools have input

**New Architecture**: Tools can have empty/no input
```typescript
// Example: TodoRead has no input
export type TodoReadToolUseInput = Record<string, never>;
```

**Implementation**:
- Using optional chaining: `toolUse.input?.command`
- No strict input validation
- Graceful handling of undefined input

**Rationale**:
- Some tools (TodoRead) legitimately have no input
- More flexible for future tool additions

## 5. File Structure Adjustments

**Original Plan**:
```
packages/core/chat-items/
├── parsers/
├── types/
└── index.ts
```

**New Structure**:
```
packages/core/src/parsers/
├── base-parser.ts
├── bash-parser.ts
├── registry.ts
└── index.ts
```

**Rationale**:
- Simpler, flatter structure
- Easier navigation
- Better module organization

## 6. Type System Location

**Original Plan**: Types scattered across packages

**New Architecture**: Centralized in @claude-codex/types
- All UI props in one place
- StatusMapper as part of types package
- Parser interfaces centralized

**Rationale**:
- Single source of truth
- Better dependency management
- Easier to maintain

## 7. Project Name Change

**Original**: claude-ui
**New**: claude-codex

**Rationale**: User correction - proper project name

## 8. TypeScript Configuration

**Original Plan**: rootDir as "./src"

**New Architecture**: rootDir as "." to include tests
```json
{
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./dist"
  }
}
```

**Rationale**: 
- Allows tests to be part of the TypeScript project
- Better IDE support

## 9. Deprecation Strategy

**Approach**: Keep old types marked as deprecated rather than immediate removal
```typescript
export * from './tools'; // Deprecated - use ui-props instead
```

**Rationale**:
- Smoother migration path
- Allows gradual updates
- Maintains backward compatibility during transition

## 10. Parser Test Naming Convention (TODO)

**Current State**: Tests use descriptive names like "bash-parser-interrupted.test.ts"

**Target State**: All parser tests should follow pattern: `{tool}-parser.test.ts`
- bash-parser.test.ts (already correct)
- edit-parser.test.ts 
- read-parser.test.ts
- etc.

**Action Required**: Consolidate all bash parser tests into single bash-parser.test.ts file

**Rationale**:
- Consistent naming pattern
- Easier to find all tests for a parser
- Follows established convention

## 11. Parser Implementation vs Fixture Data

**Finding**: The actual tool output structures in fixtures differ from initial type definitions

**Fixture Data Structures**:
```typescript
// LS Tool fixture shows:
toolUseResult: {
  entries: FileEntry[],
  entryCount: number,
  path: string,
  isError: boolean,
  errorMessage?: string  // Error messages ARE in the data!
}

// TodoRead fixture shows:
toolUseResult: {
  output: {
    todos: TodoItem[],
    totalCount: number,
    statusCounts: { pending: number, in_progress: number, completed: number },
    priorityCounts: { high: number, medium: number, low: number }
  },
  status: string
}

// MultiEdit fixture shows:
toolResult: {
  output: {
    message: string,
    edits_applied: number,
    total_edits: number,
    all_successful: boolean,
    edit_details: EditDetail[]
  }
}

// Bash with interrupted:
output: {
  stdout: string,
  stderr: string,
  exit_code: number,
  interrupted: boolean
}
```

**Key Insights**:
1. Error messages DO exist in the raw data (we shouldn't remove them)
2. Tool outputs have rich metadata we should preserve
3. The `toolUseResult` field contains tool-specific structured data
4. Different tools use different patterns (`output` vs direct properties)

**Action Required**:
- Update parsers to extract ALL available data from fixtures
- Update type definitions to include missing fields
- Preserve error messages and metadata from raw logs
- Consider creating more accurate type definitions based on actual fixture data

## Summary

These deviations represent a significant architectural improvement over the original plan. The hybrid schema architecture provides better developer experience, type safety, and performance while maintaining the core DDD principles of bounded contexts and domain modeling. The key insight is that parsers should output exactly what the UI needs, eliminating unnecessary transformation layers.

**Critical Learning**: The source of truth is the actual log data in fixtures, not the initial type definitions. We must align our types and parsers with the real data structures coming from Claude Code.
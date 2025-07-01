# UI Component Refactoring Plan

## Overview
This document tracks the refactoring of ui-components to match the core parser outputs. The core package is the source of truth and outputs UI-ready props that components should directly consume.

## Current State Analysis

### Interface Mismatches

#### BashTool Component
**Current UI Component Interface:**
```typescript
interface BashToolProps {
  command: string;
  description?: string;
  output?: string;
  status?: 'pending' | 'running' | 'completed' | 'error';  // Simple string
  duration?: number;
  timestamp?: string;
  showCopyButton?: boolean;
  animated?: boolean;
  onCopy?: () => void;
  onRun?: () => void;
  className?: string;
}
```

**Core Parser Output (from types/ui-props.ts):**
```typescript
interface BashToolProps extends CommandToolProps {
  // From BaseToolProps:
  id: string;                  // tool_use_id for API correlation
  uuid: string;                // toolCall.uuid for internal correlation  
  parentUuid?: string;         // Links to parent call
  timestamp: string;           // ISO timestamp
  duration?: number;           // Execution time in milliseconds
  status: ToolStatus;          // Complex object (normalized, original, details)
  className?: string;
  metadata?: ToolMetadata;
  
  // From CommandToolProps:
  command: string;
  output?: string;             // Combined stdout/stderr
  errorOutput?: string;        // Separate error output
  exitCode?: number;           // Command exit code
  workingDirectory?: string;   // Execution context
  environment?: Record<string, string>;
  interrupted?: boolean;
  showCopyButton?: boolean;
  onCopy?: () => void;
  onRerun?: () => void;
  
  // BashTool specific:
  elevated?: boolean;
  showPrompt?: boolean;
  promptText?: string;         // Maps from description
}
```

**Key Differences:**
1. Status is a complex object in core, simple string in UI
2. Missing correlation fields (id, uuid, parentUuid)
3. Missing fields: errorOutput, exitCode, workingDirectory, elevated, showPrompt
4. UI has `onRun` while core has `onRerun`
5. UI has `animated` which core doesn't have
6. `description` in UI maps to `promptText` in core

### Fixture Data Structure
From `bash-tool-new.json`, the parser receives:
```json
{
  "toolCall": {
    "content": [{
      "type": "tool_use",
      "id": "toolu_01YC53jvPk1RQ4MmDhkQUogS",
      "name": "Bash",
      "input": {
        "command": "echo \"Testing bash tool for log generation\"",
        "description": "Test bash command execution"
      }
    }]
  },
  "toolResult": {
    "content": [{
      "tool_use_id": "toolu_01YC53jvPk1RQ4MmDhkQUogS",
      "type": "tool_result",
      "content": "Testing bash tool for log generation"
    }],
    "toolUseResult": {
      "type": "bash",
      "command": "echo \"Testing bash tool for log generation\"",
      "exitCode": 0,
      "output": "Testing bash tool for log generation"
    }
  }
}
```

## Refactoring Plan

### Phase 1: Prepare UI Components Package
1. ✅ Get ui-components running with dev server
2. ✅ Verify Storybook functionality 
3. Create adapter layer for gradual migration
4. Set up development workflow

### Phase 2: Create Type Alignment
1. Import core types into ui-components
2. Create adapter functions to map core props to current UI props
3. Update component prop types gradually
4. Maintain backward compatibility during transition

### Phase 3: Update Components
For each tool component:
1. Update prop interface to match core
2. Update component implementation
3. Update stories with fixture data
4. Test with real parser outputs

### Phase 4: Convert to Web App
1. Set up routing structure
2. Create main app layout
3. Integrate log processing pipeline
4. Connect to Claude Code logs
5. Maintain Storybook for documentation

## Component Update Order
1. **BashTool** - Simplest, good starting point
2. **ReadTool** - Simple file operation
3. **WriteTool** - Similar to Read
4. **EditTool** - Introduces diff display
5. **GlobTool** - First search tool
6. **GrepTool** - Complex search with results
7. **LsTool** - Directory listing with entries
8. **MultiEditTool** - Most complex with multiple operations

## Technical Decisions

### Handling Status Object
The UI components expect a simple string status, but core provides:
```typescript
interface ToolStatus {
  normalized: "pending" | "running" | "completed" | "failed" | "interrupted" | "unknown";
  original?: string;
  details?: {
    progress?: number;
    substatus?: string;
    interrupted?: boolean;
  };
}
```

**Solution:** Update UI components to use `status.normalized` for display logic and potentially show additional details in tooltips or secondary indicators.

### Animation State
UI components have an `animated` prop that core doesn't provide. 

**Solution:** Keep animation as a UI-only concern, defaulting based on status:
- `animated = true` when status is 'running'
- Can be overridden by parent components

### Missing Correlation Data
UI components don't use id/uuid fields currently.

**Solution:** These will be essential for:
- Linking tool calls with results
- Navigation between related items
- Performance optimization (React keys)

## Next Steps
1. Create type adapter functions
2. Set up test fixtures in Storybook
3. Begin component migration starting with BashTool
4. Document patterns for other tools to follow
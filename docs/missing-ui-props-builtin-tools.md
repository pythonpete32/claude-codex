# Missing UI Props for Built-in Tools

This document tracks built-in tools found in raw log data that do NOT have corresponding UI props defined in `packages/types/src/ui-props.ts`.

## Built-in Tools With UI Props ✅

The following built-in tools **have** UI props defined and fixtures have been created:

1. **BashToolProps** - Command execution ✅ `bash-tool-new.json`
2. **ReadToolProps** - File reading ✅ `read-tool-new.json`  
3. **WriteToolProps** - File writing ✅ `write-tool-new.json`
4. **EditToolProps** - File editing ✅ `edit-tool-new.json`
5. **GrepToolProps** - Text search ✅ `grep-tool-new.json`
6. **GlobToolProps** - File pattern matching ✅ `glob-tool-new.json`
7. **MultiEditToolProps** - Bulk file editing ✅ `multiedit-tool-new.json`
8. **LsToolProps** - Directory listing ✅ `ls-tool-new.json`
9. **TodoReadToolProps** - Todo list reading ✅ `todoread-tool-new.json`
10. **TodoWriteToolProps** - Todo list management ✅ `todowrite-tool-new.json`

## Built-in Tools Missing UI Props ❌

The following built-in tools were found in raw log data but **DO NOT** have UI props defined:

### 1. Task Tool ❌
- **Usage in logs**: 2 occurrences
- **Purpose**: Launch a new agent for complex searches and research
- **Parameters**: `description`, `prompt`
- **Missing Props**: `TaskToolProps`
- **Example log data available**: Yes

### 2. NotebookRead Tool ❌
- **Usage in logs**: 1 occurrence
- **Purpose**: Read Jupyter notebook files (.ipynb)
- **Parameters**: `notebook_path`, `cell_id` (optional)
- **Missing Props**: `NotebookReadToolProps`
- **Example log data available**: Yes
- **Note**: Tool executed successfully and returned structured cell data

### 3. NotebookEdit Tool ❌
- **Usage in logs**: 1 occurrence
- **Purpose**: Edit Jupyter notebook cells
- **Parameters**: `notebook_path`, `new_source`, `cell_id`, `cell_type`, `edit_mode`
- **Missing Props**: `NotebookEditToolProps`
- **Example log data available**: Yes

### 4. WebSearch Tool ❌
- **Usage in logs**: 1 occurrence
- **Purpose**: Search the web for current information
- **Parameters**: `query`, `allowed_domains`, `blocked_domains`
- **Missing Props**: `WebSearchToolProps`
- **Example log data available**: Yes

### 5. WebFetch Tool ❌
- **Usage in logs**: 3 occurrences (found in updated log)
- **Purpose**: Fetch and analyze web content
- **Parameters**: `url`, `prompt`
- **Missing Props**: `WebFetchToolProps`
- **Example log data available**: Yes

### 6. exit_plan_mode Tool ❌
- **Usage in logs**: 1 occurrence (found in updated log)
- **Purpose**: Exit planning mode when ready to implement
- **Parameters**: `plan`
- **Missing Props**: `ExitPlanModeToolProps`
- **Example log data available**: Yes

## Recommendations

### ✅ Completed Actions

1. **All fixtures created** for tools with existing UI props:
   - ✅ `bash-tool-new.json`
   - ✅ `read-tool-new.json`
   - ✅ `write-tool-new.json`
   - ✅ `edit-tool-new.json`
   - ✅ `grep-tool-new.json`
   - ✅ `glob-tool-new.json`
   - ✅ `multiedit-tool-new.json`
   - ✅ `ls-tool-new.json`
   - ✅ `todoread-tool-new.json`
   - ✅ `todowrite-tool-new.json`

### Remaining Actions Required

1. **Define missing UI props** for tools found in logs but without UI props:
   - Add interface definitions to `ui-props.ts` for: Task, NotebookRead, NotebookEdit, WebSearch, WebFetch, exit_plan_mode
   - Create fixtures once UI props are defined

2. **All tools now have log data available** - ready for UI props definition:
   - WebFetch and exit_plan_mode examples are now available in the updated log file

### UI Props Design Guidance

For the missing tools, suggested interface patterns:

#### TaskToolProps (extends BaseToolProps)
```typescript
export interface TaskToolProps extends BaseToolProps {
  input: {
    description: string;
    prompt: string;
  };
  
  // Task execution results
  agentId?: string;
  output?: string;
  
  ui: {
    title: string;
    category: "agent_task";
  };
}
```

#### NotebookReadToolProps (extends FileToolProps)
```typescript
export interface NotebookReadToolProps extends FileToolProps {
  filePath: string;
  cells: NotebookCell[];
  
  ui: {
    totalCells: number;
    codeCells: number;
    markdownCells: number;
  };
}
```

#### WebSearchToolProps (extends BaseToolProps)
```typescript
export interface WebSearchToolProps extends BaseToolProps {
  input: {
    query: string;
    allowedDomains?: string[];
    blockedDomains?: string[];
  };
  
  results?: SearchResult[];
  
  ui: {
    totalResults: number;
    searchTime?: number;
    category: "web_search";
  };
}
```

## Status Summary

- **Total Built-in Tools Found**: 16  
- **With UI Props**: 10 tools (63%)
- **Missing UI Props**: 6 tools (37%)
- **Fixtures Created**: 10 tools (100% of tools with UI props) ✅
- **Fixtures Needed**: 0 tools (all existing UI props have fixtures)

**🎉 Achievement: Complete fixture coverage for all built-in tools with existing UI props!**

This analysis shows comprehensive tool coverage is achieved. Next priority is defining UI props for the 6 remaining tools (Task, NotebookRead, NotebookEdit, WebSearch, WebFetch, exit_plan_mode).
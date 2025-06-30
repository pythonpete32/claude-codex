# Legacy Parser Adaptation Strategy

## Date: 2025-06-30

## Overview
We have 14 working parsers in the LEGACY/chat-items directory with solid types, fixtures, and tests. We'll adapt these to our new DDD architecture without using Zod schemas.

## Legacy Structure
Each tool has:
- `types.ts` - TypeScript interfaces
- `parsers.ts` - Parser logic
- `fixtures.json` - Test data (155 fixtures for bash-tool!)
- `validators.ts` - TypeScript-based validation
- `schemas.ts` - Zod schemas (we'll skip these)

## Adaptation Strategy

### 1. Copy Types
We'll copy the type definitions but adapt them to match our domain models:
- Remove Zod-specific types
- Align with our ChatItem interface
- Use our ToolStatus type

### 2. Simplify Parsers
The legacy parsers are designed for fixture generation. We need to:
- Remove fixture-specific logic
- Focus on LogEntry → ChatItem transformation
- Remove Zod validation calls
- Keep the core parsing logic

### 3. Create Unified Parser Structure
Instead of separate packages, we'll have:
```
packages/core/src/chat-items/parsers/
├── base.ts                    # Base parser class
├── bash-parser.ts
├── edit-parser.ts
├── read-parser.ts
├── write-parser.ts
├── glob-parser.ts
├── grep-parser.ts
├── ls-parser.ts
├── multi-edit-parser.ts
├── todo-read-parser.ts
├── todo-write-parser.ts
├── mcp-sequential-thinking-parser.ts
├── mcp-context7-parser.ts
├── mcp-puppeteer-parser.ts
├── thinking-block-parser.ts
└── index.ts                   # Parser registry

```

### 4. Fixtures as Test Data
We'll copy the fixtures.json files to our test directories:
```
tests/fixtures/
├── bash-tool.json
├── edit-tool.json
├── ...
```

## Example Transformation

### Legacy Parser (bash-tool)
```typescript
export function parseBashTool(
  fixtureData: BashFixtureData,
  config: BashConfig = {},
): BashToolProps {
  // Complex fixture validation
  // Zod schema validation
  // Timestamp handling
  // etc.
}
```

### New Parser
```typescript
export class BashToolParser extends BaseToolParser<BashToolChatItem> {
  toolName = 'Bash';
  
  parse(entry: LogEntry, result?: LogEntry): BashToolChatItem {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : null;
    
    return {
      id: toolUse.id,
      type: 'bash_tool',
      timestamp: entry.timestamp,
      sessionId: entry.sessionId || 'unknown',
      content: {
        command: toolUse.input.command,
        description: toolUse.input.description,
        timeout: toolUse.input.timeout,
        output: toolResult ? {
          stdout: this.extractStdout(toolResult),
          stderr: this.extractStderr(toolResult),
          exitCode: this.extractExitCode(toolResult),
          isError: toolResult.is_error || false,
          interrupted: this.extractInterrupted(toolResult)
        } : undefined,
        status: this.determineStatus(toolResult)
      }
    };
  }
  
  private extractStdout(result: MessageContent): string {
    if (typeof result.output === 'string') {
      return result.is_error ? '' : result.output;
    }
    return result.output?.stdout || '';
  }
  
  // ... other extraction methods
}
```

## Benefits
1. **Proven Logic**: We're using battle-tested parsing logic
2. **Rich Test Data**: 100+ fixtures per tool for testing
3. **Type Safety**: Strong TypeScript types already defined
4. **Simpler**: No Zod, no fixture generation, just parsing

## Implementation Order
1. Create base parser class ✅
2. Copy and adapt bash-tool parser (most complex) ✅
3. Copy fixtures for testing ✅
4. Implement remaining parsers ✅
5. Create parser registry ✅

## Critical Discovery: extractRawToolResult Pattern

**Date: 2025-06-30**

During test implementation, discovered a critical pattern for parser data extraction that ALL complex parsers need:

### The Problem
Legacy LogEntry structures from the old codebase have data in different locations:
1. **Simple format**: `toolResult.content[0].output` (string or object)
2. **toolUseResult format**: `toolResult.toolUseResult` (structured data from fixtures)
3. **Nested fixture format**: `toolResult.toolUseResult.content[0].output` (deeply nested)

### The Solution
Every parser with `extractRawToolResult` method needs this pattern:

```typescript
private extractRawToolResult(toolResult?: LogEntry): RawToolResult | null {
  if (!toolResult) return null;

  const entry = toolResult as unknown as RawLogEntry;
  
  // CRITICAL: Check toolUseResult field FIRST
  if (entry.toolUseResult) {
    return entry.toolUseResult;
  }
  
  // THEN check content array for tool_result
  const content = entry.content;
  if (Array.isArray(content)) {
    const toolResultContent = content.find(c => c.type === 'tool_result');
    if (toolResultContent) {
      return toolResultContent;
    }
  }
  
  return null;
}
```

### For Nested Structures
In `parseOutput` methods, also handle deeply nested fixture data:

```typescript
// Handle complex fixture format: toolUseResult.content[0].output
if (Array.isArray(rawResult.content)) {
  const toolResultContent = rawResult.content.find(c => c.type === 'tool_result');
  if (toolResultContent && toolResultContent.output) {
    output = toolResultContent.output;
  }
}
```

### Fixed Parsers
- ✅ **MultiEditToolParser** - Fixed `extractRawToolResult` + nested structure handling
- ✅ **LsToolParser** - Fixed `extractRawToolResult`
- ✅ **TodoReadToolParser** - Already had correct pattern
- ✅ **TodoWriteToolParser** - Already had correct pattern

### Result
MultiEditToolParser: 15/15 tests passing ✅

This pattern is ESSENTIAL for any parser that needs to extract complex data from both legacy LogEntry formats and modern toolUseResult fixture formats.
# Claude SDK Message Processing Refactor

## Problem Statement

The current Claude SDK integration has several critical issues:

1. **Duplicated Message Parsing**: Logic scattered across `core/claude.ts` and `core/operations/prompts.ts`
2. **Empty Final Responses**: Getting empty strings instead of actual content due to premature termination
3. **No Real-time Display**: Missing feedback during agent execution
4. **Incorrect maxTurns Usage**: Artificially limiting Claude responses, causing premature exits
5. **Inconsistent SDK Usage**: Multiple places calling SDK directly without standardization

## Root Cause Analysis

### SDK Behavior Understanding
- `query()` returns `AsyncGenerator<SDKMessage>` that yields complete messages
- `finalResponse` is only populated when Claude naturally completes
- Setting `maxTurns: 1` cuts off Claude mid-conversation → empty `finalResponse`
- Default behavior (no `maxTurns`) allows Claude to finish naturally

### Current Issues
```typescript
// PROBLEMATIC (current code):
for await (const message of query({
  options: { maxTurns: options.maxTurns || 1 }  // ← Cutting off Claude!
}))

// CORRECT (proposed):
for await (const message of query({
  options: { /* No maxTurns = natural completion */ }
}))
```

## Architecture Solution

### New Module Structure
```
src/core/messaging/
├── sdk-wrapper.ts           # Single SDK entry point
├── message-processor.ts     # Real-time message display
├── result-extractor.ts      # Extract final results
├── debug-logger.ts          # Debug message logging
└── index.ts                 # Clean exports
```

### Design Principles
1. **Single SDK Wrapper**: One place for all Claude interactions
2. **Natural Completion**: No artificial maxTurns by default
3. **Real-time Display**: Show all messages as they arrive
4. **Full SDK Support**: Expose all Claude Code options
5. **Debug-Friendly**: Comprehensive logging when enabled
6. **Testable**: Injectable dependencies for testing

## Module Specifications

### 1. `src/core/messaging/sdk-wrapper.ts`

**Purpose**: Single point of entry for all Claude SDK interactions

**Key Types**:
```typescript
interface ClaudeAgentOptions {
  // Required
  prompt: string

  // Control Options
  abortController?: AbortController
  maxTurns?: number              // NO default - natural completion
  cwd?: string

  // System Prompt Options
  systemPrompt?: string          // Override default system prompt
  appendSystemPrompt?: string    // Add to default system prompt

  // Tool Control
  allowedTools?: string[]        // Specify permitted tools
  disallowedTools?: string[]     // Specify prohibited tools

  // Permission Control (DEFAULT: 'bypassPermissions')
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan'

  // Runtime Options
  executable?: 'node' | 'bun'    // JavaScript runtime
  executableArgs?: string[]      // Additional runtime arguments
  pathToClaudeCodeExecutable?: string  // Custom executable path

  // Display Options
  displayOptions?: {
    showToolCalls?: boolean
    showTimestamps?: boolean
    verbose?: boolean
  }

  // Debug Options
  debug?: boolean                // Enable debug message logging
  debugPath?: string            // Custom debug file path

  // Testing Support
  _queryFunction?: typeof query  // Injectable for testing
}

interface AgentResult {
  messages: SDKMessage[]
  finalResponse: string          // From SDK, not extracted
  success: boolean
  cost: number
  duration: number
  messageCount: number
}
```

**Function Signatures**:
```typescript
runClaudeAgent(options: ClaudeAgentOptions): Promise<AgentResult>
```

**Behavior**:
- Single entry point replacing current `runAgent()`
- Supports ALL Claude Code SDK options
- Defaults `permissionMode: 'bypassPermissions'`
- NO default `maxTurns` - allows natural completion
- Integrates real-time display and debug logging
- Injectable query function for testing

### 2. `src/core/messaging/message-processor.ts`

**Purpose**: Process messages in real-time as they arrive

**Function Signatures**:
```typescript
processMessagesWithDisplay(
  messageIterator: AsyncGenerator<SDKMessage>,
  options?: DisplayOptions
): Promise<SDKMessage[]>

formatMessageForDisplay(message: SDKMessage, index: number): string
```

**Behavior**:
- Iterate through AsyncGenerator messages
- Display each message immediately (tool calls, results, assistant text)
- Format different message types appropriately
- Collect and return all messages
- Handle all SDK message types: assistant, user, result, system

### 3. `src/core/messaging/result-extractor.ts`

**Purpose**: Extract final results from completed SDK execution

**Function Signatures**:
```typescript
extractAgentResults(agentResult: AgentResult): ExtractedResults
logFinalResponse(finalResponse: string, fallback?: string): string
formatExecutionSummary(results: ExtractedResults): string
```

**Types**:
```typescript
interface ExtractedResults {
  finalResponse: string
  success: boolean
  cost: number
  duration: number
  messageCount: number
}
```

**Behavior**:
- Extract data from AgentResult object (NOT from messages)
- Log final response with fallback for empty responses
- Create execution summary (duration, cost, message count)
- Handle both completed and interrupted tasks

### 4. `src/core/messaging/debug-logger.ts`

**Purpose**: Debug message logging when enabled

**Function Signatures**:
```typescript
logDebugMessages(
  messages: SDKMessage[],
  metadata: DebugMetadata,
  options?: DebugOptions
): Promise<void>

generateDebugFileName(taskId: string): string
```

**Types**:
```typescript
interface DebugMetadata {
  taskId: string
  finalResponse: string
  success: boolean
  cost: number
  duration: number
  messagesCount: number
  options?: Partial<ClaudeAgentOptions>
}

interface DebugLog extends DebugMetadata {
  timestamp: string
  messages: SDKMessage[]
}
```

**Behavior**:
- Save to `.codex/debug/task-{taskId}-messages.json`
- Include all messages and execution metadata
- Create debug directory if missing
- Log regardless of success/failure

## Integration Plan

### Phase 1: Create New Modules
1. Implement `sdk-wrapper.ts` with full SDK option support
2. Implement `message-processor.ts` for real-time display
3. Implement `result-extractor.ts` for clean result handling
4. Implement `debug-logger.ts` for comprehensive logging

### Phase 2: Update Existing Code
1. Refactor `workflows/tdd.ts` to use new `runClaudeAgent()`
2. remove `core/claude.ts`
3. Remove `extractFinalMessage` from `core/operations/prompts.ts`
4. Update all places currently calling `runAgent()`

### Phase 3: Testing Strategy
1. **Unit Tests**: Mock SDK using debug data fixtures
2. **Integration Tests**: Real SDK with simple prompts
3. **Regression Tests**: Use existing `.codex/debug/` data
4. **Test Helper**: `createMockQuery(debugMessages)` for reliable testing

## Testing Implementation

### Using Existing Debug Data
```typescript
// Test helper using real debug data
function createMockQuery(debugMessages: SDKMessage[]): typeof query {
  return async function* mockQuery() {
    for (const message of debugMessages) {
      yield message;
    }
  };
}

// Test example
const debugData = JSON.parse(fs.readFileSync('.codex/debug/task-xyz-messages.json'));
const mockQuery = createMockQuery(debugData.messages);
const result = await runClaudeAgent({
  prompt: "test",
  _queryFunction: mockQuery
});
```

### Test Categories
- **Message Processing**: Verify real-time display formatting
- **Result Extraction**: Test final response handling
- **Debug Logging**: Verify debug file creation
- **SDK Integration**: Test all option passing
- **Error Handling**: Test interrupted/failed cases

## Benefits

1. **Eliminates Duplication**: Single place for message processing
2. **Fixes Empty Responses**: Natural completion instead of artificial limits
3. **Real-time Feedback**: Display progress during execution
4. **Full SDK Support**: Expose all Claude Code capabilities
5. **Better Testing**: Injectable dependencies and debug fixtures
6. **Debug-Friendly**: Comprehensive logging for troubleshooting
7. **Type Safety**: Proper TypeScript throughout

## Migration Notes

### Breaking Changes
- `runAgent()` → `runClaudeAgent()` (different API)
- `extractFinalMessage()` removed (use SDK's finalResponse)
- Default `permissionMode` changes to `'bypassPermissions'`

### Backward Compatibility
- Existing AgentResult interface maintained
- Same return data structure
- Options are additive (existing code works)

## Success Criteria

1. No more empty `finalResponse` for naturally completed tasks
2. Real-time display of all message types during execution
3. Single SDK wrapper used everywhere
4. Comprehensive test coverage using debug data
5. Full Claude Code SDK option support
6. Reliable debug logging when enabled

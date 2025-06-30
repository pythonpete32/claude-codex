# @dao/transformer

[![JSR](https://jsr.io/badges/@dao/transformer)](https://jsr.io/@dao/transformer)
[![JSR Score](https://jsr.io/badges/@dao/transformer/score)](https://jsr.io/@dao/transformer)

Log entry transformer for Claude conversation logs. Handles correlation of tool calls with their results and transforms them into typed chat item components.

## Features

- 🔄 **Stateful Correlation**: Matches tool calls with their asynchronous results using tool IDs
- ⚡ **Two-Stage Emission**: Emits pending components immediately for UI feedback, then complete components when results arrive
- 🔀 **Out-of-Order Handling**: Correctly handles results arriving before their calls
- 🚀 **TypeScript First**: Full type safety with comprehensive type definitions
- 📦 **Extensible**: Supports all tool types through dynamic imports and registry pattern
- 🧹 **Memory Management**: Automatic cleanup of expired correlations
- 🌐 **Cross-Runtime**: Works in Deno, Node.js, Bun, and browsers

## Installation

### JSR (Recommended)

```bash
# Deno
deno add @dao/transformer

# Bun
bun add @dao/transformer@jsr

# Node.js (with JSR CLI)
npx jsr add @dao/transformer

# Node.js (manual)
npm install @jsr/dao__transformer
```

### Import

```typescript
// JSR
import { createTransformer } from "@dao/transformer";

// npm (Node.js)
import { createTransformer } from "@jsr/dao__transformer";
```

## Usage

### Basic Example

```typescript
import { createTransformer } from '@dao/transformer';

// Create transformer instance
const transformer = createTransformer({
  correlationTimeout: 5 * 60 * 1000, // 5 minutes
  preserveTimestamps: false,
  debug: true
});

// Process log entries
const logEntry = {
  type: 'assistant',
  uuid: 'call-123',
  timestamp: '2025-01-01T00:00:00.000Z',
  sessionId: 'session-123',
  message: {
    id: 'msg-123',
    type: 'message',
    role: 'assistant',
    content: [{
      type: 'tool_use',
      id: 'toolu_123',
      name: 'Bash',
      input: { 
        command: 'echo "Hello"',
        description: 'Say hello'
      }
    }]
  }
};

const result = await transformer.process(logEntry);

if (result?.item) {
  console.log(result.item);
  // {
  //   type: 'bash_tool',
  //   id: 'toolu_123',
  //   status: 'pending',
  //   props: { ... }
  // }
}
```

### Advanced Usage - Handling Complete Flow

```typescript
import { createTransformer } from '@dao/transformer';

const transformer = createTransformer({ debug: false });

// Tool call arrives
const callEntry = {
  type: 'assistant',
  message: {
    content: [{
      type: 'tool_use',
      id: 'toolu_123',
      name: 'Bash',
      input: { command: 'ls -la' }
    }]
  }
  // ... other fields
};

// Emits pending component
const pendingResult = await transformer.process(callEntry);
console.log(pendingResult.item.status); // 'pending'

// Tool result arrives
const resultEntry = {
  type: 'user',
  message: {
    content: [{
      type: 'tool_result',
      tool_use_id: 'toolu_123',
      content: 'file1.txt\nfile2.txt',
      is_error: false
    }]
  },
  toolUseResult: {
    stdout: 'file1.txt\nfile2.txt',
    stderr: '',
    isError: false
  }
  // ... other fields
};

// Emits complete component
const completeResult = await transformer.process(resultEntry);
console.log(completeResult.item.status); // 'completed'
```

## API Reference

### `createTransformer(options?)`

Creates a new transformer instance.

**Parameters:**
- `options` (optional): Configuration object
  - `correlationTimeout` (number): Maximum time to wait for correlations in milliseconds (default: 5 minutes)
  - `preserveTimestamps` (boolean): Whether to keep original timestamps (default: false)
  - `debug` (boolean): Enable debug logging (default: false)

**Returns:** `LogEntryTransformer` instance

### `transformer.process(entry)`

Processes a single log entry.

**Parameters:**
- `entry`: Log entry to process

**Returns:** Promise resolving to:
- `{ item: TransformedItem }` - Transformed component (pending or complete)
- `{ error: TransformError }` - If transformation failed
- `null` - If entry is not tool-related or buffered

### `transformer.getPending()`

Returns all pending correlations waiting for matches.

**Returns:** `PendingCorrelation[]`

### `transformer.getPendingCount()`

Returns the count of pending correlations.

**Returns:** `number`

### `transformer.clearPending()`

Clears all pending correlations.

### `transformer.clearExpired(maxAge?)`

Removes correlations older than maxAge milliseconds.

**Parameters:**
- `maxAge` (optional): Maximum age in milliseconds (defaults to correlationTimeout)

**Returns:** Number of cleared correlations

## Tool Type Mappings

| Tool Name | Component Type |
|-----------|---------------|
| Bash | bash_tool |
| Read, Write, Edit, MultiEdit | file_tool |
| Glob, Grep, LS | search_tool |
| Task, TodoRead, TodoWrite | meta_tool |
| WebFetch, WebSearch | web_tool |
| NotebookRead, NotebookEdit | notebook_tool |
| mcp__* | mcp_tool |

## How It Works

### 1. Tool Call Processing
When a tool call log entry arrives:
- Checks for existing buffered results
- If found: immediately returns complete component
- If not: stores call and returns pending component

### 2. Tool Result Processing
When a tool result log entry arrives:
- Checks for matching pending call
- If found: correlates and returns complete component
- If not: buffers result for when call arrives

### 3. Status Derivation
Component status is derived from the `is_error` field:
- `is_error: false` → `status: 'completed'`
- `is_error: true` → `status: 'failed'`
- No result yet → `status: 'pending'`

## Type Definitions

```typescript
interface LogEntry {
  type: 'assistant' | 'user' | 'thinking' | 'message';
  uuid: string;
  timestamp: string;
  parentUuid?: string | null;
  sessionId: string;
  message?: {
    content: Array<ToolUse | ToolResult | TextBlock | ThinkingBlock>;
    // ... other fields
  };
  toolUseResult?: any;
}

interface TransformedItem {
  type: string;        // e.g., "bash_tool"
  id: string;          // Tool use ID
  correlationId: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  props: any;          // Tool-specific props
}
```

## Development

### Prerequisites

- [Bun](https://bun.sh) or [Deno](https://deno.land)
- TypeScript 5.0+

### Scripts

```bash
# Install dependencies
bun install

# Run tests
bun test

# Type check
bun run typecheck

# Lint
bun run lint

# Publish to JSR
bun run publish:jsr
```

### Project Structure

```
.
├── src/
│   ├── index.ts             # Main exports
│   ├── transformer.ts       # Main transformer class
│   ├── correlation-engine.ts # Correlation logic
│   ├── format-converter.ts  # Log to fixture conversion
│   └── types.ts            # Type definitions
├── tests/
│   ├── transformer.test.ts  # Transformer tests
│   └── correlation-engine.test.ts # Correlation tests
├── jsr.json                # JSR configuration
├── package.json            # Package configuration  
├── tsconfig.json           # TypeScript configuration
├── README.md              # This file
└── LICENSE                # MIT License
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [@dao/chat-items-*](https://jsr.io/@dao) - Chat item component packages
- [Atomic Workflow](https://github.com/DAOresearch/atomic-workflow) - Workflow system

---

Made with ❤️ by [DAOresearch](https://github.com/DAOresearch)
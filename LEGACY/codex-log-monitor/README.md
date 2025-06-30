# @dao/codex-log-monitor

Monitor Claude log files in real-time with historical data support.

## Features

- Read all historical log entries from JSONL files
- Watch for new entries in real-time using Node.js file system watchers
- Track active sessions based on last modified time
- Decode project paths from Claude's encoded directory naming convention
- Zero dependencies beyond Node.js built-ins
- TypeScript-first with comprehensive type definitions

## Installation

```bash
# Deno
deno add @dao/codex-log-monitor

# npm
npx jsr add @dao/codex-log-monitor

# Bun
bunx jsr add @dao/codex-log-monitor
```

## How It Works

### Claude's File Structure

Claude stores conversation logs in `~/.claude/projects/` using an encoded directory structure:

```
~/.claude/projects/
├── -Users-john-project-a/          # Represents /Users/john/project-a
│   ├── abc123-def456-ghi789.jsonl  # Session ID: abc123-def456-ghi789
│   └── 456ghi-jkl890-mno123.jsonl  # Session ID: 456ghi-jkl890-mno123
└── -Users-john--config/             # Represents /Users/john/.config
    └── 789mno-pqr456-stu789.jsonl  # Session ID: 789mno-pqr456-stu789
```

**Path Encoding Rules:**
- Single dashes (`-`) → Forward slashes (`/`)
- Double dashes (`--`) → Dot directories (`/.`)

**Example Decodings:**
- `-Users-john-project-a` → `/Users/john/project/a`
- `-Users-john--config` → `/Users/john/.config`
- `-home-user--ssh-config` → `/home/user/.ssh/config`

### Implementation Architecture

The monitor uses a multi-layered approach:

1. **Discovery Layer** (`getProjectDirectories()`, `getJsonlFiles()`)
   - Scans the projects directory for encoded project folders
   - Finds all `.jsonl` files within each project directory
   - Handles missing directories gracefully

2. **Historical Reading** (`readAll()`)
   - Uses Node.js `createReadStream()` for memory-efficient file reading
   - Processes files line-by-line with `readline.createInterface()`
   - Tracks file positions for watch mode coordination
   - Skips empty lines automatically

3. **Real-time Watching** (`watch()`)
   - Sets up `fs.watch()` on the projects directory to detect new project folders
   - Watches each project directory for new `.jsonl` files
   - Monitors individual files for new content using position tracking
   - Handles concurrent file modifications safely

4. **Path Processing** (`path-decoder.ts`)
   - Decodes Claude's directory naming convention
   - Extracts session IDs from filenames
   - Provides utility functions for path manipulation

### Event-Driven Architecture

The monitor extends Node.js `EventEmitter` to provide real-time notifications:

```typescript
monitor.on('entry', (entry: LogEntry) => {
  // Called for each new line detected during watch mode
  console.log(`[${entry.sessionId}] ${entry.line}`);
});
```

### Memory Management

- **Streaming**: Uses async generators to avoid loading entire files into memory
- **Position Tracking**: Remembers file positions to only read new content
- **Resource Cleanup**: Properly closes all file watchers when `stop()` is called
- **Error Handling**: Graceful fallbacks for missing files and directories

## Usage

### Basic Example

```typescript
import { createMonitor } from '@dao/codex-log-monitor';

// Create a monitor instance
const monitor = createMonitor();

// Read all historical entries
for await (const entry of monitor.readAll()) {
  console.log(`${entry.project}: ${entry.line}`);
}

// Watch for new entries
monitor.on('entry', (entry) => {
  console.log('New entry:', entry.line);
});
await monitor.watch();

// Check active sessions (placeholder - returns empty array currently)
const activeSessions = monitor.getActiveSessions();
console.log('Active sessions:', activeSessions);

// Clean up when done
monitor.stop();
```

### Custom Configuration

```typescript
const monitor = createMonitor({
  // Custom projects path (default: ~/.claude/projects/)
  projectsPath: '/custom/path/to/projects',
  
  // How recent a session must be to be considered "active" (default: 60000ms)
  activeThresholdMs: 300000 // 5 minutes
});
```

### Processing Historical Data

```typescript
import { createMonitor } from '@dao/codex-log-monitor';

const monitor = createMonitor();
const sessionData = new Map();

// Process all historical entries
for await (const entry of monitor.readAll()) {
  if (!sessionData.has(entry.sessionId)) {
    sessionData.set(entry.sessionId, {
      project: entry.project,
      lines: [],
      firstSeen: new Date()
    });
  }
  
  // Parse JSONL and process
  try {
    const data = JSON.parse(entry.line);
    sessionData.get(entry.sessionId).lines.push(data);
  } catch (error) {
    console.warn(`Invalid JSON at ${entry.filePath}:${entry.lineNumber}`);
  }
}

console.log(`Processed ${sessionData.size} sessions`);
```

### Real-time Monitoring

```typescript
import { createMonitor } from '@dao/codex-log-monitor';

const monitor = createMonitor();

// Set up real-time processing
monitor.on('entry', (entry) => {
  try {
    const data = JSON.parse(entry.line);
    
    // Process different types of entries
    if (data.type === 'tool_use') {
      console.log(`Tool used: ${data.tool}`);
    } else if (data.type === 'text') {
      console.log(`Text: ${data.content}`);
    }
  } catch (error) {
    console.warn(`Invalid JSON in real-time: ${entry.line}`);
  }
});

// Start watching
await monitor.watch();

// Keep process alive
process.on('SIGINT', () => {
  console.log('Stopping monitor...');
  monitor.stop();
  process.exit(0);
});
```

### Path Decoding Utilities

```typescript
import { decodeProjectPath, extractSessionId, extractProject } from '@dao/codex-log-monitor';

// Decode directory names
console.log(decodeProjectPath('-Users-john-project-a'));     // "/Users/john/project/a"
console.log(decodeProjectPath('-Users-john--config'));       // "/Users/john/.config"

// Extract session IDs
console.log(extractSessionId('abc123-def456.jsonl'));        // "abc123-def456"

// Extract project from full path
const filePath = '/.claude/projects/-Users-john-project-a/session.jsonl';
console.log(extractProject(filePath));                       // "/Users/john/project/a"
```

## API Reference

### createMonitor(options?)

Creates a new log monitor instance.

**Parameters:**
- `options` (optional): Configuration object
  - `projectsPath` (string): Base path for project directories
  - `activeThresholdMs` (number): Threshold for active sessions in milliseconds

**Returns:** `LogMonitor` instance

### LogMonitor Methods

#### `readAll(): AsyncGenerator<LogEntry>`

Read all existing log entries from all JSONL files.

**Yields:** `LogEntry` objects for each line in discovered files

#### `watch(): Promise<void>`

Start watching for new log entries. Emits 'entry' events for each new line.

#### `on(event: 'entry', handler: (entry: LogEntry) => void): void`

Register an event handler for new log entries.

#### `getActiveSessions(): ActiveSession[]`

Get sessions with recent activity. **Note:** Currently returns empty array (placeholder implementation).

#### `stop(): void`

Stop watching files and clean up resources.

## Types

### LogEntry

```typescript
interface LogEntry {
  line: string;         // Raw JSONL line content
  project: string;      // Decoded project path  
  sessionId: string;    // Session ID from filename
  filePath: string;     // Absolute path to JSONL file
  lineNumber: number;   // Line number in file (1-indexed)
}
```

### MonitorOptions

```typescript
interface MonitorOptions {
  projectsPath?: string;        // Default: ~/.claude/projects/
  activeThresholdMs?: number;   // Default: 60000 (1 minute)
}
```

### ActiveSession

```typescript
interface ActiveSession {
  sessionId: string;
  project: string;
  lastModified: Date;
}
```

## Implementation Notes

### Current Limitations

1. **Active Sessions**: The `getActiveSessions()` method is a placeholder and currently returns an empty array. Full implementation would require tracking file modification times.

2. **File Position Persistence**: File positions are stored in memory only. Restarting the monitor will re-process all content when starting watch mode.

3. **Large Files**: While the implementation uses streaming, very large individual files (100MB+) may still impact performance.

### Error Handling

- Missing project directories return empty results rather than throwing
- Invalid JSONL lines are skipped silently in the core implementation
- File system errors are caught and logged appropriately
- Network filesystems may have delayed change detection

### Performance Characteristics

- **Memory Usage**: O(1) for file reading, O(n) for active watchers
- **CPU Usage**: Minimal when idle, scales with file change frequency  
- **File Handle Usage**: One watcher per directory plus projects root
- **Startup Time**: O(n) where n is the number of existing files

### Cross-Platform Compatibility

- Built on Node.js `fs.watch()` which works across Windows, macOS, and Linux
- Path handling uses Node.js `path` module for cross-platform compatibility
- File encoding assumes UTF-8 (standard for JSONL)

## License

MIT
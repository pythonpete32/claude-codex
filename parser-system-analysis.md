# Parser System Mismatch Analysis

## Overview
The API server is expecting packages and interfaces that don't exist in the current monorepo structure. This analysis identifies the mismatches and provides solutions.

## Current State

### 1. Package Name Mismatches

**API Server Expects:**
- `@dao/codex-log-monitor` - For monitoring log files
- `@dao/transformer` - For transforming log entries

**Actually Available:**
- `@claude-codex/log-processor` - Contains both monitor and transformer functionality
- `@claude-codex/core` - Contains parsers
- `@claude-codex/types` - Contains type definitions
- `@claude-codex/utils` - Contains logging utilities

### 2. Interface Mismatches

**API Server Expects:**
- `createMonitor()` function
- `LogEntry` type from `@dao/codex-log-monitor`
- `TransformedItem` type from `@dao/transformer`

**Actually Available:**
- `FileMonitor` class (no factory function)
- `LogEntry` type from `@claude-codex/types`
- No `TransformedItem` type - parsers output UI props directly

### 3. Functionality Analysis

The FileMonitor class in `@claude-codex/log-processor` provides all the methods the API server needs:
- `getActiveSessions()` - Returns active sessions
- `readAll()` - Async generator for reading all log entries
- `stopWatching()` (called `stop()` in API) - Cleanup method

## Key Differences

### 1. Parser Architecture
- **Current System**: Parsers transform raw logs directly to UI-ready props
- **API Server Expectation**: Seems to expect a transformer that produces `TransformedItem` objects

### 2. Package Organization
- **Current**: Domain-driven with separate packages for core, types, log-processor
- **API Server**: Expects separate monitor and transformer packages

### 3. Type System
- **Current**: All types centralized in `@claude-codex/types`
- **API Server**: Expects types distributed across multiple packages

## Solution Approach

### Option 1: Update API Server Imports (Recommended)
Update the API server to use the existing packages:

```typescript
// Replace these commented imports:
// import type { ActiveSession, LogEntry } from "@dao/codex-log-monitor";
// import { createMonitor } from "@dao/codex-log-monitor";

// With:
import type { ActiveSession, LogEntry } from "@claude-codex/types";
import { FileMonitor } from "@claude-codex/log-processor";

// Create a simple factory function if needed:
function createMonitor(options: MonitorOptions) {
  return new FileMonitor(options);
}
```

### Option 2: Create Adapter Layer
Create adapter packages that match the expected interfaces:
- Create `@dao/codex-log-monitor` that re-exports from existing packages
- Create `@dao/transformer` that wraps the parser system

### Option 3: Refactor Existing Packages
Restructure the existing packages to match what the API server expects (not recommended as it would break the current architecture).

## Implementation Steps

### Immediate Fix (Option 1):

1. Update imports in `apps/api-server/src/services/session-scanner.ts`
2. Update imports in `apps/api-server/src/types/api.ts`
3. Create a `createMonitor` factory function
4. Update method calls (`stop()` vs `stopWatching()`)
5. Handle the absence of `TransformedItem` type

### Code Changes Needed:

1. **session-scanner.ts**:
   - Import from correct packages
   - Adapt to FileMonitor class API
   - Handle method name differences

2. **api.ts**:
   - Import types from `@claude-codex/types`
   - Remove or adapt `TransformedItem` references

3. **history-reader.ts**:
   - Update LogEntry import
   - Ensure compatibility with current type structure

## Conclusion

The mismatch is primarily due to:
1. Different package naming conventions (`@dao/*` vs `@claude-codex/*`)
2. Different API patterns (factory function vs class constructor)
3. Different transformation approach (transformer with TransformedItem vs direct parser output)

The recommended solution is to update the API server to use the existing packages, as they provide all the required functionality with a cleaner, more domain-driven architecture.
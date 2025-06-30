# Project Path Resolution - Deviation from Spec

## Date: 2025-06-30

## Context
The FINAL-architecture-and-implementation-guide.md specifies a complex project path resolution strategy that involves:
1. Reading .git/config files
2. Parsing JSONL log files for hints
3. Looking for project marker files
4. Fallback to simple decode

## Problem Identified
This approach has significant computational complexity issues:
- **O(n) file I/O operations per project** where n = number of files to check
- **Scales poorly**: 100 projects = potentially 300+ file reads just for path resolution
- **Fragile**: Depends on git configs, log contents, and marker files that may not exist
- **Complex**: ~200 lines of code for something that should be simple

## Real Issue
Claude's path encoding is **lossy** - it destroys information and creates ambiguity:
- `-Users-abuusama-Desktop-temp-mono-2` could mean:
  - `/Users/abuusama/Desktop/temp/mono-2` (intended)
  - `/Users/abuusama/Desktop/temp-mono-2` (wrong)
  
- `-Users-abuusama-Desktop-temp-mono-packages-claude-codex-src-shared` has even more possible interpretations

## Deviation Decision
Instead of the complex resolution strategy, we're implementing a simpler approach:

### New Approach
1. **Simple decode by default** - O(1) string operation, no file I/O
2. **User corrections via UI** - Let users fix incorrect paths when they notice them
3. **Persistent correction cache** - Store corrections in `~/.claude/path-corrections.json`

### Implementation
```typescript
class ProjectPathResolver {
  private corrections: Map<string, string> = new Map();
  
  resolve(encoded: string): string {
    // Check user corrections first - O(1)
    if (this.corrections.has(encoded)) {
      return this.corrections.get(encoded)!;
    }
    
    // Simple decode - no file I/O
    return '/' + encoded
      .slice(1)
      .replace(/--/g, '\x00')
      .replace(/-/g, '/')
      .replace(/\x00/g, '-');
  }
  
  setCorrection(encoded: string, correct: string) {
    this.corrections.set(encoded, correct);
    this.saveCorrections();
  }
}
```

### Benefits
- **Performance**: O(1) vs O(n) file operations
- **Scalability**: Works the same with 1 or 1000 projects
- **Simplicity**: ~20 lines vs ~200 lines
- **User control**: Users can fix paths when needed
- **Predictable**: No hidden file scanning behavior

### Trade-offs
- **Initial accuracy**: Some paths will be wrong initially
- **User intervention**: Requires users to correct paths
- **But**: Most paths will decode correctly, and corrections are one-time only

## Implementation Location
This simplified approach will be implemented in:
- `packages/core/src/project/project-path-resolver.ts` (not project-path.ts as spec suggests)

## UI Consideration
We'll need to add a path correction feature in the UI:
- Show decoded path with an "edit" icon
- Let users correct it if wrong
- Save correction for future sessions
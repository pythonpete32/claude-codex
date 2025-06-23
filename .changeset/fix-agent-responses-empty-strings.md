---
"claude-codex": patch
---

Fix agent responses being saved as empty strings instead of actual content

Resolves GitHub Issue #12 by implementing proper permission bypass mode in Claude SDK integration. Agent responses are now correctly extracted and saved to task state files.

- Added `permissionMode: 'bypassPermissions'` to Claude SDK query options
- Simplified message extraction logic with proper TypeScript type guards  
- Removed complex extraction code and replaced with simple fallback chain
- All 184 tests passing with improved reliability
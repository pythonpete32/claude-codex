---
"claude-codex": minor
---

Complete Phase 5: Multi-team system with comprehensive testing and cleanup

- **BREAKING**: Removed legacy TDD workflow (use team system with 'tdd' type instead)
- **NEW**: Complete file reorganization by domain (teams/, config/, operations/, shared/, messaging/)
- **NEW**: TypeScript path mapping with ~ shortcuts for cleaner imports
- **NEW**: Dynamic version loading with proper error handling (no fallbacks)
- **FIX**: Critical state management and cleanup error handling bugs
- **FIX**: All test imports updated after file reorganization
- **IMPROVE**: 183/183 tests passing with comprehensive coverage
- **IMPROVE**: Clean Commander.js CLI with --no-cleanup flag
- **IMPROVE**: Vitest configuration with path mapping support

This completes the multi-team architecture refactor with full testing coverage and modern file organization.
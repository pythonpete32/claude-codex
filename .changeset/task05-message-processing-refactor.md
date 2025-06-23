---
"claude-codex": minor
---

Refactor Claude SDK message processing with single entry point and enhanced functionality

- **BREAKING CHANGE**: Replace `runAgent()` with `runClaudeAgent()` for all Claude SDK interactions
- **NEW**: Single SDK wrapper with natural completion (no default maxTurns)
- **NEW**: Real-time progressive message display during agent execution
- **NEW**: Comprehensive debug logging with structured metadata
- **NEW**: Full Claude Code SDK option support with proper TypeScript types
- **IMPROVED**: Injectable dependencies for reliable testing with debug data
- **IMPROVED**: Bundle size reduced by 6.4% (37.13KB → 34.76KB)
- **REMOVED**: Legacy `runAgent()` and `extractMessageText()` functions
- **FIXED**: Empty finalResponse issues for naturally completed tasks

This refactor provides a clean, production-ready foundation for Claude SDK interactions with no legacy overhead and improved performance. All 232 tests pass with comprehensive coverage including real debug data integration.
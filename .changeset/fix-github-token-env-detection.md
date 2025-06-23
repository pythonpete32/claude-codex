---
"claude-codex": patch
---

Fix GITHUB_TOKEN environment variable detection not working

Resolves GitHub issue #15 where GITHUB_TOKEN environment variable detection was failing for users who stored their tokens in .env files. The system now properly loads environment variables from .env and .env.local files before validation, following standard precedence rules (process.env > .env.local > .env).

- Added comprehensive .env file loading functionality
- Enhanced environment validation to handle edge cases
- Maintains backward compatibility with existing workflows
- Includes extensive test coverage for various token formats and edge cases
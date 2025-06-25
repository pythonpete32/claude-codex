---
'claude-codex': patch
---

Fix dynamic template path resolution for initialization

- Implement dynamic template directory discovery to fix initialization path resolution issues
- Replace hardcoded template paths with intelligent path discovery function  
- Ensure claude-codex init works across all installation methods and environments
- Support development (src/templates) and production (dist/templates) paths
- Add clear error messaging showing all checked paths when templates not found

Closes #48


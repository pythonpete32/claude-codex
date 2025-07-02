# {PROJECT_NAME} Implementation Tracking

## Setup & Configuration

### User Configuration
- **TIMEZONE**: {USER_TIMEZONE} (e.g., 'Africa/Accra', 'America/New_York', 'Europe/London')
- **LOCATION**: {USER_LOCATION} (optional - for context)

### Required MCP Servers
- **mcp__time**: For accurate timestamp tracking (MANDATORY for all "Last Updated" fields)
- **{OTHER_MCP}**: {Description of what it's used for}

> **IMPORTANT**: Always use `mcp__time__get_current_time` with the configured timezone when updating any "Last Updated" field. Never manually enter timestamps.

---

**STATUS**: {Active Implementation | Planning | Complete}  
**CREATED**: {YYYY-MM-DD}  
**LAST UPDATED**: {YYYY-MM-DD HH:MM} {TIMEZONE}  
**REFERENCE**: [01_{project-name}-design.md](./01_{project-name}-design.md)

---

## Current Implementation Status

### Phase Summary
- **Phase 1**: {Phase1Name} ({X}% complete)
- **Phase 2**: {Phase2Name} ({X}% complete)  
- **Phase 3**: {Phase3Name} ({X}% complete)
- **Phase 4**: {Phase4Name} ({X}% complete)

**Overall Progress: {X}/{TOTAL} {target entities} with {implementation goal}**

---

## Active Todo Synchronization

> **Note**: This section automatically syncs with Claude's internal TodoWrite tool for real-time tracking

### High Priority (Active)
- [ ] **PHASE 1**: {Task description for infrastructure/foundation work}
- [ ] **PHASE 1**: {Task description for core system 1}  
- [ ] **PHASE 1**: {Task description for core system 2}
- [ ] **PHASE 2**: {Task description for migration/conversion work}
- [ ] **PHASE 2**: {Task description for entity 1 migration}
- [ ] **PHASE 2**: {Task description for entity 2 migration}
- [ ] **PHASE 2**: {Task description for entity 3 migration}
- [ ] **PHASE 2**: {Task description for entity 4 migration}
- [ ] **PHASE 3**: {Task description for new implementation 1}
- [ ] **PHASE 3**: {Task description for new implementation 2}
- [ ] **PHASE 3**: {Task description for new implementation 3}
- [ ] **PHASE 3**: {Task description for new implementation 4}
- [ ] **VALIDATE**: {Overall validation goal}

### Medium Priority (Queued)
- [ ] **PHASE 2**: {Medium priority migration task}
- [ ] **PHASE 4**: {Integration task 1}
- [ ] **PHASE 4**: {Integration task 2}

### Low Priority (Future)
- [ ] **PHASE 4**: {Documentation and guidelines task}

---

## Implementation Scratch Pad

### Current Working Session
**Date**: {YYYY-MM-DD HH:MM} {TIMEZONE} (via mcp__time)  
**Focus**: {Current focus area}  
**Next**: {Next planned action}

#### Today's Decisions
- ✅ **[{HH:MM}]** {Decision made today}
- ✅ **[{HH:MM}]** {Decision made today}
- ✅ **[{HH:MM}]** {Decision made today}
- ✅ **[{HH:MM}]** **COMMITTED**: {Phase description} committed as `{commit-hash}` - {file summary}

#### Key Insights
- **[{HH:MM}]** {Important insight discovered}
- **[{HH:MM}]** {Important insight discovered}
- **[{HH:MM}]** {Important insight discovered}
- **[{HH:MM}]** {Important insight discovered}

#### Decisions Made
- **[{HH:MM}]** **{Category}**: {Decision and rationale}
- **[{HH:MM}]** **{Category}**: {Decision and rationale}
- **[{HH:MM}]** **{Category}**: {Decision and rationale}
- **[{HH:MM}]** **{Category}**: {Decision and rationale}

---

## 🚨 CRITICAL: Quality Gates & Review Process

### Quality Requirements (Every Phase)
**MANDATORY**: Each phase MUST pass ALL quality checks before proceeding:

1. **Linting**: `bun lint` - Zero linting errors allowed
2. **Formatting**: `bun format` - All files properly formatted  
3. **Type Checking**: `bun type-check` - Zero TypeScript errors allowed
4. **Test Validation**: All existing tests must continue to pass

### Phase Review Process
**MANDATORY**: After each phase:

1. **Stage Changes**: `git add <phase-files>` (DO NOT COMMIT)
2. **Run Quality Checks**: Execute all 4 quality commands above **ON PHASE FILES ONLY**
3. **Fix Any Issues**: Address ALL errors in YOUR code before review request
4. **🚨 EXPLICIT REVIEW REQUEST**: Must explicitly ask: "Phase X complete - please review staged changes"
5. **Wait for Approval**: STOP ALL WORK until explicit approval received
6. **Document Issues**: Update scratch pad with any fixes made
7. **Commit After Approval**: Only commit when user explicitly requests it
8. **Log Commit**: Record commit hash in "Today's Decisions" and "Completed Items" sections

### Critical Rules
- **Only validate YOUR code**: Ignore pre-existing errors in other packages
- **Must ask for review**: Cannot proceed without explicit review request
- **Must wait for approval**: No assumptions about approval

### Quality Gate Commands
```bash
# Run all quality checks in sequence
bun lint && bun format && bun type-check && bun test

# Individual checks
bun lint        # Biome linting
bun format      # Code formatting
bun type-check  # TypeScript validation
bun test        # Test suite validation

# Target specific packages if needed
cd packages/{package-name} && bun lint
cd packages/{package-name} && bun type-check
```

### Failure Handling
- **Any quality check failure**: STOP and fix immediately
- **Cannot proceed**: Until ALL checks pass
- **Document fixes**: Update scratch pad with resolution details
- **Re-request review**: If major fixes were needed

---

## Implementation Notes

### Phase 1: {Phase1Name} (Next Up)
#### {CoreComponent1} Implementation Strategy
```typescript
// Key decisions for implementation:
// 1. {Design decision and rationale}
// 2. {Design decision and rationale}
// 3. {Design decision and rationale}
// 4. {Design decision and rationale}
// 5. {Design decision and rationale}
```

#### {CoreComponent2} Implementation Strategy  
```typescript
// Key decisions for implementation:
// 1. {Design decision and rationale}
// 2. {Design decision and rationale}
// 3. {Design decision and rationale}
// 4. {Design decision and rationale}
// 5. {Design decision and rationale}
```

#### Critical Implementation Details
- **{Technical Area 1}**: {Detailed implementation consideration}
- **{Technical Area 2}**: {Detailed implementation consideration}
- **{Technical Area 3}**: {Detailed implementation consideration}
- **{Technical Area 4}**: {Detailed implementation consideration}

---

## Testing Strategy

### Validation Approach
1. **{Test Category 1}**: {Testing approach description}
2. **{Test Category 2}**: {Testing approach description}
3. **{Test Category 3}**: {Testing approach description}
4. **{Test Category 4}**: {Testing approach description}

### Success Metrics
- **{Metric Category 1}**: {Specific measurable criterion}
- **{Metric Category 2}**: {Specific measurable criterion}
- **{Metric Category 3}**: {Specific measurable criterion}
- **{Metric Category 4}**: {Specific measurable criterion}

---

## Risk Management

### Identified Risks
1. **{Risk Category 1}**: {Detailed risk description}
2. **{Risk Category 2}**: {Detailed risk description}
3. **{Risk Category 3}**: {Detailed risk description}
4. **{Risk Category 4}**: {Detailed risk description}

### Mitigation Strategies
1. **{Mitigation Strategy 1}**: {Detailed mitigation approach}
2. **{Mitigation Strategy 2}**: {Detailed mitigation approach}
3. **{Mitigation Strategy 3}**: {Detailed mitigation approach}
4. **{Mitigation Strategy 4}**: {Detailed mitigation approach}

---

## Archive Section

### Completed Items
*{Track completed work items here as implementation progresses}*

#### Template Format for Completed Items:
- **Phase X: {Phase Name}** (Commit: `{commit-hash}`) **[{YYYY-MM-DD HH:MM}]**
  - {List of completed work items}
  - {Key components delivered}
  - {Notable achievements}

### Historical Decisions
- **{YYYY-MM-DD HH:MM}**: {Historical decision and context}
- **{YYYY-MM-DD HH:MM}**: {Historical decision and context}
- **{YYYY-MM-DD HH:MM}**: {Historical decision and context}

---

## Quick Reference

### Key Files
- **Design Doc**: [01_{project-name}-design.md](./01_{project-name}-design.md)
- **{Category} Dir**: `{file/path/}`
- **{Key File 1}**: `{file/path/filename}`
- **{Key File 2}**: `{file/path/filename}`

### Command Shortcuts
```bash
# {Command description}
{command}

# {Command description}
{command}

# {Command description}
{command}
```

---

## Session Notes

### {YYYY-MM-DD} - {Session Focus}
**Start Time**: {HH:MM} {TIMEZONE}  
**End Time**: {HH:MM} {TIMEZONE}  
**Duration**: {duration}  
**Participants**: {who was involved}  
**Outcome**: {what was accomplished}

#### Work Completed
- **[{HH:MM}]** {Specific work item completed}
- **[{HH:MM}]** {Specific work item completed}
- **[{HH:MM}]** {Specific work item completed}

#### Decisions Made
- **[{HH:MM}]** **{Decision Category}**: {Decision details and rationale}
- **[{HH:MM}]** **{Decision Category}**: {Decision details and rationale}

#### Blockers Encountered
- **[{HH:MM}]** **{Blocker Category}**: {Description of blocker and resolution approach}
- **[{HH:MM}]** **{Blocker Category}**: {Description of blocker and resolution approach}

#### Next Session Plan
- {Planned work for next session}
- {Planned work for next session}
- {Planned work for next session}

---

### {YYYY-MM-DD} - {Session Focus}
**Start Time**: {HH:MM} {TIMEZONE}  
**End Time**: {HH:MM} {TIMEZONE}  
**Duration**: {duration}  
**Participants**: {who was involved}  
**Outcome**: {what was accomplished}

#### Work Completed
- **[{HH:MM}]** {Specific work item completed}
- **[{HH:MM}]** {Specific work item completed}
- **[{HH:MM}]** {Specific work item completed}

#### Decisions Made
- **[{HH:MM}]** **{Decision Category}**: {Decision details and rationale}
- **[{HH:MM}]** **{Decision Category}**: {Decision details and rationale}

#### Blockers Encountered
- **[{HH:MM}]** **{Blocker Category}**: {Description of blocker and resolution approach}
- **[{HH:MM}]** **{Blocker Category}**: {Description of blocker and resolution approach}

#### Next Session Plan
- {Planned work for next session}
- {Planned work for next session}
- {Planned work for next session}

---

### {YYYY-MM-DD} - {Session Focus}
**Start Time**: {HH:MM} {TIMEZONE}  
**End Time**: {HH:MM} {TIMEZONE}  
**Duration**: {duration}  
**Participants**: {who was involved}  
**Outcome**: {what was accomplished}

#### Work Completed
- **[{HH:MM}]** {Specific work item completed}
- **[{HH:MM}]** {Specific work item completed}
- **[{HH:MM}]** {Specific work item completed}

#### Decisions Made
- **[{HH:MM}]** **{Decision Category}**: {Decision details and rationale}
- **[{HH:MM}]** **{Decision Category}**: {Decision details and rationale}

#### Blockers Encountered
- **[{HH:MM}]** **{Blocker Category}**: {Description of blocker and resolution approach}
- **[{HH:MM}]** **{Blocker Category}**: {Description of blocker and resolution approach}

#### Next Session Plan
- {Planned work for next session}
- {Planned work for next session}
- {Planned work for next session}

---

## Template Usage Instructions

### How to Use This Template
1. **Replace Placeholders**: Search and replace all `{PLACEHOLDER}` values with project-specific content
2. **Update Phase Information**: Modify phases to match your specific implementation plan
3. **Customize Todo Structure**: Adapt todo items to your project's specific tasks
4. **Maintain Session Notes**: Add new session entries as work progresses
5. **Sync with Claude's TodoWrite**: Keep the Active Todo Synchronization section updated

### Key Placeholders to Replace
- `{PROJECT_NAME}`: Name of your implementation project
- `{Phase1Name}`, `{Phase2Name}`, etc.: Names of your implementation phases
- `{CoreComponent1}`, `{CoreComponent2}`: Names of your core components
- `{TOTAL}`: Total number of entities/items to implement
- `{target entities}`: What you're implementing (e.g., "parsers", "components")
- `{implementation goal}`: What you're achieving (e.g., "fixture-first testing")

### Maintenance Guidelines
- **Daily**: Update "Current Working Session" and add session notes
- **Weekly**: Review and update phase completion percentages
- **Per Decision**: Add entries to "Decisions Made" and "Historical Decisions"
- **Per Risk**: Update "Risk Management" section with new risks and mitigations
- **Per Completion**: Move items from active todos to "Completed Items"

---

## Scratch Pad

> **Purpose**: This section captures the messy reality of implementation - problems encountered, solutions discovered, architectural deviations, and ongoing observations. This is the "working memory" of the project that helps maintain context across sessions.
> 
> **IMPORTANT**: Every entry in this section MUST include a timestamp **[YYYY-MM-DD HH:MM]** or **[HH:MM]** for same-day entries. Use `mcp__time__get_current_time` to get accurate timestamps.

### Current Observations & Thoughts
**Last Updated**: {YYYY-MM-DD HH:MM} {TIMEZONE} (via mcp__time)

{Free-form observations about the current state of the project, things noticed, patterns emerging, concerns, etc.}

### Problems Encountered & Solutions

#### 🚨 PROBLEM {N}: {Problem Title} **[{YYYY-MM-DD HH:MM}]**
- **Issue**: {Detailed description of what went wrong}
- **Error**: `{Exact error message if applicable}`
- **Root Cause**: {Why this happened - be specific}
- **Solution**: {How it was fixed - include code snippets if helpful}
- **Impact**: {What changed as a result}
- **Files Changed**: {List of files affected}
- **Lessons Learned**: {What to remember for next time}
- **Resolved**: **[{HH:MM}]**

### Architectural Deviations from Original Plan

#### ❗ DEVIATION {N}: {What Changed} **[{YYYY-MM-DD HH:MM}]**
- **Original Contract**: {What was originally planned/designed}
- **New Implementation**: {What was actually implemented}
- **Reason**: {Why the change was necessary}
- **Impact**: {How this affects the rest of the system}
- **Backward Compatibility**: {Is old approach still supported?}
- **Approval Status**: ❌ **NOT REQUESTED** / ✅ **APPROVED [{HH:MM}]** / 🔄 **PENDING**

### Discovered Patterns & Anti-Patterns

#### Pattern: {Pattern Name} **[{YYYY-MM-DD HH:MM}]**
- **Context**: {When this pattern applies}
- **Implementation**: {How to implement it}
- **Benefits**: {Why use this pattern}
- **Example**: {Code snippet or reference}

#### Anti-Pattern: {Anti-Pattern Name} **[{YYYY-MM-DD HH:MM}]**
- **What Not to Do**: {Description}
- **Why It's Bad**: {Problems it causes}
- **Better Alternative**: {What to do instead}
- **Found In**: {Where this was discovered}

### Tool/Framework Learnings

#### {Tool/Framework Name} **[{YYYY-MM-DD HH:MM}]**
- **Version**: {Version number}
- **Key Learning**: {What was discovered}
- **Gotcha**: {Unexpected behavior}
- **Documentation Gap**: {What the docs don't tell you}
- **Workaround**: {How to handle the issue}

### Performance Observations

#### {Performance Issue/Optimization} **[{YYYY-MM-DD HH:MM}]**
- **Measurement**: {Baseline → Optimized}
- **Bottleneck**: {What was slow}
- **Solution**: {What fixed it}
- **Trade-off**: {What was sacrificed if anything}

### Type System Challenges

#### {Type Challenge} **[{YYYY-MM-DD HH:MM}]**
- **Issue**: {Type system problem encountered}
- **Context**: {Where/why this came up}
- **Solution**: {How it was resolved}
- **TypeScript Feature Used**: {Advanced feature if applicable}

### Integration Gotchas

#### {System/Tool Integration} **[{YYYY-MM-DD HH:MM}]**
- **Components**: {What was being integrated}
- **Issue**: {What went wrong}
- **Root Cause**: {Why it failed}
- **Fix**: {How it was resolved}
- **Prevention**: {How to avoid in future}

### Questions for Future Investigation

1. **[{HH:MM}]** **{Question}**: {Context and why it matters}
2. **[{HH:MM}]** **{Question}**: {Context and why it matters}
3. **[{HH:MM}]** **{Question}**: {Context and why it matters}

### Ideas for Improvement

- **[{HH:MM}]** **{Improvement Area}**: {Brief description of potential enhancement}
- **[{HH:MM}]** **{Improvement Area}**: {Brief description of potential enhancement}
- **[{HH:MM}]** **{Improvement Area}**: {Brief description of potential enhancement}

### Context Preservation Notes

> **For Future Sessions**: Key things to remember when continuing this work

- {Critical context point 1}
- {Critical context point 2}
- {Critical context point 3}

### Raw Notes

```
{Unstructured notes, code snippets, terminal output, etc. that might be useful later}
```

---

## Scratch Pad Usage Guidelines

### When to Update
- **Immediately** when encountering a problem
- **During** problem-solving to track attempts
- **After** finding a solution to document it
- **Before** ending a session to preserve context

### What to Include
- Error messages (exact text)
- File paths and line numbers
- Code snippets (before/after)
- Terminal commands that worked/failed
- Thought process and reasoning
- External references (docs, Stack Overflow, etc.)

### How to Structure
1. Start with the problem/observation
2. Document investigation steps  
3. Record the solution
4. Note the impact
5. Extract learnings

### Why This Matters
- **Context Preservation**: Future sessions can pick up where you left off
- **Pattern Recognition**: Similar problems can be solved faster
- **Knowledge Building**: Team learns from your discoveries
- **Debugging Aid**: Historical record for troubleshooting
- **Architecture Evolution**: Track how the system really evolved vs. planned

---

*This document serves as the living implementation tracker, synchronized with Claude's internal todo system and updated throughout the implementation process.*
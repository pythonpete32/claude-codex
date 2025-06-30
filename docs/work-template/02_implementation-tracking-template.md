# {PROJECT_NAME} Implementation Tracking

**STATUS**: {Active Implementation | Planning | Complete}  
**CREATED**: {YYYY-MM-DD}  
**LAST UPDATED**: {YYYY-MM-DD}  
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
**Date**: {YYYY-MM-DD}  
**Focus**: {Current focus area}  
**Next**: {Next planned action}

#### Today's Decisions
- ✅ {Decision made today}
- ✅ {Decision made today}
- ✅ {Decision made today}
- ✅ **COMMITTED**: {Phase description} committed as `{commit-hash}` - {file summary}

#### Key Insights
- {Important insight discovered}
- {Important insight discovered}
- {Important insight discovered}
- {Important insight discovered}

#### Decisions Made
- **{Category}**: {Decision and rationale}
- **{Category}**: {Decision and rationale}
- **{Category}**: {Decision and rationale}
- **{Category}**: {Decision and rationale}

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
- **Phase X: {Phase Name}** (Commit: `{commit-hash}`)
  - {List of completed work items}
  - {Key components delivered}
  - {Notable achievements}

### Historical Decisions
- **{YYYY-MM-DD}**: {Historical decision and context}
- **{YYYY-MM-DD}**: {Historical decision and context}
- **{YYYY-MM-DD}**: {Historical decision and context}

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
**Time**: {duration}  
**Participants**: {who was involved}  
**Outcome**: {what was accomplished}

#### Work Completed
- {Specific work item completed}
- {Specific work item completed}
- {Specific work item completed}

#### Decisions Made
- **{Decision Category}**: {Decision details and rationale}
- **{Decision Category}**: {Decision details and rationale}

#### Blockers Encountered
- **{Blocker Category}**: {Description of blocker and resolution approach}
- **{Blocker Category}**: {Description of blocker and resolution approach}

#### Next Session Plan
- {Planned work for next session}
- {Planned work for next session}
- {Planned work for next session}

---

### {YYYY-MM-DD} - {Session Focus}
**Time**: {duration}  
**Participants**: {who was involved}  
**Outcome**: {what was accomplished}

#### Work Completed
- {Specific work item completed}
- {Specific work item completed}
- {Specific work item completed}

#### Decisions Made
- **{Decision Category}**: {Decision details and rationale}
- **{Decision Category}**: {Decision details and rationale}

#### Blockers Encountered
- **{Blocker Category}**: {Description of blocker and resolution approach}
- **{Blocker Category}**: {Description of blocker and resolution approach}

#### Next Session Plan
- {Planned work for next session}
- {Planned work for next session}
- {Planned work for next session}

---

### {YYYY-MM-DD} - {Session Focus}
**Time**: {duration}  
**Participants**: {who was involved}  
**Outcome**: {what was accomplished}

#### Work Completed
- {Specific work item completed}
- {Specific work item completed}
- {Specific work item completed}

#### Decisions Made
- **{Decision Category}**: {Decision details and rationale}
- **{Decision Category}**: {Decision details and rationale}

#### Blockers Encountered
- **{Blocker Category}**: {Description of blocker and resolution approach}
- **{Blocker Category}**: {Description of blocker and resolution approach}

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

*This document serves as the living implementation tracker, synchronized with Claude's internal todo system and updated throughout the implementation process.*
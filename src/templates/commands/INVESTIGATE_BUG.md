# 🔍 Bug Investigation Command

## **ULTRA THINK** Mode Activated
You are now in specialized bug investigation mode. Your mission is to thoroughly understand and scope a problem WITHOUT fixing it.

## Current Context
- Working Directory: !`pwd`
- Git Status: !`git status --porcelain`
- Recent Commits: !`git log --oneline -5`
- Project Structure: @.claude/CLAUDE.md

## Bug Report
**User Description**: $ARGUMENTS

## <mandatory_first_step>
Before any investigation, you MUST:

1. **ULTRA THINK** about the bug report quality and completeness
2. Use subagents to analyze different aspects:
   - **Symptom Analysis Agent**: What exactly is happening?
   - **Context Gathering Agent**: What environment/conditions trigger this?
   - **Scope Assessment Agent**: How widespread could this issue be?

If the bug report lacks critical information, ask focused questions until you have:
- Clear symptoms/error messages
- Reproduction steps
- Expected vs actual behavior
- Environment details (browser, OS, versions)
- Frequency (always, sometimes, specific conditions)
</mandatory_first_step>

## Investigation Protocol

### Phase 1: Information Gathering
**ULTRA THINK** about what information is missing and systematically collect:

<thinking>
Analyze the user's bug description for completeness:
- Is the problem clearly described?
- Are there error messages or logs?
- Can I reproduce the issue?
- What's the impact and urgency?
- Are there patterns or conditions?
</thinking>

Use subagents to gather comprehensive information:
- **Error Analysis Agent**: Search for error patterns, stack traces, logs
- **Code Path Agent**: Trace through likely code paths where bug occurs
- **Environmental Agent**: Check configuration, dependencies, setup issues
- **Historical Agent**: Look for similar past issues, recent changes

### Phase 2: Codebase Investigation
**ULTRA THINK** about the most effective search and analysis strategy:

<investigation_checklist>
1. Search for error messages/keywords in codebase
2. Identify related files, functions, components
3. Check recent changes that might have introduced the bug
4. Look for similar patterns or known issues
5. Analyze dependencies and external integrations
6. Review test coverage for affected areas
7. Check configuration files and environment setup
8. Examine logs and debugging information
</investigation_checklist>

Use subagents for specialized analysis:
- **Static Analysis Agent**: Code review of suspected areas
- **Dependency Agent**: Check for version conflicts, compatibility issues
- **Test Coverage Agent**: Identify gaps in testing around the bug area
- **Integration Agent**: Analyze external service interactions

### Phase 3: Root Cause Analysis
**ULTRA THINK** about potential root causes and their likelihood:

<analysis_framework>
1. **Immediate Cause**: What directly triggers the bug?
2. **Contributing Factors**: What conditions make it worse?
3. **Root Cause**: What's the fundamental issue?
4. **Impact Assessment**: Who/what is affected?
5. **Risk Analysis**: Could this cause other issues?
</analysis_framework>

### Phase 4: Documentation and Reporting

Create comprehensive investigation report covering:

<report_structure>
# Bug Investigation Report

## Executive Summary
- **Issue**: Brief description
- **Severity**: Critical/High/Medium/Low
- **Impact**: User/system impact
- **Root Cause**: Fundamental issue identified

## Investigation Details
- **Symptoms**: What users experience
- **Reproduction Steps**: How to recreate
- **Code Analysis**: Technical findings
- **Environmental Factors**: Context conditions

## Technical Analysis
- **Affected Components**: Code areas involved
- **Dependencies**: Related systems/libraries
- **Recent Changes**: Potential triggers
- **Test Coverage**: Gaps identified

## Risk Assessment
- **Current Impact**: Who's affected now
- **Potential Escalation**: Could it get worse
- **Related Vulnerabilities**: Other areas at risk

## Recommendations
- **Immediate Actions**: Quick mitigations
- **Long-term Solutions**: Proper fixes needed
- **Prevention**: How to avoid similar issues
- **Testing**: What tests should be added

## Investigation Artifacts
- **Search Results**: Key findings
- **Code Snippets**: Relevant code sections
- **Error Logs**: Debug information
- **References**: Related issues/documentation
</report_structure>

## Final Actions

1. **Save detailed report** to `.temp/bug-investigation-[timestamp].md`
2. **Ask user** if they want to create a GitHub issue
3. **If requested**, create structured GitHub issue with:
   - Clear title and description
   - Reproduction steps
   - Technical details
   - Labels for severity/component
   - Assignment recommendations

## Investigation Complete ✅

**Remember**: Your job is ONLY to investigate and understand. Do NOT attempt to fix the bug - that's for a separate workflow.

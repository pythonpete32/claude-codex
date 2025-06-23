# Review Code Command

Review implemented code against task requirements and best practices.

## Usage
```bash
claude review-code docs/tasks/task-01-foundation-layer.md
```

## Command Structure

```markdown
You are conducting a thorough code review for Claude Codex implementation. Follow Anthropic's best practices for systematic review.

## Task File to Review Against
@{task_file_path}

## REVIEW METHODOLOGY

### 1. **REQUIREMENTS VERIFICATION** (Critical)
- [ ] Compare implementation against SPEC.md requirements exactly
- [ ] Verify all function signatures match specification
- [ ] Check all error classes are implemented correctly
- [ ] Confirm integration points work as designed
- [ ] Validate Definition of Done criteria are met

### 2. **TESTING QUALITY REVIEW**
Reference @docs/TESTING.md patterns:
- [ ] Tests follow good vs bad patterns from testing guide
- [ ] Dependency injection used for external systems
- [ ] Error scenarios are tested comprehensively
- [ ] Test coverage meets ≥90% requirement
- [ ] Tests verify behavior, not just implementation
- [ ] Mock boundaries are correct (external systems only)

### 3. **CODE QUALITY ASSESSMENT**
- [ ] TypeScript types are proper (no `any` usage)
- [ ] Error handling uses custom error classes from SPEC.md
- [ ] Code follows existing codebase patterns
- [ ] Functions are focused and single-responsibility
- [ ] Dependencies are properly injected for testability

### 4. **INTEGRATION VERIFICATION**
- [ ] Components integrate with foundation layer correctly
- [ ] No circular dependencies
- [ ] Proper imports/exports
- [ ] Claude SDK integration includes `forceSubscriptionAuth()`

### 5. **SECURITY & SAFETY**
- [ ] No hardcoded secrets or API keys
- [ ] File operations are safe and scoped
- [ ] Git operations don't affect main repository
- [ ] Input validation prevents injection attacks

## REVIEW COMMANDS
Run these to verify implementation:
```bash
bun run test                    # All tests pass
bun run test:coverage          # Coverage ≥90%  
bun run check:fix              # Code quality
bun run build                  # Build succeeds
```

## REVIEW OUTPUT FORMAT

### ✅ **APPROVED** or ❌ **CHANGES REQUIRED**

### **Requirements Compliance**
- Requirement 1: ✅/❌ [specific findings]
- Requirement 2: ✅/❌ [specific findings]

### **Testing Quality** 
- Test coverage: X% (target: ≥90%)
- Testing patterns: ✅/❌ [specific issues]
- Error scenario coverage: ✅/❌ [gaps identified]

### **Code Quality Issues**
- Critical: [blocking issues that must be fixed]
- Minor: [suggestions for improvement]
- Suggestions: [nice-to-have improvements]

### **Integration Points**
- Foundation layer: ✅/❌ [integration status]
- Dependencies: ✅/❌ [dependency issues]

### **Action Items** (if changes required)
1. [Specific change needed with file:line reference]
2. [Next specific change with rationale]

## REVIEW PRINCIPLES
- Be specific about what needs to change and why
- Reference exact SPEC.md sections for requirements
- Prioritize functional correctness over style preferences  
- Focus on testability and maintainability
- Verify the implementation actually works as intended

## APPROVAL CRITERIA
Only approve if ALL of these are true:
- [ ] All SPEC.md requirements implemented correctly
- [ ] Tests pass with ≥90% coverage following good patterns
- [ ] Code quality standards met
- [ ] Integration points verified working
- [ ] Security/safety requirements met
- [ ] Definition of Done criteria satisfied
```
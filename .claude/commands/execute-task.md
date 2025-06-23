# Execute Task Command

Execute a specific task following TDD and Claude Code best practices.

## Usage
```bash
claude implement-task docs/tasks/task-01-foundation-layer.md
```

## Command Structure

```markdown
You are implementing a specific task for Claude Codex. Follow the Explore-Plan-Code-Commit workflow from Anthropic's best practices.

## Task File
@{task_file_path}

## CRITICAL: Follow TDD Workflow
1. **EXPLORE PHASE** (15-20 minutes)
   - Read all referenced SPEC.md sections thoroughly
   - Examine existing codebase structure and patterns
   - Understand dependencies and integration points
   - Read @docs/TESTING.md for testing patterns

2. **PLAN PHASE** (10-15 minutes)  
   - Create detailed implementation plan with specific steps
   - Identify test scenarios from task requirements
   - Plan dependency injection points for testability
   - List exact functions/interfaces to implement
   - **SHOW ME THIS PLAN FOR APPROVAL**

3. **TEST-FIRST IMPLEMENTATION** (TDD Cycle)
   - Write failing tests FIRST (following @docs/TESTING.md patterns)
   - Implement minimal code to pass tests
   - Refactor for quality
   - Repeat for each function/feature

4. **VERIFICATION PHASE**
   - Run all tests with `bun run test`
   - Check code quality with `bun run check:fix`
   - Verify all Definition of Done criteria
   - Test integration points manually

## Authentication Requirement
CRITICAL: Any code using Claude Code SDK MUST call `forceSubscriptionAuth()` from `src/lib.ts` first.

## Testing Standards
- Follow patterns in @docs/TESTING.md
- Use dependency injection for external systems
- Test error scenarios, not just happy paths
- Mock external dependencies (file system, network, shell commands)
- Achieve ≥90% test coverage

## Code Quality
- Follow existing codebase patterns
- Use TypeScript strictly (no `any` types)
- Handle errors with custom error classes from SPEC.md
- Write clear, maintainable code

## Definition of Done
Complete ALL requirements from the task file:
- [ ] All functions implemented per SPEC.md
- [ ] Unit tests with ≥90% coverage
- [ ] Integration tests for key workflows  
- [ ] Code passes linting and formatting
- [ ] All error scenarios handled
- [ ] Documentation updated

## Commands to Run
```bash
# Development
bun run test:watch     # TDD development
bun run check:fix      # Fix formatting/linting

# Verification  
bun run test           # All tests pass
bun run test:coverage  # Check coverage
bun run build          # Verify build works
```

## Notes
- Work incrementally - implement one function at a time
- Show progress frequently  
- Ask for clarification if requirements are unclear
- Use `/clear` if context gets too large
- Focus on behavior testing, not implementation details
```
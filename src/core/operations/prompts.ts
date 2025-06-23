import { MessageExtractionError, PromptFormattingError } from '../../shared/errors.js';
import type { CoderPromptOptions, ReviewerPromptOptions, SDKMessage } from '../../shared/types.js';

export async function formatCoderPrompt(options: CoderPromptOptions): Promise<string> {
  try {
    const { specContent, reviewerFeedback } = options;

    if (!specContent || specContent.trim() === '') {
      throw new PromptFormattingError('Specification content cannot be empty');
    }

    if (reviewerFeedback) {
      // Revision run - include feedback
      return `You are a CODING AGENT implementing a task for Claude Codex. You work iteratively with a REVIEW AGENT through temp file reports.

## CRITICAL WORKFLOW: Coding Agent Process

This is an ITERATION based on reviewer feedback. Address ALL feedback points before proceeding.

### REVIEWER FEEDBACK FROM PREVIOUS ITERATION:
${reviewerFeedback}

### ORIGINAL SPECIFICATION:
${specContent}

### YOUR TASK:
1. **Address ALL reviewer feedback points** - Do not ignore any feedback
2. **Follow TDD workflow** - Write failing tests first, then implement minimal passing code
3. **Ensure quality gates pass** - All tests, linting, and build must succeed
4. **Create completion report** when done at \`/tmp/coding-report.md\`

### CRITICAL QUALITY GATES
**❌ DO NOT CLAIM WORK IS FINISHED UNLESS ALL OF THESE PASS:**

\`\`\`bash
bun run test           # ✅ All tests pass
bun run check          # ✅ NO linting errors
bun run build          # ✅ Build succeeds
\`\`\`

### COMPLETION CRITERIA:
- All reviewer feedback addressed
- All quality gates pass
- Completion report created at \`/tmp/coding-report.md\`

Remember: You are part of a coding-review cycle. Address the feedback thoroughly and ensure all quality standards are met.`;
    }
    // Initial run - fresh implementation
    return `You are a CODING AGENT implementing a task for Claude Codex. You work iteratively with a REVIEW AGENT through temp file reports.

## SPECIFICATION:
${specContent}

## CRITICAL WORKFLOW: Coding Agent Process

### 1. **EXPLORE PHASE**
- Read all referenced SPEC.md sections thoroughly
- Examine existing codebase structure and patterns
- Understand dependencies and integration points
- Read @docs/TESTING.md for testing patterns

### 2. **PLAN PHASE**
- Create detailed implementation plan with specific steps
- Identify test scenarios from task requirements
- Plan dependency injection points for testability
- List exact functions/interfaces to implement

### 3. **TEST-FIRST IMPLEMENTATION** (TDD Cycle)
- Write failing tests FIRST (following @docs/TESTING.md patterns)
- Implement minimal code to pass tests
- Refactor for quality
- Repeat for each function/feature

### 4. **MANDATORY QUALITY GATES** 
**❌ DO NOT CLAIM WORK IS FINISHED UNLESS ALL OF THESE PASS:**

\`\`\`bash
bun run test           # ✅ All tests pass
bun run check          # ✅ NO linting errors (including no \`any\` types)
bun run build          # ✅ Build succeeds
\`\`\`

### 5. **COMPLETION REPORT**
When ALL quality gates pass, create completion report at \`/tmp/coding-report.md\`:

\`\`\`markdown
# Coding Agent Completion Report
**Task**: [task name]
**Date**: [current date/time]

## ✅ Quality Gates Status
- Tests: PASSED (bun run test)
- Linting: PASSED (bun run check - no warnings)
- Build: PASSED (bun run build)
- Coverage: X% (target: ≥90%)

## Implementation Summary
[Brief summary of what was implemented]

## Ready for Review
This implementation is ready for review by the Review Agent.
\`\`\`

## Authentication Requirement
**CRITICAL**: Any code using Claude Code SDK MUST call \`forceSubscriptionAuth()\` from \`src/lib.ts\` first.

Remember: You are part of a coding-review cycle. The Review Agent will check your work and either create a PR (if satisfied) or provide feedback for the next iteration.`;
  } catch (error) {
    throw new PromptFormattingError(`Failed to format coder prompt: ${error}`);
  }
}

export async function formatReviewerPrompt(options: ReviewerPromptOptions): Promise<string> {
  try {
    const { originalSpec, coderHandoff } = options;

    if (!originalSpec || originalSpec.trim() === '') {
      throw new PromptFormattingError('Original specification cannot be empty');
    }

    if (!coderHandoff || coderHandoff.trim() === '') {
      throw new PromptFormattingError('Coder handoff cannot be empty');
    }

    return `You are a REVIEW AGENT working with a CODING AGENT through iterative temp file reports.

## ORIGINAL SPECIFICATION:
${originalSpec}

## CODER AGENT COMPLETION REPORT:
${coderHandoff}

## YOUR REVIEW TASK:

### 1. **QUALITY VERIFICATION**
Verify the Coder Agent's claims about quality gates:
- Check if tests actually pass (\`bun run test\`)
- Check if linting passes (\`bun run check\`)
- Check if build succeeds (\`bun run build\`)
- Verify test coverage is ≥90%

### 2. **IMPLEMENTATION REVIEW**
- Does the implementation match the specification requirements?
- Are all specified functions/interfaces implemented?
- Is the code following existing patterns and conventions?
- Are error scenarios properly handled?
- Is dependency injection used for testability?

### 3. **TESTING REVIEW**
- Are tests following @docs/TESTING.md patterns?
- Do tests cover both happy path and error scenarios?
- Are external dependencies properly mocked?
- Are tests meaningful (not just coverage)?

### 4. **DECISION MAKING**

**OPTION A: APPROVE AND CREATE PR**
If ALL criteria are met:
- All quality gates pass
- Implementation is complete and correct
- Tests are comprehensive and meaningful
- Code follows patterns and handles errors

Then create a GitHub pull request with:
\`\`\`bash
gh pr create --title "Implement [feature name]" --body "[description]"
\`\`\`

**OPTION B: PROVIDE FEEDBACK**
If ANY criteria are not met, create feedback report at \`/tmp/review-report.md\`:

\`\`\`markdown
# Review Agent Feedback Report
**Date**: [current date/time]

## Issues Found:

### Critical Issues (Must Fix):
- [Specific issue with file:line references]
- [Another critical issue]

### Quality Gate Failures:
- [ ] Tests: [status and specific failures]
- [ ] Linting: [status and specific errors]  
- [ ] Build: [status and specific errors]
- [ ] Coverage: [percentage and missing areas]

### Implementation Issues:
- [Specific implementation problems with solutions]

## Required Actions:
1. [Specific action required]
2. [Another specific action]

## Next Steps:
The Coder Agent must address ALL issues above before the next review iteration.
\`\`\`

## CRITICAL REQUIREMENTS:
- Only create PR if EVERYTHING is perfect
- Provide specific, actionable feedback with file:line references
- Never approve partial implementations
- Verify quality gates by actually running the commands

Remember: You are the quality gatekeeper. Be thorough and demanding.`;
  } catch (error) {
    throw new PromptFormattingError(`Failed to format reviewer prompt: ${error}`);
  }
}

export async function extractFinalMessage(messages: SDKMessage[]): Promise<string> {
  try {
    // Find the last assistant message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === 'assistant') {
        // Handle both string and complex content structures
        if (typeof message.content === 'string') {
          return message.content;
        }
        if (Array.isArray(message.content)) {
          // Extract text from complex content array
          const textParts: string[] = [];
          for (const part of message.content) {
            if (part.type === 'text' && part.text) {
              textParts.push(part.text);
            }
          }
          if (textParts.length > 0) {
            return textParts.join('\n');
          }
        }
      }
    }

    throw new MessageExtractionError('No assistant message found in SDK response');
  } catch (error) {
    if (error instanceof MessageExtractionError) {
      throw error;
    }
    throw new MessageExtractionError(`Failed to extract final message: ${error}`);
  }
}

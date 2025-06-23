import { PromptFormattingError } from '../../shared/errors.js';
import type { CoderPromptOptions, ReviewerPromptOptions } from '../../shared/types.js';

// Coder Agent Handoff Template (based on PRD)
const CODER_HANDOFF_TEMPLATE = `
Always end your response with this structured handoff:

## Implementation Summary
- **What I Built**: [brief description of the feature]
- **Files Modified**: [list of files created/modified]
- **Testing Instructions**: [specific commands to validate the work]
- **Manual Validation**: [any manual steps needed to verify functionality]
- **Notes for Reviewer**: [important context, design decisions, caveats]`;

/**
 * Formats the prompt for the Coder Agent with spec and optional feedback
 */
export async function formatCoderPrompt(options: CoderPromptOptions): Promise<string> {
  try {
    const isRevision = !!options.reviewerFeedback;

    if (isRevision) {
      return `Address this review feedback: ${options.reviewerFeedback}
Update tests and implementation as needed.

${CODER_HANDOFF_TEMPLATE}`;
    }
    return `Implement the specification in the provided file using Test-Driven Development:
1. Read and understand the requirements
2. Write comprehensive tests first  
3. Implement the minimal code to pass tests
4. Refactor for quality and clarity

SPECIFICATION:
${options.specContent}

${CODER_HANDOFF_TEMPLATE}`;
  } catch (error) {
    throw new PromptFormattingError(
      `Failed to format coder prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Formats the prompt for the Reviewer Agent with full context
 */
export async function formatReviewerPrompt(options: ReviewerPromptOptions): Promise<string> {
  try {
    return `You are a Senior Engineer conducting a thorough code review.

ORIGINAL SPECIFICATION:
${options.originalSpec}

IMPLEMENTATION HANDOFF:
${options.coderHandoff}

REVIEW PROCESS:
1. **Deep Analysis**: First, analyze this codebase structure, testing framework, and available tooling
2. **Follow Instructions**: Execute the testing instructions provided by the coder exactly
3. **Intelligent Validation**: Use your codebase analysis to run additional appropriate quality checks
4. **Specification Compliance**: Verify the implementation meets the original requirements
5. **Production Readiness**: Assess code quality, error handling, and maintainability

OUTCOMES:
- If production-ready: Create a pull request with comprehensive title and description
- If changes needed: Provide specific, actionable feedback referencing the original specification

Leverage your intelligence to adapt to any project structure (React, Node, Python, etc.) based on your analysis.`;
  } catch (error) {
    throw new PromptFormattingError(
      `Failed to format reviewer prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// extractFinalMessage function removed - now using SDK's finalResponse directly

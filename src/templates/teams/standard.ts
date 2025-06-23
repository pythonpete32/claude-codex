const CODER = (SPEC_OR_ISSUE: string) => `
You are implementing this specification/issue: ${SPEC_OR_ISSUE}

IF THERE IS A REVIEW AT '.temp/review-feedback.md', THEN ADDRESS THAT FEEDBACK FIRST.

Focus on clean, maintainable code with proper error handling.

Save your implementation summary to .temp/coder-feedback.md
`;

const REVIEWER = (SPEC_OR_ISSUE: string) => `
You are reviewing a coder's implementation of: ${SPEC_OR_ISSUE}

Read the coder's work from .temp/coder-feedback.md

REVIEW PROCESS:
1. Analyze code quality and maintainability
2. Verify implementation meets requirements
3. Check for proper error handling

OUTCOMES:
- If production-ready: Create a pull request with comprehensive description
- If changes needed: Save specific feedback to '.temp/review-feedback.md'
`;

const TEAM = { CODER, REVIEWER };
export default TEAM;
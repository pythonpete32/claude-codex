const CODER = (SPEC_OR_ISSUE: string) => `
You are implementing this specification/issue: ${SPEC_OR_ISSUE}

IF THERE IS A REVIEW AT '.temp/review-feedback.md', THEN ADDRESS THAT FEEDBACK FIRST.

Use Test-Driven Development:
1. Write comprehensive tests FIRST
2. Implement minimal code to pass tests
3. Refactor for quality

Save your implementation summary to .temp/coder-feedback.md
`;

const REVIEWER = (SPEC_OR_ISSUE: string) => `
You are reviewing a coder's implementation of: ${SPEC_OR_ISSUE}

Read the coder's work from .temp/coder-feedback.md

REVIEW PROCESS:
1. Analyze codebase structure and testing framework
2. Execute testing instructions provided by coder
3. Verify implementation meets original requirements
4. Assess code quality and maintainability

OUTCOMES:
- If production-ready: Create a pull request with comprehensive description
- If changes needed: Save specific feedback to '.temp/review-feedback.md'
`;

const TEAM = { CODER, REVIEWER };
export default TEAM;
const CODER = (SPEC_OR_ISSUE: string) => `
You are implementing this specification/issue: ${SPEC_OR_ISSUE}

IF THERE IS A REVIEW AT '.temp/review-feedback.md', THEN ADDRESS THAT FEEDBACK FIRST.

Focus on modern frontend development:
1. Component-based architecture
2. Responsive design
3. Accessibility best practices
4. Performance optimization

Save your implementation summary to .temp/coder-feedback.md
`;

const REVIEWER = (SPEC_OR_ISSUE: string) => `
You are reviewing a coder's implementation of: ${SPEC_OR_ISSUE}

Read the coder's work from .temp/coder-feedback.md

REVIEW PROCESS:
1. Test UI components and interactions
2. Verify responsive design
3. Check accessibility compliance
4. Assess performance and bundle size

OUTCOMES:
- If production-ready: Create a pull request with comprehensive description
- If changes needed: Save specific feedback to '.temp/review-feedback.md'
`;

const TEAM = { CODER, REVIEWER };
export default TEAM;

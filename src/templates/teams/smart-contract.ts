const CODER = (SPEC_OR_ISSUE: string) => `
You are implementing this specification/issue: ${SPEC_OR_ISSUE}

IF THERE IS A REVIEW AT '.temp/review-feedback.md', THEN ADDRESS THAT FEEDBACK FIRST.

Focus on secure smart contract development:
1. Security-first approach
2. Gas optimization
3. Comprehensive testing
4. Clear documentation

Save your implementation summary to .temp/coder-feedback.md
`;

const REVIEWER = (SPEC_OR_ISSUE: string) => `
You are reviewing a coder's implementation of: ${SPEC_OR_ISSUE}

Read the coder's work from .temp/coder-feedback.md

REVIEW PROCESS:
1. Security audit for common vulnerabilities
2. Gas efficiency analysis
3. Test coverage verification
4. Documentation review

OUTCOMES:
- If production-ready: Create a pull request with comprehensive description
- If changes needed: Save specific feedback to '.temp/review-feedback.md'
`;

const TEAM = { CODER, REVIEWER };
export default TEAM;
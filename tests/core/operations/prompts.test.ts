import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import modules after mocking
const { formatCoderPrompt, formatReviewerPrompt } = await import(
  '../../../src/core/operations/prompts.js'
);

describe('Prompt Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatCoderPrompt', () => {
    it('should format initial coder prompt without feedback', async () => {
      const options = {
        specContent: 'This is a test specification file with requirements.',
      };

      const result = await formatCoderPrompt(options);

      expect(result).toContain('Implement the specification');
      expect(result).toContain('Test-Driven Development');
      expect(result).toContain('This is a test specification file with requirements.');
      expect(result).toContain('Read and understand the requirements');
      expect(result).toContain('Write comprehensive tests first');
      expect(result).toContain('Implement the minimal code to pass tests');
      expect(result).toContain('Refactor for quality and clarity');
      expect(result).not.toContain('Address this review feedback');
    });

    it('should format revision coder prompt with feedback', async () => {
      const options = {
        specContent: 'This is a test specification file.',
        reviewerFeedback: 'Please fix the error handling in the function.',
      };

      const result = await formatCoderPrompt(options);

      expect(result).toContain('Address this review feedback');
      expect(result).toContain('Please fix the error handling in the function.');
      expect(result).toContain('Update tests and implementation as needed');
      expect(result).not.toContain('Implement the specification');
    });

    it('should include handoff template in both formats', async () => {
      const options = {
        specContent: 'Test spec',
      };

      const result = await formatCoderPrompt(options);

      // Should contain handoff template instructions
      expect(result).toContain('Always end your response with this structured handoff');
      expect(result).toContain('Implementation Summary');
    });

    it('should handle empty spec content', async () => {
      const options = {
        specContent: '',
      };

      const result = await formatCoderPrompt(options);
      expect(result).toContain('SPECIFICATION:\n');
    });

    it('should handle multiline spec content', async () => {
      const options = {
        specContent: 'Line 1\nLine 2\nLine 3',
      };

      const result = await formatCoderPrompt(options);
      expect(result).toContain('Line 1\nLine 2\nLine 3');
    });
  });

  describe('formatReviewerPrompt', () => {
    it('should format reviewer prompt with original spec and coder handoff', async () => {
      const options = {
        originalSpec: 'Original specification content here.',
        coderHandoff: 'Implementation completed. Files created: src/module.ts. Tests pass.',
      };

      const result = await formatReviewerPrompt(options);

      expect(result).toContain('Senior Engineer conducting a thorough code review');
      expect(result).toContain('Original specification content here.');
      expect(result).toContain(
        'Implementation completed. Files created: src/module.ts. Tests pass.'
      );
      expect(result).toContain('ORIGINAL SPECIFICATION');
      expect(result).toContain('IMPLEMENTATION HANDOFF');
    });

    it('should include outcome instructions', async () => {
      const options = {
        originalSpec: 'Test spec',
        coderHandoff: 'Test handoff',
      };

      const result = await formatReviewerPrompt(options);

      // Should contain instructions about PR creation vs feedback
      expect(result).toContain('PR'); // Should mention creating PR or providing feedback
    });

    it('should handle empty content gracefully', async () => {
      const options = {
        originalSpec: '',
        coderHandoff: '',
      };

      const result = await formatReviewerPrompt(options);
      expect(result).toContain('ORIGINAL SPECIFICATION:\n');
      expect(result).toContain('IMPLEMENTATION HANDOFF:\n');
    });

    it('should handle multiline content', async () => {
      const options = {
        originalSpec: 'Spec line 1\nSpec line 2',
        coderHandoff: 'Handoff line 1\nHandoff line 2',
      };

      const result = await formatReviewerPrompt(options);
      expect(result).toContain('Spec line 1\nSpec line 2');
      expect(result).toContain('Handoff line 1\nHandoff line 2');
    });
  });
});

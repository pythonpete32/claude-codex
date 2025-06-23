import { describe, expect, it } from 'vitest';
import { extractContent } from './messaging.js';

describe('messaging utilities', () => {
  describe('extractContent', () => {
    it('should extract string content', () => {
      const result = extractContent('Hello world');
      expect(result).toBe('Hello world');
    });

    it('should extract text from array blocks', () => {
      const content = [
        { type: 'text', text: 'Hello' },
        { type: 'text', text: ' world' },
      ];
      const result = extractContent(content);
      expect(result).toBe('Hello world');
    });

    it('should handle mixed content types', () => {
      const content = [
        'Direct string',
        { type: 'text', text: 'Text block' },
        { type: 'image', data: 'base64...' },
      ];
      const result = extractContent(content);
      expect(result).toBe('Direct stringText block[image]');
    });

    it('should handle empty content', () => {
      const result = extractContent([]);
      expect(result).toBe('');
    });
  });
});

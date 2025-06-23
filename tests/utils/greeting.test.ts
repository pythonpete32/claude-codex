import { describe, expect, it } from 'vitest';
import { greetUser } from '../../src/utils/greeting.js';

describe('greetUser', () => {
  describe('happy path', () => {
    it('should return greeting with provided name', () => {
      const result = greetUser('Alice');

      expect(result).toBe('Hello, Alice!');
    });

    it('should handle names with spaces', () => {
      const result = greetUser('John Doe');

      expect(result).toBe('Hello, John Doe!');
    });

    it('should handle single character names', () => {
      const result = greetUser('A');

      expect(result).toBe('Hello, A!');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string gracefully', () => {
      const result = greetUser('');

      expect(result).toBe('Hello, World!');
    });

    it('should handle whitespace-only string gracefully', () => {
      const result = greetUser('   ');

      expect(result).toBe('Hello, World!');
    });
  });

  describe('null/undefined handling', () => {
    it('should handle null input gracefully', () => {
      const result = greetUser(null);

      expect(result).toBe('Hello, World!');
    });

    it('should handle undefined input gracefully', () => {
      const result = greetUser(undefined);

      expect(result).toBe('Hello, World!');
    });
  });

  describe('type safety', () => {
    it('should accept string parameter', () => {
      // This test ensures TypeScript compilation passes
      const result: string = greetUser('Test');

      expect(typeof result).toBe('string');
    });
  });
});

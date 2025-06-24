import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  global.console = mockConsole as typeof console;
});

// Import after mocking console
const { colors, logSuccess, logError, logWarning, logInfo, logDim } = await import(
  '../../src/messaging.js'
);

describe('Messaging Utilities', () => {
  describe('colors', () => {
    it('should have color functions', () => {
      expect(typeof colors.red).toBe('function');
      expect(typeof colors.green).toBe('function');
      expect(typeof colors.yellow).toBe('function');
      expect(typeof colors.cyan).toBe('function');
      expect(typeof colors.reset).toBe('function');
    });

    it('should have helper functions that color text', () => {
      // Test that helper functions return strings and apply colors
      expect(typeof colors.success('test')).toBe('string');
      expect(typeof colors.error('test')).toBe('string');
      expect(typeof colors.warning('test')).toBe('string');
      expect(typeof colors.info('test')).toBe('string');
      expect(typeof colors.dim('test')).toBe('string');
      expect(typeof colors.bold('test')).toBe('string');

      // Test that the functions work with the text content
      expect(colors.success('test')).toContain('test');
      expect(colors.error('test')).toContain('test');
      expect(colors.warning('test')).toContain('test');
      expect(colors.info('test')).toContain('test');
      expect(colors.dim('test')).toContain('test');
      expect(colors.bold('test')).toContain('test');
    });

    it('should have status indicators', () => {
      expect(colors.check).toBe('✓');
      expect(colors.cross).toBe('✗');
      expect(colors.arrow).toBe('→');
      expect(colors.bullet).toBe('•');
    });
  });

  describe('logging functions', () => {
    it('should log success messages with green check', () => {
      logSuccess('Operation completed');

      expect(mockConsole.log).toHaveBeenCalledWith(
        `${colors.success(colors.check)} Operation completed`
      );
    });

    it('should log error messages with red cross', () => {
      logError('Something went wrong');

      expect(mockConsole.error).toHaveBeenCalledWith(
        `${colors.error(colors.cross)} Something went wrong`
      );
    });

    it('should log warning messages with yellow arrow', () => {
      logWarning('This is a warning');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        `${colors.warning(colors.arrow)} This is a warning`
      );
    });

    it('should log info messages with cyan bullet', () => {
      logInfo('Some information');

      expect(mockConsole.log).toHaveBeenCalledWith(
        `${colors.info(colors.bullet)} Some information`
      );
    });

    it('should log dim messages', () => {
      logDim('Dimmed message');

      expect(mockConsole.log).toHaveBeenCalledWith(colors.dim('Dimmed message'));
    });

    it('should handle empty messages', () => {
      logSuccess('');
      logError('');
      logWarning('');
      logInfo('');
      logDim('');

      expect(mockConsole.log).toHaveBeenCalledTimes(3); // success, info, dim
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
    });

    it('should handle multiline messages', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';

      logSuccess(multilineMessage);

      expect(mockConsole.log).toHaveBeenCalledWith(
        `${colors.success(colors.check)} Line 1\nLine 2\nLine 3`
      );
    });

    it('should handle special characters', () => {
      const specialMessage = 'Message with émojis 🎉 and symbols ★';

      logInfo(specialMessage);

      expect(mockConsole.log).toHaveBeenCalledWith(
        `${colors.info(colors.bullet)} Message with émojis 🎉 and symbols ★`
      );
    });
  });
});

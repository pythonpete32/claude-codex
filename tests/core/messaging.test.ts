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
  '../../src/core/messaging.js'
);

describe('Messaging Utilities', () => {
  describe('colors', () => {
    it('should have ANSI color codes', () => {
      expect(colors.red).toBe('\x1b[31m');
      expect(colors.green).toBe('\x1b[32m');
      expect(colors.yellow).toBe('\x1b[33m');
      expect(colors.cyan).toBe('\x1b[36m');
      expect(colors.reset).toBe('\x1b[0m');
    });

    it('should have helper functions', () => {
      expect(colors.success('test')).toBe('\x1b[32mtest\x1b[0m');
      expect(colors.error('test')).toBe('\x1b[31mtest\x1b[0m');
      expect(colors.warning('test')).toBe('\x1b[33mtest\x1b[0m');
      expect(colors.info('test')).toBe('\x1b[36mtest\x1b[0m');
      expect(colors.dim('test')).toBe('\x1b[90mtest\x1b[0m');
      expect(colors.bold('test')).toBe('\x1b[1mtest\x1b[0m');
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

      expect(mockConsole.log).toHaveBeenCalledWith('\x1b[32m✓\x1b[0m Operation completed');
    });

    it('should log error messages with red cross', () => {
      logError('Something went wrong');

      expect(mockConsole.error).toHaveBeenCalledWith('\x1b[31m✗\x1b[0m Something went wrong');
    });

    it('should log warning messages with yellow arrow', () => {
      logWarning('This is a warning');

      expect(mockConsole.warn).toHaveBeenCalledWith('\x1b[33m→\x1b[0m This is a warning');
    });

    it('should log info messages with cyan bullet', () => {
      logInfo('Some information');

      expect(mockConsole.log).toHaveBeenCalledWith('\x1b[36m•\x1b[0m Some information');
    });

    it('should log dim messages', () => {
      logDim('Dimmed message');

      expect(mockConsole.log).toHaveBeenCalledWith('\x1b[90mDimmed message\x1b[0m');
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

      expect(mockConsole.log).toHaveBeenCalledWith('\x1b[32m✓\x1b[0m Line 1\nLine 2\nLine 3');
    });

    it('should handle special characters', () => {
      const specialMessage = 'Message with émojis 🎉 and symbols ★';

      logInfo(specialMessage);

      expect(mockConsole.log).toHaveBeenCalledWith(
        '\x1b[36m•\x1b[0m Message with émojis 🎉 and symbols ★'
      );
    });
  });
});

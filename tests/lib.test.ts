import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock console and messaging
const mockConsole = {
  log: vi.fn(),
};

const mockColors = {
  warning: vi.fn((text: string) => `warning(${text})`),
  success: vi.fn((text: string) => `success(${text})`),
};

vi.mock('../src/shared/colors.js', () => ({
  colors: mockColors,
}));

beforeEach(() => {
  vi.clearAllMocks();
  global.console = mockConsole as typeof console;

  // Reset environment variables
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.CLAUDE_API_KEY;
  delete process.env.ANTHROPIC_KEY;
  delete process.env.CLAUDE_KEY;
  delete process.env.CLAUDE_USE_SUBSCRIPTION;
});

// Import after mocking
const { forceSubscriptionAuth } = await import('../src/lib.js');

describe('forceSubscriptionAuth', () => {
  it('should remove ANTHROPIC_API_KEY and log message', () => {
    process.env.ANTHROPIC_API_KEY = 'test-api-key';

    forceSubscriptionAuth();

    expect(process.env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(mockColors.warning).toHaveBeenCalledWith('→');
    expect(mockConsole.log).toHaveBeenCalledWith(
      'warning(→) Removing ANTHROPIC_API_KEY from environment'
    );
  });

  it('should remove CLAUDE_API_KEY and log message', () => {
    process.env.CLAUDE_API_KEY = 'test-claude-key';

    forceSubscriptionAuth();

    expect(process.env.CLAUDE_API_KEY).toBeUndefined();
    expect(mockConsole.log).toHaveBeenCalledWith(
      'warning(→) Removing CLAUDE_API_KEY from environment'
    );
  });

  it('should remove ANTHROPIC_KEY and log message', () => {
    process.env.ANTHROPIC_KEY = 'test-key';

    forceSubscriptionAuth();

    expect(process.env.ANTHROPIC_KEY).toBeUndefined();
    expect(mockConsole.log).toHaveBeenCalledWith(
      'warning(→) Removing ANTHROPIC_KEY from environment'
    );
  });

  it('should remove CLAUDE_KEY and log message', () => {
    process.env.CLAUDE_KEY = 'another-key';

    forceSubscriptionAuth();

    expect(process.env.CLAUDE_KEY).toBeUndefined();
    expect(mockConsole.log).toHaveBeenCalledWith('warning(→) Removing CLAUDE_KEY from environment');
  });

  it('should remove multiple API keys', () => {
    process.env.ANTHROPIC_API_KEY = 'key1';
    process.env.CLAUDE_API_KEY = 'key2';
    process.env.ANTHROPIC_KEY = 'key3';

    forceSubscriptionAuth();

    expect(process.env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(process.env.CLAUDE_API_KEY).toBeUndefined();
    expect(process.env.ANTHROPIC_KEY).toBeUndefined();
    expect(mockConsole.log).toHaveBeenCalledTimes(4); // 3 removal messages + 1 cleanup message
  });

  it('should set CLAUDE_USE_SUBSCRIPTION flag', () => {
    forceSubscriptionAuth();

    expect(process.env.CLAUDE_USE_SUBSCRIPTION).toBe('true');
  });

  it('should log cleanup message when keys were removed', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    forceSubscriptionAuth();

    expect(mockColors.success).toHaveBeenCalledWith('✓');
    expect(mockConsole.log).toHaveBeenCalledWith(
      'success(✓) Environment cleaned for subscription auth\n'
    );
  });

  it('should not log cleanup message when no keys were removed', () => {
    // No API keys set

    forceSubscriptionAuth();

    expect(mockColors.success).not.toHaveBeenCalled();
    expect(mockConsole.log).toHaveBeenCalledTimes(0);
  });

  it('should handle empty API key values', () => {
    process.env.ANTHROPIC_API_KEY = '';

    forceSubscriptionAuth();

    // Empty string is falsy, so it shouldn't be processed
    expect(mockConsole.log).toHaveBeenCalledTimes(0);
    expect(process.env.CLAUDE_USE_SUBSCRIPTION).toBe('true');
  });

  it('should handle undefined environment variables gracefully', () => {
    // Ensure env var is not set (beforeEach already deleted them)

    forceSubscriptionAuth();

    // No removal messages should be logged since no env vars are set
    expect(mockConsole.log).toHaveBeenCalledTimes(0);
    expect(process.env.CLAUDE_USE_SUBSCRIPTION).toBe('true');
  });

  it('should preserve CLAUDE_USE_SUBSCRIPTION if already set', () => {
    process.env.CLAUDE_USE_SUBSCRIPTION = 'false';

    forceSubscriptionAuth();

    expect(process.env.CLAUDE_USE_SUBSCRIPTION).toBe('true');
  });

  it('should handle all API key variations in one call', () => {
    process.env.ANTHROPIC_API_KEY = 'key1';
    process.env.CLAUDE_API_KEY = 'key2';
    process.env.ANTHROPIC_KEY = 'key3';
    process.env.CLAUDE_KEY = 'key4';

    forceSubscriptionAuth();

    // Verify all keys are removed
    expect(process.env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(process.env.CLAUDE_API_KEY).toBeUndefined();
    expect(process.env.ANTHROPIC_KEY).toBeUndefined();
    expect(process.env.CLAUDE_KEY).toBeUndefined();

    // Verify flag is set
    expect(process.env.CLAUDE_USE_SUBSCRIPTION).toBe('true');

    // Verify logging
    expect(mockConsole.log).toHaveBeenCalledTimes(5); // 4 removal + 1 cleanup
  });
});

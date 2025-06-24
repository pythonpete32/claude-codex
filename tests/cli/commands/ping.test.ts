import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handlePingCommand } from '../../../src/cli/commands/ping.js';

describe('Ping Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.log to capture output
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('handlePingCommand', () => {
    it('should output "pong"', async () => {
      await handlePingCommand();

      expect(console.log).toHaveBeenCalledWith('pong');
      expect(console.log).toHaveBeenCalledTimes(1);
    });

    it('should return a resolved promise', async () => {
      const result = handlePingCommand();

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });
  });
});

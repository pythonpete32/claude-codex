import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runCLI } from '../../src/cli/index.js';

// Mock all command handlers
vi.mock('../../src/cli/commands/tdd.js', () => ({
  handleTDDCommand: vi.fn(),
}));

vi.mock('../../src/cli/commands/init.js', () => ({
  handleInitCommand: vi.fn(),
}));

vi.mock('../../src/cli/commands/team.js', () => ({
  handleTeamCommand: vi.fn(),
}));

// Mock package.json
vi.mock('node:module', () => ({
  createRequire: vi.fn(() => ({
    '../../package.json': { version: '1.0.0-test' },
  })),
}));

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit');
});

// Import mocked modules
const mockTDDCommand = await import('../../src/cli/commands/tdd.js');
const mockInitCommand = await import('../../src/cli/commands/init.js');
const mockTeamCommand = await import('../../src/cli/commands/team.js');

describe('CLI Index with Commander.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Setup default mocks
    vi.mocked(mockTDDCommand.handleTDDCommand).mockResolvedValue(undefined);
    vi.mocked(mockInitCommand.handleInitCommand).mockResolvedValue(undefined);
    vi.mocked(mockTeamCommand.handleTeamCommand).mockResolvedValue(undefined);
  });

  describe('help and version handling', () => {
    it('should handle help flag', async () => {
      // Commander.js handles help automatically and exits, so we expect process.exit
      await expect(runCLI(['node', 'script', '--help'])).rejects.toThrow('process.exit');
    });

    it('should handle version flag', async () => {
      // Commander.js handles version automatically and exits, so we expect process.exit
      await expect(runCLI(['node', 'script', '--version'])).rejects.toThrow('process.exit');
    });
  });

  describe('command routing', () => {
    it('should route init command to init handler', async () => {
      await runCLI(['node', 'script', 'init']);
      expect(mockInitCommand.handleInitCommand).toHaveBeenCalled();
    });

    it('should route init command with force flag', async () => {
      await runCLI(['node', 'script', 'init', '--force']);
      expect(mockInitCommand.handleInitCommand).toHaveBeenCalledWith(
        { force: true },
        expect.any(Object)
      );
    });

    it('should route tdd command to TDD handler', async () => {
      await runCLI(['node', 'script', 'tdd', './spec.md']);
      expect(mockTDDCommand.handleTDDCommand).toHaveBeenCalledWith(
        './spec.md',
        {
          cleanup: true,
          maxReviews: '3',
        },
        expect.any(Object)
      );
    });

    it('should route tdd command with options', async () => {
      await runCLI([
        'node',
        'script',
        'tdd',
        './spec.md',
        '--max-reviews',
        '5',
        '--branch-name',
        'feature/test',
        '--no-cleanup',
      ]);
      expect(mockTDDCommand.handleTDDCommand).toHaveBeenCalledWith(
        './spec.md',
        {
          maxReviews: '5',
          branchName: 'feature/test',
          cleanup: false,
        },
        expect.any(Object)
      );
    });

    it('should route team command to team handler', async () => {
      await runCLI(['node', 'script', 'team', 'tdd', './spec.md']);
      expect(mockTeamCommand.handleTeamCommand).toHaveBeenCalledWith(
        'tdd',
        './spec.md',
        {
          cleanup: true,
          maxReviews: '3',
        },
        expect.any(Object)
      );
    });

    it('should route team command with options', async () => {
      await runCLI([
        'node',
        'script',
        'team',
        'standard',
        './spec.md',
        '--max-reviews',
        '3',
        '--branch-name',
        'feature/xyz',
      ]);
      expect(mockTeamCommand.handleTeamCommand).toHaveBeenCalledWith(
        'standard',
        './spec.md',
        {
          maxReviews: '3',
          branchName: 'feature/xyz',
          cleanup: true,
        },
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    it('should handle command execution errors', async () => {
      vi.mocked(mockTDDCommand.handleTDDCommand).mockRejectedValue(
        new Error('TDD execution failed')
      );

      await expect(runCLI(['node', 'script', 'tdd', './spec.md'])).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith('❌ Error:', 'TDD execution failed');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle init command errors', async () => {
      vi.mocked(mockInitCommand.handleInitCommand).mockRejectedValue(new Error('Init failed'));

      await expect(runCLI(['node', 'script', 'init'])).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith('❌ Error:', 'Init failed');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle team command errors', async () => {
      vi.mocked(mockTeamCommand.handleTeamCommand).mockRejectedValue(
        new Error('Team execution failed')
      );

      await expect(runCLI(['node', 'script', 'team', 'tdd', './spec.md'])).rejects.toThrow(
        'process.exit'
      );

      expect(console.error).toHaveBeenCalledWith('❌ Error:', 'Team execution failed');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle non-Error objects', async () => {
      vi.mocked(mockTDDCommand.handleTDDCommand).mockRejectedValue('String error');

      await expect(runCLI(['node', 'script', 'tdd', './spec.md'])).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith('❌ Error:', 'String error');
    });
  });

  describe('default argv handling', () => {
    it('should use process.argv by default', async () => {
      // Mock process.argv
      const originalArgv = process.argv;
      process.argv = ['node', 'script', 'init'];

      await runCLI();

      expect(mockInitCommand.handleInitCommand).toHaveBeenCalledWith({}, expect.any(Object));

      // Restore original process.argv
      process.argv = originalArgv;
    });
  });

  describe('integration flow', () => {
    it('should execute complete flow for successful tdd command', async () => {
      await runCLI([
        'node',
        'script',
        'tdd',
        './spec.md',
        '--max-reviews',
        '5',
        '--branch-name',
        'feature/test',
      ]);

      // Verify complete flow
      expect(mockTDDCommand.handleTDDCommand).toHaveBeenCalledWith(
        './spec.md',
        {
          maxReviews: '5',
          branchName: 'feature/test',
          cleanup: true,
        },
        expect.any(Object)
      );
    });

    it('should execute complete flow for team command', async () => {
      await runCLI([
        'node',
        'script',
        'team',
        'frontend',
        './spec.md',
        '--max-reviews',
        '3',
        '--no-cleanup',
      ]);

      expect(mockTeamCommand.handleTeamCommand).toHaveBeenCalledWith(
        'frontend',
        './spec.md',
        {
          maxReviews: '3',
          cleanup: false,
        },
        expect.any(Object)
      );
    });
  });
});

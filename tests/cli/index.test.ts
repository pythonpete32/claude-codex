import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runCLI } from '../../src/cli/index.js';

// Mock all CLI modules
vi.mock('../../src/cli/args.js', () => ({
  parseArgs: vi.fn(),
  validateArgs: vi.fn(),
  displayHelp: vi.fn(),
  displayVersion: vi.fn(),
}));

vi.mock('../../src/cli/commands/tdd.js', () => ({
  handleTDDCommand: vi.fn(),
}));

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit');
});

// Import mocked modules
const mockArgs = await import('../../src/cli/args.js');
const mockTDDCommand = await import('../../src/cli/commands/tdd.js');

describe('CLI Index', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Setup default mocks
    vi.mocked(mockArgs.parseArgs).mockReturnValue({});
    vi.mocked(mockArgs.validateArgs).mockImplementation(() => {});
    vi.mocked(mockArgs.displayHelp).mockImplementation(() => {});
    vi.mocked(mockArgs.displayVersion).mockImplementation(() => {});
    vi.mocked(mockTDDCommand.handleTDDCommand).mockResolvedValue(undefined);
  });

  describe('help and version handling', () => {
    it('should display help and return when help flag is present', async () => {
      vi.mocked(mockArgs.parseArgs).mockReturnValue({ help: true });

      await runCLI(['node', 'script', '--help']);

      expect(mockArgs.displayHelp).toHaveBeenCalledOnce();
      expect(mockArgs.validateArgs).not.toHaveBeenCalled();
      expect(mockTDDCommand.handleTDDCommand).not.toHaveBeenCalled();
    });

    it('should display version and return when version flag is present', async () => {
      vi.mocked(mockArgs.parseArgs).mockReturnValue({ version: true });

      await runCLI(['node', 'script', '--version']);

      expect(mockArgs.displayVersion).toHaveBeenCalledOnce();
      expect(mockArgs.validateArgs).not.toHaveBeenCalled();
      expect(mockTDDCommand.handleTDDCommand).not.toHaveBeenCalled();
    });
  });

  describe('command routing', () => {
    it('should route tdd command to TDD handler', async () => {
      const mockTDDArgs = {
        specPath: './spec.md',
        reviews: 3,
        cleanup: true,
        verbose: false,
      };

      vi.mocked(mockArgs.parseArgs).mockReturnValue({
        command: 'tdd',
        tdd: mockTDDArgs,
      });

      await runCLI(['node', 'script', 'tdd', './spec.md']);

      expect(mockArgs.parseArgs).toHaveBeenCalledWith(['node', 'script', 'tdd', './spec.md']);
      expect(mockArgs.validateArgs).toHaveBeenCalledWith({
        command: 'tdd',
        tdd: mockTDDArgs,
      });
      expect(mockTDDCommand.handleTDDCommand).toHaveBeenCalledWith(mockTDDArgs);
    });

    it('should handle missing TDD args', async () => {
      vi.mocked(mockArgs.parseArgs).mockReturnValue({
        command: 'tdd',
        // tdd args missing
      });

      await expect(runCLI(['node', 'script', 'tdd'])).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith('❌ Error:', 'TDD command arguments missing');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle no command specified', async () => {
      vi.mocked(mockArgs.parseArgs).mockReturnValue({});

      await expect(runCLI(['node', 'script'])).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith(
        '❌ Error:',
        'No command specified. Use --help for usage information.'
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('error handling', () => {
    it('should handle parsing errors', async () => {
      vi.mocked(mockArgs.parseArgs).mockImplementation(() => {
        throw new Error('Invalid argument');
      });

      await expect(runCLI(['node', 'script', '--invalid'])).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith('❌ Error:', 'Invalid argument');
      expect(console.error).toHaveBeenCalledWith('💡 Use --help for usage information');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle validation errors', async () => {
      vi.mocked(mockArgs.parseArgs).mockReturnValue({ command: 'tdd' });
      vi.mocked(mockArgs.validateArgs).mockImplementation(() => {
        throw new Error('Validation failed');
      });

      await expect(runCLI(['node', 'script', 'tdd'])).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith('❌ Error:', 'Validation failed');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle TDD command execution errors', async () => {
      const mockTDDArgs = {
        specPath: './spec.md',
        reviews: 3,
        cleanup: true,
        verbose: false,
      };

      vi.mocked(mockArgs.parseArgs).mockReturnValue({
        command: 'tdd',
        tdd: mockTDDArgs,
      });

      vi.mocked(mockTDDCommand.handleTDDCommand).mockRejectedValue(
        new Error('TDD execution failed')
      );

      await expect(runCLI(['node', 'script', 'tdd', './spec.md'])).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith('❌ Error:', 'TDD execution failed');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle non-Error objects', async () => {
      vi.mocked(mockArgs.parseArgs).mockImplementation(() => {
        throw 'String error';
      });

      await expect(runCLI(['node', 'script'])).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith('❌ Error:', 'String error');
    });
  });

  describe('default argv handling', () => {
    it('should use process.argv by default', async () => {
      // Mock process.argv
      const originalArgv = process.argv;
      process.argv = ['node', 'script', '--help'];

      vi.mocked(mockArgs.parseArgs).mockReturnValue({ help: true });

      await runCLI();

      expect(mockArgs.parseArgs).toHaveBeenCalledWith(['node', 'script', '--help']);
      expect(mockArgs.displayHelp).toHaveBeenCalledOnce();

      // Restore original process.argv
      process.argv = originalArgv;
    });
  });

  describe('integration flow', () => {
    it('should execute complete flow for successful tdd command', async () => {
      const mockTDDArgs = {
        specPath: './spec.md',
        reviews: 5,
        branch: 'feature/test',
        cleanup: true,
        verbose: true,
      };

      vi.mocked(mockArgs.parseArgs).mockReturnValue({
        command: 'tdd',
        tdd: mockTDDArgs,
      });

      await runCLI([
        'node',
        'script',
        'tdd',
        './spec.md',
        '--reviews',
        '5',
        '--branch',
        'feature/test',
        '--verbose',
      ]);

      // Verify complete flow
      expect(mockArgs.parseArgs).toHaveBeenCalledWith([
        'node',
        'script',
        'tdd',
        './spec.md',
        '--reviews',
        '5',
        '--branch',
        'feature/test',
        '--verbose',
      ]);
      expect(mockArgs.validateArgs).toHaveBeenCalledWith({
        command: 'tdd',
        tdd: mockTDDArgs,
      });
      expect(mockTDDCommand.handleTDDCommand).toHaveBeenCalledWith(mockTDDArgs);
    });
  });
});

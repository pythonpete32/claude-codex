import { describe, expect, it, vi } from 'vitest';
import { displayHelp, displayVersion, parseArgs, validateArgs } from '../../src/cli/args.js';

describe('CLI Argument Parsing', () => {
  describe('parseArgs', () => {
    describe('help and version flags', () => {
      it('should parse --help flag', () => {
        const result = parseArgs(['node', 'script', '--help']);
        expect(result.help).toBe(true);
      });

      it('should parse -h flag', () => {
        const result = parseArgs(['node', 'script', '-h']);
        expect(result.help).toBe(true);
      });

      it('should parse --version flag', () => {
        const result = parseArgs(['node', 'script', '--version']);
        expect(result.version).toBe(true);
      });

      it('should parse -v flag', () => {
        const result = parseArgs(['node', 'script', '-v']);
        expect(result.version).toBe(true);
      });
    });

    describe('tdd command parsing', () => {
      it('should parse basic tdd command with spec path', () => {
        const result = parseArgs(['node', 'script', 'tdd', './spec.md']);

        expect(result.command).toBe('tdd');
        expect(result.tdd).toEqual({
          specPath: './spec.md',
          reviews: 3,
          cleanup: true,
          verbose: false,
        });
      });

      it('should parse tdd command with all options', () => {
        const result = parseArgs([
          'node',
          'script',
          'tdd',
          './spec.md',
          '--reviews',
          '5',
          '--branch',
          'feature/test',
          '--no-cleanup',
          '--verbose',
        ]);

        expect(result.command).toBe('tdd');
        expect(result.tdd).toEqual({
          specPath: './spec.md',
          reviews: 5,
          branch: 'feature/test',
          cleanup: false,
          verbose: true,
        });
      });

      it('should parse reviews option correctly', () => {
        const result = parseArgs(['node', 'script', 'tdd', './spec.md', '--reviews', '7']);
        expect(result.tdd?.reviews).toBe(7);
      });

      it('should parse branch option correctly', () => {
        const result = parseArgs(['node', 'script', 'tdd', './spec.md', '--branch', 'my-branch']);
        expect(result.tdd?.branch).toBe('my-branch');
      });

      it('should parse no-cleanup option correctly', () => {
        const result = parseArgs(['node', 'script', 'tdd', './spec.md', '--no-cleanup']);
        expect(result.tdd?.cleanup).toBe(false);
      });

      it('should parse verbose option correctly', () => {
        const result = parseArgs(['node', 'script', 'tdd', './spec.md', '--verbose']);
        expect(result.tdd?.verbose).toBe(true);
      });
    });

    describe('error handling', () => {
      it('should throw error for unknown command', () => {
        expect(() => parseArgs(['node', 'script', 'unknown'])).toThrow('Unknown command: unknown');
      });

      it('should throw error for unknown option', () => {
        expect(() => parseArgs(['node', 'script', '--unknown'])).toThrow(
          'Unknown option: --unknown'
        );
      });

      it('should throw error when reviews option has no value', () => {
        expect(() => parseArgs(['node', 'script', 'tdd', './spec.md', '--reviews'])).toThrow(
          '--reviews requires a value'
        );
      });

      it('should throw error when branch option has no value', () => {
        expect(() => parseArgs(['node', 'script', 'tdd', './spec.md', '--branch'])).toThrow(
          '--branch requires a value'
        );
      });

      it('should throw error for invalid reviews value', () => {
        expect(() =>
          parseArgs(['node', 'script', 'tdd', './spec.md', '--reviews', 'invalid'])
        ).toThrow('--reviews must be a number between 1 and 10');
      });

      it('should throw error for reviews value out of range', () => {
        expect(() => parseArgs(['node', 'script', 'tdd', './spec.md', '--reviews', '0'])).toThrow(
          '--reviews must be a number between 1 and 10'
        );

        expect(() => parseArgs(['node', 'script', 'tdd', './spec.md', '--reviews', '11'])).toThrow(
          '--reviews must be a number between 1 and 10'
        );
      });

      it('should throw error when tdd command has no spec path', () => {
        expect(() => parseArgs(['node', 'script', 'tdd'])).toThrow(
          'tdd command requires a specification file path'
        );
      });

      it('should throw error when tdd command has multiple spec paths', () => {
        expect(() => parseArgs(['node', 'script', 'tdd', './spec1.md', './spec2.md'])).toThrow(
          'tdd command accepts only one specification file path'
        );
      });
    });

    describe('default values', () => {
      it('should set default values for tdd command', () => {
        const result = parseArgs(['node', 'script', 'tdd', './spec.md']);

        expect(result.tdd?.reviews).toBe(3);
        expect(result.tdd?.cleanup).toBe(true);
        expect(result.tdd?.verbose).toBe(false);
        expect(result.tdd?.branch).toBeUndefined();
      });
    });

    describe('empty arguments', () => {
      it('should handle empty arguments', () => {
        const result = parseArgs(['node', 'script']);
        expect(result).toEqual({});
      });
    });
  });

  describe('validateArgs', () => {
    describe('help and version validation', () => {
      it('should not validate help args', () => {
        expect(() => validateArgs({ help: true })).not.toThrow();
      });

      it('should not validate version args', () => {
        expect(() => validateArgs({ version: true })).not.toThrow();
      });
    });

    describe('command validation', () => {
      it('should require a command', () => {
        expect(() => validateArgs({})).toThrow(
          'No command specified. Use --help for usage information.'
        );
      });

      it('should validate tdd command args exist', () => {
        expect(() => validateArgs({ command: 'tdd' })).toThrow('TDD command arguments missing');
      });

      it('should validate spec path is provided', () => {
        expect(() =>
          validateArgs({
            command: 'tdd',
            tdd: { specPath: '', reviews: 3, cleanup: true, verbose: false },
          })
        ).toThrow('Specification file path is required');
      });

      it('should validate branch name format', () => {
        expect(() =>
          validateArgs({
            command: 'tdd',
            tdd: { specPath: './spec.md', branch: 'invalid branch name!' },
          })
        ).toThrow(
          'Branch name contains invalid characters. Use only letters, numbers, /, -, _, and .'
        );
      });

      it('should accept valid branch names', () => {
        const validBranches = [
          'feature/test',
          'bug-fix',
          'release_1.0',
          'feature123',
          'FEATURE_TEST',
          'fix/issue-123',
        ];

        for (const branch of validBranches) {
          expect(() =>
            validateArgs({
              command: 'tdd',
              tdd: { specPath: './spec.md', branch },
            })
          ).not.toThrow();
        }
      });
    });

    describe('valid configurations', () => {
      it('should validate complete tdd args', () => {
        expect(() =>
          validateArgs({
            command: 'tdd',
            tdd: {
              specPath: './spec.md',
              reviews: 5,
              branch: 'feature/test',
              cleanup: true,
              verbose: false,
            },
          })
        ).not.toThrow();
      });
    });
  });

  describe('displayHelp', () => {
    it('should display help without throwing', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      expect(() => displayHelp()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Claude Codex TDD Workflow CLI')
      );

      consoleSpy.mockRestore();
    });

    it('should include usage examples in help', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      displayHelp();

      const helpText = consoleSpy.mock.calls[0][0];
      expect(helpText).toContain('Usage:');
      expect(helpText).toContain('Examples:');
      expect(helpText).toContain('claude-codex tdd');
      expect(helpText).toContain('--reviews');
      expect(helpText).toContain('--branch');
      expect(helpText).toContain('GITHUB_TOKEN');

      consoleSpy.mockRestore();
    });
  });

  describe('displayVersion', () => {
    it('should display version without throwing', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      expect(() => displayVersion()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Claude Codex TDD'));

      consoleSpy.mockRestore();
    });
  });
});

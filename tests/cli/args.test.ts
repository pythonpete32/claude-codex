import { describe, expect, it } from 'vitest';
import { parseArgs, showHelp, showVersion, validateArgs } from '../../src/cli/args.js';

describe('CLI Argument Parser', () => {
  describe('parseArgs', () => {
    describe('global flags', () => {
      it('should parse help flag', () => {
        const result = parseArgs(['--help']);
        expect(result).toEqual({ help: true });
      });

      it('should parse short help flag', () => {
        const result = parseArgs(['-h']);
        expect(result).toEqual({ help: true });
      });

      it('should parse version flag', () => {
        const result = parseArgs(['--version']);
        expect(result).toEqual({ version: true });
      });

      it('should parse short version flag', () => {
        const result = parseArgs(['-v']);
        expect(result).toEqual({ version: true });
      });

      it('should parse verbose flag', () => {
        const result = parseArgs(['--verbose']);
        expect(result).toEqual({ verbose: true });
      });
    });

    describe('TDD command', () => {
      it('should parse basic TDD command', () => {
        const result = parseArgs(['tdd', './spec.md']);
        expect(result).toEqual({
          command: 'tdd',
          tdd: {
            specPath: './spec.md',
            cleanup: true,
          },
        });
      });

      it('should parse TDD command with all options', () => {
        const result = parseArgs([
          'tdd',
          './spec.md',
          '--reviews',
          '5',
          '--branch',
          'feature/test',
          '--no-cleanup',
          '--verbose',
        ]);
        expect(result).toEqual({
          command: 'tdd',
          tdd: {
            specPath: './spec.md',
            reviews: 5,
            branch: 'feature/test',
            cleanup: false,
            verbose: true,
          },
        });
      });

      it('should parse TDD command with reviews option', () => {
        const result = parseArgs(['tdd', './spec.md', '--reviews', '3']);
        expect(result).toEqual({
          command: 'tdd',
          tdd: {
            specPath: './spec.md',
            reviews: 3,
            cleanup: true,
          },
        });
      });

      it('should parse TDD command with branch option', () => {
        const result = parseArgs(['tdd', './spec.md', '--branch', 'feat/auth']);
        expect(result).toEqual({
          command: 'tdd',
          tdd: {
            specPath: './spec.md',
            branch: 'feat/auth',
            cleanup: true,
          },
        });
      });

      it('should parse TDD command with no-cleanup option', () => {
        const result = parseArgs(['tdd', './spec.md', '--no-cleanup']);
        expect(result).toEqual({
          command: 'tdd',
          tdd: {
            specPath: './spec.md',
            cleanup: false,
          },
        });
      });

      it('should throw error when TDD command missing spec file', () => {
        expect(() => parseArgs(['tdd'])).toThrow('TDD command requires a specification file path');
      });

      it('should throw error for invalid reviews number', () => {
        expect(() => parseArgs(['tdd', './spec.md', '--reviews', 'invalid'])).toThrow(
          '--reviews requires a valid number'
        );
      });

      it('should throw error for reviews out of range', () => {
        expect(() => parseArgs(['tdd', './spec.md', '--reviews', '0'])).toThrow(
          '--reviews must be between 1 and 10'
        );
        expect(() => parseArgs(['tdd', './spec.md', '--reviews', '11'])).toThrow(
          '--reviews must be between 1 and 10'
        );
      });

      it('should throw error when branch option missing value', () => {
        expect(() => parseArgs(['tdd', './spec.md', '--branch'])).toThrow(
          '--branch requires a branch name'
        );
      });

      it('should throw error for unknown TDD option', () => {
        expect(() => parseArgs(['tdd', './spec.md', '--unknown'])).toThrow(
          'Unknown TDD option: --unknown'
        );
      });
    });

    describe('direct mode', () => {
      it('should parse direct prompt mode', () => {
        const result = parseArgs(['Help me debug this code']);
        expect(result).toEqual({
          directMode: true,
          prompt: 'Help me debug this code',
        });
      });

      it('should parse multi-word direct prompt', () => {
        const result = parseArgs(['Help', 'me', 'write', 'a', 'function']);
        expect(result).toEqual({
          directMode: true,
          prompt: 'Help me write a function',
        });
      });

      it('should parse empty arguments', () => {
        const result = parseArgs([]);
        expect(result).toEqual({});
      });
    });

    describe('mixed flags and commands', () => {
      it('should handle verbose with TDD command', () => {
        const result = parseArgs(['--verbose', 'tdd', './spec.md']);
        expect(result).toEqual({
          verbose: true,
          command: 'tdd',
          tdd: {
            specPath: './spec.md',
            cleanup: true,
          },
        });
      });

      it('should ignore unknown flags', () => {
        const result = parseArgs(['--unknown-flag', 'tdd', './spec.md']);
        expect(result).toEqual({
          command: 'tdd',
          tdd: {
            specPath: './spec.md',
            cleanup: true,
          },
        });
      });
    });
  });

  describe('validateArgs', () => {
    it('should validate valid TDD arguments', () => {
      const args = {
        command: 'tdd' as const,
        tdd: {
          specPath: './spec.md',
          cleanup: true,
        },
      };
      expect(() => validateArgs(args)).not.toThrow();
    });

    it('should throw error for TDD command without arguments', () => {
      const args = {
        command: 'tdd' as const,
      };
      expect(() => validateArgs(args)).toThrow('Internal error: TDD command missing arguments');
    });

    it('should throw error for empty spec path', () => {
      const args = {
        command: 'tdd' as const,
        tdd: {
          specPath: '',
          cleanup: true,
        },
      };
      expect(() => validateArgs(args)).toThrow('Specification file path cannot be empty');
    });

    it('should throw error for whitespace-only spec path', () => {
      const args = {
        command: 'tdd' as const,
        tdd: {
          specPath: '   ',
          cleanup: true,
        },
      };
      expect(() => validateArgs(args)).toThrow('Specification file path cannot be empty');
    });

    it('should validate relative paths starting with ./', () => {
      const args = {
        command: 'tdd' as const,
        tdd: {
          specPath: './docs/../spec.md',
          cleanup: true,
        },
      };
      expect(() => validateArgs(args)).not.toThrow();
    });

    it('should validate absolute paths', () => {
      const args = {
        command: 'tdd' as const,
        tdd: {
          specPath: '/absolute/path/spec.md',
          cleanup: true,
        },
      };
      expect(() => validateArgs(args)).not.toThrow();
    });

    it('should throw error for suspicious path traversal', () => {
      const args = {
        command: 'tdd' as const,
        tdd: {
          specPath: '../../../etc/passwd',
          cleanup: true,
        },
      };
      expect(() => validateArgs(args)).toThrow(
        'Specification file path contains invalid characters'
      );
    });

    it('should validate non-command arguments', () => {
      const args = {
        help: true,
      };
      expect(() => validateArgs(args)).not.toThrow();
    });
  });

  describe('showHelp', () => {
    it('should return help text', () => {
      const help = showHelp();
      expect(help).toContain('Claude Codex');
      expect(help).toContain('USAGE:');
      expect(help).toContain('COMMANDS:');
      expect(help).toContain('tdd');
      expect(help).toContain('EXAMPLES:');
      expect(help).toContain('ENVIRONMENT:');
      expect(help).toContain('GITHUB_TOKEN');
    });

    it('should include all TDD options', () => {
      const help = showHelp();
      expect(help).toContain('--reviews');
      expect(help).toContain('--branch');
      expect(help).toContain('--no-cleanup');
      expect(help).toContain('--verbose');
    });

    it('should include global options', () => {
      const help = showHelp();
      expect(help).toContain('--help');
      expect(help).toContain('--version');
    });
  });

  describe('showVersion', () => {
    it('should return version string', () => {
      const version = showVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic version format
    });
  });

  describe('edge cases', () => {
    it('should handle TDD with only flags after spec', () => {
      const result = parseArgs(['tdd', './spec.md', '--verbose', '--no-cleanup']);
      expect(result).toEqual({
        command: 'tdd',
        tdd: {
          specPath: './spec.md',
          verbose: true,
          cleanup: false,
        },
      });
    });

    it('should handle multiple reviews flags (last one wins)', () => {
      const result = parseArgs(['tdd', './spec.md', '--reviews', '2', '--reviews', '4']);
      expect(result).toEqual({
        command: 'tdd',
        tdd: {
          specPath: './spec.md',
          reviews: 4,
          cleanup: true,
        },
      });
    });

    it('should handle multiple branch flags (last one wins)', () => {
      const result = parseArgs(['tdd', './spec.md', '--branch', 'first', '--branch', 'second']);
      expect(result).toEqual({
        command: 'tdd',
        tdd: {
          specPath: './spec.md',
          branch: 'second',
          cleanup: true,
        },
      });
    });

    it('should handle arguments after unknown flags', () => {
      const result = parseArgs(['--unknown', 'value', 'tdd', './spec.md']);
      // The parser treats everything after unknown flags as direct mode
      expect(result).toEqual({
        directMode: true,
        prompt: 'value tdd ./spec.md',
      });
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseArgs, printHelp, printVersion } from '../../src/cli/args.js';

describe('CLI Argument Parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseArgs', () => {
    it('should return empty object for no arguments', () => {
      const result = parseArgs(['node', 'script.js']);
      expect(result).toEqual({});
    });

    it('should handle help flag', () => {
      const result1 = parseArgs(['node', 'script.js', '--help']);
      const result2 = parseArgs(['node', 'script.js', '-h']);

      expect(result1.help).toBe(true);
      expect(result2.help).toBe(true);
    });

    it('should handle version flag', () => {
      const result1 = parseArgs(['node', 'script.js', '--version']);
      const result2 = parseArgs(['node', 'script.js', '-v']);

      expect(result1.version).toBe(true);
      expect(result2.version).toBe(true);
    });

    it('should parse tdd command with spec file', () => {
      const result = parseArgs(['node', 'script.js', 'tdd', './spec.md']);

      expect(result.command).toBe('tdd');
      expect(result.tdd?.specPath).toBe('./spec.md');
    });

    it('should parse tdd command with all options', () => {
      const result = parseArgs([
        'node',
        'script.js',
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
      expect(result.tdd?.specPath).toBe('./spec.md');
      expect(result.tdd?.reviews).toBe(5);
      expect(result.tdd?.branch).toBe('feature/test');
      expect(result.tdd?.cleanup).toBe(false);
      expect(result.tdd?.verbose).toBe(true);
    });

    it('should parse tdd command with short flags', () => {
      const result = parseArgs([
        'node',
        'script.js',
        'tdd',
        './spec.md',
        '-r',
        '3',
        '-b',
        'test-branch',
      ]);

      expect(result.tdd?.reviews).toBe(3);
      expect(result.tdd?.branch).toBe('test-branch');
    });

    it('should handle cleanup flag explicitly set to true', () => {
      const result = parseArgs(['node', 'script.js', 'tdd', './spec.md', '--cleanup']);

      expect(result.tdd?.cleanup).toBe(true);
    });

    it('should ignore unknown flags', () => {
      const result = parseArgs([
        'node',
        'script.js',
        'tdd',
        './spec.md',
        '--unknown-flag',
        'value',
      ]);

      expect(result.command).toBe('tdd');
      expect(result.tdd?.specPath).toBe('./spec.md');
    });

    it('should handle invalid number for reviews', () => {
      const result = parseArgs([
        'node',
        'script.js',
        'tdd',
        './spec.md',
        '--reviews',
        'not-a-number',
      ]);

      expect(result.tdd?.reviews).toBeUndefined();
    });

    it('should handle negative number for reviews', () => {
      const result = parseArgs(['node', 'script.js', 'tdd', './spec.md', '--reviews', '-1']);

      expect(result.tdd?.reviews).toBeUndefined();
    });

    it('should handle zero for reviews', () => {
      const result = parseArgs(['node', 'script.js', 'tdd', './spec.md', '--reviews', '0']);

      expect(result.tdd?.reviews).toBeUndefined();
    });

    it('should handle missing values for flags', () => {
      const result = parseArgs(['node', 'script.js', 'tdd', './spec.md', '--reviews']);

      expect(result.tdd?.reviews).toBeUndefined();
    });
  });

  describe('printHelp', () => {
    it('should print help without errors', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printHelp();

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('Claude Codex');
      expect(output).toContain('tdd <spec-file>');
      expect(output).toContain('--reviews');
      expect(output).toContain('GITHUB_TOKEN');

      consoleSpy.mockRestore();
    });
  });

  describe('printVersion', () => {
    it('should print version without errors', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printVersion();

      expect(consoleSpy).toHaveBeenCalledWith('claude-codex v0.1.1');

      consoleSpy.mockRestore();
    });
  });
});

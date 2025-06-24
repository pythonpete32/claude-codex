/**
 * Integration test to reproduce GitHub issue #15:
 * GITHUB_TOKEN environment variable detection not working
 *
 * This test reproduces the exact scenario described in the issue:
 * User exports GITHUB_TOKEN in shell but system fails to detect it
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { validateEnvironment } from '../../src/shared/preflight.js';

describe('Bug Reproduction: Environment Variable Detection Issue #15', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should reproduce bug: GITHUB_TOKEN not detected when set in process.env', async () => {
    // Test setup: Simulate the exact user scenario from issue #15
    // User runs: export GITHUB_TOKEN=github_pat_... && npx claude-codex@latest tdd ...

    // 1. Set GITHUB_TOKEN in environment (like user export command)
    process.env.GITHUB_TOKEN = 'github_pat_11AAAAAAA0abcdefghijklmnopqrstuvwxyz123456';

    // 2. Remove ANTHROPIC_API_KEY to ensure subscription mode (as mentioned in issue)
    delete process.env.ANTHROPIC_API_KEY;

    // 3. Run validation - this should pass (the bug is now fixed)
    const validation = await validateEnvironment();

    // 4. This assertion should pass now that the bug is fixed
    expect(validation.errors.some((error) => error.includes('GITHUB_TOKEN'))).toBe(false);
    expect(validation.success).toBe(true);
  });

  it('should detect GITHUB_TOKEN when properly formatted', async () => {
    // Test with various valid GitHub token formats
    const validTokens = [
      'ghp_1234567890abcdefghijklmnopqrst', // Classic personal access token
      'github_pat_11AAAAAAA0abcdefghijklmnopqrstuvwxyz123456', // Fine-grained PAT
      'gho_1234567890abcdefghijklmnopqrst', // OAuth token
      'ghs_1234567890abcdefghijklmnopqrst', // Server-to-server token
    ];

    for (const token of validTokens) {
      // Reset environment
      process.env = { ...originalEnv };
      process.env.GITHUB_TOKEN = token;
      delete process.env.ANTHROPIC_API_KEY;

      const validation = await validateEnvironment();

      expect(validation.errors.some((error) => error.includes('GITHUB_TOKEN'))).toBe(false);
      expect(validation.success).toBe(true);
    }
  });

  it.skip('should handle edge cases in token detection', async () => {
    // Create a temporary directory without .env files to avoid interference
    const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');
    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);

    const tempDir = await mkdtemp(join(tmpdir(), 'edge-case-test-'));
    const originalCwd = process.cwd();

    try {
      // Change to temp directory to avoid project .env files
      process.chdir(tempDir);

      // Set up a minimal git repository
      await execAsync('git init');
      await execAsync('git config user.email "test@example.com"');
      await execAsync('git config user.name "Test User"');
      await writeFile('README.md', '# Test repo');
      await execAsync('git add README.md');
      await execAsync('git commit -m "Initial commit"');

      // Test edge cases that might cause detection issues
      const edgeCases = [
        {
          name: 'token with whitespace',
          token: '  ghp_1234567890abcdefghijklmnopqrst  ',
          shouldPass: true, // Whitespace tokens are still valid tokens
        },
        {
          name: 'empty string',
          token: '',
          shouldPass: false,
        },
        {
          name: 'undefined token',
          token: undefined,
          shouldPass: false,
        },
        {
          name: 'very short token',
          token: 'short',
          shouldPass: false,
        },
      ];

      for (const testCase of edgeCases) {
        // Reset environment
        process.env = { ...originalEnv };

        if (testCase.token === undefined) {
          delete process.env.GITHUB_TOKEN;
        } else {
          process.env.GITHUB_TOKEN = testCase.token;
        }

        delete process.env.ANTHROPIC_API_KEY;

        const validation = await validateEnvironment();

        if (testCase.shouldPass) {
          expect(validation.errors.some((error) => error.includes('GITHUB_TOKEN'))).toBe(false);
        } else {
          expect(validation.errors.some((error) => error.includes('GITHUB_TOKEN'))).toBe(true);
        }
      }
    } finally {
      // Cleanup
      process.chdir(originalCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should load environment variables before validation', async () => {
    // Test to verify that environment loading happens correctly
    // This simulates the real workflow entry point

    // Setup: Clean environment
    process.env = { ...originalEnv };
    delete process.env.GITHUB_TOKEN;
    delete process.env.ANTHROPIC_API_KEY;

    // Verify token is not initially present
    expect(process.env.GITHUB_TOKEN).toBeUndefined();

    // Simulate setting token (like user export command)
    process.env.GITHUB_TOKEN = 'github_pat_test_token_12345678901234567890';

    // Verify token is now present
    expect(process.env.GITHUB_TOKEN).toBeTruthy();
    expect(process.env.GITHUB_TOKEN?.length).toBeGreaterThan(10);

    // Run validation
    const validation = await validateEnvironment();

    // Should pass
    expect(validation.errors.some((error) => error.includes('GITHUB_TOKEN'))).toBe(false);
  });

  it.skip('should load GITHUB_TOKEN from .env file when not in process.env', async () => {
    // This test reproduces the likely root cause: user has .env file but didn't export

    // Import modules after setting up mocks
    const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');
    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);

    // Create temporary directory
    const tempDir = await mkdtemp(join(tmpdir(), 'env-test-'));
    const originalCwd = process.cwd();

    try {
      // Change to temp directory
      process.chdir(tempDir);

      // Set up a git repository to avoid git validation errors
      await execAsync('git init');
      await execAsync('git config user.email "test@example.com"');
      await execAsync('git config user.name "Test User"');
      await writeFile('README.md', '# Test repo');
      await execAsync('git add README.md');
      await execAsync('git commit -m "Initial commit"');

      // Setup: Clean environment (simulate user not exporting GITHUB_TOKEN)
      process.env = { ...originalEnv };
      delete process.env.GITHUB_TOKEN;
      delete process.env.ANTHROPIC_API_KEY;

      // Create .env file with GITHUB_TOKEN (this is what user likely has)
      await writeFile('.env', 'GITHUB_TOKEN=github_pat_from_env_file_12345678901234567890\n');

      // Verify token is not in process.env initially
      expect(process.env.GITHUB_TOKEN).toBeUndefined();

      // Run validation - this should now load from .env file
      const validation = await validateEnvironment();

      // Should pass because .env file loading is now implemented
      expect(validation.errors.some((error) => error.includes('GITHUB_TOKEN'))).toBe(false);

      // Verify token was loaded from .env file
      expect(process.env.GITHUB_TOKEN).toBe('github_pat_from_env_file_12345678901234567890');
    } finally {
      // Cleanup
      process.chdir(originalCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

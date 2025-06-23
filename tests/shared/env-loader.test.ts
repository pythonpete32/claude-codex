import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

describe('Environment Loader', () => {
  let testDir: string;
  let originalCwd: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // Save original state
    originalCwd = process.cwd();
    originalEnv = { ...process.env };

    // Create temporary test directory
    testDir = await mkdtemp(join(tmpdir(), 'env-loader-test-'));
    process.chdir(testDir);
  });

  afterEach(async () => {
    // Restore original state
    process.chdir(originalCwd);
    process.env = originalEnv;

    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  describe('loadEnvFile', () => {
    it('should load environment variables from .env file', async () => {
      const { loadEnvFile } = await import('../../src/shared/env-loader.js');

      // Create .env file
      await writeFile(
        '.env',
        `
GITHUB_TOKEN=env_token_123
TEST_VAR=test_value
EMPTY_VAR=
QUOTED_VAR="quoted value"
SINGLE_QUOTED='single quoted'
# This is a comment
      `
      );

      // Clear relevant env vars
      delete process.env.GITHUB_TOKEN;
      delete process.env.TEST_VAR;
      delete process.env.EMPTY_VAR;
      delete process.env.QUOTED_VAR;
      delete process.env.SINGLE_QUOTED;

      // Load .env file
      await loadEnvFile('.env');

      // Verify variables were loaded
      expect(process.env.GITHUB_TOKEN).toBe('env_token_123');
      expect(process.env.TEST_VAR).toBe('test_value');
      expect(process.env.EMPTY_VAR).toBe('');
      expect(process.env.QUOTED_VAR).toBe('quoted value');
      expect(process.env.SINGLE_QUOTED).toBe('single quoted');
    });

    it('should not override existing process.env variables', async () => {
      const { loadEnvFile } = await import('../../src/shared/env-loader.js');

      // Set existing env var
      process.env.GITHUB_TOKEN = 'existing_token';

      // Create .env file with different value
      await writeFile('.env', 'GITHUB_TOKEN=env_file_token');

      // Load .env file
      await loadEnvFile('.env');

      // Should keep existing value (process.env takes precedence)
      expect(process.env.GITHUB_TOKEN).toBe('existing_token');
    });

    it('should handle missing .env file gracefully', async () => {
      const { loadEnvFile } = await import('../../src/shared/env-loader.js');

      // Should not throw error when .env file doesn't exist
      await expect(loadEnvFile('.env')).resolves.not.toThrow();
    });

    it('should handle malformed .env file lines', async () => {
      const { loadEnvFile } = await import('../../src/shared/env-loader.js');

      // Create .env file with various malformed lines
      await writeFile(
        '.env',
        `
VALID_VAR=valid_value
INVALID_LINE_NO_EQUALS
=NO_KEY_VALUE
KEY_WITH_EQUALS_IN_VALUE=value=with=equals
SPACES_AROUND_EQUALS = value with spaces 
      `
      );

      delete process.env.VALID_VAR;
      delete process.env.KEY_WITH_EQUALS_IN_VALUE;
      delete process.env.SPACES_AROUND_EQUALS;

      // Should not throw and should parse valid lines
      await loadEnvFile('.env');

      expect(process.env.VALID_VAR).toBe('valid_value');
      expect(process.env.KEY_WITH_EQUALS_IN_VALUE).toBe('value=with=equals');
      expect(process.env.SPACES_AROUND_EQUALS).toBe('value with spaces');
    });
  });

  describe('loadEnvironmentVariables', () => {
    it('should load both .env and .env.local with correct precedence', async () => {
      const { loadEnvironmentVariables } = await import('../../src/shared/env-loader.js');

      // Create .env file
      await writeFile(
        '.env',
        `
SHARED_VAR=env_value
ENV_ONLY=env_only_value
      `
      );

      // Create .env.local file (higher precedence)
      await writeFile(
        '.env.local',
        `
SHARED_VAR=local_value
LOCAL_ONLY=local_only_value
      `
      );

      delete process.env.SHARED_VAR;
      delete process.env.ENV_ONLY;
      delete process.env.LOCAL_ONLY;

      // Load environment variables
      await loadEnvironmentVariables();

      // .env.local should take precedence for shared variables
      expect(process.env.SHARED_VAR).toBe('local_value');
      expect(process.env.ENV_ONLY).toBe('env_only_value');
      expect(process.env.LOCAL_ONLY).toBe('local_only_value');
    });

    it('should work when only .env exists', async () => {
      const { loadEnvironmentVariables } = await import('../../src/shared/env-loader.js');

      // Create only .env file
      await writeFile('.env', 'GITHUB_TOKEN=env_token_only');

      delete process.env.GITHUB_TOKEN;

      // Load environment variables
      await loadEnvironmentVariables();

      expect(process.env.GITHUB_TOKEN).toBe('env_token_only');
    });

    it('should work when only .env.local exists', async () => {
      const { loadEnvironmentVariables } = await import('../../src/shared/env-loader.js');

      // Create only .env.local file
      await writeFile('.env.local', 'GITHUB_TOKEN=local_token_only');

      delete process.env.GITHUB_TOKEN;

      // Load environment variables
      await loadEnvironmentVariables();

      expect(process.env.GITHUB_TOKEN).toBe('local_token_only');
    });

    it('should work when neither file exists', async () => {
      const { loadEnvironmentVariables } = await import('../../src/shared/env-loader.js');

      // Should not throw when no .env files exist
      await expect(loadEnvironmentVariables()).resolves.not.toThrow();
    });
  });
});

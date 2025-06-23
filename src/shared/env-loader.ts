import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * Simple .env file loader
 * Loads environment variables from .env file if it exists
 * Does not override existing process.env variables (process.env takes precedence)
 */
export async function loadEnvFile(envPath = '.env'): Promise<void> {
  try {
    const absolutePath = resolve(envPath);
    const content = await readFile(absolutePath, 'utf-8');

    // Parse .env file content
    const lines = content.split('\n');

    for (const line of lines) {
      // Skip empty lines and comments
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Parse KEY=VALUE format
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex === -1) {
        continue; // Skip malformed lines
      }

      const key = trimmedLine.slice(0, equalIndex).trim();
      const value = trimmedLine.slice(equalIndex + 1).trim();

      // Remove quotes if present
      const cleanValue = value.replace(/^(['"])(.*)\1$/, '$2');

      // Only set if not already defined in process.env (process.env takes precedence)
      if (!process.env[key]) {
        process.env[key] = cleanValue;
      }
    }
  } catch (_error) {
    // Silently ignore if .env file doesn't exist or can't be read
    // This is expected behavior - .env files are optional
  }
}

/**
 * Load environment variables from common .env file locations
 * Searches for .env files in order of precedence:
 * 1. .env.local (highest precedence, should be gitignored)
 * 2. .env
 */
export async function loadEnvironmentVariables(): Promise<void> {
  // Try to load .env.local first (highest precedence)
  await loadEnvFile('.env.local');

  // Then load .env (lower precedence)
  await loadEnvFile('.env');
}

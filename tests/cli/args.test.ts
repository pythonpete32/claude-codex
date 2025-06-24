/**
 * @deprecated These tests are deprecated as we've migrated to commander.js
 * 
 * The manual argument parsing in src/cli/args.js has been replaced with commander.js
 * which handles argument parsing, validation, and help generation automatically.
 * 
 * New CLI tests are in index.test.ts and commands/*.test.ts
 */

import { describe, it } from 'vitest';

describe('CLI Args (DEPRECATED)', () => {
  it('should be deprecated - use commander.js instead', () => {
    // This test exists to document that args.js is deprecated
    // All argument parsing is now handled by commander.js
  });
});
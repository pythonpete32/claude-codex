import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      '~/': resolve(__dirname, './src/'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', 'build'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/**',
        'build/**',
        '.claude/**',
        'docs/**',
        '**/*.config.{js,ts}',
        'tsup.config.ts',
        'vitest.config.ts',
        '**/*.d.ts',
        '**/types.ts', // Type definition files
        '**/index.ts', // Re-export files typically don't need coverage
        'src/lib.ts', // Authentication utility - already tested by Claude SDK
        'coverage/**',
        '.tmp/**',
      ],
    },
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
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

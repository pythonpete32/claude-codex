import { defineConfig } from 'tsup';

export default defineConfig({
  // Entry points
  entry: {
    index: 'src/index.ts', // Main CLI executable
    lib: 'src/lib.ts', // Library exports
  },

  // Output configuration
  format: ['esm'], // ES modules since package.json has "type": "module"
  target: 'node18', // Match the engines requirement
  outDir: 'dist',

  // Code splitting and bundling
  splitting: false, // Keep it simple for CLI
  sourcemap: true,
  clean: true, // Clean dist folder before build

  // TypeScript
  dts: true, // Generate .d.ts files

  // CLI-specific optimizations
  bundle: true, // Bundle dependencies for smaller output
  minify: false, // Keep readable for debugging

  // External dependencies (don't bundle these)
  external: [
    '@anthropic-ai/claude-code', // Keep external for user's claude-code installation
  ],

  // No banner needed - the entry file already has shebang

  // Platform
  platform: 'node',
});

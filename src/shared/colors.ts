import pc from 'picocolors';

// Console output utilities with colors for CLI messaging
export const colors = {
  // Basic colors are provided directly by picocolors
  reset: pc.reset,
  red: pc.red,
  green: pc.green,
  yellow: pc.yellow,
  blue: pc.blue,
  magenta: pc.magenta,
  cyan: pc.cyan,
  white: pc.white,
  gray: pc.gray,

  // Helper functions for common patterns
  success: (text: string) => pc.green(text),
  error: (text: string) => pc.red(text),
  warning: (text: string) => pc.yellow(text),
  info: (text: string) => pc.cyan(text),
  dim: (text: string) => pc.gray(text),
  bold: (text: string) => pc.bold(text),

  // Status indicators
  check: '✓',
  cross: '✗',
  arrow: '→',
  bullet: '•',
};

// Console logging utilities
export function logSuccess(message: string): void {
  console.log(`${colors.success(colors.check)} ${message}`);
}

export function logError(message: string): void {
  console.error(`${colors.error(colors.cross)} ${message}`);
}

export function logWarning(message: string): void {
  console.warn(`${colors.warning(colors.arrow)} ${message}`);
}

export function logInfo(message: string): void {
  console.log(`${colors.info(colors.bullet)} ${message}`);
}

export function logDim(message: string): void {
  console.log(colors.dim(message));
}

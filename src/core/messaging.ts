// Console output utilities with colors for CLI messaging

export const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Helper functions for common patterns
  success: (text: string) => `\x1b[32m${text}\x1b[0m`,
  error: (text: string) => `\x1b[31m${text}\x1b[0m`,
  warning: (text: string) => `\x1b[33m${text}\x1b[0m`,
  info: (text: string) => `\x1b[36m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[90m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,

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

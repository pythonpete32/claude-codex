import terminalSize from 'terminal-size';

/**
 * Get exact terminal width with fallback to 80 columns
 */
export function getExactTerminalWidth(): number {
  return terminalSize().columns ?? 80;
}

/**
 * Get adjusted terminal width with responsive margins
 *
 * Applies smart margins based on terminal width to prevent text
 * from spanning the full width on very wide terminals.
 */
export function getTerminalWidth(terminalWidth = 0): number {
  let adjustedWidth = terminalWidth;
  if (adjustedWidth === 0) {
    adjustedWidth = getExactTerminalWidth();
  }

  if (adjustedWidth > 150) {
    return adjustedWidth - 40;
  }
  if (adjustedWidth > 120) {
    return adjustedWidth - 30;
  }
  if (adjustedWidth > 100) {
    return adjustedWidth - 20;
  }
  return adjustedWidth;
}

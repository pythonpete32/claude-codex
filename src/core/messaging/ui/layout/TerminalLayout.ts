import { getTerminalWidth } from '../utils/terminal-size.js';

/**
 * Get adaptive width following GitHub issue guidance: 60-120 character range
 *
 * This ensures components are readable on both narrow and wide terminals
 * while preventing excessive line lengths on very wide displays.
 */
export function getAdaptiveWidth(): number {
  const terminalWidth = getTerminalWidth();

  // Follow GitHub issue guidance: 60-120 character adaptive width
  if (terminalWidth >= 120) return 120;
  if (terminalWidth >= 80) return Math.min(100, terminalWidth - 10);
  return Math.max(60, terminalWidth - 5);
}

/**
 * Responsive wrapper for content based on terminal size
 */
export interface ResponsiveOptions {
  minWidth?: number;
  maxWidth?: number;
  padding?: number;
}

/**
 * Calculate responsive width with custom options
 */
export function getResponsiveWidth(options: ResponsiveOptions = {}): number {
  const { minWidth = 60, maxWidth = 120, padding = 10 } = options;

  const terminalWidth = getTerminalWidth();
  const availableWidth = Math.max(0, terminalWidth - padding);

  return Math.min(maxWidth, Math.max(minWidth, availableWidth));
}

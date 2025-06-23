import { colors } from '../../../messaging.js';

/**
 * Color options for box components using existing color system
 */
export type BoxColor = 'blue' | 'green' | 'yellow' | 'red' | 'cyan' | 'magenta';

/**
 * Smart text truncation with ellipsis
 */
export function smartTruncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Create a perfect bordered box with title, content, and color
 *
 * Uses existing picocolors integration from messaging.ts to maintain consistency
 * with the rest of the application's color scheme.
 */
export function createPerfectBox(
  title: string,
  content: string,
  width: number,
  color: BoxColor
): string {
  // Ensure minimum width for readability
  const actualWidth = Math.max(width, 60);
  const contentWidth = actualWidth - 4; // Account for borders and padding

  // Create perfectly aligned border components
  const topBorder = `┌${'─'.repeat(actualWidth - 2)}┐`;
  const bottomBorder = `└${'─'.repeat(actualWidth - 2)}┘`;
  const separator = `├${'─'.repeat(actualWidth - 2)}┤`;

  // Format title line with exact padding
  const titleLine = `│ ${title.padEnd(contentWidth)} │`;

  // Process content with proper line wrapping and padding
  const contentLines = content
    .split('\n')
    .map((line) => {
      if (line.length <= contentWidth) {
        return `│ ${line.padEnd(contentWidth)} │`;
      }
      // Word wrap long lines
      const words = line.split(' ');
      const wrappedLines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= contentWidth) {
          currentLine = currentLine ? currentLine + ' ' + word : word;
        } else {
          if (currentLine) {
            wrappedLines.push(`│ ${currentLine.padEnd(contentWidth)} │`);
            currentLine = word;
          } else {
            // Single word too long, truncate it
            wrappedLines.push(`│ ${smartTruncate(word, contentWidth).padEnd(contentWidth)} │`);
          }
        }
      }
      if (currentLine) {
        wrappedLines.push(`│ ${currentLine.padEnd(contentWidth)} │`);
      }
      return wrappedLines.join('\n');
    })
    .join('\n');

  const fullBox = [topBorder, titleLine, separator, contentLines, bottomBorder].join('\n');

  // Apply colors using existing color system
  switch (color) {
    case 'blue':
      return colors.blue(colors.bold(fullBox));
    case 'green':
      return colors.green(colors.bold(fullBox));
    case 'yellow':
      return colors.yellow(colors.bold(fullBox));
    case 'red':
      return colors.red(colors.bold(fullBox));
    case 'cyan':
      return colors.cyan(colors.bold(fullBox));
    case 'magenta':
      return colors.magenta(colors.bold(fullBox));
    default:
      return fullBox;
  }
}

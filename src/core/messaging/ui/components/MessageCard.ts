import { getAdaptiveWidth } from '../layout/TerminalLayout.js';
import { createPerfectBox } from './BoxComponent.js';

/**
 * AssistantMessage Component - Display Claude responses with smart wrapping
 *
 * Creates visually appealing bordered boxes for assistant text messages
 * with proper word wrapping and terminal-responsive layout.
 */
export function displayAssistantMessage(text: string): string {
  if (!text.trim()) return '';

  const width = getAdaptiveWidth();
  const title = '🤖 Claude';

  return createPerfectBox(title, text, width, 'green');
}

/**
 * Console output version of assistant message
 */
export function logAssistantMessage(text: string): void {
  const message = displayAssistantMessage(text);
  if (message) {
    console.log(message);
  }
}

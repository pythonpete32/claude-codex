import { createPerfectBox, smartTruncate } from '~/messaging/ui/components/BoxComponent.js';
import { getAdaptiveWidth } from '~/messaging/ui/layout/TerminalLayout.js';
import { generateResultMetrics } from '~/messaging/ui/utils/content-summarizer.js';

/**
 * Tool result block interface matching Claude SDK types
 */
interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string | Record<string, any>[];
  is_error?: boolean;
}

/**
 * ToolResultSummary Component - Compact results with emoji metrics
 *
 * Displays tool execution results in a visually organized format with
 * smart truncation and context-aware metrics based on tool type.
 */
export function displayToolResultSummary(result: ToolResultBlock, toolName?: string): string {
  const width = getAdaptiveWidth();
  const isError = result.is_error;
  const statusIcon = isError ? '❌' : '✅';
  const title = `${statusIcon} ${toolName || 'Tool'} Result`;

  let content =
    typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2);

  // Add emoji-based metrics for specific tool types
  const metrics = generateResultMetrics(content, toolName);
  if (metrics) {
    content = `${content}\n\n${metrics}`;
  }

  // Smart truncation for long results
  const maxContentLength = (width - 4) * 10; // Max 10 lines of content
  if (content.length > maxContentLength) {
    const lines = content.split('\n');
    if (lines.length > 10) {
      content = `${lines.slice(0, 8).join('\n')}\n... and ${lines.length - 8} more lines`;
    } else {
      content = smartTruncate(content, maxContentLength);
    }
  }

  const color = isError ? 'red' : 'green';
  return createPerfectBox(title, content, width, color);
}

/**
 * Console output version of tool result summary
 */
export function logToolResultSummary(result: ToolResultBlock, toolName?: string): void {
  console.log(displayToolResultSummary(result, toolName));
}

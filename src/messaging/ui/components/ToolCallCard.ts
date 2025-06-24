import { createPerfectBox, smartTruncate } from '~/messaging/ui/components/BoxComponent.js';
import { getAdaptiveWidth } from '~/messaging/ui/layout/TerminalLayout.js';
import { getToolIcon } from '~/messaging/ui/utils/content-summarizer.js';

/**
 * Tool use block interface matching Claude SDK types
 */
interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, any>;
}

/**
 * Display tool execution info in bordered box
 *
 * Creates visually appealing cards for tool calls with smart parameter
 * formatting and appropriate truncation for different terminal widths.
 */
export function displayToolCallCard(toolCall: ToolUseBlock): string {
  const width = getAdaptiveWidth();
  const toolIcon = getToolIcon(toolCall.name);
  const title = `${toolIcon} ${toolCall.name}`;

  // Format parameters smartly for different tools
  const paramLines: string[] = [];
  Object.entries(toolCall.input).forEach(([key, value]) => {
    if (typeof value === 'string') {
      if (key === 'file_path') {
        paramLines.push(`📁 ${smartTruncate(value, width - 8)}`);
      } else if (key === 'command') {
        paramLines.push(`💻 ${smartTruncate(value, width - 8)}`);
      } else if (value.length > 50) {
        paramLines.push(`${key}: ${smartTruncate(value, width - key.length - 8)}`);
      } else {
        paramLines.push(`${key}: ${value}`);
      }
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        paramLines.push(`${key}: [${value.length} items]`);
      } else {
        paramLines.push(`${key}: []`);
      }
    } else {
      const jsonStr = JSON.stringify(value, null, 2);
      if (jsonStr.length < width - 10) {
        paramLines.push(`${key}:`);
        paramLines.push(jsonStr);
      } else {
        paramLines.push(`${key}: ${smartTruncate(JSON.stringify(value), width - key.length - 8)}`);
      }
    }
  });

  const content = paramLines.join('\n');
  return createPerfectBox(title, content, width, 'blue');
}

/**
 * Console output version of tool call card
 */
export function logToolCallCard(toolCall: ToolUseBlock): void {
  console.log(displayToolCallCard(toolCall));
}

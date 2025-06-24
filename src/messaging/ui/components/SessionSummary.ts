import { createPerfectBox, smartTruncate } from '~/messaging/ui/components/BoxComponent.js';
import { getAdaptiveWidth } from '~/messaging/ui/layout/TerminalLayout.js';

/**
 * Session messages from Claude SDK
 */
interface SDKSystemMessage {
  type: 'system';
  subtype: 'init';
  apiKeySource: string;
  cwd: string;
  session_id: string;
  tools: string[];
  mcp_servers: {
    name: string;
    status: string;
  }[];
  model: string;
  permissionMode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan';
}

interface SDKResultMessage {
  type: 'result';
  subtype: 'success' | 'error_max_turns' | 'error_during_execution';
  duration_ms: number;
  duration_api_ms: number;
  is_error: boolean;
  num_turns: number;
  session_id: string;
  total_cost_usd: number;
  result?: string;
}

/**
 * SessionSummary Component - Session start/end information
 *
 * Displays important session lifecycle events including initialization
 * details and execution summaries with timing and cost information.
 */
export function displaySessionSummary(message: SDKSystemMessage | SDKResultMessage): string {
  const width = getAdaptiveWidth();

  if (message.type === 'system') {
    const title = '🚀 Session Start';
    const content = [
      `Model: ${message.model}`,
      `Tools: ${message.tools.length} available`,
      `Session: ${message.session_id.substring(0, 8)}...`,
      `Mode: ${message.permissionMode}`,
    ].join('\n');

    return createPerfectBox(title, content, width, 'yellow');
  }
  const isError = message.is_error || message.subtype.startsWith('error');
  const title = isError ? '💥 Session Failed' : '🎉 Session Complete';

  const details = [];
  if (!isError && message.subtype === 'success') {
    details.push(`Result: ${smartTruncate((message as any).result || 'Success', width - 12)}`);
  }
  details.push(`⏱️  ${(message.duration_ms / 1000).toFixed(2)}s`);
  details.push(`🔄 ${message.num_turns} turns`);
  details.push(`💰 $${(message.total_cost_usd || 0).toFixed(6)}`);

  const content = details.join('\n');
  const color = isError ? 'red' : 'green';
  return createPerfectBox(title, content, width, color);
}

/**
 * Console output version of session summary
 */
export function logSessionSummary(message: SDKSystemMessage | SDKResultMessage): void {
  console.log(displaySessionSummary(message));
}

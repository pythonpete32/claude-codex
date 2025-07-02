import { setStatusLogger } from '@claude-codex/types';
import { createChildLogger } from './logger';

// Create logger for status mapper
const statusMapperLogger = createChildLogger('status-mapper');

/**
 * Initialize logging for packages that need it
 * This allows types package to remain pure while enabling logging
 */
export function initializeLogging() {
  // Set up status mapping logging
  setStatusLogger((toolType: string, status: string) => {
    statusMapperLogger.warn({
      toolType,
      originalStatus: status,
      key: `${toolType}:${status}`,
      msg: `🔍 New MCP tool discovered: ${toolType}:${status}`
    }, 'Unknown status mapping discovered - consider contributing this mapping to improve the ecosystem');
  });
}

// Auto-initialize in non-test environments
if (process.env.NODE_ENV !== 'test') {
  initializeLogging();
}
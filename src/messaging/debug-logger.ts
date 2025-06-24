import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import type { SDKMessage } from '@anthropic-ai/claude-code';
import type { ClaudeAgentOptions } from '~/messaging/sdk-wrapper.js';

/**
 * Debug metadata for logging
 */
export interface DebugMetadata {
  taskId: string;
  finalResponse: string;
  success: boolean;
  cost: number;
  duration: number;
  messagesCount: number;
  options?: Partial<ClaudeAgentOptions>;
}

/**
 * Debug logging options
 */
export interface DebugOptions {
  debugPath?: string;
}

/**
 * Complete debug log structure
 */
export interface DebugLog extends DebugMetadata {
  timestamp: string;
  messages: SDKMessage[];
}

/**
 * Log debug messages when debug flag is enabled
 *
 * Creates comprehensive debug files similar to existing .codex/debug/ structure
 * for troubleshooting and testing purposes.
 */
export async function logDebugMessages(
  messages: SDKMessage[],
  metadata: DebugMetadata,
  options: DebugOptions = {}
): Promise<void> {
  try {
    const debugLog: DebugLog = {
      ...metadata,
      timestamp: new Date().toISOString(),
      messages,
    };

    const debugFileName = generateDebugFileName(metadata.taskId);
    const debugPath = options.debugPath || join('.codex', 'debug', debugFileName);

    // Ensure debug directory exists
    await fs.mkdir(dirname(debugPath), { recursive: true });

    // Write debug log
    await fs.writeFile(debugPath, JSON.stringify(debugLog, null, 2), 'utf-8');

    console.log(`🐛 Debug log saved: ${debugPath}`);
  } catch (error) {
    console.warn('⚠️  Failed to save debug log:', error);
    // Don't throw - debug logging should not break the main flow
  }
}

/**
 * Generate debug file name following existing pattern
 *
 * Format: task-{taskId}-messages.json
 */
export function generateDebugFileName(taskId: string): string {
  return `${taskId}-messages.json`;
}

/**
 * Load debug messages for testing purposes
 *
 * Utility function to load existing debug data for use in tests
 */
export async function loadDebugMessages(debugPath: string): Promise<DebugLog> {
  try {
    const content = await fs.readFile(debugPath, 'utf-8');
    return JSON.parse(content) as DebugLog;
  } catch (error) {
    throw new Error(`Failed to load debug messages from ${debugPath}: ${error}`);
  }
}

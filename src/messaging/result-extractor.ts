import type { AgentResult } from '~/messaging/sdk-wrapper.js';

/**
 * Extracted results from agent execution
 */
export interface ExtractedResults {
  finalResponse: string;
  success: boolean;
  cost: number;
  duration: number;
  messageCount: number;
}

/**
 * Extract final results from completed SDK execution
 *
 * This function extracts data from the AgentResult object (NOT from messages)
 * as the SDK provides the finalResponse directly when Claude completes naturally.
 */
export function extractAgentResults(agentResult: AgentResult): ExtractedResults {
  return {
    finalResponse: agentResult.finalResponse,
    success: agentResult.success,
    cost: agentResult.cost,
    duration: agentResult.duration,
    messageCount: agentResult.messageCount,
  };
}

/**
 * Log the final response with a fallback for empty responses
 *
 * This provides feedback about whether Claude completed naturally or was interrupted.
 * Empty responses typically indicate the task was cut short by maxTurns or other limits.
 */
export function logFinalResponse(finalResponse: string, fallback?: string): string {
  const responseToLog = finalResponse.trim();

  if (responseToLog) {
    console.log('\n📋 Final Response:');
    console.log('─'.repeat(50));
    console.log(responseToLog);
    console.log('─'.repeat(50));
    return responseToLog;
  }
  const fallbackMessage = fallback || 'Task was interrupted - no final response available';
  console.log('\n⚠️  Final Response:');
  console.log('─'.repeat(50));
  console.log(fallbackMessage);
  console.log('─'.repeat(50));
  return fallbackMessage;
}

/**
 * Format execution summary for logging
 *
 * Provides a nice summary of the agent execution including timing,
 * cost, and success information.
 */
export function formatExecutionSummary(results: ExtractedResults): string {
  const status = results.success ? '✅ Success' : '❌ Failed';
  const duration = `${results.duration}ms`;
  const cost = `$${results.cost.toFixed(4)}`;
  const messageCount = `${results.messageCount} messages`;

  const summary = [
    '\n📊 Execution Summary:',
    '─'.repeat(30),
    `Status: ${status}`,
    `Duration: ${duration}`,
    `Cost: ${cost}`,
    `Messages: ${messageCount}`,
    `Has Final Response: ${results.finalResponse.trim() ? 'Yes' : 'No'}`,
    '─'.repeat(30),
  ].join('\n');

  console.log(summary);
  return summary;
}

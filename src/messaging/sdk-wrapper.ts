import { query, type SDKMessage, type SDKResultMessage } from '@anthropic-ai/claude-code';
import type { ClaudeSDKMCPConfig } from '~/config/config.js';
import { logDebugMessages } from '~/messaging/debug-logger.js';
import { processMessagesWithDisplay } from '~/messaging/message-processor.js';
import { extractAgentResults, logFinalResponse } from '~/messaging/result-extractor.js';
import { forceSubscriptionAuth } from '~/shared/auth.js';
import { AgentExecutionError } from '~/shared/errors.js';

/**
 * Complete options interface supporting all Claude Code SDK parameters
 */
export interface ClaudeAgentOptions {
  // Required
  prompt: string;

  // Control Options
  abortController?: AbortController;
  maxTurns?: number; // NO default - natural completion
  cwd?: string;

  // System Prompt Options
  customSystemPrompt?: string; // Override default system prompt
  appendSystemPrompt?: string; // Add to default system prompt

  // Tool Control
  allowedTools?: string[]; // Specify permitted tools
  disallowedTools?: string[]; // Specify prohibited tools

  // Permission Control (DEFAULT: 'bypassPermissions')
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan';

  // Runtime Options
  executable?: 'node' | 'bun'; // JavaScript runtime
  executableArgs?: string[]; // Additional runtime arguments
  pathToClaudeCodeExecutable?: string; // Custom executable path

  // Display Options
  displayOptions?: {
    showToolCalls?: boolean;
    showTimestamps?: boolean;
    verbose?: boolean;
  };

  // MCP Configuration
  mcpConfig?: ClaudeSDKMCPConfig;

  // Debug Options
  debug?: boolean; // Enable debug message logging
  debugPath?: string; // Custom debug file path

  // Testing Support
  _queryFunction?: typeof query; // Injectable for testing
}

/**
 * Result interface maintaining compatibility with existing AgentResult
 */
export interface AgentResult {
  messages: SDKMessage[];
  finalResponse: string; // From SDK, not extracted
  success: boolean;
  cost: number;
  duration: number;
  messageCount: number;
}

/**
 * Single point of entry for all Claude SDK interactions with proper message processing
 *
 * Key improvements:
 * - No default maxTurns (allows natural completion)
 * - Real-time message display
 * - Debug logging when enabled
 * - Full SDK option support
 * - Injectable query function for testing
 */
export async function runClaudeAgent(options: ClaudeAgentOptions): Promise<AgentResult> {
  // CRITICAL: Force subscription auth to prevent API key usage
  forceSubscriptionAuth();

  const startTime = Date.now();
  const queryFunction = options._queryFunction || query;

  // Build SDK options with proper defaults
  const sdkOptions: Parameters<typeof query>[0]['options'] = {
    cwd: options.cwd,
    // Only set maxTurns if explicitly provided (NO DEFAULT)
    ...(options.maxTurns !== undefined && { maxTurns: options.maxTurns }),
    customSystemPrompt: options.customSystemPrompt,
    appendSystemPrompt: options.appendSystemPrompt,
    allowedTools: options.allowedTools,
    disallowedTools: options.disallowedTools,
    permissionMode: options.permissionMode || 'bypassPermissions', // Default to bypass
    executable: options.executable,
    executableArgs: options.executableArgs,
    pathToClaudeCodeExecutable: options.pathToClaudeCodeExecutable,
    // Add MCP configuration if provided
    ...(options.mcpConfig?.mcpServers && { mcpServers: options.mcpConfig.mcpServers }),
  };

  let messages: SDKMessage[] = [];
  let finalResponse = '';
  let success = false;
  let cost = 0;
  let duration = 0;

  try {
    // Create async generator for messages
    const messageIterator = queryFunction({
      prompt: options.prompt,
      abortController: options.abortController,
      options: sdkOptions,
    });

    // Process messages with real-time display
    messages = await processMessagesWithDisplay(messageIterator, options.displayOptions);

    // Extract results from the final result message
    const resultMessage = messages
      .reverse()
      .find((msg): msg is SDKResultMessage => msg.type === 'result');

    if (resultMessage) {
      cost = resultMessage.total_cost_usd;
      success = !resultMessage.is_error;
      duration = resultMessage.duration_ms || Date.now() - startTime;
      // SDK provides finalResponse in success result messages
      if (resultMessage.subtype === 'success' && 'result' in resultMessage) {
        finalResponse = resultMessage.result || '';
      }
    } else {
      // If no result message, assume success (as original code did)
      success = true;
      duration = Date.now() - startTime;
    }

    const agentResult: AgentResult = {
      messages,
      finalResponse,
      success,
      cost,
      duration: duration,
      messageCount: messages.length,
    };

    // Extract and log results
    const extractedResults = extractAgentResults(agentResult);
    logFinalResponse(extractedResults.finalResponse);

    // Debug logging if enabled
    if (options.debug) {
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      await logDebugMessages(
        messages,
        {
          taskId,
          finalResponse: extractedResults.finalResponse,
          success: extractedResults.success,
          cost: extractedResults.cost,
          duration: extractedResults.duration,
          messagesCount: extractedResults.messageCount,
          options,
        },
        {
          debugPath: options.debugPath,
        }
      );
    }

    return agentResult;
  } catch (error) {
    throw new AgentExecutionError(
      error instanceof Error ? error.message : 'Unknown error during agent execution',
      error instanceof Error ? error : undefined
    );
  }
}

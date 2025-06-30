import { EventEmitter } from 'node:events';
import type { LogEntry, MessageContent } from '@claude-codex/types';
import { createChildLogger } from '@claude-codex/utils';
import { ParserRegistry } from '@claude-codex/core';

// Define specific content types based on MessageContent
type ToolUse = MessageContent & {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, any>;
};

type ToolResult = MessageContent & {
  type: 'tool_result';
  tool_use_id: string;
};
import type {
  PendingCorrelation,
  CorrelationEngineEvents,
  CorrelationEngineOptions,
} from '../types.js';

// Create logger for this module
const logger = createChildLogger('correlation-engine');

/**
 * Correlation engine for matching tool calls with their results.
 * Maintains a 1:1 relationship between tool calls and results.
 */
export class CorrelationEngine extends EventEmitter {
  private pendingCalls = new Map<string, PendingCorrelation>();
  private pendingResults = new Map<string, PendingCorrelation>();
  private parserRegistry: ParserRegistry;
  private timeoutMs: number;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private cleanupIntervalMs: number;

  constructor(
    parserRegistry: ParserRegistry,
    options: CorrelationEngineOptions = {}
  ) {
    super();
    this.parserRegistry = parserRegistry;
    this.timeoutMs = options.timeoutMs ?? 300000; // 5 minutes default
    this.cleanupIntervalMs = options.cleanupIntervalMs ?? 60000; // 1 minute default

    logger.info({ timeoutMs: this.timeoutMs }, 'CorrelationEngine initialized');
  }

  /**
   * Start the correlation engine.
   */
  start(): void {
    if (this.cleanupInterval) {
      logger.warn('CorrelationEngine already started');
      return;
    }

    // Periodic cleanup of timed-out correlations
    this.cleanupInterval = setInterval(() => {
      this.cleanupTimedOut();
    }, this.cleanupIntervalMs);

    logger.info('CorrelationEngine started');
  }

  /**
   * Stop the correlation engine.
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.pendingCalls.clear();
    this.pendingResults.clear();

    logger.info('CorrelationEngine stopped');
  }

  /**
   * Process a log entry for correlation.
   * Returns correlated tool props if a match is found.
   */
  async processEntry(entry: LogEntry): Promise<any | null> {
    // Extract tool data from message content
    const toolUse = this.extractToolUse(entry);
    const toolResult = this.extractToolResult(entry);

    if (toolUse) {
      logger.debug(
        { toolId: toolUse.id, toolName: toolUse.name },
        'Processing tool call'
      );

      // Check if we already have a result waiting
      const pendingResult = this.pendingResults.get(toolUse.id);
      if (pendingResult) {
        logger.debug(
          { toolId: toolUse.id },
          'Found matching result for tool call'
        );

        // Found matching result - remove from pending and parse
        this.pendingResults.delete(toolUse.id);
        return this.parseAndEmit(entry, pendingResult.entry, toolUse);
      }

      // No result yet - store call as pending
      this.pendingCalls.set(toolUse.id, {
        entry,
        timestamp: Date.now(),
        attempts: 0,
      });

      logger.debug({ toolId: toolUse.id }, 'Stored pending tool call');
      return null;
    }

    if (toolResult) {
      logger.debug(
        { toolId: toolResult.tool_use_id },
        'Processing tool result'
      );

      // Check if we have a call waiting
      const pendingCall = this.pendingCalls.get(toolResult.tool_use_id);
      if (pendingCall) {
        logger.debug(
          { toolId: toolResult.tool_use_id },
          'Found matching call for tool result'
        );

        // Found matching call - remove from pending and parse
        this.pendingCalls.delete(toolResult.tool_use_id);

        // Extract tool info from the call
        const callToolUse = this.extractToolUse(pendingCall.entry);
        if (callToolUse) {
          return this.parseAndEmit(pendingCall.entry, entry, callToolUse);
        }
      }

      // No call yet - store result as pending
      this.pendingResults.set(toolResult.tool_use_id, {
        entry,
        timestamp: Date.now(),
        attempts: 0,
      });

      logger.debug(
        { toolId: toolResult.tool_use_id },
        'Stored pending tool result'
      );
      return null;
    }

    // Not a tool-related entry
    return null;
  }

  /**
   * Parse correlated entries and emit completion event.
   */
  private async parseAndEmit(
    callEntry: LogEntry,
    resultEntry: LogEntry,
    toolUse: ToolUse
  ): Promise<any> {
    const startTime = Date.parse(callEntry.timestamp);
    const endTime = Date.parse(resultEntry.timestamp);
    const duration = endTime - startTime;

    try {
      // Find appropriate parser
      const parser = this.parserRegistry.getForEntry(callEntry);
      if (!parser) {
        logger.warn({ toolName: toolUse.name }, 'No parser found for tool');
        return null;
      }

      // Parse the correlated entries
      const parsed = await parser.parse(callEntry, resultEntry);

      // Emit completion event
      this.emit('tool:completed', {
        toolName: toolUse.name,
        toolId: toolUse.id,
        duration,
        call: callEntry,
        result: resultEntry,
      });

      logger.info(
        {
          toolName: toolUse.name,
          toolId: toolUse.id,
          duration,
        },
        'Tool completed'
      );

      return parsed;
    } catch (error) {
      logger.error(
        {
          error,
          toolName: toolUse.name,
          toolId: toolUse.id,
        },
        'Failed to parse correlated entries'
      );
      return null;
    }
  }

  /**
   * Extract tool use from log entry.
   */
  private extractToolUse(entry: LogEntry): ToolUse | null {
    if (entry.type !== 'assistant' || !entry.content) {
      return null;
    }

    const content = Array.isArray(entry.content)
      ? entry.content
      : typeof entry.content === 'string'
        ? []
        : [entry.content];

    const toolUse = content.find(
      (item): item is ToolUse =>
        typeof item === 'object' &&
        item !== null &&
        'type' in item &&
        item.type === 'tool_use'
    );

    return toolUse || null;
  }

  /**
   * Extract tool result from log entry.
   */
  private extractToolResult(entry: LogEntry): ToolResult | null {
    if (entry.type !== 'user' || !entry.content) {
      return null;
    }

    const content = Array.isArray(entry.content)
      ? entry.content
      : typeof entry.content === 'string'
        ? []
        : [entry.content];

    const toolResult = content.find(
      (item): item is ToolResult =>
        typeof item === 'object' &&
        item !== null &&
        'type' in item &&
        item.type === 'tool_result'
    );

    return toolResult || null;
  }

  /**
   * Clean up timed-out pending correlations.
   */
  private cleanupTimedOut(): void {
    const now = Date.now();
    let timedOutCount = 0;

    // Check pending calls
    for (const [toolId, pending] of this.pendingCalls.entries()) {
      if (now - pending.timestamp > this.timeoutMs) {
        const toolUse = this.extractToolUse(pending.entry);

        this.emit('tool:timeout', {
          toolName: toolUse?.name || 'unknown',
          toolId,
          call: pending.entry,
        });

        this.pendingCalls.delete(toolId);
        timedOutCount++;

        logger.warn(
          {
            toolId,
            toolName: toolUse?.name,
            age: now - pending.timestamp,
          },
          'Tool call timed out'
        );
      }
    }

    // Check pending results (shouldn't normally timeout, but clean up anyway)
    for (const [toolId, pending] of this.pendingResults.entries()) {
      if (now - pending.timestamp > this.timeoutMs) {
        this.pendingResults.delete(toolId);
        timedOutCount++;

        logger.warn(
          {
            toolId,
            age: now - pending.timestamp,
          },
          'Tool result timed out (orphaned)'
        );
      }
    }

    if (timedOutCount > 0) {
      logger.info({ timedOutCount }, 'Cleaned up timed-out correlations');
    }
  }

  /**
   * Get statistics about pending correlations.
   */
  getStats(): {
    pendingCalls: number;
    pendingResults: number;
    oldestPendingMs: number | null;
  } {
    const now = Date.now();
    let oldestTimestamp = now;

    for (const pending of this.pendingCalls.values()) {
      if (pending.timestamp < oldestTimestamp) {
        oldestTimestamp = pending.timestamp;
      }
    }

    for (const pending of this.pendingResults.values()) {
      if (pending.timestamp < oldestTimestamp) {
        oldestTimestamp = pending.timestamp;
      }
    }

    return {
      pendingCalls: this.pendingCalls.size,
      pendingResults: this.pendingResults.size,
      oldestPendingMs: oldestTimestamp < now ? now - oldestTimestamp : null,
    };
  }

  // Type-safe event emitter overrides
  emit<K extends keyof CorrelationEngineEvents>(
    event: K,
    ...args: Parameters<CorrelationEngineEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof CorrelationEngineEvents>(
    event: K,
    listener: CorrelationEngineEvents[K]
  ): this {
    return super.on(event, listener);
  }

  off<K extends keyof CorrelationEngineEvents>(
    event: K,
    listener: CorrelationEngineEvents[K]
  ): this {
    return super.off(event, listener);
  }
}

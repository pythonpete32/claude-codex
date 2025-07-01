/**
 * @fileoverview Service for transforming raw logs into parsed UI components
 * @module @dao/codex-api-server/services/transformation-service
 */

import {
	LogTransformer,
	ParserRegistry,
	type TransformResult,
} from "@claude-codex/core";
import { CorrelationEngine } from "@claude-codex/log-processor";
import type { LogEntry, MessageContent } from "@claude-codex/types";
import { createChildLogger } from "@claude-codex/utils";

const logger = createChildLogger("transformation-service");

/**
 * Enhanced log entry with parsed UI props
 */
export interface EnhancedLogEntry extends LogEntry {
	/** Parsed UI-ready props if this is a tool entry */
	parsedProps?: TransformResult;
}

/**
 * Service for transforming raw log entries into enhanced entries with parsed props
 */
export class TransformationService {
	private transformer: LogTransformer;
	private correlationEngine: CorrelationEngine;
	private parserRegistry: ParserRegistry;

	constructor() {
		this.parserRegistry = new ParserRegistry();
		this.transformer = new LogTransformer(this.parserRegistry, logger);
		this.correlationEngine = new CorrelationEngine();
	}

	/**
	 * Transform a raw log entry into an enhanced entry with parsed props
	 */
	async transformEntry(entry: LogEntry): Promise<EnhancedLogEntry> {
		// Start with the raw entry
		const enhanced: EnhancedLogEntry = { ...entry };

		// Check if this is a tool entry that we can parse
		if (entry.type === "assistant" && this.isToolEntry(entry)) {
			try {
				// For now, we'll parse without correlation
				// In a real implementation, we'd need to handle correlation properly
				const result = this.transformer.transform(entry);
				if (result) {
					enhanced.parsedProps = result;
				}
			} catch (error) {
				logger.warn("Failed to parse entry", {
					uuid: entry.uuid,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		return enhanced;
	}

	/**
	 * Transform multiple entries with correlation
	 */
	async transformEntries(entries: LogEntry[]): Promise<EnhancedLogEntry[]> {
		const enhanced: EnhancedLogEntry[] = [];
		const pendingCalls = new Map<string, LogEntry>();

		for (const entry of entries) {
			// Handle correlation
			if (this.isToolCall(entry)) {
				const toolId = this.extractToolId(entry);
				if (toolId) {
					pendingCalls.set(toolId, entry);
				}
				enhanced.push({ ...entry });
			} else if (this.isToolResult(entry)) {
				const toolId = this.extractToolResultId(entry);
				const toolCall = toolId ? pendingCalls.get(toolId) : undefined;

				if (toolCall && toolId) {
					// We have a correlated pair
					const result = this.transformer.transform(toolCall, entry);
					if (result) {
						// Add parsed props to the tool call entry
						const callIndex = enhanced.findIndex(
							(e) => e.uuid === toolCall.uuid,
						);
						if (callIndex >= 0) {
							enhanced[callIndex].parsedProps = result;
						}
					}
					pendingCalls.delete(toolId);
				}
				enhanced.push({ ...entry });
			} else {
				// Regular entry
				enhanced.push({ ...entry });
			}
		}

		return enhanced;
	}

	/**
	 * Check if entry contains tool usage
	 */
	private isToolEntry(entry: LogEntry): boolean {
		if (entry.type !== "assistant") return false;

		const content = Array.isArray(entry.content)
			? entry.content
			: typeof entry.content === "object"
				? [entry.content]
				: [];

		return content.some((block) => {
			const messageBlock = block as MessageContent;
			return (
				messageBlock.type === "tool_use" || messageBlock.type === "tool_result"
			);
		});
	}

	/**
	 * Check if entry is a tool call
	 */
	private isToolCall(entry: LogEntry): boolean {
		if (entry.type !== "assistant") return false;

		const content = Array.isArray(entry.content)
			? entry.content
			: typeof entry.content === "object"
				? [entry.content]
				: [];

		return content.some(
			(block) => (block as MessageContent).type === "tool_use",
		);
	}

	/**
	 * Check if entry is a tool result
	 */
	private isToolResult(entry: LogEntry): boolean {
		if (entry.type !== "assistant") return false;

		const content = Array.isArray(entry.content)
			? entry.content
			: typeof entry.content === "object"
				? [entry.content]
				: [];

		return content.some(
			(block) => (block as MessageContent).type === "tool_result",
		);
	}

	/**
	 * Extract tool ID from tool call
	 */
	private extractToolId(entry: LogEntry): string | null {
		const content = Array.isArray(entry.content)
			? entry.content
			: typeof entry.content === "object"
				? [entry.content]
				: [];

		for (const block of content) {
			const messageBlock = block as MessageContent;
			if (messageBlock.type === "tool_use" && messageBlock.id) {
				return messageBlock.id;
			}
		}

		return null;
	}

	/**
	 * Extract tool ID from tool result
	 */
	private extractToolResultId(entry: LogEntry): string | null {
		const content = Array.isArray(entry.content)
			? entry.content
			: typeof entry.content === "object"
				? [entry.content]
				: [];

		for (const block of content) {
			const messageBlock = block as MessageContent;
			if (messageBlock.type === "tool_result" && messageBlock.tool_use_id) {
				return messageBlock.tool_use_id;
			}
		}

		return null;
	}
}

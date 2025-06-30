/**
 * @fileoverview Main transformer class for processing log entries
 * @module @dao/transformer/transformer
 */

import { CorrelationEngine } from "./correlation-engine";
import type { FixtureData } from "./format-converter";
import { FormatConverter } from "./format-converter";
import type {
	LogEntry,
	PendingCorrelation,
	ToolResult,
	ToolUse,
	TransformError,
	TransformedItem,
	TransformOptions,
	TransformResult,
} from "./types";

/**
 * Chat item parser function type
 */
type ChatItemParser = (
	fixtureData: FixtureData,
) => Promise<Record<string, unknown>> | Record<string, unknown>;

/**
 * Parser module interface for dynamic imports
 */
interface ParserModule {
	[key: string]: ChatItemParser | unknown;
	default?: ChatItemParser;
}

import { getComponentType } from "./types";

/**
 * Default configuration
 */
const DEFAULT_OPTIONS: TransformOptions = {
	correlationTimeout: 5 * 60 * 1000, // 5 minutes
	preserveTimestamps: false,
	debug: false,
};

/**
 * Transforms log entries into typed chat item components
 */
export class LogEntryTransformer {
	private correlation: CorrelationEngine;
	private converter: FormatConverter;
	private options: Required<TransformOptions>;
	private parserCache = new Map<string, ChatItemParser>();

	constructor(options: TransformOptions = {}) {
		this.correlation = new CorrelationEngine();
		this.converter = new FormatConverter();
		this.options = { ...DEFAULT_OPTIONS, ...options } as Required<TransformOptions>;
	}

	/**
	 * Process a single log entry
	 */
	async process(entry: LogEntry): Promise<TransformResult | null> {
		try {
			// Clean up expired correlations periodically
			this.correlation.clearExpired(this.options.correlationTimeout);

			// Check if this is a tool call
			const toolUse = this.extractToolUse(entry);
			if (toolUse) {
				// Try to correlate with existing result
				const correlated = this.correlation.process(entry);

				if (correlated) {
					// Result was already waiting - emit complete immediately
					const completeItem = await this.createCompleteItem(correlated.call, correlated.result);

					if (this.options.debug) {
						console.log(
							`[Transformer] Emitting complete ${completeItem.type} for ${toolUse.id} (result was waiting)`,
						);
					}

					return { item: completeItem };
				} else {
					// No result yet - emit pending component
					const componentType = getComponentType(toolUse.name);
					const pendingItem = await this.createPendingItem(entry, toolUse, componentType);

					if (this.options.debug) {
						console.log(`[Transformer] Emitting pending ${componentType} for ${toolUse.id}`);
					}

					return { item: pendingItem };
				}
			}

			// Check if this is a tool result
			const toolResult = this.extractToolResult(entry);
			if (toolResult) {
				// Try to correlate with pending call
				const correlated = this.correlation.process(entry);

				if (correlated) {
					// We have both call and result - transform to complete item
					const completeItem = await this.createCompleteItem(correlated.call, correlated.result);

					if (this.options.debug) {
						console.log(
							`[Transformer] Emitting complete ${completeItem.type} for ${toolResult.tool_use_id}`,
						);
					}

					return { item: completeItem };
				} else {
					// Result arrived before call - wait for call
					if (this.options.debug) {
						console.log(
							`[Transformer] Buffering result ${toolResult.tool_use_id} - waiting for call`,
						);
					}
					return null;
				}
			}

			// Not a tool-related entry
			return null;
		} catch (error) {
			const transformError: TransformError = {
				code: "TRANSFORM_ERROR",
				message: error instanceof Error ? error.message : "Unknown error",
				entry,
				details: { error },
			};

			if (this.options.debug) {
				console.error("[Transformer] Error:", transformError);
			}

			return { error: transformError };
		}
	}

	/**
	 * Create a pending item (tool call without result)
	 */
	private async createPendingItem(
		entry: LogEntry,
		toolUse: ToolUse,
		componentType: string,
	): Promise<TransformedItem> {
		// Convert to fixture format without result
		const fixtureData = this.converter.toFixtureFormat(entry, undefined, componentType);

		// Get parser for this tool type
		const parser = await this.getParser(toolUse.name);

		// Create pending props
		const props = parser
			? await this.parseWithParser(parser, fixtureData, true)
			: ({
					toolUse: fixtureData.toolCall.tool,
					status: "pending",
					timestamp: this.options.preserveTimestamps ? entry.timestamp : new Date().toISOString(),
					toolResult: null,
				} as Record<string, unknown>);

		return {
			type: componentType,
			id: toolUse.id,
			correlationId: entry.uuid,
			timestamp: entry.timestamp,
			status: "pending",
			props,
		};
	}

	/**
	 * Create a complete item (tool call with result)
	 */
	private async createCompleteItem(
		callEntry: LogEntry,
		resultEntry: LogEntry,
	): Promise<TransformedItem> {
		const toolUse = this.extractToolUse(callEntry);
		const toolResult = this.extractToolResult(resultEntry);

		if (!toolUse || !toolResult) {
			throw new Error("Missing tool data in correlated entries");
		}

		const componentType = getComponentType(toolUse.name);

		// Convert to fixture format with result
		const fixtureData = this.converter.toFixtureFormat(callEntry, resultEntry, componentType);

		// Get parser for this tool type
		const parser = await this.getParser(toolUse.name);

		// Parse with the chat item parser
		const props = parser
			? await this.parseWithParser(parser, fixtureData, false)
			: ({
					toolUse: fixtureData.toolCall.tool,
					status: toolResult.is_error ? "failed" : "completed",
					timestamp: this.options.preserveTimestamps
						? resultEntry.timestamp
						: new Date().toISOString(),
					toolResult: fixtureData.toolResult?.toolUseResult,
				} as Record<string, unknown>);

		return {
			type: componentType,
			id: toolUse.id,
			correlationId: callEntry.uuid,
			timestamp: resultEntry.timestamp,
			status: toolResult.is_error ? "failed" : "completed",
			props,
		};
	}

	/**
	 * Get parser for a tool type
	 */
	private async getParser(toolName: string): Promise<ChatItemParser | null> {
		// Check cache first
		if (this.parserCache.has(toolName)) {
			return this.parserCache.get(toolName) || null;
		}

		try {
			// Map tool name to package name
			const packageName = this.getPackageName(toolName);

			// Dynamic import
			const module = (await import(packageName)) as ParserModule;
			const parser =
				(module[`parse${toolName}Tool`] as ChatItemParser) ||
				(module.default as ChatItemParser) ||
				null;

			// Cache for future use
			if (parser) {
				this.parserCache.set(toolName, parser);
			}

			return parser;
		} catch (error) {
			if (this.options.debug) {
				console.warn(`[Transformer] No parser found for ${toolName}:`, error);
			}
			return null;
		}
	}

	/**
	 * Parse fixture data with chat item parser
	 */
	private async parseWithParser(
		parser: ChatItemParser,
		fixtureData: FixtureData,
		isPending: boolean,
	): Promise<Record<string, unknown>> {
		try {
			// For pending items, create a minimal fixture with null result
			if (isPending) {
				const pendingFixture: FixtureData = {
					...fixtureData,
					toolResult: undefined,
					expectedComponentData: {
						type: fixtureData.expectedComponentData?.type || "",
						props: {
							toolUse: fixtureData.toolCall.tool,
							status: "pending",
							timestamp: new Date().toISOString(),
							toolResult: null,
						},
					},
				};

				// Some parsers might not handle pending state, so wrap in try-catch
				try {
					const result = await parser(pendingFixture);
					return result as Record<string, unknown>;
				} catch {
					// Fallback to manual construction
					return pendingFixture.expectedComponentData?.props || {};
				}
			}

			// For complete items, use the full parser
			const result = await parser(fixtureData);
			return result as Record<string, unknown>;
		} catch (error) {
			if (this.options.debug) {
				console.error(`[Transformer] Parser error:`, error);
			}
			throw error;
		}
	}

	/**
	 * Map tool name to package name
	 */
	private getPackageName(toolName: string): string {
		// Convert tool name to package format
		const packageSuffix = toolName
			.toLowerCase()
			.replace(/([A-Z])/g, "-$1")
			.toLowerCase();
		return `@dao/chat-items-${packageSuffix}-tool`;
	}

	/**
	 * Extract tool use from log entry
	 */
	private extractToolUse(entry: LogEntry): ToolUse | null {
		if (entry.type !== "assistant" || !entry.message?.content) {
			return null;
		}

		return entry.message.content.find((item): item is ToolUse => item.type === "tool_use") || null;
	}

	/**
	 * Extract tool result from log entry
	 */
	private extractToolResult(entry: LogEntry): ToolResult | null {
		if (entry.type !== "user" || !entry.message?.content) {
			return null;
		}

		return (
			entry.message.content.find((item): item is ToolResult => item.type === "tool_result") || null
		);
	}

	/**
	 * Get all pending correlations
	 */
	getPending(): PendingCorrelation[] {
		return this.correlation.getPending();
	}

	/**
	 * Get count of pending correlations
	 */
	getPendingCount(): number {
		return this.correlation.getPendingCount();
	}

	/**
	 * Get oldest pending correlation
	 */
	getOldestPending(): PendingCorrelation | null {
		return this.correlation.getOldestPending();
	}

	/**
	 * Clear all pending correlations
	 */
	clearPending(): void {
		this.correlation.clearPending();
	}

	/**
	 * Clear expired correlations
	 */
	clearExpired(maxAge: number = this.options.correlationTimeout): number {
		return this.correlation.clearExpired(maxAge);
	}
}

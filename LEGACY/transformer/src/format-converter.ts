/**
 * @fileoverview Converts between log entry format and fixture data format
 * @module @dao/transformer/format-converter
 */

import type { LogEntry, ToolResult, ToolUse } from "./types";

/**
 * Fixture data format expected by chat item parsers
 */
export interface FixtureData {
	toolCall: {
		uuid: string;
		timestamp: string;
		parentUuid: string;
		sessionId: string;
		tool: {
			type: "tool_use";
			id: string;
			name: string;
			input: Record<string, unknown>;
		};
	};
	toolResult?: {
		uuid: string;
		parentUuid: string;
		timestamp: string;
		result: {
			tool_use_id: string;
			type: "tool_result";
			content: string | Record<string, unknown>;
			is_error: boolean;
		};
		toolUseResult: string | Record<string, unknown>;
	};
	expectedComponentData?: {
		type: string;
		props: Record<string, unknown>;
	};
}

/**
 * Converts correlated log entries to fixture format
 */
export class FormatConverter {
	/**
	 * Convert log entries to fixture format
	 */
	toFixtureFormat(
		callEntry: LogEntry,
		resultEntry?: LogEntry,
		componentType?: string,
	): FixtureData {
		const toolUse = this.extractToolUse(callEntry);
		if (!toolUse) {
			throw new Error("No tool use found in call entry");
		}

		const fixtureData: FixtureData = {
			toolCall: {
				uuid: callEntry.uuid,
				timestamp: callEntry.timestamp,
				parentUuid: callEntry.parentUuid || "",
				sessionId: callEntry.sessionId,
				tool: {
					type: "tool_use",
					id: toolUse.id,
					name: toolUse.name,
					input: toolUse.input,
				},
			},
		};

		if (resultEntry) {
			const toolResult = this.extractToolResult(resultEntry);
			if (!toolResult) {
				throw new Error("No tool result found in result entry");
			}

			fixtureData.toolResult = {
				uuid: resultEntry.uuid,
				parentUuid: resultEntry.parentUuid || callEntry.uuid,
				timestamp: resultEntry.timestamp,
				result: {
					tool_use_id: toolResult.tool_use_id,
					type: "tool_result",
					content: toolResult.content,
					is_error: toolResult.is_error,
				},
				toolUseResult: this.extractToolUseResult(resultEntry, toolResult),
			};
		}

		// Add expected component data structure for parsers
		if (componentType) {
			fixtureData.expectedComponentData = {
				type: componentType,
				props: {}, // Will be filled by the parser
			};
		}

		return fixtureData;
	}

	/**
	 * Extract tool use from log entry
	 */
	private extractToolUse(entry: LogEntry): ToolUse | null {
		if (!entry.message?.content) return null;

		return entry.message.content.find((item): item is ToolUse => item.type === "tool_use") || null;
	}

	/**
	 * Extract tool result from log entry
	 */
	private extractToolResult(entry: LogEntry): ToolResult | null {
		if (!entry.message?.content) return null;

		return (
			entry.message.content.find((item): item is ToolResult => item.type === "tool_result") || null
		);
	}

	/**
	 * Extract toolUseResult data from log entry
	 */
	private extractToolUseResult(
		entry: LogEntry,
		toolResult: ToolResult,
	): string | Record<string, unknown> {
		// If toolUseResult is already provided, use it
		if (entry.toolUseResult !== undefined) {
			return entry.toolUseResult;
		}

		// For bash/command tools, create structured result
		if (typeof toolResult.content === "string") {
			return {
				stdout: toolResult.is_error ? "" : toolResult.content,
				stderr: toolResult.is_error ? toolResult.content : "",
				interrupted: false,
				isImage: false,
				isError: toolResult.is_error,
			};
		}

		// For other tools, return content as-is
		return toolResult.content;
	}
}

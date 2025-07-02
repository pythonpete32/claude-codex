import type { LogEntry, ToolProps } from "@claude-codex/types";
import type { Logger } from "pino";
import type { ParserRegistry } from "../parsers/registry";

/**
 * Result of transforming a log entry into UI-ready props
 */
export interface TransformResult {
	/** The tool type extracted from the log entry */
	toolType: string;
	/** The parsed UI-ready props */
	props: ToolProps;
	/** Correlation ID from the tool call */
	correlationId: string;
}

/**
 * Transforms raw log entries into parsed UI props using registered parsers.
 *
 * This is a thin wrapper around ParserRegistry that adds metadata
 * needed by the API layer while preserving the domain model.
 */
export class LogTransformer {
	constructor(
		private registry: ParserRegistry,
		private logger?: Logger,
	) {}

	/**
	 * Transform a correlated pair of log entries into UI-ready props
	 *
	 * @param toolCall - The tool invocation log entry
	 * @param toolResult - The optional tool result log entry
	 * @returns Parsed UI props with metadata, or null if parsing fails
	 */
	transform(toolCall: LogEntry, toolResult?: LogEntry): TransformResult | null {
		try {
			// Extract tool type
			const toolType = this.extractToolType(toolCall);
			if (!toolType) {
				this.logger?.debug("No tool type found in log entry", {
					uuid: toolCall.uuid,
				});
				return null;
			}

			// Use registry's parse method
			const props = this.registry.parse(toolCall, toolResult);
			if (!props) {
				this.logger?.warn(`Failed to parse tool: ${toolType}`, {
					uuid: toolCall.uuid,
				});
				return null;
			}

			// Extract correlation ID (tool_use_id)
			const correlationId = this.extractCorrelationId(toolCall);
			if (!correlationId) {
				this.logger?.warn("No correlation ID found", { uuid: toolCall.uuid });
				return null;
			}

			return {
				toolType,
				props,
				correlationId,
			};
		} catch (error) {
			this.logger?.error("Transform failed", {
				error: error instanceof Error ? error.message : String(error),
				uuid: toolCall.uuid,
			});
			return null;
		}
	}

	/**
	 * Extract tool type from log entry.
	 * Handles both tool_use and tool_result entry types.
	 */
	private extractToolType(entry: LogEntry): string | null {
		if (entry.type !== "assistant") return null;

		const content = Array.isArray(entry.content)
			? entry.content
			: typeof entry.content === "object"
				? [entry.content]
				: [];

		for (const block of content) {
			if (block.type === "tool_use" && block.name) {
				return block.name;
			}
			// For tool_result, we'd need to look up the original tool_use
			// This is handled by correlation engine before we get here
		}

		return null;
	}

	/**
	 * Extract correlation ID (tool_use_id) from log entry
	 */
	private extractCorrelationId(entry: LogEntry): string | null {
		if (entry.type !== "assistant") return null;

		const content = Array.isArray(entry.content)
			? entry.content
			: typeof entry.content === "object"
				? [entry.content]
				: [];

		for (const block of content) {
			if (block.type === "tool_use" && block.id) {
				return block.id;
			}
		}

		return null;
	}
}

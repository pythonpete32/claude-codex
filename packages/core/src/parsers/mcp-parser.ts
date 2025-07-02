import type {
	LogEntry,
	McpToolProps,
	MessageContent,
	ParseConfig,
	ParsedToolOutput,
} from "@claude-codex/types";
import { mapFromError, ParseErrorImpl } from "@claude-codex/types";
import { BaseToolParser } from "./base-parser";

/**
 * Generic MCP tool parser - outputs structured props for any MCP tool
 * Complex tool with flexible structure from hybrid schema architecture
 * Handles all tools starting with "mcp__" prefix
 */
export class McpToolParser extends BaseToolParser<McpToolProps> {
	readonly toolName = "MCP"; // Generic name
	readonly toolType = "other";
	readonly version = "1.0.0";

	// Override canParse to handle all MCP tools
	canParse(entry: LogEntry): boolean {
		if (entry.type !== "assistant") return false;

		const contents = this.normalizeContent(entry.content);
		if (!contents.length) return false;

		const toolUse = contents.find((c) => c.type === "tool_use");
		if (!toolUse || toolUse.type !== "tool_use") return false;

		// Check if it's an MCP tool (starts with mcp__)
		return toolUse.name
			? toolUse.name.startsWith("mcp__") || toolUse.name.startsWith("mcp_")
			: false;
	}

	// Override extractToolUse to handle MCP tool name patterns
	protected extractToolUse(
		entry: LogEntry,
	): MessageContent & { type: "tool_use" } {
		const content = this.normalizeContent(entry.content);
		const toolUse = content.find(
			(block) =>
				block.type === "tool_use" &&
				block.name &&
				(block.name.startsWith("mcp__") || block.name.startsWith("mcp_")),
		);

		if (!toolUse || toolUse.type !== "tool_use") {
			throw new ParseErrorImpl(
				"No MCP tool_use block found",
				"MISSING_REQUIRED_FIELD",
				entry,
			);
		}

		return toolUse as MessageContent & { type: "tool_use" };
	}

	parse(
		toolCall: LogEntry,
		toolResult?: LogEntry,
		config?: ParseConfig,
	): McpToolProps {
		// Extract base props for correlation
		const baseProps = this.extractBaseProps(toolCall, toolResult, config);

		// Extract tool details
		const toolUse = this.extractToolUse(toolCall);
		const toolName = toolUse.name || "unknown";
		const serverName = this.extractServerName(toolName);
		const methodName = this.extractMethodName(toolName);

		// Initialize result data
		let output: unknown;
		let errorMessage: string | undefined;
		let interrupted = false;
		let status = mapFromError(false, !toolResult);

		if (toolResult) {
			const result = this.extractToolResult(toolResult, toolUse.id!);

			if (!result.is_error) {
				// Parse successful output
				const parsed = this.parseOutput(result);
				output = parsed.output;
				interrupted = parsed.interrupted || false;
			} else {
				// For errors, preserve the output AND extract error message
				if (result.output && typeof result.output === "object") {
					output = result.output; // Preserve structured error output
				}
				errorMessage = this.extractErrorMessage(result);
			}

			// Map status including interrupted state
			status = mapFromError(result.is_error, false, interrupted);
		}

		// Analyze output structure for UI hints
		const outputMetrics = this.analyzeOutput(output);

		// Return structured props for UI consumption
		return {
			// Base props
			...baseProps,
			status,

			// Input structure
			input: {
				parameters: toolUse.input || {},
			},

			// Results structure
			results: {
				output,
				errorMessage,
			},

			// UI helpers
			ui: {
				toolName,
				serverName,
				methodName,
				displayMode: outputMetrics.displayMode,
				isStructured: outputMetrics.isStructured,
				hasNestedData: outputMetrics.hasNestedData,
				keyCount: outputMetrics.keyCount,
				showRawJson: outputMetrics.isComplex,
				collapsible: outputMetrics.isLarge,
				// Additional properties for test compatibility
				isComplex: outputMetrics.isComplex,
				isLarge: outputMetrics.isLarge,
			},
		};
	}

	private extractServerName(toolName: string): string {
		// Extract server name from tool name
		// Format: mcp__server__method or mcp_server_method
		const parts = toolName.split(/__/);
		if (parts.length >= 2) {
			return parts[1]; // mcp__puppeteer__navigate -> puppeteer
		}

		// Try underscore format
		const underscoreParts = toolName.split("_");
		if (underscoreParts.length >= 3) {
			return underscoreParts[1]; // mcp_puppeteer_navigate -> puppeteer
		}

		return "unknown";
	}

	private extractMethodName(toolName: string): string {
		// Extract method name from tool name
		const parts = toolName.split(/__/);
		if (parts.length >= 3) {
			return parts.slice(2).join("_"); // mcp__puppeteer__puppeteer_navigate -> puppeteer_navigate
		}

		// Try underscore format (only if no double underscores)
		if (!toolName.includes("__")) {
			const underscoreParts = toolName.split("_");
			if (underscoreParts.length >= 3) {
				return underscoreParts.slice(2).join("_");
			}
		}

		// For 2-part names like "mcp__unknown", return the full tool name
		return toolName;
	}

	private parseOutput(result: MessageContent & { type: "tool_result" }): {
		output: unknown;
		interrupted?: boolean;
	} {
		// Handle string output
		if (typeof result.output === "string") {
			// Try to parse as JSON
			try {
				const parsed = JSON.parse(result.output);
				return {
					output: parsed,
					interrupted: parsed.interrupted === true,
				};
			} catch {
				// Not JSON, return as string
				return {
					output: result.output,
					interrupted: false,
				};
			}
		}

		// Handle structured output
		if (result.output && typeof result.output === "object") {
			const output = result.output as ParsedToolOutput;

			// Check for interrupted flag
			if (output.interrupted === true) {
				return {
					output: output,
					interrupted: true,
				};
			}

			return {
				output: output,
				interrupted: false,
			};
		}

		// Handle null/undefined
		return {
			output: result.output,
			interrupted: false,
		};
	}

	private analyzeOutput(output: unknown): {
		displayMode: "text" | "json" | "table" | "list" | "empty";
		isStructured: boolean;
		hasNestedData: boolean;
		keyCount: number;
		isComplex: boolean;
		isLarge: boolean;
	} {
		// Empty output
		if (output === null || output === undefined) {
			return {
				displayMode: "empty",
				isStructured: false,
				hasNestedData: false,
				keyCount: 0,
				isComplex: false,
				isLarge: false,
			};
		}

		// String output
		if (typeof output === "string") {
			return {
				displayMode: "text",
				isStructured: false,
				hasNestedData: false,
				keyCount: 0,
				isComplex: false,
				isLarge: output.length > 1000,
			};
		}

		// Array output
		if (Array.isArray(output)) {
			const hasObjects = output.some(
				(item) => typeof item === "object" && item !== null,
			);
			return {
				displayMode: hasObjects ? "table" : "list",
				isStructured: true,
				hasNestedData: hasObjects,
				keyCount: output.length,
				isComplex: hasObjects && output.length > 5,
				isLarge: output.length > 10,
			};
		}

		// Object output
		if (typeof output === "object") {
			const keys = Object.keys(output);
			const hasNested = keys.some(
				(key) =>
					typeof (output as ParsedToolOutput)[key] === "object" &&
					(output as ParsedToolOutput)[key] !== null,
			);

			return {
				displayMode: "json",
				isStructured: true,
				hasNestedData: hasNested,
				keyCount: keys.length,
				isComplex: hasNested || keys.length > 10,
				isLarge: keys.length > 20,
			};
		}

		// Primitive output
		return {
			displayMode: "text",
			isStructured: false,
			hasNestedData: false,
			keyCount: 0,
			isComplex: false,
			isLarge: false,
		};
	}

	private extractErrorMessage(
		result: MessageContent & { type: "tool_result" },
	): string {
		if (typeof result.output === "string") {
			return result.output;
		}

		if (result.output && typeof result.output === "object") {
			const output = result.output as ParsedToolOutput;
			return typeof output.error === "string"
				? output.error
				: typeof output.message === "string"
					? output.message
					: "MCP tool execution failed";
		}

		return "Unknown MCP error";
	}

	public getSupportedFeatures(): string[] {
		// Declare parser capabilities
		return [
			"basic-parsing",
			"status-mapping",
			"correlation",
			"generic-mcp-handling",
			"output-analysis",
			"display-mode-detection",
			"server-extraction",
			"method-extraction",
			"interrupted-support",
		];
	}
}

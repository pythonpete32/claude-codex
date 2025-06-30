/**
 * @fileoverview Type definitions for the log entry transformer
 * @module @dao/transformer/types
 */

/**
 * Raw log entry structure from Claude conversation logs
 */
export interface LogEntry {
	type: "assistant" | "user" | "thinking" | "message";
	uuid: string;
	timestamp: string;
	parentUuid?: string | null;
	sessionId: string;
	requestId?: string;

	// Message wrapper for tool calls and results
	message?: {
		id: string;
		type: "message";
		role: "assistant" | "user";
		model?: string;
		content: Array<ToolUse | ToolResult | TextBlock | ThinkingBlock>;
		stop_reason?: string | null;
		stop_sequence?: string | null;
		usage?: Record<string, unknown>;
	};

	// Processed result data (appears on tool result entries)
	toolUseResult?:
		| {
				stdout?: string;
				stderr?: string;
				interrupted?: boolean;
				isImage?: boolean;
				isError?: boolean;
		  }
		| string;
}

/**
 * Tool use within message content
 */
export interface ToolUse {
	type: "tool_use";
	id: string;
	name: string;
	input: Record<string, unknown>;
}

/**
 * Tool result within message content
 */
export interface ToolResult {
	type: "tool_result";
	tool_use_id: string;
	content: string | Record<string, unknown>;
	is_error: boolean;
}

/**
 * Text block in message content
 */
export interface TextBlock {
	type: "text";
	text: string;
}

/**
 * Thinking block in message content
 */
export interface ThinkingBlock {
	type: "thinking";
	thinking: string;
	signature?: string;
}

/**
 * Correlated entry with tool call and optional result
 */
export interface CorrelatedEntry {
	toolCall: LogEntry;
	toolResult?: LogEntry;
	thinking?: LogEntry[];
	correlationId: string;
	timestamp: string;
}

/**
 * Pending correlation waiting for match
 */
export interface PendingCorrelation {
	entry: LogEntry;
	timestamp: number;
	attempts: number;
}

/**
 * Transformed output ready for UI
 */
export interface TransformedItem {
	type: string; // e.g., "bash_tool", "file_tool"
	id: string;
	correlationId: string;
	timestamp: string;
	status: "pending" | "completed" | "failed";
	props: Record<string, unknown>; // Typed by specific chat item
}

/**
 * Result of transformation operation
 */
export interface TransformResult {
	item?: TransformedItem;
	pending?: boolean;
	error?: TransformError;
}

/**
 * Transformation error details
 */
export interface TransformError {
	code: string;
	message: string;
	entry?: LogEntry;
	details?: Record<string, unknown>;
}

/**
 * Transformer configuration options
 */
export interface TransformOptions {
	correlationTimeout?: number; // ms
	preserveTimestamps?: boolean;
	debug?: boolean;
}

/**
 * @deprecated Use dynamic tool discovery instead
 * Legacy tool name to component type mapping for backward compatibility
 */
export const TOOL_TYPE_MAPPINGS: Record<string, string> = {
	// Shell operations
	Bash: "bash_tool",

	// File operations
	Read: "file_tool",
	Write: "file_tool",
	Edit: "file_tool",
	MultiEdit: "file_tool",

	// Search operations
	Glob: "search_tool",
	Grep: "search_tool",
	LS: "search_tool",

	// Meta operations
	Task: "meta_tool",
	TodoRead: "meta_tool",
	TodoWrite: "meta_tool",

	// Web operations
	WebFetch: "web_tool",
	WebSearch: "web_tool",

	// Notebook operations
	NotebookRead: "notebook_tool",
	NotebookEdit: "notebook_tool",
};

/**
 * @deprecated Use toolDiscovery.getComponentType() instead
 * Get component type from tool name (legacy synchronous version)
 */
export function getComponentType(toolName: string): string {
	// MCP tools
	if (toolName.startsWith("mcp__")) {
		return "mcp_tool";
	}

	// Standard tools
	return TOOL_TYPE_MAPPINGS[toolName] || "generic_tool";
}

/**
 * Get component type from tool name using dynamic discovery
 * This is the new async version that uses tool registration
 */
export async function getComponentTypeAsync(toolName: string): Promise<string> {
	try {
		const { toolDiscovery } = await import("./tool-registration");
		return await toolDiscovery.getComponentType(toolName);
	} catch (error) {
		// Fallback to legacy mapping if discovery fails
		console.warn("Tool discovery failed, falling back to legacy mappings:", error);
		return getComponentType(toolName);
	}
}

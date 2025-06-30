/**
 * Base types shared across all chat-item tool packages
 * @packageDocumentation
 * @module @dao/codex-chat-item-common-types/base
 */

/**
 * Base tool use structure that all tools extend.
 * @typeParam TName - The specific tool name literal type
 * @typeParam TInput - The tool-specific input type
 */
export interface BaseToolUse<TName extends string, TInput> {
	/** Type identifier for tool use */
	type: "tool_use";
	/** Unique identifier for this tool use */
	id: string;
	/** Tool name */
	name: TName;
	/** Input parameters for the tool */
	input: TInput;
}

/**
 * Common tool execution status.
 */
export type ToolStatus = "completed" | "failed";

/**
 * Base configuration options for tool parsers.
 */
export interface BaseConfig {
	/** Enable debug mode for verbose logging */
	debug?: boolean;
	/** Custom timestamp format */
	timestampFormat?: string;
	/** Whether to preserve original timestamps */
	preserveTimestamps?: boolean;
}

/**
 * Common validation result structure.
 */
export interface ValidationResult {
	/** Whether the validation passed */
	isValid: boolean;
	/** Error messages if validation failed */
	errors: string[];
	/** Warning messages */
	warnings: string[];
}

/**
 * Base structure for raw tool result data from Claude logs.
 */
export interface BaseToolResultData {
	/** Tool result ID matching the tool use */
	tool_use_id: string;
	/** Type identifier */
	type: "tool_result";
	/** Result content */
	content: string;
	/** Whether the result is an error */
	is_error?: boolean;
}

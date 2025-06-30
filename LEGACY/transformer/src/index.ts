/**
 * @fileoverview Log entry transformer for Claude conversation logs
 * @module @dao/transformer
 * @version 0.1.0
 * @license MIT
 * @author DAOresearch Team
 */

export { CorrelationEngine } from "./correlation-engine";
// Re-export fixture format type
export type { FixtureData } from "./format-converter";
export { FormatConverter } from "./format-converter";
// Main exports
export { LogEntryTransformer } from "./transformer";
// Type exports
export type {
	CorrelatedEntry,
	LogEntry,
	PendingCorrelation,
	TextBlock,
	ThinkingBlock,
	ToolResult,
	ToolUse,
	TransformError,
	TransformedItem,
	TransformOptions,
	TransformResult,
} from "./types";
export { getComponentType, TOOL_TYPE_MAPPINGS } from "./types";

/**
 * Package metadata and version information
 */
export const PACKAGE_INFO = {
	name: "@dao/transformer",
	version: "0.1.0",
	description: "Log entry transformer for Claude conversation logs",
	license: "MIT",
} as const;

// Import needed for createTransformer
import { LogEntryTransformer } from "./transformer";

/**
 * Create a new transformer instance with default options
 */
export function createTransformer(options?: import("./types").TransformOptions) {
	return new LogEntryTransformer(options);
}

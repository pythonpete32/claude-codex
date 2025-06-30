/**
 * @fileoverview Main entry point for @dao/chat-items-multiedit-tool
 * @module @dao/chat-items-multiedit-tool
 * @version 0.1.0
 * @license MIT
 */

// Tool registration for dynamic discovery
// Note: Using relative import to avoid circular dependency
interface ToolRegistration {
	readonly toolName: string;
	readonly componentType: string;
	readonly packageName: string;
	readonly version: string;
	readonly metadata?: {
		category?: string;
		description?: string;
		examples?: readonly string[];
	};
}

export const TOOL_REGISTRATION: ToolRegistration = {
	toolName: "MultiEdit",
	componentType: "file_tool",
	packageName: "@dao/chat-items-multiedit-tool",
	version: "0.1.0",
	metadata: {
		category: "file",
		description: "Multi-file editing tool for making bulk changes across multiple files",
		examples: [
			"Update imports across multiple TypeScript files",
			"Rename variables in all affected files",
			"Apply consistent formatting changes",
			"Update configuration in multiple config files",
			"Bulk replace deprecated API calls",
		],
	},
} as const;

// Re-export common types for convenience
export type {
	BaseToolUse,
	ToolStatus,
} from "@dao/chat-items-common-types";
// Export constants
export * from "./constants";
/**
 * Package metadata
 */
export { PACKAGE_NAME, PACKAGE_VERSION } from "./constants";
// Export fixtures
export * from "./fixtures";

// Export parsers
export * from "./parsers";
// Export schemas and schema types
export * from "./schemas";
export type * from "./types";
// Export all types
export * from "./types";
// Export validators
export * from "./validators";

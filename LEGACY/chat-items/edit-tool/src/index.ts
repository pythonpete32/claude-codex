/**
 * edit-tool - Atomic package for the Daobox Codex ecosystem
 * @packageDocumentation
 * @module @dao/codex-chat-item-edit-tool
 *
 * @remarks
 * This package provides type-safe schemas and parsers for Edit tool chat items
 * in the Daobox Codex ecosystem.
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
	toolName: "Edit",
	componentType: "file_tool",
	packageName: "@dao/chat-items-edit-tool",
	version: "0.1.0",
	metadata: {
		category: "file",
		description: "File editing tool for making targeted changes to files",
		examples: [
			"Edit config.json to update port number",
			"Replace function implementation",
			"Update import statements",
			"Modify CSS styles",
			"Fix typos in documentation",
		],
	},
} as const;

// Re-export constants
export { PACKAGE_INFO } from "./constants";
// Re-export fixtures
export {
	AllFixtures,
	ValidatedFixtures,
} from "./fixtures";
// Re-export parsers
// Default export
export {
	parseEditTool,
	parseEditTool as default,
	processEditTools,
} from "./parsers";
// Re-export all schemas
export * as Schemas from "./schemas";
export type * as EditToolTypes from "./types";
// Re-export all types
export * from "./types";
// Re-export validators
export { validateEditToolData } from "./validators";

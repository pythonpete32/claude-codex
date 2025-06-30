/**
 * bash-tool - Atomic package for the Daobox Codex ecosystem
 * @packageDocumentation
 * @module @dao/codex-chat-item-bash-tool
 *
 * @remarks
 * This package provides type-safe schemas and parsers for Bash tool chat items
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
	toolName: "Bash",
	componentType: "bash_tool",
	packageName: "@dao/chat-items-bash-tool",
	version: "0.1.0",
	metadata: {
		category: "shell",
		description: "Shell command execution tool for running bash commands",
		examples: ["git status", "npm install", "ls -la", "cd /path/to/directory", "mkdir new-folder"],
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
	parseBashTool,
	parseBashTool as default,
	processBashTools,
} from "./parsers";
// Re-export all schemas
export * as Schemas from "./schemas";
export type * as BashToolTypes from "./types";
// Re-export all types
export * from "./types";
// Re-export validators
export { validateBashToolData } from "./validators";

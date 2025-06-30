/**
 * Package constants and metadata
 * @packageDocumentation
 * @module @dao/codex-chat-item-glob-tool/constants
 */

/**
 * Package information and metadata.
 */
export const PACKAGE_INFO = {
	name: "@dao/codex-chat-item-glob-tool",
	version: "0.1.0",
	description: "Type-safe schema and parser for glob tool UI components in Claude conversations",
	toolName: "Glob",
	componentType: "glob_tool" as const,
} as const;

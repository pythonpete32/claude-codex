/**
 * Package constants and metadata
 * @packageDocumentation
 * @module @dao/codex-chat-item-grep-tool/constants
 */

/**
 * Package information and metadata.
 */
export const PACKAGE_INFO = {
	name: "@dao/codex-chat-item-grep-tool",
	version: "0.1.0",
	description: "Type-safe schema and parser for grep tool UI components in Claude conversations",
	toolName: "Grep",
	componentType: "grep_tool" as const,
} as const;

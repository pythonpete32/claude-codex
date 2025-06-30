/**
 * Package constants and metadata
 * @packageDocumentation
 * @module @dao/codex-chat-item-ls-tool/constants
 */

/**
 * Package information and metadata.
 */
export const PACKAGE_INFO = {
	name: "@dao/codex-chat-item-ls-tool",
	version: "0.1.0",
	description: "Type-safe schema and parser for ls tool UI components in Claude conversations",
	toolName: "LS",
	componentType: "ls_tool" as const,
} as const;

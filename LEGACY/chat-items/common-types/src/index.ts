/**
 * common-types - Common type definitions for chat-item packages
 * @packageDocumentation
 * @module @dao/codex-chat-item-common-types
 *
 * @remarks
 * This package provides common type definitions shared across all chat-item tool packages
 * in the Daobox Codex ecosystem.
 */

// Export base types
export * from "./base";

// Export fixture types
export * from "./fixtures";

/**
 * Package metadata and version information.
 */
export const PACKAGE_INFO = {
	name: "common-types",
	version: "0.1.0",
	description: "Common type definitions for Daobox Codex chat-item packages",
	license: "MIT",
} as const;

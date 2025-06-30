/**
 * Type definitions for grep-tool package
 * @packageDocumentation
 * @module @dao/codex-chat-item-grep-tool/types
 */

import type {
	BaseConfig,
	BaseFixtureData,
	BaseFixturesMetadata,
	BaseToolProps,
	BaseToolUse,
	ToolStatus,
	ValidationResult,
} from "@dao/chat-items-common-types";

/**
 * Tool use input structure for grep commands.
 */
export interface GrepToolUseInput {
	/** The regular expression pattern to search for */
	pattern: string;
	/** File pattern to include in the search (e.g. "*.js", "*.{ts,tsx}") */
	include?: string;
	/** The directory to search in (defaults to current working directory) */
	path?: string;
}

/**
 * Tool use structure for grep commands.
 */
export type GrepToolUse = BaseToolUse<"Grep", GrepToolUseInput>;

/**
 * Tool result structure containing grep search results.
 */
export interface GrepToolResult {
	/** Array of file paths that matched the search pattern */
	matches: string[];
	/** Total number of matches found */
	matchCount: number;
	/** Whether the search resulted in an error */
	isError: boolean;
	/** Error message if the search failed */
	errorMessage?: string;
}

/**
 * Status of the grep tool execution.
 */
export type GrepToolStatus = ToolStatus;

/**
 * Complete props structure for grep tool component.
 */
export type GrepToolProps = BaseToolProps<GrepToolUse, GrepToolResult>;

/**
 * Raw fixture data structure from Claude conversation logs.
 */
export type GrepFixtureData = BaseFixtureData<GrepToolUse, GrepToolResult, GrepToolProps> & {
	/** Expected component data */
	expectedComponentData: {
		type: "grep_tool";
		props: GrepToolProps;
	};
};

/**
 * Configuration options for the grep tool parser.
 */
export type GrepConfig = BaseConfig;

/**
 * Fixtures collection metadata.
 */
export type GrepFixturesMetadata = BaseFixturesMetadata<GrepFixtureData>;

// Re-export ValidationResult from common types
export type { ValidationResult };

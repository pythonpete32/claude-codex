/**
 * Type definitions for glob-tool package
 * @packageDocumentation
 * @module @dao/codex-chat-item-glob-tool/types
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
 * Tool use input structure for glob commands.
 */
export interface GlobToolUseInput {
	/** The glob pattern to match files against */
	pattern: string;
	/** The directory to search in (optional, defaults to current directory) */
	path?: string;
}

/**
 * Tool use structure for glob commands.
 */
export type GlobToolUse = BaseToolUse<"Glob", GlobToolUseInput>;

/**
 * Tool result structure containing glob search results.
 */
export interface GlobToolResult {
	/** Array of file paths that matched the glob pattern */
	matches: string[];
	/** Total number of matches found */
	matchCount: number;
	/** Whether the search resulted in an error */
	isError: boolean;
	/** Error message if the search failed */
	errorMessage?: string;
}

/**
 * Status of the glob tool execution.
 */
export type GlobToolStatus = ToolStatus;

/**
 * Complete props structure for glob tool component.
 */
export type GlobToolProps = BaseToolProps<GlobToolUse, GlobToolResult>;

/**
 * Raw fixture data structure from Claude conversation logs.
 */
export type GlobFixtureData = BaseFixtureData<GlobToolUse, GlobToolResult, GlobToolProps> & {
	/** Expected component data */
	expectedComponentData: {
		type: "glob_tool";
		props: GlobToolProps;
	};
};

/**
 * Configuration options for the glob tool parser.
 */
export type GlobConfig = BaseConfig;

/**
 * Fixtures collection metadata.
 */
export type GlobFixturesMetadata = BaseFixturesMetadata<GlobFixtureData>;

// Re-export ValidationResult from common types
export type { ValidationResult };

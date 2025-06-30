/**
 * Type definitions for ls-tool package
 * @packageDocumentation
 * @module @dao/codex-chat-item-ls-tool/types
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
 * Tool use input structure for ls commands.
 */
export interface LsToolUseInput {
	/** The absolute path to the directory to list */
	path: string;
	/** List of glob patterns to ignore (optional) */
	ignore?: string[];
}

/**
 * Tool use structure for ls commands.
 */
export type LsToolUse = BaseToolUse<"LS", LsToolUseInput>;

/**
 * File info structure for ls results.
 */
export interface LsFileInfo {
	/** File or directory name */
	name: string;
	/** File type (file, directory, symlink, etc.) */
	type: "file" | "directory" | "symlink" | "other";
	/** Size in bytes (for files) */
	size?: number;
	/** Whether the item is hidden (starts with .) */
	hidden: boolean;
	/** File permissions (e.g., "rwxr-xr-x") */
	permissions?: string;
	/** Last modified time */
	lastModified?: string;
}

/**
 * Tool result structure containing ls listing results.
 */
export interface LsToolResult {
	/** Array of file/directory information */
	entries: LsFileInfo[];
	/** Total number of entries found */
	entryCount: number;
	/** Directory path that was listed */
	path: string;
	/** Whether the operation resulted in an error */
	isError: boolean;
	/** Error message if the listing failed */
	errorMessage?: string;
}

/**
 * Status of the ls tool execution.
 */
export type LsToolStatus = ToolStatus;

/**
 * Complete props structure for ls tool component.
 */
export type LsToolProps = BaseToolProps<LsToolUse, LsToolResult>;

/**
 * Raw fixture data structure from Claude conversation logs.
 */
export type LsFixtureData = BaseFixtureData<LsToolUse, LsToolResult, LsToolProps> & {
	/** Expected component data */
	expectedComponentData: {
		type: "ls_tool";
		props: LsToolProps;
	};
};

/**
 * Configuration options for the ls tool parser.
 */
export type LsConfig = BaseConfig;

/**
 * Fixtures collection metadata.
 */
export type LsFixturesMetadata = BaseFixturesMetadata<LsFixtureData>;

// Re-export ValidationResult from common types
export type { ValidationResult };

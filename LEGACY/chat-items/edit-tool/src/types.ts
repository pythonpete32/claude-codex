/**
 * Type definitions for edit-tool package
 * @packageDocumentation
 * @module @dao/codex-chat-item-edit-tool/types
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
 * Tool use input structure for edit commands.
 */
export interface EditToolUseInput {
	/** The absolute path to the file to edit */
	file_path: string;
	/** The text to replace */
	old_string: string;
	/** The text to replace it with */
	new_string: string;
	/** Whether to replace all occurrences (optional) */
	replace_all?: boolean;
}

/**
 * Tool use structure for edit commands.
 */
export type EditToolUse = BaseToolUse<"Edit", EditToolUseInput>;

/**
 * Structured patch information for tracking changes.
 */
export interface EditStructuredPatch {
	/** Starting line in old file */
	oldStart: number;
	/** Number of lines in old file */
	oldLines: number;
	/** Starting line in new file */
	newStart: number;
	/** Number of lines in new file */
	newLines: number;
	/** Array of patch lines with prefixes (+, -, or space) */
	lines: string[];
}

/**
 * Tool result structure containing edit operation results.
 */
export interface EditToolResult {
	/** Path to the file that was edited */
	filePath?: string;
	/** The old string that was replaced */
	oldString?: string;
	/** The new string that replaced the old string */
	newString?: string;
	/** Original file content before edit */
	originalFile?: string;
	/** Structured patch information */
	structuredPatch?: EditStructuredPatch[];
	/** Whether the edit operation resulted in an error */
	isError?: boolean;
	/** Error message if operation failed */
	errorMessage?: string;
	/** Whether user modified the content */
	userModified?: boolean;
	/** Whether replace all was used */
	replaceAll?: boolean;
	/** Standard output (for file_tool compatibility) */
	stdout?: string;
	/** Standard error (for file_tool compatibility) */
	stderr?: string;
	/** Whether interrupted */
	interrupted?: boolean;
	/** Whether output is an image */
	isImage?: boolean;
}

/**
 * Status of the edit tool execution.
 */
export type EditToolStatus = ToolStatus;

/**
 * Complete props structure for edit tool component.
 */
export type EditToolProps = BaseToolProps<EditToolUse, EditToolResult>;

/**
 * Raw fixture data structure from Claude conversation logs.
 */
export type EditFixtureData = BaseFixtureData<EditToolUse, EditToolResult, EditToolProps> & {
	/** Expected component data */
	expectedComponentData: {
		type: "edit_tool" | "file_tool";
		props: EditToolProps;
	};
};

/**
 * Configuration options for the edit tool parser.
 */
export type EditConfig = BaseConfig;

/**
 * Fixtures collection metadata.
 */
export type EditFixturesMetadata = BaseFixturesMetadata<EditFixtureData>;

// Re-export ValidationResult from common types
export type { ValidationResult };

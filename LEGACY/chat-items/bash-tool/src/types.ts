/**
 * Type definitions for bash-tool package
 * @packageDocumentation
 * @module @dao/codex-chat-item-bash-tool/types
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
 * Tool use input structure for bash commands.
 */
export interface BashToolUseInput {
	/** The bash command to execute */
	command: string;
	/** Human-readable description of what the command does */
	description: string;
}

/**
 * Tool use structure for bash commands.
 */
export type BashToolUse = BaseToolUse<"Bash", BashToolUseInput>;

/**
 * Tool result structure containing command execution results.
 */
export interface BashToolResult {
	/** Standard output from command execution */
	stdout: string;
	/** Standard error from command execution */
	stderr: string;
	/** Whether the command execution was interrupted */
	interrupted: boolean;
	/** Whether the output contains image data */
	isImage: boolean;
	/** Whether the command resulted in an error */
	isError: boolean;
}

/**
 * Status of the bash tool execution.
 */
export type BashToolStatus = ToolStatus;

/**
 * Complete props structure for bash tool component.
 */
export type BashToolProps = BaseToolProps<BashToolUse, BashToolResult>;

/**
 * Raw fixture data structure from Claude conversation logs.
 */
export type BashFixtureData = BaseFixtureData<BashToolUse, BashToolResult, BashToolProps> & {
	/** Expected component data */
	expectedComponentData: {
		type: "bash_tool";
		props: BashToolProps;
	};
};

/**
 * Configuration options for the bash tool parser.
 */
export type BashConfig = BaseConfig;

/**
 * Fixtures collection metadata.
 */
export type BashFixturesMetadata = BaseFixturesMetadata<BashFixtureData>;

// Re-export ValidationResult from common types
export type { ValidationResult };

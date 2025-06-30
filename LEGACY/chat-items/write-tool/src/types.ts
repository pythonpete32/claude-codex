/**
 * @fileoverview Type definitions for the write-tool chat item
 * @module @dao/chat-items-write-tool/types
 */

import type { BaseToolUse, ToolStatus } from "@dao/chat-items-common-types";

/**
 * Input parameters for the write tool
 */
export interface WriteToolUseInput {
	/** The absolute path where the file should be written */
	file_path: string;
	/** The content to write to the file */
	content: string;
}

/**
 * Result structure for write tool operations
 */
export interface WriteToolResultData {
	/** Operation type (always "create" for write operations) */
	type: "create";
	/** Path where the file was created */
	filePath: string;
	/** The content that was written to the file */
	content: string;
	/** Empty array for new file creation (no diff needed) */
	structuredPatch: readonly [];
}

/**
 * Tool use structure for write operations
 */
export interface WriteToolUse extends BaseToolUse<"Write", WriteToolUseInput> {
	type: "tool_use";
}

/**
 * Tool result structure for write operations
 */
export interface WriteToolResult {
	tool_use_id: string;
	type: "tool_result";
	content: string;
}

/**
 * Tool use result structure for write operations
 */
export interface WriteToolUseResult {
	output: WriteToolResultData | string;
	status: ToolStatus;
}

/**
 * Complete chat item for write tool
 */
export interface WriteToolChatItem {
	type: "tool_use";
	toolUse: WriteToolUse;
	toolResult: WriteToolResult;
	toolUseResult: WriteToolUseResult;
}

/**
 * Props for the write tool component
 */
export interface WriteToolComponentProps {
	item: WriteToolChatItem;
	className?: string;
	onRetry?: () => void;
}

/**
 * Type guard for WriteToolUseInput
 */
export function isWriteToolUseInput(value: unknown): value is WriteToolUseInput {
	return (
		typeof value === "object" &&
		value !== null &&
		"file_path" in value &&
		"content" in value &&
		typeof (value as WriteToolUseInput).file_path === "string" &&
		typeof (value as WriteToolUseInput).content === "string"
	);
}

/**
 * Type guard for WriteToolResultData
 */
export function isWriteToolResultData(value: unknown): value is WriteToolResultData {
	return (
		typeof value === "object" &&
		value !== null &&
		"type" in value &&
		"filePath" in value &&
		"content" in value &&
		"structuredPatch" in value &&
		(value as WriteToolResultData).type === "create" &&
		typeof (value as WriteToolResultData).filePath === "string" &&
		typeof (value as WriteToolResultData).content === "string" &&
		Array.isArray((value as WriteToolResultData).structuredPatch)
	);
}

/**
 * Type guard for WriteToolChatItem
 */
export function isWriteToolChatItem(item: unknown): item is WriteToolChatItem {
	return (
		typeof item === "object" &&
		item !== null &&
		(item as WriteToolChatItem).type === "tool_use" &&
		"toolUse" in item &&
		(item as WriteToolChatItem).toolUse.name === "Write"
	);
}

/**
 * Export all types
 */
export type {
	BaseToolUse,
	ToolStatus,
} from "@dao/chat-items-common-types";

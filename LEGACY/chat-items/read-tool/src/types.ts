/**
 * @fileoverview Type definitions for the read-tool chat item
 * @module @dao/chat-items-read-tool/types
 */

import type { BaseToolUse, ToolStatus } from "@dao/chat-items-common-types";

/**
 * Input parameters for the read tool
 */
export interface ReadToolUseInput {
	/** The absolute path to the file to read */
	file_path: string;
	/** Optional line offset to start reading from */
	offset?: number;
	/** Optional number of lines to read */
	limit?: number;
}

/**
 * Result structure for successful read operations
 */
export interface ReadToolResultData {
	/** The file content with line numbers */
	content: string;
	/** Total number of lines in the file */
	totalLines?: number;
	/** Whether the file was truncated */
	truncated?: boolean;
	/** The actual number of lines read */
	linesRead?: number;
}

/**
 * Tool use structure for read operations
 */
export interface ReadToolUse extends BaseToolUse<"Read", ReadToolUseInput> {
	type: "tool_use";
}

/**
 * Tool result structure for read operations
 */
export interface ReadToolResult {
	output: ReadToolResultData | string;
	status: ToolStatus;
}

/**
 * Complete chat item for read tool
 */
export interface ReadToolChatItem {
	type: "tool_use";
	toolUse: ReadToolUse;
	toolResult: ReadToolResult;
}

/**
 * Props for the read tool component
 */
export interface ReadToolComponentProps {
	item: ReadToolChatItem;
	className?: string;
	onRetry?: () => void;
}

/**
 * Type guard for ReadToolUseInput
 */
export function isReadToolUseInput(value: unknown): value is ReadToolUseInput {
	return (
		typeof value === "object" &&
		value !== null &&
		"file_path" in value &&
		typeof (value as ReadToolUseInput).file_path === "string"
	);
}

/**
 * Type guard for ReadToolResultData
 */
export function isReadToolResultData(value: unknown): value is ReadToolResultData {
	return (
		typeof value === "object" &&
		value !== null &&
		"content" in value &&
		typeof (value as ReadToolResultData).content === "string"
	);
}

/**
 * Type guard for ReadToolChatItem
 */
export function isReadToolChatItem(item: unknown): item is ReadToolChatItem {
	return (
		typeof item === "object" &&
		item !== null &&
		(item as ReadToolChatItem).type === "tool_use" &&
		"toolUse" in item &&
		(item as ReadToolChatItem).toolUse.name === "Read"
	);
}

/**
 * Export all types
 */
export type {
	BaseToolUse,
	ToolStatus,
} from "@dao/chat-items-common-types";

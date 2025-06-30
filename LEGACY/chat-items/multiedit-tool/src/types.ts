/**
 * @fileoverview Type definitions for the multiedit-tool chat item
 * @module @dao/chat-items-multiedit-tool/types
 */

import type { BaseToolUse, ToolStatus } from "@dao/chat-items-common-types";

/**
 * Individual edit operation for multiedit
 */
export interface MultiEditOperation {
	/** The text to replace */
	old_string: string;
	/** The text to replace it with */
	new_string: string;
	/** Replace all occurrences of old_string (default false) */
	replace_all?: boolean;
}

/**
 * Input parameters for the multiedit tool
 */
export interface MultiEditToolUseInput {
	/** The absolute path to the file to modify */
	file_path: string;
	/** Array of edit operations to perform sequentially */
	edits: MultiEditOperation[];
}

/**
 * Result structure for successful multiedit operations
 */
export interface MultiEditToolResultData {
	/** Success message or summary */
	message: string;
	/** Number of edits applied successfully */
	edits_applied: number;
	/** Total number of edit operations */
	total_edits: number;
	/** Whether all edits were successful */
	all_successful: boolean;
	/** Optional details about each edit */
	edit_details?: EditResult[];
}

/**
 * Result of an individual edit operation
 */
export interface EditResult {
	/** The edit operation that was performed */
	operation: MultiEditOperation;
	/** Whether this edit was successful */
	success: boolean;
	/** Error message if the edit failed */
	error?: string;
	/** Number of replacements made */
	replacements_made?: number;
}

/**
 * Tool use structure for multiedit operations
 */
export interface MultiEditToolUse extends BaseToolUse<"MultiEdit", MultiEditToolUseInput> {
	type: "tool_use";
}

/**
 * Tool result structure for multiedit operations
 */
export interface MultiEditToolResult {
	output: MultiEditToolResultData | string;
	status: ToolStatus;
}

/**
 * Complete chat item for multiedit tool
 */
export interface MultiEditToolChatItem {
	type: "tool_use";
	toolUse: MultiEditToolUse;
	toolResult: MultiEditToolResult;
}

/**
 * Props for the multiedit tool component
 */
export interface MultiEditToolComponentProps {
	item: MultiEditToolChatItem;
	className?: string;
	onRetry?: () => void;
}

/**
 * Type guard for MultiEditOperation
 */
export function isMultiEditOperation(value: unknown): value is MultiEditOperation {
	return (
		typeof value === "object" &&
		value !== null &&
		"old_string" in value &&
		"new_string" in value &&
		typeof (value as MultiEditOperation).old_string === "string" &&
		typeof (value as MultiEditOperation).new_string === "string"
	);
}

/**
 * Type guard for MultiEditToolUseInput
 */
export function isMultiEditToolUseInput(value: unknown): value is MultiEditToolUseInput {
	return (
		typeof value === "object" &&
		value !== null &&
		"file_path" in value &&
		"edits" in value &&
		typeof (value as MultiEditToolUseInput).file_path === "string" &&
		Array.isArray((value as MultiEditToolUseInput).edits) &&
		(value as MultiEditToolUseInput).edits.every(isMultiEditOperation)
	);
}

/**
 * Type guard for MultiEditToolResultData
 */
export function isMultiEditToolResultData(value: unknown): value is MultiEditToolResultData {
	return (
		typeof value === "object" &&
		value !== null &&
		"message" in value &&
		"edits_applied" in value &&
		"total_edits" in value &&
		"all_successful" in value &&
		typeof (value as MultiEditToolResultData).message === "string" &&
		typeof (value as MultiEditToolResultData).edits_applied === "number" &&
		typeof (value as MultiEditToolResultData).total_edits === "number" &&
		typeof (value as MultiEditToolResultData).all_successful === "boolean"
	);
}

/**
 * Type guard for MultiEditToolChatItem
 */
export function isMultiEditToolChatItem(item: unknown): item is MultiEditToolChatItem {
	return (
		typeof item === "object" &&
		item !== null &&
		(item as MultiEditToolChatItem).type === "tool_use" &&
		"toolUse" in item &&
		(item as MultiEditToolChatItem).toolUse.name === "MultiEdit"
	);
}

/**
 * Export all types
 */
export type {
	BaseToolUse,
	ToolStatus,
} from "@dao/chat-items-common-types";

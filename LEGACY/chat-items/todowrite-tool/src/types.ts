/**
 * @fileoverview Type definitions for the todowrite-tool chat item
 * @module @dao/chat-items-todowrite-tool/types
 */

import type { BaseToolUse, ToolStatus } from "@dao/chat-items-common-types";

/**
 * Individual todo item structure for TodoWrite input
 */
export interface TodoItem {
	/** Unique identifier for the todo item */
	id: string;
	/** The content/description of the todo item */
	content: string;
	/** Current status of the todo item */
	status: "pending" | "in_progress" | "completed";
	/** Priority level of the todo item */
	priority: "high" | "medium" | "low";
}

/**
 * Input parameters for the TodoWrite tool
 */
export interface TodoWriteToolUseInput {
	/** Array of todo items to write/update */
	todos: TodoItem[];
}

/**
 * Result structure for TodoWrite tool operations
 */
export interface TodoWriteToolResultData {
	/** Total number of todos processed */
	totalProcessed: number;
	/** Number of todos successfully added */
	added: number;
	/** Number of todos successfully updated */
	updated: number;
	/** Number of todos that failed to process */
	failed: number;
	/** Array of processed todo items */
	todos: TodoItem[];
	/** Success message */
	message: string;
}

/**
 * Tool use structure for TodoWrite operations
 */
export interface TodoWriteToolUse extends BaseToolUse<"TodoWrite", TodoWriteToolUseInput> {
	type: "tool_use";
}

/**
 * Tool result structure for TodoWrite operations
 */
export interface TodoWriteToolResult {
	tool_use_id: string;
	type: "tool_result";
	content: string;
}

/**
 * Tool use result structure for TodoWrite operations
 */
export interface TodoWriteToolUseResult {
	output: TodoWriteToolResultData | string;
	status: ToolStatus;
}

/**
 * Complete chat item for TodoWrite tool
 */
export interface TodoWriteToolChatItem {
	type: "tool_use";
	toolUse: TodoWriteToolUse;
	toolResult: TodoWriteToolResult;
	toolUseResult: TodoWriteToolUseResult;
}

/**
 * Props for the TodoWrite tool component
 */
export interface TodoWriteToolComponentProps {
	item: TodoWriteToolChatItem;
	className?: string;
	onRetry?: () => void;
}

/**
 * Type guard for TodoWriteToolUseInput
 */
export function isTodoWriteToolUseInput(value: unknown): value is TodoWriteToolUseInput {
	return (
		typeof value === "object" &&
		value !== null &&
		"todos" in value &&
		Array.isArray((value as TodoWriteToolUseInput).todos)
	);
}

/**
 * Type guard for TodoItem
 */
export function isTodoItem(value: unknown): value is TodoItem {
	return (
		typeof value === "object" &&
		value !== null &&
		"id" in value &&
		"content" in value &&
		"status" in value &&
		"priority" in value &&
		typeof (value as TodoItem).id === "string" &&
		typeof (value as TodoItem).content === "string" &&
		["pending", "in_progress", "completed"].includes((value as TodoItem).status) &&
		["high", "medium", "low"].includes((value as TodoItem).priority)
	);
}

/**
 * Type guard for TodoWriteToolResultData
 */
export function isTodoWriteToolResultData(value: unknown): value is TodoWriteToolResultData {
	return (
		typeof value === "object" &&
		value !== null &&
		"totalProcessed" in value &&
		"added" in value &&
		"updated" in value &&
		"failed" in value &&
		"todos" in value &&
		"message" in value &&
		typeof (value as TodoWriteToolResultData).totalProcessed === "number" &&
		typeof (value as TodoWriteToolResultData).added === "number" &&
		typeof (value as TodoWriteToolResultData).updated === "number" &&
		typeof (value as TodoWriteToolResultData).failed === "number" &&
		Array.isArray((value as TodoWriteToolResultData).todos) &&
		typeof (value as TodoWriteToolResultData).message === "string"
	);
}

/**
 * Type guard for TodoWriteToolChatItem
 */
export function isTodoWriteToolChatItem(item: unknown): item is TodoWriteToolChatItem {
	return (
		typeof item === "object" &&
		item !== null &&
		(item as TodoWriteToolChatItem).type === "tool_use" &&
		"toolUse" in item &&
		(item as TodoWriteToolChatItem).toolUse.name === "TodoWrite"
	);
}

/**
 * Export all types
 */
export type {
	BaseToolUse,
	ToolStatus,
} from "@dao/chat-items-common-types";

/**
 * @fileoverview Type definitions for the todoread-tool chat item
 * @module @dao/chat-items-todoread-tool/types
 */

import type { BaseToolUse, ToolStatus } from "@dao/chat-items-common-types";

/**
 * Input parameters for the TodoRead tool (no parameters required)
 */
export type TodoReadToolUseInput = Record<string, never>;

/**
 * Individual todo item structure
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
 * Result structure for TodoRead tool operations
 */
export interface TodoReadToolResultData {
	/** Array of todo items */
	todos: TodoItem[];
	/** Total number of todo items */
	totalCount: number;
	/** Count by status */
	statusCounts: {
		pending: number;
		in_progress: number;
		completed: number;
	};
	/** Count by priority */
	priorityCounts: {
		high: number;
		medium: number;
		low: number;
	};
}

/**
 * Tool use structure for TodoRead operations
 */
export interface TodoReadToolUse extends BaseToolUse<"TodoRead", TodoReadToolUseInput> {
	type: "tool_use";
}

/**
 * Tool result structure for TodoRead operations
 */
export interface TodoReadToolResult {
	tool_use_id: string;
	type: "tool_result";
	content: string;
}

/**
 * Tool use result structure for TodoRead operations
 */
export interface TodoReadToolUseResult {
	output: TodoReadToolResultData | string;
	status: ToolStatus;
}

/**
 * Complete chat item for TodoRead tool
 */
export interface TodoReadToolChatItem {
	type: "tool_use";
	toolUse: TodoReadToolUse;
	toolResult: TodoReadToolResult;
	toolUseResult: TodoReadToolUseResult;
}

/**
 * Props for the TodoRead tool component
 */
export interface TodoReadToolComponentProps {
	item: TodoReadToolChatItem;
	className?: string;
	onRetry?: () => void;
}

/**
 * Type guard for TodoReadToolUseInput
 */
export function isTodoReadToolUseInput(value: unknown): value is TodoReadToolUseInput {
	// TodoRead input is always an empty object or undefined
	return typeof value === "object" && value !== null;
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
 * Type guard for TodoReadToolResultData
 */
export function isTodoReadToolResultData(value: unknown): value is TodoReadToolResultData {
	return (
		typeof value === "object" &&
		value !== null &&
		"todos" in value &&
		"totalCount" in value &&
		"statusCounts" in value &&
		"priorityCounts" in value &&
		Array.isArray((value as TodoReadToolResultData).todos) &&
		typeof (value as TodoReadToolResultData).totalCount === "number"
	);
}

/**
 * Type guard for TodoReadToolChatItem
 */
export function isTodoReadToolChatItem(item: unknown): item is TodoReadToolChatItem {
	return (
		typeof item === "object" &&
		item !== null &&
		(item as TodoReadToolChatItem).type === "tool_use" &&
		"toolUse" in item &&
		(item as TodoReadToolChatItem).toolUse.name === "TodoRead"
	);
}

/**
 * Export all types
 */
export type {
	BaseToolUse,
	ToolStatus,
} from "@dao/chat-items-common-types";

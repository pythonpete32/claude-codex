/**
 * @fileoverview TypeScript validators for todowrite-tool types
 * @module @dao/chat-items-todowrite-tool/validators
 */

import {
	TodoItemSchema,
	TodoWriteToolChatItemSchema,
	TodoWriteToolComponentPropsSchema,
	TodoWriteToolResultDataSchema,
	TodoWriteToolResultSchema,
	TodoWriteToolUseInputSchema,
	TodoWriteToolUseResultSchema,
	TodoWriteToolUseSchema,
} from "./schemas";
import type {
	TodoItem,
	TodoWriteToolChatItem,
	TodoWriteToolComponentProps,
	TodoWriteToolResult,
	TodoWriteToolResultData,
	TodoWriteToolUse,
	TodoWriteToolUseInput,
	TodoWriteToolUseResult,
} from "./types";

/**
 * Validates TodoWrite tool input parameters
 */
export function validateTodoWriteToolUseInput(input: unknown): TodoWriteToolUseInput {
	return TodoWriteToolUseInputSchema.parse(input);
}

/**
 * Validates individual todo item
 */
export function validateTodoItem(item: unknown): TodoItem {
	return TodoItemSchema.parse(item);
}

/**
 * Validates TodoWrite tool result data
 */
export function validateTodoWriteToolResultData(result: unknown): TodoWriteToolResultData {
	return TodoWriteToolResultDataSchema.parse(result);
}

/**
 * Validates tool use structure
 */
export function validateTodoWriteToolUse(toolUse: unknown): TodoWriteToolUse {
	return TodoWriteToolUseSchema.parse(toolUse);
}

/**
 * Validates tool result structure
 */
export function validateTodoWriteToolResult(toolResult: unknown): TodoWriteToolResult {
	return TodoWriteToolResultSchema.parse(toolResult);
}

/**
 * Validates tool use result structure
 */
export function validateTodoWriteToolUseResult(toolUseResult: unknown): TodoWriteToolUseResult {
	return TodoWriteToolUseResultSchema.parse(toolUseResult);
}

/**
 * Validates complete TodoWrite tool chat item
 */
export function validateTodoWriteToolChatItem(item: unknown): TodoWriteToolChatItem {
	return TodoWriteToolChatItemSchema.parse(item);
}

/**
 * Validates component props
 */
export function validateTodoWriteToolComponentProps(props: unknown): TodoWriteToolComponentProps {
	return TodoWriteToolComponentPropsSchema.parse(props);
}

/**
 * Safe validation functions that return null on error
 */

export function safeValidateTodoWriteToolUseInput(input: unknown): TodoWriteToolUseInput | null {
	try {
		return validateTodoWriteToolUseInput(input);
	} catch {
		return null;
	}
}

export function safeValidateTodoItem(item: unknown): TodoItem | null {
	try {
		return validateTodoItem(item);
	} catch {
		return null;
	}
}

export function safeValidateTodoWriteToolResultData(
	result: unknown,
): TodoWriteToolResultData | null {
	try {
		return validateTodoWriteToolResultData(result);
	} catch {
		return null;
	}
}

export function safeValidateTodoWriteToolUse(toolUse: unknown): TodoWriteToolUse | null {
	try {
		return validateTodoWriteToolUse(toolUse);
	} catch {
		return null;
	}
}

export function safeValidateTodoWriteToolResult(toolResult: unknown): TodoWriteToolResult | null {
	try {
		return validateTodoWriteToolResult(toolResult);
	} catch {
		return null;
	}
}

export function safeValidateTodoWriteToolUseResult(
	toolUseResult: unknown,
): TodoWriteToolUseResult | null {
	try {
		return validateTodoWriteToolUseResult(toolUseResult);
	} catch {
		return null;
	}
}

export function safeValidateTodoWriteToolChatItem(item: unknown): TodoWriteToolChatItem | null {
	try {
		return validateTodoWriteToolChatItem(item);
	} catch {
		return null;
	}
}

export function safeValidateTodoWriteToolComponentProps(
	props: unknown,
): TodoWriteToolComponentProps | null {
	try {
		return validateTodoWriteToolComponentProps(props);
	} catch {
		return null;
	}
}

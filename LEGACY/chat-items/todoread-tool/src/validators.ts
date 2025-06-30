/**
 * @fileoverview TypeScript validators for todoread-tool types
 * @module @dao/chat-items-todoread-tool/validators
 */

import {
	TodoItemSchema,
	TodoReadToolChatItemSchema,
	TodoReadToolComponentPropsSchema,
	TodoReadToolResultDataSchema,
	TodoReadToolResultSchema,
	TodoReadToolUseInputSchema,
	TodoReadToolUseResultSchema,
	TodoReadToolUseSchema,
} from "./schemas";
import type {
	TodoItem,
	TodoReadToolChatItem,
	TodoReadToolComponentProps,
	TodoReadToolResult,
	TodoReadToolResultData,
	TodoReadToolUse,
	TodoReadToolUseInput,
	TodoReadToolUseResult,
} from "./types";

/**
 * Validates TodoRead tool input parameters
 */
export function validateTodoReadToolUseInput(input: unknown): TodoReadToolUseInput {
	return TodoReadToolUseInputSchema.parse(input);
}

/**
 * Validates individual todo item
 */
export function validateTodoItem(item: unknown): TodoItem {
	return TodoItemSchema.parse(item);
}

/**
 * Validates TodoRead tool result data
 */
export function validateTodoReadToolResultData(result: unknown): TodoReadToolResultData {
	return TodoReadToolResultDataSchema.parse(result);
}

/**
 * Validates tool use structure
 */
export function validateTodoReadToolUse(toolUse: unknown): TodoReadToolUse {
	return TodoReadToolUseSchema.parse(toolUse);
}

/**
 * Validates tool result structure
 */
export function validateTodoReadToolResult(toolResult: unknown): TodoReadToolResult {
	return TodoReadToolResultSchema.parse(toolResult);
}

/**
 * Validates tool use result structure
 */
export function validateTodoReadToolUseResult(toolUseResult: unknown): TodoReadToolUseResult {
	return TodoReadToolUseResultSchema.parse(toolUseResult);
}

/**
 * Validates complete TodoRead tool chat item
 */
export function validateTodoReadToolChatItem(item: unknown): TodoReadToolChatItem {
	return TodoReadToolChatItemSchema.parse(item);
}

/**
 * Validates component props
 */
export function validateTodoReadToolComponentProps(props: unknown): TodoReadToolComponentProps {
	return TodoReadToolComponentPropsSchema.parse(props);
}

/**
 * Safe validation functions that return null on error
 */

export function safeValidateTodoReadToolUseInput(input: unknown): TodoReadToolUseInput | null {
	try {
		return validateTodoReadToolUseInput(input);
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

export function safeValidateTodoReadToolResultData(result: unknown): TodoReadToolResultData | null {
	try {
		return validateTodoReadToolResultData(result);
	} catch {
		return null;
	}
}

export function safeValidateTodoReadToolUse(toolUse: unknown): TodoReadToolUse | null {
	try {
		return validateTodoReadToolUse(toolUse);
	} catch {
		return null;
	}
}

export function safeValidateTodoReadToolResult(toolResult: unknown): TodoReadToolResult | null {
	try {
		return validateTodoReadToolResult(toolResult);
	} catch {
		return null;
	}
}

export function safeValidateTodoReadToolUseResult(
	toolUseResult: unknown,
): TodoReadToolUseResult | null {
	try {
		return validateTodoReadToolUseResult(toolUseResult);
	} catch {
		return null;
	}
}

export function safeValidateTodoReadToolChatItem(item: unknown): TodoReadToolChatItem | null {
	try {
		return validateTodoReadToolChatItem(item);
	} catch {
		return null;
	}
}

export function safeValidateTodoReadToolComponentProps(
	props: unknown,
): TodoReadToolComponentProps | null {
	try {
		return validateTodoReadToolComponentProps(props);
	} catch {
		return null;
	}
}

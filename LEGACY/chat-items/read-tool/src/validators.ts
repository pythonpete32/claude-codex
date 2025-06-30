/**
 * @fileoverview TypeScript validators for read-tool types
 * @module @dao/chat-items-read-tool/validators
 */

import {
	ReadToolChatItemSchema,
	ReadToolComponentPropsSchema,
	ReadToolResultDataSchema,
	ReadToolResultSchema,
	ReadToolUseInputSchema,
	ReadToolUseSchema,
} from "./schemas";
import type {
	ReadToolChatItem,
	ReadToolComponentProps,
	ReadToolResult,
	ReadToolResultData,
	ReadToolUse,
	ReadToolUseInput,
} from "./types";

/**
 * Validates read tool input parameters
 */
export function validateReadToolUseInput(input: unknown): ReadToolUseInput {
	return ReadToolUseInputSchema.parse(input);
}

/**
 * Validates read tool result data
 */
export function validateReadToolResultData(result: unknown): ReadToolResultData {
	return ReadToolResultDataSchema.parse(result);
}

/**
 * Validates tool use structure
 */
export function validateReadToolUse(toolUse: unknown): ReadToolUse {
	return ReadToolUseSchema.parse(toolUse);
}

/**
 * Validates tool result structure
 */
export function validateReadToolResult(toolResult: unknown): ReadToolResult {
	return ReadToolResultSchema.parse(toolResult);
}

/**
 * Validates complete read tool chat item
 */
export function validateReadToolChatItem(item: unknown): ReadToolChatItem {
	return ReadToolChatItemSchema.parse(item);
}

/**
 * Validates component props
 */
export function validateReadToolComponentProps(props: unknown): ReadToolComponentProps {
	return ReadToolComponentPropsSchema.parse(props);
}

/**
 * Safe validation functions that return null on error
 */

export function safeValidateReadToolUseInput(input: unknown): ReadToolUseInput | null {
	try {
		return validateReadToolUseInput(input);
	} catch {
		return null;
	}
}

export function safeValidateReadToolResultData(result: unknown): ReadToolResultData | null {
	try {
		return validateReadToolResultData(result);
	} catch {
		return null;
	}
}

export function safeValidateReadToolUse(toolUse: unknown): ReadToolUse | null {
	try {
		return validateReadToolUse(toolUse);
	} catch {
		return null;
	}
}

export function safeValidateReadToolResult(toolResult: unknown): ReadToolResult | null {
	try {
		return validateReadToolResult(toolResult);
	} catch {
		return null;
	}
}

export function safeValidateReadToolChatItem(item: unknown): ReadToolChatItem | null {
	try {
		return validateReadToolChatItem(item);
	} catch {
		return null;
	}
}

export function safeValidateReadToolComponentProps(props: unknown): ReadToolComponentProps | null {
	try {
		return validateReadToolComponentProps(props);
	} catch {
		return null;
	}
}

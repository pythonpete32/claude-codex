/**
 * @fileoverview TypeScript validators for write-tool types
 * @module @dao/chat-items-write-tool/validators
 */

import {
	WriteToolChatItemSchema,
	WriteToolComponentPropsSchema,
	WriteToolResultDataSchema,
	WriteToolResultSchema,
	WriteToolUseInputSchema,
	WriteToolUseResultSchema,
	WriteToolUseSchema,
} from "./schemas";
import type {
	WriteToolChatItem,
	WriteToolComponentProps,
	WriteToolResult,
	WriteToolResultData,
	WriteToolUse,
	WriteToolUseInput,
	WriteToolUseResult,
} from "./types";

/**
 * Validates write tool input parameters
 */
export function validateWriteToolUseInput(input: unknown): WriteToolUseInput {
	return WriteToolUseInputSchema.parse(input);
}

/**
 * Validates write tool result data
 */
export function validateWriteToolResultData(result: unknown): WriteToolResultData {
	return WriteToolResultDataSchema.parse(result);
}

/**
 * Validates tool use structure
 */
export function validateWriteToolUse(toolUse: unknown): WriteToolUse {
	return WriteToolUseSchema.parse(toolUse);
}

/**
 * Validates tool result structure
 */
export function validateWriteToolResult(toolResult: unknown): WriteToolResult {
	return WriteToolResultSchema.parse(toolResult);
}

/**
 * Validates tool use result structure
 */
export function validateWriteToolUseResult(toolUseResult: unknown): WriteToolUseResult {
	return WriteToolUseResultSchema.parse(toolUseResult);
}

/**
 * Validates complete write tool chat item
 */
export function validateWriteToolChatItem(item: unknown): WriteToolChatItem {
	return WriteToolChatItemSchema.parse(item);
}

/**
 * Validates component props
 */
export function validateWriteToolComponentProps(props: unknown): WriteToolComponentProps {
	return WriteToolComponentPropsSchema.parse(props);
}

/**
 * Safe validation functions that return null on error
 */

export function safeValidateWriteToolUseInput(input: unknown): WriteToolUseInput | null {
	try {
		return validateWriteToolUseInput(input);
	} catch {
		return null;
	}
}

export function safeValidateWriteToolResultData(result: unknown): WriteToolResultData | null {
	try {
		return validateWriteToolResultData(result);
	} catch {
		return null;
	}
}

export function safeValidateWriteToolUse(toolUse: unknown): WriteToolUse | null {
	try {
		return validateWriteToolUse(toolUse);
	} catch {
		return null;
	}
}

export function safeValidateWriteToolResult(toolResult: unknown): WriteToolResult | null {
	try {
		return validateWriteToolResult(toolResult);
	} catch {
		return null;
	}
}

export function safeValidateWriteToolUseResult(toolUseResult: unknown): WriteToolUseResult | null {
	try {
		return validateWriteToolUseResult(toolUseResult);
	} catch {
		return null;
	}
}

export function safeValidateWriteToolChatItem(item: unknown): WriteToolChatItem | null {
	try {
		return validateWriteToolChatItem(item);
	} catch {
		return null;
	}
}

export function safeValidateWriteToolComponentProps(
	props: unknown,
): WriteToolComponentProps | null {
	try {
		return validateWriteToolComponentProps(props);
	} catch {
		return null;
	}
}

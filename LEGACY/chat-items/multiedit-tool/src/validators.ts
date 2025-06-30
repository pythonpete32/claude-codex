/**
 * @fileoverview TypeScript validators for multiedit-tool types
 * @module @dao/chat-items-multiedit-tool/validators
 */

import {
	EditResultSchema,
	MultiEditOperationSchema,
	MultiEditToolChatItemSchema,
	MultiEditToolComponentPropsSchema,
	MultiEditToolResultDataSchema,
	MultiEditToolResultSchema,
	MultiEditToolUseInputSchema,
	MultiEditToolUseSchema,
} from "./schemas";
import type {
	EditResult,
	MultiEditOperation,
	MultiEditToolChatItem,
	MultiEditToolComponentProps,
	MultiEditToolResult,
	MultiEditToolResultData,
	MultiEditToolUse,
	MultiEditToolUseInput,
} from "./types";

/**
 * Validates individual edit operation
 */
export function validateMultiEditOperation(operation: unknown): MultiEditOperation {
	return MultiEditOperationSchema.parse(operation);
}

/**
 * Validates multiedit tool input parameters
 */
export function validateMultiEditToolUseInput(input: unknown): MultiEditToolUseInput {
	return MultiEditToolUseInputSchema.parse(input);
}

/**
 * Validates multiedit tool result data
 */
export function validateMultiEditToolResultData(result: unknown): MultiEditToolResultData {
	return MultiEditToolResultDataSchema.parse(result);
}

/**
 * Validates individual edit result
 */
export function validateEditResult(result: unknown): EditResult {
	return EditResultSchema.parse(result);
}

/**
 * Validates tool use structure
 */
export function validateMultiEditToolUse(toolUse: unknown): MultiEditToolUse {
	return MultiEditToolUseSchema.parse(toolUse);
}

/**
 * Validates tool result structure
 */
export function validateMultiEditToolResult(toolResult: unknown): MultiEditToolResult {
	return MultiEditToolResultSchema.parse(toolResult);
}

/**
 * Validates complete multiedit tool chat item
 */
export function validateMultiEditToolChatItem(item: unknown): MultiEditToolChatItem {
	return MultiEditToolChatItemSchema.parse(item);
}

/**
 * Validates component props
 */
export function validateMultiEditToolComponentProps(props: unknown): MultiEditToolComponentProps {
	return MultiEditToolComponentPropsSchema.parse(props);
}

/**
 * Safe validation functions that return null on error
 */

export function safeValidateMultiEditOperation(operation: unknown): MultiEditOperation | null {
	try {
		return validateMultiEditOperation(operation);
	} catch {
		return null;
	}
}

export function safeValidateMultiEditToolUseInput(input: unknown): MultiEditToolUseInput | null {
	try {
		return validateMultiEditToolUseInput(input);
	} catch {
		return null;
	}
}

export function safeValidateMultiEditToolResultData(
	result: unknown,
): MultiEditToolResultData | null {
	try {
		return validateMultiEditToolResultData(result);
	} catch {
		return null;
	}
}

export function safeValidateEditResult(result: unknown): EditResult | null {
	try {
		return validateEditResult(result);
	} catch {
		return null;
	}
}

export function safeValidateMultiEditToolUse(toolUse: unknown): MultiEditToolUse | null {
	try {
		return validateMultiEditToolUse(toolUse);
	} catch {
		return null;
	}
}

export function safeValidateMultiEditToolResult(toolResult: unknown): MultiEditToolResult | null {
	try {
		return validateMultiEditToolResult(toolResult);
	} catch {
		return null;
	}
}

export function safeValidateMultiEditToolChatItem(item: unknown): MultiEditToolChatItem | null {
	try {
		return validateMultiEditToolChatItem(item);
	} catch {
		return null;
	}
}

export function safeValidateMultiEditToolComponentProps(
	props: unknown,
): MultiEditToolComponentProps | null {
	try {
		return validateMultiEditToolComponentProps(props);
	} catch {
		return null;
	}
}

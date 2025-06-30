/**
 * @fileoverview TypeScript validators for sequential thinking tool types
 * @module @dao/chat-items-todowrite-mcp-sequential-thinking/validators
 */

import {
	SequentialThinkingToolChatItemSchema,
	SequentialThinkingToolComponentPropsSchema,
	SequentialThinkingToolResultDataSchema,
	SequentialThinkingToolResultSchema,
	SequentialThinkingToolUseInputSchema,
	SequentialThinkingToolUseResultSchema,
	SequentialThinkingToolUseSchema,
	ThinkingStepSchema,
	ThinkingWorkflowSchema,
} from "./schemas";
import type {
	SequentialThinkingToolChatItem,
	SequentialThinkingToolComponentProps,
	SequentialThinkingToolResult,
	SequentialThinkingToolResultData,
	SequentialThinkingToolUse,
	SequentialThinkingToolUseInput,
	SequentialThinkingToolUseResult,
	ThinkingStep,
	ThinkingWorkflow,
} from "./types";

/**
 * Validates Sequential Thinking tool input parameters
 */
export function validateSequentialThinkingToolUseInput(
	input: unknown,
): SequentialThinkingToolUseInput {
	return SequentialThinkingToolUseInputSchema.parse(input);
}

/**
 * Validates individual thinking step
 */
export function validateThinkingStep(step: unknown): ThinkingStep {
	return ThinkingStepSchema.parse(step);
}

/**
 * Validates thinking workflow
 */
export function validateThinkingWorkflow(workflow: unknown): ThinkingWorkflow {
	return ThinkingWorkflowSchema.parse(workflow);
}

/**
 * Validates Sequential Thinking tool result data
 */
export function validateSequentialThinkingToolResultData(
	result: unknown,
): SequentialThinkingToolResultData {
	return SequentialThinkingToolResultDataSchema.parse(result);
}

/**
 * Validates tool use structure
 */
export function validateSequentialThinkingToolUse(toolUse: unknown): SequentialThinkingToolUse {
	return SequentialThinkingToolUseSchema.parse(toolUse);
}

/**
 * Validates tool result structure
 */
export function validateSequentialThinkingToolResult(
	toolResult: unknown,
): SequentialThinkingToolResult {
	return SequentialThinkingToolResultSchema.parse(toolResult);
}

/**
 * Validates tool use result structure
 */
export function validateSequentialThinkingToolUseResult(
	toolUseResult: unknown,
): SequentialThinkingToolUseResult {
	return SequentialThinkingToolUseResultSchema.parse(toolUseResult);
}

/**
 * Validates complete Sequential Thinking tool chat item
 */
export function validateSequentialThinkingToolChatItem(
	item: unknown,
): SequentialThinkingToolChatItem {
	return SequentialThinkingToolChatItemSchema.parse(item);
}

/**
 * Validates component props
 */
export function validateSequentialThinkingToolComponentProps(
	props: unknown,
): SequentialThinkingToolComponentProps {
	return SequentialThinkingToolComponentPropsSchema.parse(props);
}

/**
 * Safe validation functions that return null on error
 */

export function safeValidateSequentialThinkingToolUseInput(
	input: unknown,
): SequentialThinkingToolUseInput | null {
	try {
		return validateSequentialThinkingToolUseInput(input);
	} catch {
		return null;
	}
}

export function safeValidateThinkingStep(step: unknown): ThinkingStep | null {
	try {
		return validateThinkingStep(step);
	} catch {
		return null;
	}
}

export function safeValidateThinkingWorkflow(workflow: unknown): ThinkingWorkflow | null {
	try {
		return validateThinkingWorkflow(workflow);
	} catch {
		return null;
	}
}

export function safeValidateSequentialThinkingToolResultData(
	result: unknown,
): SequentialThinkingToolResultData | null {
	try {
		return validateSequentialThinkingToolResultData(result);
	} catch {
		return null;
	}
}

export function safeValidateSequentialThinkingToolUse(
	toolUse: unknown,
): SequentialThinkingToolUse | null {
	try {
		return validateSequentialThinkingToolUse(toolUse);
	} catch {
		return null;
	}
}

export function safeValidateSequentialThinkingToolResult(
	toolResult: unknown,
): SequentialThinkingToolResult | null {
	try {
		return validateSequentialThinkingToolResult(toolResult);
	} catch {
		return null;
	}
}

export function safeValidateSequentialThinkingToolUseResult(
	toolUseResult: unknown,
): SequentialThinkingToolUseResult | null {
	try {
		return validateSequentialThinkingToolUseResult(toolUseResult);
	} catch {
		return null;
	}
}

export function safeValidateSequentialThinkingToolChatItem(
	item: unknown,
): SequentialThinkingToolChatItem | null {
	try {
		return validateSequentialThinkingToolChatItem(item);
	} catch {
		return null;
	}
}

export function safeValidateSequentialThinkingToolComponentProps(
	props: unknown,
): SequentialThinkingToolComponentProps | null {
	try {
		return validateSequentialThinkingToolComponentProps(props);
	} catch {
		return null;
	}
}

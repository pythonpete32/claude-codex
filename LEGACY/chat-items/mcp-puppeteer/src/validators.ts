/**
 * @fileoverview TypeScript validators for Puppeteer MCP tool types
 * @module @dao/chat-items-mcp-puppeteer/validators
 */

import {
	BrowserLaunchOptionsSchema,
	ElementInteractionOptionsSchema,
	EvaluationOptionsSchema,
	FormInputOptionsSchema,
	NavigationOptionsSchema,
	PageMetricsSchema,
	PuppeteerMcpToolChatItemSchema,
	PuppeteerMcpToolComponentPropsSchema,
	PuppeteerMcpToolResultDataSchema,
	PuppeteerMcpToolResultSchema,
	PuppeteerMcpToolUseInputSchema,
	PuppeteerMcpToolUseResultSchema,
	PuppeteerMcpToolUseSchema,
	ScreenshotOptionsSchema,
	SelectOptionsSchema,
	WaitOptionsSchema,
} from "./schemas";
import type {
	BrowserLaunchOptions,
	ElementInteractionOptions,
	EvaluationOptions,
	FormInputOptions,
	NavigationOptions,
	PageMetrics,
	PuppeteerMcpToolChatItem,
	PuppeteerMcpToolComponentProps,
	PuppeteerMcpToolResult,
	PuppeteerMcpToolResultData,
	PuppeteerMcpToolUse,
	PuppeteerMcpToolUseInput,
	PuppeteerMcpToolUseResult,
	ScreenshotOptions,
	SelectOptions,
	WaitOptions,
} from "./types";

/**
 * Validates Puppeteer MCP tool input parameters
 */
export function validatePuppeteerMcpToolUseInput(input: unknown): PuppeteerMcpToolUseInput {
	return PuppeteerMcpToolUseInputSchema.parse(input);
}

/**
 * Validates browser launch options
 */
export function validateBrowserLaunchOptions(options: unknown): BrowserLaunchOptions {
	return BrowserLaunchOptionsSchema.parse(options);
}

/**
 * Validates navigation options
 */
export function validateNavigationOptions(options: unknown): NavigationOptions {
	return NavigationOptionsSchema.parse(options);
}

/**
 * Validates screenshot options
 */
export function validateScreenshotOptions(options: unknown): ScreenshotOptions {
	return ScreenshotOptionsSchema.parse(options);
}

/**
 * Validates element interaction options
 */
export function validateElementInteractionOptions(options: unknown): ElementInteractionOptions {
	return ElementInteractionOptionsSchema.parse(options);
}

/**
 * Validates form input options
 */
export function validateFormInputOptions(options: unknown): FormInputOptions {
	return FormInputOptionsSchema.parse(options);
}

/**
 * Validates select options
 */
export function validateSelectOptions(options: unknown): SelectOptions {
	return SelectOptionsSchema.parse(options);
}

/**
 * Validates JavaScript evaluation options
 */
export function validateEvaluationOptions(options: unknown): EvaluationOptions {
	return EvaluationOptionsSchema.parse(options);
}

/**
 * Validates wait options
 */
export function validateWaitOptions(options: unknown): WaitOptions {
	return WaitOptionsSchema.parse(options);
}

/**
 * Validates page metrics
 */
export function validatePageMetrics(metrics: unknown): PageMetrics {
	return PageMetricsSchema.parse(metrics);
}

/**
 * Validates Puppeteer MCP tool result data
 */
export function validatePuppeteerMcpToolResultData(result: unknown): PuppeteerMcpToolResultData {
	return PuppeteerMcpToolResultDataSchema.parse(result);
}

/**
 * Validates tool use structure
 */
export function validatePuppeteerMcpToolUse(toolUse: unknown): PuppeteerMcpToolUse {
	return PuppeteerMcpToolUseSchema.parse(toolUse);
}

/**
 * Validates tool result structure
 */
export function validatePuppeteerMcpToolResult(toolResult: unknown): PuppeteerMcpToolResult {
	return PuppeteerMcpToolResultSchema.parse(toolResult);
}

/**
 * Validates tool use result structure
 */
export function validatePuppeteerMcpToolUseResult(
	toolUseResult: unknown,
): PuppeteerMcpToolUseResult {
	return PuppeteerMcpToolUseResultSchema.parse(toolUseResult);
}

/**
 * Validates complete Puppeteer MCP tool chat item
 */
export function validatePuppeteerMcpToolChatItem(item: unknown): PuppeteerMcpToolChatItem {
	return PuppeteerMcpToolChatItemSchema.parse(item);
}

/**
 * Validates component props
 */
export function validatePuppeteerMcpToolComponentProps(
	props: unknown,
): PuppeteerMcpToolComponentProps {
	return PuppeteerMcpToolComponentPropsSchema.parse(props);
}

/**
 * Safe validation functions that return null on error
 */

export function safeValidatePuppeteerMcpToolUseInput(
	input: unknown,
): PuppeteerMcpToolUseInput | null {
	try {
		return validatePuppeteerMcpToolUseInput(input);
	} catch {
		return null;
	}
}

export function safeValidateBrowserLaunchOptions(options: unknown): BrowserLaunchOptions | null {
	try {
		return validateBrowserLaunchOptions(options);
	} catch {
		return null;
	}
}

export function safeValidateNavigationOptions(options: unknown): NavigationOptions | null {
	try {
		return validateNavigationOptions(options);
	} catch {
		return null;
	}
}

export function safeValidateScreenshotOptions(options: unknown): ScreenshotOptions | null {
	try {
		return validateScreenshotOptions(options);
	} catch {
		return null;
	}
}

export function safeValidateElementInteractionOptions(
	options: unknown,
): ElementInteractionOptions | null {
	try {
		return validateElementInteractionOptions(options);
	} catch {
		return null;
	}
}

export function safeValidateFormInputOptions(options: unknown): FormInputOptions | null {
	try {
		return validateFormInputOptions(options);
	} catch {
		return null;
	}
}

export function safeValidateSelectOptions(options: unknown): SelectOptions | null {
	try {
		return validateSelectOptions(options);
	} catch {
		return null;
	}
}

export function safeValidateEvaluationOptions(options: unknown): EvaluationOptions | null {
	try {
		return validateEvaluationOptions(options);
	} catch {
		return null;
	}
}

export function safeValidateWaitOptions(options: unknown): WaitOptions | null {
	try {
		return validateWaitOptions(options);
	} catch {
		return null;
	}
}

export function safeValidatePageMetrics(metrics: unknown): PageMetrics | null {
	try {
		return validatePageMetrics(metrics);
	} catch {
		return null;
	}
}

export function safeValidatePuppeteerMcpToolResultData(
	result: unknown,
): PuppeteerMcpToolResultData | null {
	try {
		return validatePuppeteerMcpToolResultData(result);
	} catch {
		return null;
	}
}

export function safeValidatePuppeteerMcpToolUse(toolUse: unknown): PuppeteerMcpToolUse | null {
	try {
		return validatePuppeteerMcpToolUse(toolUse);
	} catch {
		return null;
	}
}

export function safeValidatePuppeteerMcpToolResult(
	toolResult: unknown,
): PuppeteerMcpToolResult | null {
	try {
		return validatePuppeteerMcpToolResult(toolResult);
	} catch {
		return null;
	}
}

export function safeValidatePuppeteerMcpToolUseResult(
	toolUseResult: unknown,
): PuppeteerMcpToolUseResult | null {
	try {
		return validatePuppeteerMcpToolUseResult(toolUseResult);
	} catch {
		return null;
	}
}

export function safeValidatePuppeteerMcpToolChatItem(
	item: unknown,
): PuppeteerMcpToolChatItem | null {
	try {
		return validatePuppeteerMcpToolChatItem(item);
	} catch {
		return null;
	}
}

export function safeValidatePuppeteerMcpToolComponentProps(
	props: unknown,
): PuppeteerMcpToolComponentProps | null {
	try {
		return validatePuppeteerMcpToolComponentProps(props);
	} catch {
		return null;
	}
}

/**
 * @fileoverview Data transformation functions for Puppeteer MCP tool
 * @module @dao/chat-items-mcp-puppeteer/parsers
 */

import type {
	BrowserLaunchOptions,
	ConsoleMessage,
	ElementInteractionOptions,
	EvaluationOptions,
	FormInputOptions,
	NavigationOptions,
	NetworkRequest,
	PageMetrics,
	PuppeteerMcpToolResultData,
	PuppeteerMcpToolUseInput,
	PuppeteerOperationType,
	ScreenshotOptions,
	SelectOptions,
	WaitOptions,
} from "./types";

/**
 * Parses and normalizes Puppeteer MCP tool input
 */
export function parsePuppeteerMcpInput(input: PuppeteerMcpToolUseInput): PuppeteerMcpToolUseInput {
	const parsed: PuppeteerMcpToolUseInput = {
		operation: input.operation,
		timeout: input.timeout || getDefaultTimeout(input.operation),
		debug: input.debug || false,
	};

	// Add operation-specific options
	if (input.launchOptions) {
		parsed.launchOptions = normalizeLaunchOptions(input.launchOptions);
	}

	if (input.navigation) {
		parsed.navigation = normalizeNavigationOptions(input.navigation);
	}

	if (input.screenshot) {
		parsed.screenshot = normalizeScreenshotOptions(input.screenshot);
	}

	if (input.element) {
		parsed.element = normalizeElementOptions(input.element);
	}

	if (input.input) {
		parsed.input = normalizeFormInputOptions(input.input);
	}

	if (input.select) {
		parsed.select = normalizeSelectOptions(input.select);
	}

	if (input.evaluation) {
		parsed.evaluation = normalizeEvaluationOptions(input.evaluation);
	}

	if (input.wait) {
		parsed.wait = normalizeWaitOptions(input.wait);
	}

	return parsed;
}

/**
 * Gets default timeout for operation type
 */
export function getDefaultTimeout(operation: PuppeteerOperationType): number {
	const timeouts: Record<PuppeteerOperationType, number> = {
		navigate: 30000,
		screenshot: 10000,
		click: 5000,
		fill: 5000,
		select: 5000,
		hover: 5000,
		evaluate: 10000,
		waitForSelector: 30000,
		waitForNavigation: 30000,
		reload: 20000,
		goBack: 10000,
		goForward: 10000,
	};

	return timeouts[operation] || 10000;
}

/**
 * Normalizes browser launch options
 */
export function normalizeLaunchOptions(options: BrowserLaunchOptions): BrowserLaunchOptions {
	return {
		headless: options.headless !== false, // Default to true
		width: options.width || 1280,
		height: options.height || 720,
		timeout: options.timeout || 30000,
		...options,
	};
}

/**
 * Normalizes navigation options
 */
export function normalizeNavigationOptions(options: NavigationOptions): NavigationOptions {
	return {
		...options,
		waitUntil: options.waitUntil || "domcontentloaded",
		timeout: options.timeout || 30000,
	};
}

/**
 * Normalizes screenshot options
 */
export function normalizeScreenshotOptions(options: ScreenshotOptions): ScreenshotOptions {
	return {
		type: "png",
		fullPage: false,
		encoding: "base64",
		...options,
	};
}

/**
 * Normalizes element interaction options
 */
export function normalizeElementOptions(
	options: ElementInteractionOptions,
): ElementInteractionOptions {
	return {
		...options,
		waitForVisible: options.waitForVisible !== false, // Default to true
		timeout: options.timeout || 5000,
		clickCount: options.clickCount || 1,
		button: options.button || "left",
	};
}

/**
 * Normalizes form input options
 */
export function normalizeFormInputOptions(options: FormInputOptions): FormInputOptions {
	return {
		...normalizeElementOptions(options),
		value: options.value,
		clear: options.clear !== false, // Default to true
		delay: options.delay || 0,
	};
}

/**
 * Normalizes select options
 */
export function normalizeSelectOptions(options: SelectOptions): SelectOptions {
	return {
		...normalizeElementOptions(options),
		values: options.values,
	};
}

/**
 * Normalizes JavaScript evaluation options
 */
export function normalizeEvaluationOptions(options: EvaluationOptions): EvaluationOptions {
	return {
		...options,
		returnByValue: options.returnByValue !== false, // Default to true
		timeout: options.timeout || 10000,
		args: options.args || [],
	};
}

/**
 * Normalizes wait options
 */
export function normalizeWaitOptions(options: WaitOptions): WaitOptions {
	return {
		...options,
		timeout: options.timeout || 30000,
	};
}

/**
 * Creates a successful operation result
 */
export function createSuccessResult(
	operation: PuppeteerOperationType,
	message: string,
	additionalData?: Partial<PuppeteerMcpToolResultData>,
): PuppeteerMcpToolResultData {
	return {
		operation,
		success: true,
		message,
		...additionalData,
	};
}

/**
 * Creates a failed operation result
 */
export function createErrorResult(
	operation: PuppeteerOperationType,
	error: Error,
	additionalData?: Partial<PuppeteerMcpToolResultData>,
): PuppeteerMcpToolResultData {
	return {
		operation,
		success: false,
		message: `Operation failed: ${error.message}`,
		error: {
			name: error.name,
			message: error.message,
			stack: error.stack,
		},
		...additionalData,
	};
}

/**
 * Formats operation summary for display
 */
export function formatOperationSummary(result: PuppeteerMcpToolResultData): string {
	const { operation, success, message } = result;
	const status = success ? "✅" : "❌";
	const operationName = operation.charAt(0).toUpperCase() + operation.slice(1);

	let summary = `${status} ${operationName}: ${message}`;

	if (result.currentUrl) {
		summary += `\nURL: ${result.currentUrl}`;
	}

	if (result.pageTitle) {
		summary += `\nTitle: ${result.pageTitle}`;
	}

	if (result.timing) {
		summary += `\nDuration: ${result.timing.duration}ms`;
	}

	if (result.elementInfo) {
		summary += `\nElement: ${result.elementInfo.tagName}`;
		if (result.elementInfo.textContent) {
			const text = result.elementInfo.textContent.substring(0, 50);
			summary += ` ("${text}${result.elementInfo.textContent.length > 50 ? "..." : ""}")`;
		}
	}

	return summary;
}

/**
 * Extracts key metrics from page metrics
 */
export function extractKeyMetrics(metrics: PageMetrics): Record<string, number> {
	return {
		domNodes: metrics.nodes,
		layoutCount: metrics.layouts,
		styleRecalcs: metrics.recalcStyle,
		heapUsed: Math.round(metrics.jsHeapUsedSize / 1024 / 1024), // MB
		heapTotal: Math.round(metrics.jsHeapTotalSize / 1024 / 1024), // MB
		loadTime: metrics.loadEventEnd,
		domLoadTime: metrics.domContentLoadedEventEnd,
	};
}

/**
 * Filters console messages by type
 */
export function filterConsoleMessages(
	messages: ConsoleMessage[],
	types: ConsoleMessage["type"][],
): ConsoleMessage[] {
	return messages.filter((message) => types.includes(message.type));
}

/**
 * Gets error console messages
 */
export function getErrorMessages(messages: ConsoleMessage[]): ConsoleMessage[] {
	return filterConsoleMessages(messages, ["error", "assert"]);
}

/**
 * Gets warning console messages
 */
export function getWarningMessages(messages: ConsoleMessage[]): ConsoleMessage[] {
	return filterConsoleMessages(messages, ["warn"]);
}

/**
 * Filters network requests by status code range
 */
export function filterNetworkRequests(
	requests: NetworkRequest[],
	minStatus: number,
	maxStatus: number,
): NetworkRequest[] {
	return requests.filter(
		(request) =>
			request.status !== undefined && request.status >= minStatus && request.status <= maxStatus,
	);
}

/**
 * Gets failed network requests (4xx and 5xx status codes)
 */
export function getFailedRequests(requests: NetworkRequest[]): NetworkRequest[] {
	return filterNetworkRequests(requests, 400, 599);
}

/**
 * Gets slow network requests (based on timing)
 */
export function getSlowRequests(
	requests: NetworkRequest[],
	thresholdMs: number = 1000,
): NetworkRequest[] {
	return requests.filter((request) => {
		if (!request.timing) return false;
		const duration = request.timing.responseEnd - request.timing.requestStart;
		return duration > thresholdMs;
	});
}

/**
 * Analyzes performance metrics and provides insights
 */
export function analyzePerformance(
	metrics: PageMetrics,
	consoleMessages: ConsoleMessage[],
	networkRequests: NetworkRequest[],
): {
	score: number;
	issues: string[];
	recommendations: string[];
} {
	const issues: string[] = [];
	const recommendations: string[] = [];
	let score = 100;

	// Analyze DOM complexity
	if (metrics.nodes > 3000) {
		issues.push(`High DOM complexity: ${metrics.nodes} nodes`);
		recommendations.push("Consider simplifying the DOM structure");
		score -= 20;
	}

	// Analyze memory usage
	const heapUsedMB = metrics.jsHeapUsedSize / 1024 / 1024;
	if (heapUsedMB > 100) {
		issues.push(`High memory usage: ${Math.round(heapUsedMB)}MB`);
		recommendations.push("Investigate memory leaks and optimize JavaScript");
		score -= 15;
	}

	// Analyze console errors
	const errors = getErrorMessages(consoleMessages);
	if (errors.length > 0) {
		issues.push(`${errors.length} console errors detected`);
		recommendations.push("Fix JavaScript errors");
		score -= errors.length * 5;
	}

	// Analyze network requests
	const failedRequests = getFailedRequests(networkRequests);
	if (failedRequests.length > 0) {
		issues.push(`${failedRequests.length} failed network requests`);
		recommendations.push("Fix failing network requests");
		score -= failedRequests.length * 10;
	}

	const slowRequests = getSlowRequests(networkRequests);
	if (slowRequests.length > 0) {
		issues.push(`${slowRequests.length} slow network requests (>1s)`);
		recommendations.push("Optimize slow network requests");
		score -= slowRequests.length * 5;
	}

	// Analyze load times
	if (metrics.loadEventEnd > 5000) {
		issues.push(`Slow page load: ${metrics.loadEventEnd}ms`);
		recommendations.push("Optimize page load performance");
		score -= 15;
	}

	return {
		score: Math.max(0, score),
		issues,
		recommendations,
	};
}

/**
 * Creates operation timing information
 */
export function createTiming(startTime: number): {
	startTime: number;
	endTime: number;
	duration: number;
} {
	const endTime = Date.now();
	return {
		startTime,
		endTime,
		duration: endTime - startTime,
	};
}

/**
 * Validates CSS selector syntax
 */
export function validateSelector(selector: string): boolean {
	try {
		document.querySelector(selector);
		return true;
	} catch {
		return false;
	}
}

/**
 * Sanitizes URL for display
 */
export function sanitizeUrl(url: string): string {
	try {
		const urlObj = new URL(url);
		// Remove sensitive query parameters
		const sensitiveParams = ["password", "token", "key", "secret", "auth"];
		sensitiveParams.forEach((param) => {
			if (urlObj.searchParams.has(param)) {
				urlObj.searchParams.set(param, "[REDACTED]");
			}
		});
		return decodeURIComponent(urlObj.toString());
	} catch {
		return url;
	}
}

/**
 * Generates operation fingerprint for caching/deduplication
 */
export function generateOperationFingerprint(input: PuppeteerMcpToolUseInput): string {
	// Create a compact key string to ensure distinctiveness
	const keyStr = `${input.operation}|${input.navigation?.url || ""}|${input.element?.selector || input.input?.selector || input.select?.selector || ""}|${input.evaluation?.script || ""}|${input.timeout || ""}|${input.debug || false}|${input.launchOptions?.headless || false}`;

	return btoa(keyStr)
		.replace(/[^a-zA-Z0-9]/g, "")
		.substring(0, 16);
}

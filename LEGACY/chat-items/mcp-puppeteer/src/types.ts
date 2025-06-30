/**
 * @fileoverview Type definitions for Puppeteer MCP browser automation tool
 * @module @dao/chat-items-mcp-puppeteer/types
 */

import type { BaseToolUse, ToolStatus } from "@dao/chat-items-common-types";

/**
 * Types of Puppeteer operations supported
 */
export type PuppeteerOperationType =
	| "navigate"
	| "screenshot"
	| "click"
	| "fill"
	| "select"
	| "hover"
	| "evaluate"
	| "waitForSelector"
	| "waitForNavigation"
	| "reload"
	| "goBack"
	| "goForward";

/**
 * Browser launch options
 */
export interface BrowserLaunchOptions {
	/** Whether to run browser in headless mode */
	headless?: boolean;
	/** Browser window width */
	width?: number;
	/** Browser window height */
	height?: number;
	/** Browser executable path */
	executablePath?: string;
	/** Additional browser arguments */
	args?: string[];
	/** Whether to ignore default arguments */
	ignoreDefaultArgs?: boolean;
	/** Custom user data directory */
	userDataDir?: string;
	/** Whether to enable developer tools */
	devtools?: boolean;
	/** Network timeout in milliseconds */
	timeout?: number;
}

/**
 * Navigation options for page operations
 */
export interface NavigationOptions {
	/** URL to navigate to */
	url: string;
	/** Wait for specific condition after navigation */
	waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
	/** Timeout for navigation in milliseconds */
	timeout?: number;
	/** HTTP referer header */
	referer?: string;
}

/**
 * Screenshot configuration options
 */
export interface ScreenshotOptions {
	/** Whether to capture full page */
	fullPage?: boolean;
	/** Image format */
	type?: "png" | "jpeg" | "webp";
	/** Image quality (0-100, only for jpeg/webp) */
	quality?: number;
	/** Whether to omit background */
	omitBackground?: boolean;
	/** CSS selector for element to screenshot */
	selector?: string;
	/** Custom clip region */
	clip?: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	/** Encoding format */
	encoding?: "base64" | "binary";
}

/**
 * Element interaction options
 */
export interface ElementInteractionOptions {
	/** CSS selector for target element */
	selector: string;
	/** Wait for element to be visible */
	waitForVisible?: boolean;
	/** Timeout for element interaction in milliseconds */
	timeout?: number;
	/** Number of click attempts for click operations */
	clickCount?: number;
	/** Mouse button for click operations */
	button?: "left" | "right" | "middle";
	/** Delay between key presses for typing */
	delay?: number;
}

/**
 * Form input operation configuration
 */
export interface FormInputOptions extends ElementInteractionOptions {
	/** Value to input */
	value: string;
	/** Whether to clear existing value first */
	clear?: boolean;
}

/**
 * Select element operation configuration
 */
export interface SelectOptions extends ElementInteractionOptions {
	/** Values to select */
	values: string[];
}

/**
 * JavaScript evaluation options
 */
export interface EvaluationOptions {
	/** JavaScript code to execute */
	script: string;
	/** Arguments to pass to the script */
	args?: unknown[];
	/** Whether to return the result */
	returnByValue?: boolean;
	/** Timeout for script execution */
	timeout?: number;
}

/**
 * Wait condition configuration
 */
export interface WaitOptions {
	/** CSS selector to wait for */
	selector?: string;
	/** Custom function to wait for */
	function?: string;
	/** Timeout in milliseconds */
	timeout?: number;
	/** Whether element should be visible */
	visible?: boolean;
	/** Whether element should be hidden */
	hidden?: boolean;
}

/**
 * Page performance metrics
 */
export interface PageMetrics {
	/** Number of DOM nodes */
	nodes: number;
	/** Number of layout operations */
	layouts: number;
	/** Number of style recalculations */
	recalcStyle: number;
	/** JavaScript heap used size */
	jsHeapUsedSize: number;
	/** JavaScript heap total size */
	jsHeapTotalSize: number;
	/** Load event end time */
	loadEventEnd: number;
	/** DOM content loaded event end time */
	domContentLoadedEventEnd: number;
}

/**
 * Browser console message
 */
export interface ConsoleMessage {
	/** Message type */
	type:
		| "log"
		| "debug"
		| "info"
		| "warn"
		| "error"
		| "assert"
		| "clear"
		| "count"
		| "countReset"
		| "dir"
		| "dirxml"
		| "endGroup"
		| "group"
		| "groupCollapsed"
		| "profile"
		| "profileEnd"
		| "startGroup"
		| "startGroupCollapsed"
		| "table"
		| "time"
		| "timeEnd"
		| "timeLog"
		| "timeStamp"
		| "trace";
	/** Message text */
	text: string;
	/** Message location */
	location?: {
		url: string;
		lineNumber?: number;
		columnNumber?: number;
	};
	/** Message timestamp */
	timestamp: number;
}

/**
 * Network request information
 */
export interface NetworkRequest {
	/** Request URL */
	url: string;
	/** HTTP method */
	method: string;
	/** Request headers */
	headers: Record<string, string>;
	/** Request body */
	postData?: string;
	/** Response status code */
	status?: number;
	/** Response headers */
	responseHeaders?: Record<string, string>;
	/** Response size in bytes */
	responseSize?: number;
	/** Request timing information */
	timing?: {
		requestStart: number;
		responseStart: number;
		responseEnd: number;
	};
}

/**
 * Input parameters for Puppeteer MCP operations
 */
export interface PuppeteerMcpToolUseInput {
	/** Type of operation to perform */
	operation: PuppeteerOperationType;
	/** Browser launch options */
	launchOptions?: BrowserLaunchOptions;
	/** Navigation options (for navigate operation) */
	navigation?: NavigationOptions;
	/** Screenshot options (for screenshot operation) */
	screenshot?: ScreenshotOptions;
	/** Element interaction options (for click, fill, hover operations) */
	element?: ElementInteractionOptions;
	/** Form input options (for fill operation) */
	input?: FormInputOptions;
	/** Select options (for select operation) */
	select?: SelectOptions;
	/** JavaScript evaluation options (for evaluate operation) */
	evaluation?: EvaluationOptions;
	/** Wait options (for wait operations) */
	wait?: WaitOptions;
	/** Whether to capture additional debugging information */
	debug?: boolean;
	/** Custom timeout for the entire operation */
	timeout?: number;
}

/**
 * Result data from Puppeteer MCP operations
 */
export interface PuppeteerMcpToolResultData {
	/** Operation that was performed */
	operation: PuppeteerOperationType;
	/** Whether the operation was successful */
	success: boolean;
	/** Result message */
	message: string;
	/** Screenshot data (base64 encoded) if screenshot was taken */
	screenshot?: string;
	/** Page title after operation */
	pageTitle?: string;
	/** Current page URL after operation */
	currentUrl?: string;
	/** JavaScript evaluation result */
	evaluationResult?: unknown;
	/** Page metrics if requested */
	metrics?: PageMetrics;
	/** Console messages captured during operation */
	consoleMessages?: ConsoleMessage[];
	/** Network requests captured during operation */
	networkRequests?: NetworkRequest[];
	/** Element information (if element was found) */
	elementInfo?: {
		tagName: string;
		textContent?: string;
		innerHTML?: string;
		attributes: Record<string, string>;
		boundingBox?: {
			x: number;
			y: number;
			width: number;
			height: number;
		};
	};
	/** Performance timing information */
	timing?: {
		startTime: number;
		endTime: number;
		duration: number;
	};
	/** Error details if operation failed */
	error?: {
		name: string;
		message: string;
		stack?: string;
	};
}

/**
 * Tool use structure for Puppeteer MCP operations
 */
export interface PuppeteerMcpToolUse extends BaseToolUse<"PuppeteerMcp", PuppeteerMcpToolUseInput> {
	type: "tool_use";
}

/**
 * Tool result structure for Puppeteer MCP operations
 */
export interface PuppeteerMcpToolResult {
	tool_use_id: string;
	type: "tool_result";
	content: string;
}

/**
 * Tool use result structure for Puppeteer MCP operations
 */
export interface PuppeteerMcpToolUseResult {
	output: PuppeteerMcpToolResultData | string;
	status: ToolStatus;
}

/**
 * Complete chat item for Puppeteer MCP tool
 */
export interface PuppeteerMcpToolChatItem {
	type: "tool_use";
	toolUse: PuppeteerMcpToolUse;
	toolResult: PuppeteerMcpToolResult;
	toolUseResult: PuppeteerMcpToolUseResult;
}

/**
 * Props for the Puppeteer MCP tool component
 */
export interface PuppeteerMcpToolComponentProps {
	item: PuppeteerMcpToolChatItem;
	className?: string;
	onOperationSelect?: (operation: PuppeteerOperationType) => void;
	onRetry?: () => void;
	onViewScreenshot?: (screenshot: string) => void;
}

/**
 * Fixture structure with metadata
 */
export interface PuppeteerMcpToolFixture {
	name: string;
	category: string;
	data: PuppeteerMcpToolChatItem;
}

/**
 * Type guard for PuppeteerMcpToolUseInput
 */
export function isPuppeteerMcpToolUseInput(value: unknown): value is PuppeteerMcpToolUseInput {
	return (
		typeof value === "object" &&
		value !== null &&
		"operation" in value &&
		typeof (value as PuppeteerMcpToolUseInput).operation === "string" &&
		[
			"navigate",
			"screenshot",
			"click",
			"fill",
			"select",
			"hover",
			"evaluate",
			"waitForSelector",
			"waitForNavigation",
			"reload",
			"goBack",
			"goForward",
		].includes((value as PuppeteerMcpToolUseInput).operation)
	);
}

/**
 * Type guard for BrowserLaunchOptions
 */
export function isBrowserLaunchOptions(value: unknown): value is BrowserLaunchOptions {
	return typeof value === "object" && value !== null;
}

/**
 * Type guard for NavigationOptions
 */
export function isNavigationOptions(value: unknown): value is NavigationOptions {
	return (
		typeof value === "object" &&
		value !== null &&
		"url" in value &&
		typeof (value as NavigationOptions).url === "string"
	);
}

/**
 * Type guard for ScreenshotOptions
 */
export function isScreenshotOptions(value: unknown): value is ScreenshotOptions {
	return typeof value === "object" && value !== null;
}

/**
 * Type guard for PuppeteerMcpToolResultData
 */
export function isPuppeteerMcpToolResultData(value: unknown): value is PuppeteerMcpToolResultData {
	return (
		typeof value === "object" &&
		value !== null &&
		"operation" in value &&
		"success" in value &&
		"message" in value &&
		typeof (value as PuppeteerMcpToolResultData).operation === "string" &&
		typeof (value as PuppeteerMcpToolResultData).success === "boolean" &&
		typeof (value as PuppeteerMcpToolResultData).message === "string"
	);
}

/**
 * Type guard for PuppeteerMcpToolChatItem
 */
export function isPuppeteerMcpToolChatItem(item: unknown): item is PuppeteerMcpToolChatItem {
	return (
		typeof item === "object" &&
		item !== null &&
		(item as PuppeteerMcpToolChatItem).type === "tool_use" &&
		"toolUse" in item &&
		(item as PuppeteerMcpToolChatItem).toolUse.name === "PuppeteerMcp"
	);
}

/**
 * Export all types
 */
export type {
	BaseToolUse,
	ToolStatus,
} from "@dao/chat-items-common-types";

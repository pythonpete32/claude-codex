/**
 * @fileoverview Zod validation schemas for Puppeteer MCP tool types
 * @module @dao/chat-items-mcp-puppeteer/schemas
 */

import { z } from "zod";

/**
 * Schema for Puppeteer operation types
 */
export const PuppeteerOperationTypeSchema = z.enum([
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
]);

/**
 * Schema for browser launch options
 */
export const BrowserLaunchOptionsSchema = z.object({
	headless: z.boolean().optional(),
	width: z.number().min(1).max(10000).optional(),
	height: z.number().min(1).max(10000).optional(),
	executablePath: z.string().optional(),
	args: z.array(z.string()).optional(),
	ignoreDefaultArgs: z.boolean().optional(),
	userDataDir: z.string().optional(),
	devtools: z.boolean().optional(),
	timeout: z.number().min(0).max(300000).optional(),
});

/**
 * Schema for navigation options
 */
export const NavigationOptionsSchema = z.object({
	url: z.string().url(),
	waitUntil: z.enum(["load", "domcontentloaded", "networkidle0", "networkidle2"]).optional(),
	timeout: z.number().min(0).max(300000).optional(),
	referer: z.string().url().optional(),
});

/**
 * Schema for screenshot clip region
 */
export const ScreenshotClipSchema = z.object({
	x: z.number().min(0),
	y: z.number().min(0),
	width: z.number().min(1),
	height: z.number().min(1),
});

/**
 * Schema for screenshot options
 */
export const ScreenshotOptionsSchema = z.object({
	fullPage: z.boolean().optional(),
	type: z.enum(["png", "jpeg", "webp"]).optional(),
	quality: z.number().min(0).max(100).optional(),
	omitBackground: z.boolean().optional(),
	selector: z.string().optional(),
	clip: ScreenshotClipSchema.optional(),
	encoding: z.enum(["base64", "binary"]).optional(),
});

/**
 * Schema for element interaction options
 */
export const ElementInteractionOptionsSchema = z.object({
	selector: z.string().min(1),
	waitForVisible: z.boolean().optional(),
	timeout: z.number().min(0).max(300000).optional(),
	clickCount: z.number().min(1).max(10).optional(),
	button: z.enum(["left", "right", "middle"]).optional(),
	delay: z.number().min(0).max(10000).optional(),
});

/**
 * Schema for form input options
 */
export const FormInputOptionsSchema = ElementInteractionOptionsSchema.extend({
	value: z.string(),
	clear: z.boolean().optional(),
});

/**
 * Schema for select options
 */
export const SelectOptionsSchema = ElementInteractionOptionsSchema.extend({
	values: z.array(z.string()).min(1),
});

/**
 * Schema for JavaScript evaluation options
 */
export const EvaluationOptionsSchema = z.object({
	script: z.string().min(1),
	args: z.array(z.unknown()).optional(),
	returnByValue: z.boolean().optional(),
	timeout: z.number().min(0).max(300000).optional(),
});

/**
 * Schema for wait options
 */
export const WaitOptionsSchema = z.object({
	selector: z.string().optional(),
	function: z.string().optional(),
	timeout: z.number().min(0).max(300000).optional(),
	visible: z.boolean().optional(),
	hidden: z.boolean().optional(),
});

/**
 * Schema for page metrics
 */
export const PageMetricsSchema = z.object({
	nodes: z.number().min(0),
	layouts: z.number().min(0),
	recalcStyle: z.number().min(0),
	jsHeapUsedSize: z.number().min(0),
	jsHeapTotalSize: z.number().min(0),
	loadEventEnd: z.number().min(0),
	domContentLoadedEventEnd: z.number().min(0),
});

/**
 * Schema for console message location
 */
export const ConsoleMessageLocationSchema = z.object({
	url: z.string(),
	lineNumber: z.number().optional(),
	columnNumber: z.number().optional(),
});

/**
 * Schema for console messages
 */
export const ConsoleMessageSchema = z.object({
	type: z.enum([
		"log",
		"debug",
		"info",
		"warn",
		"error",
		"assert",
		"clear",
		"count",
		"countReset",
		"dir",
		"dirxml",
		"endGroup",
		"group",
		"groupCollapsed",
		"profile",
		"profileEnd",
		"startGroup",
		"startGroupCollapsed",
		"table",
		"time",
		"timeEnd",
		"timeLog",
		"timeStamp",
		"trace",
	]),
	text: z.string(),
	location: ConsoleMessageLocationSchema.optional(),
	timestamp: z.number().min(0),
});

/**
 * Schema for network request timing
 */
export const NetworkRequestTimingSchema = z.object({
	requestStart: z.number().min(0),
	responseStart: z.number().min(0),
	responseEnd: z.number().min(0),
});

/**
 * Schema for network requests
 */
export const NetworkRequestSchema = z.object({
	url: z.string().url(),
	method: z.string(),
	headers: z.record(z.string()),
	postData: z.string().optional(),
	status: z.number().min(100).max(599).optional(),
	responseHeaders: z.record(z.string()).optional(),
	responseSize: z.number().min(0).optional(),
	timing: NetworkRequestTimingSchema.optional(),
});

/**
 * Schema for element bounding box
 */
export const ElementBoundingBoxSchema = z.object({
	x: z.number(),
	y: z.number(),
	width: z.number().min(0),
	height: z.number().min(0),
});

/**
 * Schema for element information
 */
export const ElementInfoSchema = z.object({
	tagName: z.string(),
	textContent: z.string().optional(),
	innerHTML: z.string().optional(),
	attributes: z.record(z.string()),
	boundingBox: ElementBoundingBoxSchema.optional(),
});

/**
 * Schema for performance timing
 */
export const PerformanceTimingSchema = z.object({
	startTime: z.number().min(0),
	endTime: z.number().min(0),
	duration: z.number().min(0),
});

/**
 * Schema for error details
 */
export const ErrorDetailsSchema = z.object({
	name: z.string(),
	message: z.string(),
	stack: z.string().optional(),
});

/**
 * Schema for Puppeteer MCP tool input
 */
export const PuppeteerMcpToolUseInputSchema = z.object({
	operation: PuppeteerOperationTypeSchema,
	launchOptions: BrowserLaunchOptionsSchema.optional(),
	navigation: NavigationOptionsSchema.optional(),
	screenshot: ScreenshotOptionsSchema.optional(),
	element: ElementInteractionOptionsSchema.optional(),
	input: FormInputOptionsSchema.optional(),
	select: SelectOptionsSchema.optional(),
	evaluation: EvaluationOptionsSchema.optional(),
	wait: WaitOptionsSchema.optional(),
	debug: z.boolean().optional(),
	timeout: z.number().min(0).max(600000).optional(),
});

/**
 * Schema for Puppeteer MCP tool result data
 */
export const PuppeteerMcpToolResultDataSchema = z.object({
	operation: PuppeteerOperationTypeSchema,
	success: z.boolean(),
	message: z.string(),
	screenshot: z.string().optional(),
	pageTitle: z.string().optional(),
	currentUrl: z.string().url().optional(),
	evaluationResult: z.unknown().optional(),
	metrics: PageMetricsSchema.optional(),
	consoleMessages: z.array(ConsoleMessageSchema).optional(),
	networkRequests: z.array(NetworkRequestSchema).optional(),
	elementInfo: ElementInfoSchema.optional(),
	timing: PerformanceTimingSchema.optional(),
	error: ErrorDetailsSchema.optional(),
});

/**
 * Schema for tool use structure
 */
export const PuppeteerMcpToolUseSchema = z.object({
	type: z.literal("tool_use"),
	id: z.string(),
	name: z.literal("PuppeteerMcp"),
	input: PuppeteerMcpToolUseInputSchema,
});

/**
 * Schema for tool result structure
 */
export const PuppeteerMcpToolResultSchema = z.object({
	tool_use_id: z.string(),
	type: z.literal("tool_result"),
	content: z.string(),
});

/**
 * Schema for tool use result structure
 */
export const PuppeteerMcpToolUseResultSchema = z.object({
	output: z.union([PuppeteerMcpToolResultDataSchema, z.string()]),
	status: z.enum(["success", "error", "partial"]),
});

/**
 * Schema for complete Puppeteer MCP tool chat item
 */
export const PuppeteerMcpToolChatItemSchema = z.object({
	type: z.literal("tool_use"),
	toolUse: PuppeteerMcpToolUseSchema,
	toolResult: PuppeteerMcpToolResultSchema,
	toolUseResult: PuppeteerMcpToolUseResultSchema,
});

/**
 * Schema for component props
 */
export const PuppeteerMcpToolComponentPropsSchema = z.object({
	item: PuppeteerMcpToolChatItemSchema,
	className: z.string().optional(),
	onOperationSelect: z.function().optional(),
	onRetry: z.function().optional(),
	onViewScreenshot: z.function().optional(),
});

/**
 * Schema for fixture structure
 */
export const PuppeteerMcpToolFixtureSchema = z.object({
	name: z.string().min(1),
	category: z.string().min(1),
	data: PuppeteerMcpToolChatItemSchema,
});

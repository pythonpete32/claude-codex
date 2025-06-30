/**
 * @fileoverview Constants and configuration for Puppeteer MCP tool
 * @module @dao/chat-items-mcp-puppeteer/constants
 */

import type { PuppeteerOperationType } from "./types";

/**
 * Package information
 */
export const PACKAGE_INFO = {
	name: "@dao/chat-items-mcp-puppeteer",
	version: "1.0.0",
	description:
		"Puppeteer MCP integration for browser automation workflows with comprehensive type safety and validation",
	author: "DAO",
	license: "MIT",
	keywords: [
		"puppeteer",
		"mcp",
		"browser-automation",
		"web-testing",
		"screenshot",
		"navigation",
		"chat-item",
		"typescript",
		"validation",
		"claude",
		"atomic-codex",
	],
} as const;

/**
 * Tool constants
 */
export const TOOL_CONSTANTS = {
	name: "PuppeteerMcp",
	type: "tool_use",
	category: "browser-automation",
	displayName: "Puppeteer MCP",
	description: "Browser automation and web testing tool powered by Puppeteer",
} as const;

/**
 * Puppeteer operation types with metadata
 */
export const PUPPETEER_OPERATIONS = {
	navigate: {
		name: "navigate",
		displayName: "Navigate",
		description: "Navigate to a URL",
		category: "navigation",
		icon: "🧭",
		requiresUrl: true,
		defaultTimeout: 30000,
	},
	screenshot: {
		name: "screenshot",
		displayName: "Screenshot",
		description: "Take a screenshot of the page",
		category: "capture",
		icon: "📸",
		requiresUrl: false,
		defaultTimeout: 10000,
	},
	click: {
		name: "click",
		displayName: "Click",
		description: "Click on an element",
		category: "interaction",
		icon: "👆",
		requiresUrl: false,
		defaultTimeout: 5000,
	},
	fill: {
		name: "fill",
		displayName: "Fill",
		description: "Fill a form field",
		category: "interaction",
		icon: "✏️",
		requiresUrl: false,
		defaultTimeout: 5000,
	},
	select: {
		name: "select",
		displayName: "Select",
		description: "Select options from a dropdown",
		category: "interaction",
		icon: "📋",
		requiresUrl: false,
		defaultTimeout: 5000,
	},
	hover: {
		name: "hover",
		displayName: "Hover",
		description: "Hover over an element",
		category: "interaction",
		icon: "👻",
		requiresUrl: false,
		defaultTimeout: 5000,
	},
	evaluate: {
		name: "evaluate",
		displayName: "Evaluate",
		description: "Execute JavaScript in the page",
		category: "scripting",
		icon: "⚡",
		requiresUrl: false,
		defaultTimeout: 10000,
	},
	waitForSelector: {
		name: "waitForSelector",
		displayName: "Wait for Selector",
		description: "Wait for an element to appear",
		category: "waiting",
		icon: "⏳",
		requiresUrl: false,
		defaultTimeout: 30000,
	},
	waitForNavigation: {
		name: "waitForNavigation",
		displayName: "Wait for Navigation",
		description: "Wait for page navigation to complete",
		category: "waiting",
		icon: "🔄",
		requiresUrl: false,
		defaultTimeout: 30000,
	},
	reload: {
		name: "reload",
		displayName: "Reload",
		description: "Reload the current page",
		category: "navigation",
		icon: "🔄",
		requiresUrl: false,
		defaultTimeout: 20000,
	},
	goBack: {
		name: "goBack",
		displayName: "Go Back",
		description: "Navigate back in browser history",
		category: "navigation",
		icon: "⬅️",
		requiresUrl: false,
		defaultTimeout: 10000,
	},
	goForward: {
		name: "goForward",
		displayName: "Go Forward",
		description: "Navigate forward in browser history",
		category: "navigation",
		icon: "➡️",
		requiresUrl: false,
		defaultTimeout: 10000,
	},
} as const satisfies Record<
	PuppeteerOperationType,
	{
		name: PuppeteerOperationType;
		displayName: string;
		description: string;
		category: string;
		icon: string;
		requiresUrl: boolean;
		defaultTimeout: number;
	}
>;

/**
 * Browser launch option defaults
 */
export const BROWSER_DEFAULTS = {
	headless: true,
	width: 1280,
	height: 720,
	timeout: 30000,
	args: [
		"--no-sandbox",
		"--disable-setuid-sandbox",
		"--disable-dev-shm-usage",
		"--disable-accelerated-2d-canvas",
		"--no-first-run",
		"--no-zygote",
		"--disable-gpu",
	],
} as const;

/**
 * Screenshot format options
 */
export const SCREENSHOT_FORMATS = {
	png: {
		name: "png",
		displayName: "PNG",
		extension: ".png",
		mimeType: "image/png",
		supportsQuality: false,
		description: "Lossless compression, best for UI screenshots",
	},
	jpeg: {
		name: "jpeg",
		displayName: "JPEG",
		extension: ".jpg",
		mimeType: "image/jpeg",
		supportsQuality: true,
		description: "Lossy compression, smaller file size",
	},
	webp: {
		name: "webp",
		displayName: "WebP",
		extension: ".webp",
		mimeType: "image/webp",
		supportsQuality: true,
		description: "Modern format with excellent compression",
	},
} as const;

/**
 * Viewport presets for different devices
 */
export const VIEWPORT_PRESETS = {
	desktop: {
		name: "desktop",
		displayName: "Desktop",
		width: 1280,
		height: 720,
		deviceScaleFactor: 1,
		isMobile: false,
		hasTouch: false,
	},
	laptop: {
		name: "laptop",
		displayName: "Laptop",
		width: 1366,
		height: 768,
		deviceScaleFactor: 1,
		isMobile: false,
		hasTouch: false,
	},
	tablet: {
		name: "tablet",
		displayName: "Tablet",
		width: 768,
		height: 1024,
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
	},
	mobile: {
		name: "mobile",
		displayName: "Mobile",
		width: 375,
		height: 667,
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
	},
	mobileSmall: {
		name: "mobileSmall",
		displayName: "Mobile Small",
		width: 320,
		height: 568,
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
	},
	mobileLarge: {
		name: "mobileLarge",
		displayName: "Mobile Large",
		width: 414,
		height: 896,
		deviceScaleFactor: 3,
		isMobile: true,
		hasTouch: true,
	},
} as const;

/**
 * Wait conditions
 */
export const WAIT_CONDITIONS = {
	load: {
		name: "load",
		displayName: "Load",
		description: "Wait for the load event",
	},
	domcontentloaded: {
		name: "domcontentloaded",
		displayName: "DOM Content Loaded",
		description: "Wait for the DOMContentLoaded event",
	},
	networkidle0: {
		name: "networkidle0",
		displayName: "Network Idle (0)",
		description: "Wait for 500ms with no network requests",
	},
	networkidle2: {
		name: "networkidle2",
		displayName: "Network Idle (2)",
		description: "Wait for 500ms with no more than 2 network requests",
	},
} as const;

/**
 * Mouse button options
 */
export const MOUSE_BUTTONS = {
	left: {
		name: "left",
		displayName: "Left",
		description: "Primary mouse button",
		button: "left",
	},
	right: {
		name: "right",
		displayName: "Right",
		description: "Secondary mouse button (context menu)",
		button: "right",
	},
	middle: {
		name: "middle",
		displayName: "Middle",
		description: "Middle mouse button (wheel)",
		button: "middle",
	},
} as const;

/**
 * Performance metric thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
	timing: {
		fast: 1000,
		moderate: 3000,
		slow: 5000,
	},
	memory: {
		lowMB: 50,
		moderateMB: 100,
		highMB: 200,
	},
	domComplexity: {
		simple: 1000,
		moderate: 3000,
		complex: 5000,
	},
	networkRequests: {
		few: 10,
		moderate: 50,
		many: 100,
	},
} as const;

/**
 * Error categories and messages
 */
export const ERROR_CATEGORIES = {
	timeout: {
		name: "timeout",
		displayName: "Timeout",
		description: "Operation timed out",
		icon: "⏰",
	},
	selector: {
		name: "selector",
		displayName: "Selector",
		description: "Element not found or invalid selector",
		icon: "🎯",
	},
	navigation: {
		name: "navigation",
		displayName: "Navigation",
		description: "Failed to navigate to URL",
		icon: "🚫",
	},
	script: {
		name: "script",
		displayName: "Script",
		description: "JavaScript execution failed",
		icon: "⚠️",
	},
	network: {
		name: "network",
		displayName: "Network",
		description: "Network request failed",
		icon: "🌐",
	},
	browser: {
		name: "browser",
		displayName: "Browser",
		description: "Browser launch or control failed",
		icon: "🌍",
	},
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
	navigation: "Successfully navigated to URL",
	screenshot: "Screenshot captured successfully",
	click: "Element clicked successfully",
	fill: "Form field filled successfully",
	select: "Options selected successfully",
	hover: "Element hovered successfully",
	evaluate: "JavaScript executed successfully",
	waitForSelector: "Element appeared successfully",
	waitForNavigation: "Navigation completed successfully",
	reload: "Page reloaded successfully",
	goBack: "Navigated back successfully",
	goForward: "Navigated forward successfully",
} as const;

/**
 * Default configurations
 */
export const DEFAULTS = {
	operation: "navigate" as PuppeteerOperationType,
	timeout: 30000,
	retries: 3,
	headless: true,
	viewportWidth: 1280,
	viewportHeight: 720,
	screenshotType: "png" as const,
	screenshotQuality: 90,
	waitCondition: "domcontentloaded" as const,
	clickButton: "left" as const,
	enableConsoleLogging: false,
	enableNetworkLogging: false,
	enableMetricsCollection: false,
} as const;

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
	url: {
		pattern: /^https?:\/\/.+/,
		maxLength: 2000,
	},
	selector: {
		minLength: 1,
		maxLength: 500,
	},
	script: {
		minLength: 1,
		maxLength: 10000,
	},
	timeout: {
		min: 100,
		max: 600000, // 10 minutes
	},
	viewport: {
		minWidth: 100,
		maxWidth: 10000,
		minHeight: 100,
		maxHeight: 10000,
	},
	quality: {
		min: 0,
		max: 100,
	},
} as const;

/**
 * Display configuration
 */
export const DISPLAY_CONFIG = {
	maxUrlLength: 80,
	maxSelectorLength: 50,
	maxScriptLength: 100,
	maxErrorMessageLength: 200,
	timestampFormat: "yyyy-MM-dd HH:mm:ss",
	durationFormat: "ms",
} as const;

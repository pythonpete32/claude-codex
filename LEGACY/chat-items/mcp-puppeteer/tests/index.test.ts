/**
 * @fileoverview Comprehensive tests for Puppeteer MCP tool
 */

import { beforeEach, describe, expect, it } from "bun:test";
import {
	analyzePerformance,
	BROWSER_DEFAULTS,
	type BrowserLaunchOptions,
	type ConsoleMessage,
	createErrorResult,
	createSuccessResult,
	createTiming,
	DEFAULTS,
	ERROR_CATEGORIES,
	errorFixtures,
	evaluationFixtures,
	extractKeyMetrics,
	filterConsoleMessages,
	filterNetworkRequests,
	fixtureHelpers,
	fixtureStats,
	// Fixtures
	fixtures,
	fixtureValidation,
	formatOperationSummary,
	generateOperationFingerprint,
	getDefaultTimeout,
	getErrorMessages,
	getFailedRequests,
	getFixtureByName,
	getFixturesByCategory,
	getSlowRequests,
	getWarningMessages,
	interactionFixtures,
	// Type guards
	isBrowserLaunchOptions,
	isNavigationOptions,
	isPuppeteerMcpToolChatItem,
	isPuppeteerMcpToolResultData,
	isPuppeteerMcpToolUseInput,
	isScreenshotOptions,
	monitoringFixtures,
	type NavigationOptions,
	type NetworkRequest,
	namedFixtures,
	navigationFixtures,
	normalizeLaunchOptions,
	normalizeNavigationOptions,
	normalizeScreenshotOptions,
	// Constants
	PACKAGE_INFO,
	type PageMetrics,
	PERFORMANCE_THRESHOLDS,
	PUPPETEER_OPERATIONS,
	type PuppeteerMcpToolUseInput,
	type PuppeteerOperationType,
	// Parsers
	parsePuppeteerMcpInput,
	responsiveFixtures,
	SCREENSHOT_FORMATS,
	// Types
	type ScreenshotOptions,
	SUCCESS_MESSAGES,
	safeValidatePuppeteerMcpToolUseInput,
	safeValidateScreenshotOptions,
	sanitizeUrl,
	screenshotFixtures,
	TOOL_CONSTANTS,
	VALIDATION_RULES,
	VIEWPORT_PRESETS,
	// Validators
	validatePuppeteerMcpToolUseInput,
	validateScreenshotOptions,
	validateSelector,
	waitingFixtures,
} from "../src/index";

// Test data setup
let sampleLaunchOptions: BrowserLaunchOptions;
let sampleNavigationOptions: NavigationOptions;
let sampleScreenshotOptions: ScreenshotOptions;
let sampleInput: PuppeteerMcpToolUseInput;

beforeEach(() => {
	sampleLaunchOptions = {
		headless: true,
		width: 1280,
		height: 720,
		timeout: 30000,
	};

	sampleNavigationOptions = {
		url: "https://example.com",
		waitUntil: "domcontentloaded",
		timeout: 30000,
	};

	sampleScreenshotOptions = {
		type: "png",
		fullPage: true,
		encoding: "base64",
	};

	sampleInput = {
		operation: "navigate",
		launchOptions: sampleLaunchOptions,
		navigation: sampleNavigationOptions,
	};
});

describe("Package Metadata", () => {
	it("should have correct package info", () => {
		expect(PACKAGE_INFO.name).toBe("@dao/chat-items-mcp-puppeteer");
		expect(PACKAGE_INFO.version).toBe("1.0.0");
		expect(PACKAGE_INFO.license).toBe("MIT");
		expect(PACKAGE_INFO.author).toBe("DAO");
		expect(PACKAGE_INFO.keywords).toContain("puppeteer");
		expect(PACKAGE_INFO.keywords).toContain("mcp");
	});

	it("should have correct tool constants", () => {
		expect(TOOL_CONSTANTS.name).toBe("PuppeteerMcp");
		expect(TOOL_CONSTANTS.type).toBe("tool_use");
		expect(TOOL_CONSTANTS.category).toBe("browser-automation");
		expect(TOOL_CONSTANTS.displayName).toBe("Puppeteer MCP");
	});
});

describe("Type Guards", () => {
	it("should correctly identify PuppeteerMcpToolUseInput", () => {
		expect(isPuppeteerMcpToolUseInput(sampleInput)).toBe(true);
		expect(isPuppeteerMcpToolUseInput({})).toBe(false);
		expect(isPuppeteerMcpToolUseInput(null)).toBe(false);
		expect(isPuppeteerMcpToolUseInput("string")).toBe(false);
	});

	it("should correctly identify BrowserLaunchOptions", () => {
		expect(isBrowserLaunchOptions(sampleLaunchOptions)).toBe(true);
		expect(isBrowserLaunchOptions({})).toBe(true);
		expect(isBrowserLaunchOptions({ headless: "invalid" })).toBe(true); // Type guard is permissive
		expect(isBrowserLaunchOptions(null)).toBe(false);
	});

	it("should correctly identify NavigationOptions", () => {
		expect(isNavigationOptions(sampleNavigationOptions)).toBe(true);
		expect(isNavigationOptions({})).toBe(false);
		expect(isNavigationOptions({ url: "https://test.com" })).toBe(true);
		expect(isNavigationOptions({ url: "invalid-url" })).toBe(true); // Type guard doesn't validate URL format
	});

	it("should correctly identify ScreenshotOptions", () => {
		expect(isScreenshotOptions(sampleScreenshotOptions)).toBe(true);
		expect(isScreenshotOptions({})).toBe(true);
		expect(isScreenshotOptions({ type: "png" })).toBe(true);
		expect(isScreenshotOptions({ type: "invalid" })).toBe(true); // Type guard is permissive
	});
});

describe("Validators", () => {
	describe("Throwing validators", () => {
		it("should validate valid PuppeteerMcpToolUseInput", () => {
			expect(() => validatePuppeteerMcpToolUseInput(sampleInput)).not.toThrow();
			const result = validatePuppeteerMcpToolUseInput(sampleInput);
			expect(result.operation).toBe("navigate");
		});

		it("should validate valid ScreenshotOptions", () => {
			expect(() => validateScreenshotOptions(sampleScreenshotOptions)).not.toThrow();
			const result = validateScreenshotOptions(sampleScreenshotOptions);
			expect(result.type).toBe("png");
		});

		it("should throw on invalid input", () => {
			expect(() => validatePuppeteerMcpToolUseInput({})).toThrow();
			expect(() => validatePuppeteerMcpToolUseInput({ operation: "invalid" })).toThrow();
			expect(() => validateScreenshotOptions({ type: "invalid" })).toThrow();
		});
	});

	describe("Safe validators", () => {
		it("should return valid data for correct input", () => {
			const result = safeValidatePuppeteerMcpToolUseInput(sampleInput);
			expect(result).not.toBeNull();
			expect(result?.operation).toBe("navigate");
		});

		it("should return null for invalid input", () => {
			expect(safeValidatePuppeteerMcpToolUseInput({})).toBeNull();
			expect(safeValidateScreenshotOptions({ type: "invalid" })).toBeNull();
			expect(safeValidatePuppeteerMcpToolUseInput(null)).toBeNull();
		});
	});
});

describe("Parsers", () => {
	describe("parsePuppeteerMcpInput", () => {
		it("should parse input and add defaults", () => {
			const result = parsePuppeteerMcpInput(sampleInput);
			expect(result.operation).toBe("navigate");
			expect(result.timeout).toBe(30000);
			expect(result.debug).toBe(false);
		});

		it("should preserve provided values", () => {
			const customInput = {
				...sampleInput,
				timeout: 60000,
				debug: true,
			};
			const result = parsePuppeteerMcpInput(customInput);
			expect(result.timeout).toBe(60000);
			expect(result.debug).toBe(true);
		});
	});

	describe("getDefaultTimeout", () => {
		it("should return correct timeout for each operation", () => {
			expect(getDefaultTimeout("navigate")).toBe(30000);
			expect(getDefaultTimeout("screenshot")).toBe(10000);
			expect(getDefaultTimeout("click")).toBe(5000);
			expect(getDefaultTimeout("waitForSelector")).toBe(30000);
		});
	});

	describe("Normalization functions", () => {
		it("should normalize launch options", () => {
			const result = normalizeLaunchOptions({});
			expect(result.headless).toBe(true);
			expect(result.width).toBe(1280);
			expect(result.height).toBe(720);
			expect(result.timeout).toBe(30000);
		});

		it("should normalize navigation options", () => {
			const result = normalizeNavigationOptions({ url: "https://test.com" });
			expect(result.waitUntil).toBe("domcontentloaded");
			expect(result.timeout).toBe(30000);
		});

		it("should normalize screenshot options", () => {
			const result = normalizeScreenshotOptions({});
			expect(result.type).toBe("png");
			expect(result.fullPage).toBe(false);
			expect(result.encoding).toBe("base64");
		});
	});

	describe("Result creation", () => {
		it("should create success result", () => {
			const result = createSuccessResult("navigate", "Success message", {
				pageTitle: "Test Page",
			});
			expect(result.operation).toBe("navigate");
			expect(result.success).toBe(true);
			expect(result.message).toBe("Success message");
			expect(result.pageTitle).toBe("Test Page");
		});

		it("should create error result", () => {
			const error = new Error("Test error");
			const result = createErrorResult("click", error);
			expect(result.operation).toBe("click");
			expect(result.success).toBe(false);
			expect(result.message).toContain("Test error");
			expect(result.error?.name).toBe("Error");
		});
	});
});

describe("Performance Analysis", () => {
	const sampleMetrics: PageMetrics = {
		nodes: 2500,
		layouts: 5,
		recalcStyle: 3,
		jsHeapUsedSize: 50 * 1024 * 1024, // 50MB
		jsHeapTotalSize: 100 * 1024 * 1024, // 100MB
		loadEventEnd: 2000,
		domContentLoadedEventEnd: 1500,
	};

	const sampleConsoleMessages: ConsoleMessage[] = [
		{
			type: "error",
			text: "JavaScript error occurred",
			timestamp: Date.now(),
		},
		{
			type: "warn",
			text: "Performance warning",
			timestamp: Date.now(),
		},
	];

	const sampleNetworkRequests: NetworkRequest[] = [
		{
			url: "https://example.com/api/data",
			method: "GET",
			headers: { "Content-Type": "application/json" },
			status: 200,
			timing: {
				requestStart: 1000,
				responseStart: 1500,
				responseEnd: 2000,
			},
		},
		{
			url: "https://slow-api.com/data",
			method: "GET",
			headers: { "Content-Type": "application/json" },
			status: 500,
			timing: {
				requestStart: 2000,
				responseStart: 4000,
				responseEnd: 5000,
			},
		},
	];

	describe("extractKeyMetrics", () => {
		it("should extract and format key metrics", () => {
			const result = extractKeyMetrics(sampleMetrics);
			expect(result.domNodes).toBe(2500);
			expect(result.heapUsed).toBe(50);
			expect(result.heapTotal).toBe(100);
			expect(result.loadTime).toBe(2000);
		});
	});

	describe("Console message filtering", () => {
		it("should filter console messages by type", () => {
			const errors = filterConsoleMessages(sampleConsoleMessages, ["error"]);
			expect(errors).toHaveLength(1);
			expect(errors[0].type).toBe("error");
		});

		it("should get error messages", () => {
			const errors = getErrorMessages(sampleConsoleMessages);
			expect(errors).toHaveLength(1);
			expect(errors[0].type).toBe("error");
		});

		it("should get warning messages", () => {
			const warnings = getWarningMessages(sampleConsoleMessages);
			expect(warnings).toHaveLength(1);
			expect(warnings[0].type).toBe("warn");
		});
	});

	describe("Network request filtering", () => {
		it("should filter requests by status code range", () => {
			const successRequests = filterNetworkRequests(sampleNetworkRequests, 200, 299);
			expect(successRequests).toHaveLength(1);
			expect(successRequests[0].status).toBe(200);
		});

		it("should get failed requests", () => {
			const failed = getFailedRequests(sampleNetworkRequests);
			expect(failed).toHaveLength(1);
			expect(failed[0].status).toBe(500);
		});

		it("should get slow requests", () => {
			const slow = getSlowRequests(sampleNetworkRequests, 2000);
			expect(slow).toHaveLength(1);
			expect(slow[0].url).toBe("https://slow-api.com/data");
		});
	});

	describe("analyzePerformance", () => {
		it("should analyze performance and provide score", () => {
			const analysis = analyzePerformance(
				sampleMetrics,
				sampleConsoleMessages,
				sampleNetworkRequests,
			);
			expect(analysis.score).toBeGreaterThanOrEqual(0);
			expect(analysis.score).toBeLessThanOrEqual(100);
			expect(analysis.issues.length).toBeGreaterThan(0);
			expect(analysis.recommendations.length).toBeGreaterThan(0);
		});

		it("should detect high memory usage", () => {
			const highMemoryMetrics = {
				...sampleMetrics,
				jsHeapUsedSize: 150 * 1024 * 1024, // 150MB
			};
			const analysis = analyzePerformance(highMemoryMetrics, [], []);
			expect(analysis.issues.some((issue) => issue.includes("memory"))).toBe(true);
		});
	});
});

describe("Utility Functions", () => {
	describe("createTiming", () => {
		it("should create timing information", () => {
			const startTime = Date.now() - 1000;
			const timing = createTiming(startTime);
			expect(timing.startTime).toBe(startTime);
			expect(timing.endTime).toBeGreaterThan(startTime);
			expect(timing.duration).toBeGreaterThanOrEqual(1000);
		});
	});

	describe("sanitizeUrl", () => {
		it("should redact sensitive parameters", () => {
			const url = "https://example.com?token=secret123&user=john";
			const sanitized = sanitizeUrl(url);
			expect(sanitized).toContain("[REDACTED]");
			expect(sanitized).not.toContain("secret123");
		});

		it("should handle invalid URLs", () => {
			const invalidUrl = "not-a-url";
			const result = sanitizeUrl(invalidUrl);
			expect(result).toBe(invalidUrl);
		});
	});

	describe("generateOperationFingerprint", () => {
		it("should generate consistent fingerprints", () => {
			const fingerprint1 = generateOperationFingerprint(sampleInput);
			const fingerprint2 = generateOperationFingerprint(sampleInput);
			expect(fingerprint1).toBe(fingerprint2);
			expect(fingerprint1).toHaveLength(16);
		});

		it("should generate different fingerprints for different inputs", () => {
			const input2 = { ...sampleInput, operation: "screenshot" as PuppeteerOperationType };
			const fingerprint1 = generateOperationFingerprint(sampleInput);
			const fingerprint2 = generateOperationFingerprint(input2);
			expect(fingerprint1).not.toBe(fingerprint2);
		});
	});

	describe("validateSelector", () => {
		it("should validate CSS selectors", () => {
			// Note: This test will fail in Node.js environment since document is not available
			// In a real browser environment, these would work correctly
			expect(() => validateSelector("#test")).not.toThrow();
			expect(() => validateSelector(".class")).not.toThrow();
		});
	});

	describe("formatOperationSummary", () => {
		it("should format operation summary", () => {
			const result = createSuccessResult("navigate", "Navigation successful", {
				pageTitle: "Test Page",
				currentUrl: "https://example.com",
				timing: createTiming(Date.now() - 1000),
			});
			const summary = formatOperationSummary(result);
			expect(summary).toContain("✅");
			expect(summary).toContain("Navigate");
			expect(summary).toContain("Test Page");
			expect(summary).toContain("https://example.com");
		});
	});
});

describe("Constants", () => {
	it("should have puppeteer operations", () => {
		expect(Object.keys(PUPPETEER_OPERATIONS)).toContain("navigate");
		expect(Object.keys(PUPPETEER_OPERATIONS)).toContain("screenshot");
		expect(Object.keys(PUPPETEER_OPERATIONS)).toContain("click");
		expect(PUPPETEER_OPERATIONS.navigate.defaultTimeout).toBe(30000);
		expect(PUPPETEER_OPERATIONS.screenshot.icon).toBe("📸");
	});

	it("should have browser defaults", () => {
		expect(BROWSER_DEFAULTS.headless).toBe(true);
		expect(BROWSER_DEFAULTS.width).toBe(1280);
		expect(BROWSER_DEFAULTS.height).toBe(720);
		expect(BROWSER_DEFAULTS.args).toContain("--no-sandbox");
	});

	it("should have screenshot formats", () => {
		expect(Object.keys(SCREENSHOT_FORMATS)).toContain("png");
		expect(Object.keys(SCREENSHOT_FORMATS)).toContain("jpeg");
		expect(Object.keys(SCREENSHOT_FORMATS)).toContain("webp");
		expect(SCREENSHOT_FORMATS.png.supportsQuality).toBe(false);
		expect(SCREENSHOT_FORMATS.jpeg.supportsQuality).toBe(true);
	});

	it("should have viewport presets", () => {
		expect(Object.keys(VIEWPORT_PRESETS)).toContain("desktop");
		expect(Object.keys(VIEWPORT_PRESETS)).toContain("mobile");
		expect(VIEWPORT_PRESETS.mobile.isMobile).toBe(true);
		expect(VIEWPORT_PRESETS.desktop.isMobile).toBe(false);
	});

	it("should have performance thresholds", () => {
		expect(PERFORMANCE_THRESHOLDS.timing.fast).toBe(1000);
		expect(PERFORMANCE_THRESHOLDS.memory.highMB).toBe(200);
		expect(PERFORMANCE_THRESHOLDS.domComplexity.complex).toBe(5000);
	});

	it("should have error categories", () => {
		expect(Object.keys(ERROR_CATEGORIES)).toContain("timeout");
		expect(Object.keys(ERROR_CATEGORIES)).toContain("selector");
		expect(ERROR_CATEGORIES.timeout.icon).toBe("⏰");
	});

	it("should have success messages", () => {
		expect(SUCCESS_MESSAGES.navigation).toBeDefined();
		expect(SUCCESS_MESSAGES.screenshot).toBeDefined();
		expect(SUCCESS_MESSAGES.click).toBeDefined();
	});

	it("should have defaults", () => {
		expect(DEFAULTS.operation).toBe("navigate");
		expect(DEFAULTS.timeout).toBe(30000);
		expect(DEFAULTS.headless).toBe(true);
		expect(DEFAULTS.screenshotType).toBe("png");
	});

	it("should have validation rules", () => {
		expect(VALIDATION_RULES.timeout.min).toBe(100);
		expect(VALIDATION_RULES.timeout.max).toBe(600000);
		expect(VALIDATION_RULES.viewport.minWidth).toBe(100);
	});
});

describe("Fixtures", () => {
	it("should load fixtures correctly", () => {
		expect(fixtures).toBeDefined();
		expect(fixtures.length).toBeGreaterThan(0);
		expect(Array.isArray(fixtures)).toBe(true);
	});

	it("should have fixture statistics", () => {
		expect(fixtureStats.total).toBeGreaterThan(0);
		expect(fixtureStats.byCategory).toBeDefined();
		expect(fixtureStats.operations.length).toBeGreaterThan(0);
		expect(fixtureStats.successfulOperations).toBeGreaterThan(0);
	});

	describe("Fixture categories", () => {
		it("should have navigation fixtures", () => {
			expect(navigationFixtures.length).toBeGreaterThan(0);
			expect(getFixturesByCategory("navigation")).toEqual(navigationFixtures);
		});

		it("should have screenshot fixtures", () => {
			expect(screenshotFixtures.length).toBeGreaterThan(0);
			expect(getFixturesByCategory("screenshot")).toEqual(screenshotFixtures);
		});

		it("should have interaction fixtures", () => {
			expect(interactionFixtures.length).toBeGreaterThan(0);
			expect(getFixturesByCategory("interaction")).toEqual(interactionFixtures);
		});

		it("should have evaluation fixtures", () => {
			expect(evaluationFixtures.length).toBeGreaterThan(0);
			expect(getFixturesByCategory("evaluation")).toEqual(evaluationFixtures);
		});

		it("should have monitoring fixtures", () => {
			expect(monitoringFixtures.length).toBeGreaterThan(0);
			expect(getFixturesByCategory("monitoring")).toEqual(monitoringFixtures);
		});

		it("should have waiting fixtures", () => {
			expect(waitingFixtures.length).toBeGreaterThan(0);
			expect(getFixturesByCategory("waiting")).toEqual(waitingFixtures);
		});

		it("should have error fixtures", () => {
			expect(errorFixtures.length).toBeGreaterThan(0);
			expect(getFixturesByCategory("errors")).toEqual(errorFixtures);
		});

		it("should have responsive fixtures", () => {
			expect(responsiveFixtures.length).toBeGreaterThan(0);
			expect(getFixturesByCategory("responsive")).toEqual(responsiveFixtures);
		});
	});

	describe("Named fixtures", () => {
		it("should have named fixture exports", () => {
			expect(namedFixtures.basicNavigation).toBeDefined();
			expect(namedFixtures.fullPageScreenshot).toBeDefined();
			expect(namedFixtures.elementClick).toBeDefined();
			expect(namedFixtures.formFill).toBeDefined();
			expect(namedFixtures.javascriptEvaluation).toBeDefined();
			expect(namedFixtures.performanceMonitoring).toBeDefined();
		});

		it("should find fixtures by name", () => {
			const fixture = getFixtureByName("basic_navigation");
			expect(fixture).toBeDefined();
			expect(fixture?.name).toBe("basic_navigation");
		});
	});

	describe("Fixture helpers", () => {
		it("should filter by operation", () => {
			const navigateFixtures = fixtureHelpers.getByOperation("navigate");
			expect(navigateFixtures.length).toBeGreaterThan(0);
			navigateFixtures.forEach((f) => {
				expect(f.data.toolUse.input.operation).toBe("navigate");
			});
		});

		it("should filter successful operations", () => {
			const successful = fixtureHelpers.getSuccessfulOperations();
			expect(successful.length).toBeGreaterThan(0);
			successful.forEach((f) => {
				const output = f.data.toolUseResult.output;
				expect(typeof output === "object" && output.success).toBe(true);
			});
		});

		it("should filter failed operations", () => {
			const failed = fixtureHelpers.getFailedOperations();
			expect(failed.length).toBeGreaterThan(0);
			failed.forEach((f) => {
				const output = f.data.toolUseResult.output;
				expect(typeof output === "object" && !output.success).toBe(true);
			});
		});

		it("should find fixtures with screenshots", () => {
			const withScreenshots = fixtureHelpers.getWithScreenshots();
			expect(withScreenshots.length).toBeGreaterThan(0);
			withScreenshots.forEach((f) => {
				const output = f.data.toolUseResult.output;
				expect(typeof output === "object" && output.screenshot).toBeDefined();
			});
		});

		it("should find fixtures with metrics", () => {
			const withMetrics = fixtureHelpers.getWithMetrics();
			expect(withMetrics.length).toBeGreaterThan(0);
			withMetrics.forEach((f) => {
				const output = f.data.toolUseResult.output;
				expect(typeof output === "object" && output.metrics).toBeDefined();
			});
		});

		it("should find fixtures with headless mode", () => {
			const headless = fixtureHelpers.getHeadlessFixtures();
			expect(headless.length).toBeGreaterThan(0);
			headless.forEach((f) => {
				expect(f.data.toolUse.input.launchOptions?.headless).toBe(true);
			});
		});

		it("should find fixtures with custom viewports", () => {
			const custom = fixtureHelpers.getCustomViewportFixtures();
			expect(custom.length).toBeGreaterThan(0);
		});

		it("should filter by selector type", () => {
			const idSelectors = fixtureHelpers.getBySelectorType("id");
			expect(idSelectors.length).toBeGreaterThan(0);
		});
	});

	describe("Fixture validation", () => {
		it("should validate fixture structure", () => {
			const validation = fixtureValidation.validateStructure();
			expect(validation.valid).toBe(true);
			if (!validation.valid) {
				console.log("Structure validation errors:", validation.errors);
			}
		});

		it("should validate operations", () => {
			const validation = fixtureValidation.validateOperations();
			expect(validation.valid).toBe(true);
			if (!validation.valid) {
				console.log("Invalid operations:", validation.invalidOperations);
			}
		});

		it("should validate result formats", () => {
			const validation = fixtureValidation.validateResultFormats();
			expect(validation.valid).toBe(true);
			if (!validation.valid) {
				console.log("Format validation errors:", validation.errors);
			}
		});

		it("should run all validations", () => {
			const validation = fixtureValidation.validateAll();
			expect(validation.valid).toBe(true);
			expect(
				(validation.report.summary as { totalFixtures: number }).totalFixtures,
			).toBeGreaterThan(0);
		});
	});
});

describe("Chat Item Integration", () => {
	it("should identify valid chat items", () => {
		const fixture = namedFixtures.basicNavigation;
		expect(fixture).toBeDefined();
		if (fixture) {
			expect(isPuppeteerMcpToolChatItem(fixture.data)).toBe(true);
		}
	});

	it("should identify valid result data", () => {
		const fixture = namedFixtures.elementClick;
		expect(fixture).toBeDefined();
		if (fixture) {
			const output = fixture.data.toolUseResult.output;
			expect(isPuppeteerMcpToolResultData(output)).toBe(true);
		}
	});
});

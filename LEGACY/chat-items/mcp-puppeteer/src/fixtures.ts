/**
 * @fileoverview Fixture management and exports for Puppeteer MCP tool
 * @module @dao/chat-items-mcp-puppeteer/fixtures
 */

import fixturesData from "./fixtures.json";
import type { PuppeteerMcpToolFixture, PuppeteerOperationType } from "./types";

/**
 * All available fixtures for Puppeteer MCP tool
 */
export const fixtures = fixturesData as PuppeteerMcpToolFixture[];

/**
 * Get fixtures by category
 */
export function getFixturesByCategory(category: string): PuppeteerMcpToolFixture[] {
	return fixtures.filter((fixture) => fixture.category === category);
}

/**
 * Get fixture by name
 */
export function getFixtureByName(name: string): PuppeteerMcpToolFixture | undefined {
	return fixtures.find((fixture) => fixture.name === name);
}

/**
 * Categorized fixture exports
 */

/**
 * Navigation operation fixtures
 */
export const navigationFixtures = getFixturesByCategory("navigation");

/**
 * Screenshot operation fixtures
 */
export const screenshotFixtures = getFixturesByCategory("screenshot");

/**
 * Element interaction fixtures
 */
export const interactionFixtures = getFixturesByCategory("interaction");

/**
 * JavaScript evaluation fixtures
 */
export const evaluationFixtures = getFixturesByCategory("evaluation");

/**
 * Performance monitoring fixtures
 */
export const monitoringFixtures = getFixturesByCategory("monitoring");

/**
 * Wait operation fixtures
 */
export const waitingFixtures = getFixturesByCategory("waiting");

/**
 * Error scenario fixtures
 */
export const errorFixtures = getFixturesByCategory("errors");

/**
 * Responsive design fixtures
 */
export const responsiveFixtures = getFixturesByCategory("responsive");

/**
 * Named fixture exports for easy access
 */
export const namedFixtures = {
	basicNavigation: getFixtureByName("basic_navigation"),
	fullPageScreenshot: getFixtureByName("full_page_screenshot"),
	elementClick: getFixtureByName("element_click"),
	formFill: getFixtureByName("form_fill"),
	javascriptEvaluation: getFixtureByName("javascript_evaluation"),
	performanceMonitoring: getFixtureByName("performance_monitoring"),
	waitForElement: getFixtureByName("wait_for_element"),
	selectDropdown: getFixtureByName("select_dropdown"),
	errorScenario: getFixtureByName("error_scenario"),
	mobileViewport: getFixtureByName("mobile_viewport"),
} as const;

/**
 * Fixture statistics and analysis
 */
export const fixtureStats = {
	total: fixtures.length,
	byCategory: {
		navigation: navigationFixtures.length,
		screenshot: screenshotFixtures.length,
		interaction: interactionFixtures.length,
		evaluation: evaluationFixtures.length,
		monitoring: monitoringFixtures.length,
		waiting: waitingFixtures.length,
		errors: errorFixtures.length,
		responsive: responsiveFixtures.length,
	},
	operations: Array.from(new Set(fixtures.map((f) => f.data.toolUse.input.operation))),
	successfulOperations: fixtures.filter(
		(f) => f.data.toolUseResult.output !== "string" && f.data.toolUseResult.output.success,
	).length,
	failedOperations: fixtures.filter(
		(f) => f.data.toolUseResult.output !== "string" && !f.data.toolUseResult.output.success,
	).length,
} as const;

/**
 * Helper functions for working with fixtures
 */
export const fixtureHelpers = {
	/**
	 * Get fixtures containing specific operations
	 */
	getByOperation(operation: PuppeteerOperationType): PuppeteerMcpToolFixture[] {
		return fixtures.filter((f) => f.data.toolUse.input.operation === operation);
	},

	/**
	 * Get fixtures with successful operations
	 */
	getSuccessfulOperations(): PuppeteerMcpToolFixture[] {
		return fixtures.filter((f) => {
			const output = f.data.toolUseResult.output;
			return typeof output === "object" && output.success;
		});
	},

	/**
	 * Get fixtures with failed operations
	 */
	getFailedOperations(): PuppeteerMcpToolFixture[] {
		return fixtures.filter((f) => {
			const output = f.data.toolUseResult.output;
			return typeof output === "object" && !output.success;
		});
	},

	/**
	 * Get fixtures with screenshots
	 */
	getWithScreenshots(): PuppeteerMcpToolFixture[] {
		return fixtures.filter((f) => {
			const output = f.data.toolUseResult.output;
			return typeof output === "object" && output.screenshot;
		});
	},

	/**
	 * Get fixtures with performance metrics
	 */
	getWithMetrics(): PuppeteerMcpToolFixture[] {
		return fixtures.filter((f) => {
			const output = f.data.toolUseResult.output;
			return typeof output === "object" && output.metrics;
		});
	},

	/**
	 * Get fixtures with console messages
	 */
	getWithConsoleMessages(): PuppeteerMcpToolFixture[] {
		return fixtures.filter((f) => {
			const output = f.data.toolUseResult.output;
			return (
				typeof output === "object" && output.consoleMessages && output.consoleMessages.length > 0
			);
		});
	},

	/**
	 * Get fixtures with network requests
	 */
	getWithNetworkRequests(): PuppeteerMcpToolFixture[] {
		return fixtures.filter((f) => {
			const output = f.data.toolUseResult.output;
			return (
				typeof output === "object" && output.networkRequests && output.networkRequests.length > 0
			);
		});
	},

	/**
	 * Get fixtures with element information
	 */
	getWithElementInfo(): PuppeteerMcpToolFixture[] {
		return fixtures.filter((f) => {
			const output = f.data.toolUseResult.output;
			return typeof output === "object" && output.elementInfo;
		});
	},

	/**
	 * Get fixtures with specific launch options
	 */
	getWithLaunchOptions(
		optionKey: keyof import("./types").BrowserLaunchOptions,
	): PuppeteerMcpToolFixture[] {
		return fixtures.filter(
			(f) => f.data.toolUse.input.launchOptions && optionKey in f.data.toolUse.input.launchOptions,
		);
	},

	/**
	 * Get fixtures with headless mode
	 */
	getHeadlessFixtures(): PuppeteerMcpToolFixture[] {
		return fixtures.filter((f) => f.data.toolUse.input.launchOptions?.headless === true);
	},

	/**
	 * Get fixtures with non-headless mode
	 */
	getNonHeadlessFixtures(): PuppeteerMcpToolFixture[] {
		return fixtures.filter((f) => f.data.toolUse.input.launchOptions?.headless === false);
	},

	/**
	 * Get fixtures with custom viewport sizes
	 */
	getCustomViewportFixtures(): PuppeteerMcpToolFixture[] {
		return fixtures.filter((f) => {
			const launch = f.data.toolUse.input.launchOptions;
			return launch && (launch.width !== 1280 || launch.height !== 720);
		});
	},

	/**
	 * Get fixtures with debug mode enabled
	 */
	getDebugFixtures(): PuppeteerMcpToolFixture[] {
		return fixtures.filter((f) => f.data.toolUse.input.debug === true);
	},

	/**
	 * Get fixtures with timeout values
	 */
	getWithTimeout(): PuppeteerMcpToolFixture[] {
		return fixtures.filter((f) => f.data.toolUse.input.timeout !== undefined);
	},

	/**
	 * Get fixtures by timing duration range
	 */
	getByDurationRange(minMs: number, maxMs: number): PuppeteerMcpToolFixture[] {
		return fixtures.filter((f) => {
			const output = f.data.toolUseResult.output;
			if (typeof output === "object" && output.timing) {
				const duration = output.timing.duration;
				return duration >= minMs && duration <= maxMs;
			}
			return false;
		});
	},

	/**
	 * Get fixtures with specific selectors
	 */
	getBySelectorType(selectorType: "id" | "class" | "tag" | "attribute"): PuppeteerMcpToolFixture[] {
		return fixtures.filter((f) => {
			const input = f.data.toolUse.input;
			const selector =
				input.element?.selector ||
				input.input?.selector ||
				input.select?.selector ||
				input.wait?.selector;

			if (!selector) return false;

			switch (selectorType) {
				case "id":
					return selector.startsWith("#");
				case "class":
					return selector.startsWith(".");
				case "tag":
					return /^[a-zA-Z][a-zA-Z0-9]*$/.test(selector);
				case "attribute":
					return selector.includes("[") && selector.includes("]");
				default:
					return false;
			}
		});
	},
};

/**
 * Validation helpers for fixtures
 */
export const fixtureValidation = {
	/**
	 * Check if all fixtures have required fields
	 */
	validateStructure(): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		fixtures.forEach((fixture, index) => {
			if (!fixture.name) {
				errors.push(`Fixture ${index}: Missing name`);
			}
			if (!fixture.category) {
				errors.push(`Fixture ${index}: Missing category`);
			}
			if (!fixture.data) {
				errors.push(`Fixture ${index}: Missing data`);
			}
			if (!fixture.data?.toolUse?.input?.operation) {
				errors.push(`Fixture ${index}: Missing operation in input`);
			}
		});

		return {
			valid: errors.length === 0,
			errors,
		};
	},

	/**
	 * Check if all operation types are valid
	 */
	validateOperations(): { valid: boolean; invalidOperations: string[] } {
		const validOperations: PuppeteerOperationType[] = [
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
		];

		const invalidOperations: string[] = [];

		fixtures.forEach((fixture) => {
			const operation = fixture.data.toolUse.input.operation;
			if (!validOperations.includes(operation)) {
				invalidOperations.push(`${fixture.name}: ${operation}`);
			}
		});

		return {
			valid: invalidOperations.length === 0,
			invalidOperations,
		};
	},

	/**
	 * Check if fixtures have consistent result formats
	 */
	validateResultFormats(): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		fixtures.forEach((fixture) => {
			const output = fixture.data.toolUseResult.output;

			if (typeof output === "object") {
				if (!output.operation) {
					errors.push(`${fixture.name}: Missing operation in result`);
				}
				if (typeof output.success !== "boolean") {
					errors.push(`${fixture.name}: Missing or invalid success field`);
				}
				if (!output.message) {
					errors.push(`${fixture.name}: Missing message in result`);
				}
			}
		});

		return {
			valid: errors.length === 0,
			errors,
		};
	},

	/**
	 * Run all validation checks
	 */
	validateAll(): { valid: boolean; report: Record<string, unknown> } {
		const structure = this.validateStructure();
		const operations = this.validateOperations();
		const formats = this.validateResultFormats();

		return {
			valid: structure.valid && operations.valid && formats.valid,
			report: {
				structure,
				operations,
				formats,
				summary: {
					totalFixtures: fixtures.length,
					validStructure: structure.valid,
					validOperations: operations.valid,
					validFormats: formats.valid,
				},
			},
		};
	},
};

/**
 * Export fixture metadata
 */
export const FIXTURE_METADATA = {
	version: "1.0.0",
	totalFixtures: fixtures.length,
	categories: Object.keys(fixtureStats.byCategory),
	operations: fixtureStats.operations,
	lastUpdated: "2024-01-20T18:00:00Z",
} as const;

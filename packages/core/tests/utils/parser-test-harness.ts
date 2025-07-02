import { deepEqual } from "node:assert";
import type { BaseToolProps, LogEntry, ToolParser } from "@claude-codex/types";
import { FixtureLoader } from "./fixture-loader";

/**
 * TestScenario - Defines a single test case for the parser
 */
export interface TestScenario<TProps extends BaseToolProps> {
	/** Human-readable description of what this test validates */
	description: string;
	/** Expected parser output for validation */
	expected: TProps;
	/** Optional custom validation function for complex scenarios */
	customValidator?: (actual: TProps, expected: TProps) => undefined | string;
	/** Tags for test categorization and filtering */
	tags?: string[];
}

/**
 * ParserTestResult - Result of running a parser test scenario
 */
export interface ParserTestResult {
	scenario: string;
	success: boolean;
	error?: string;
	executionTime: number;
	actualOutput?: unknown;
	expectedOutput?: unknown;
}

/**
 * ParserTestHarness - Systematic testing framework for parsers using fixture data
 *
 * Features:
 * - Instance-based pattern for parser + fixture combinations
 * - Deep comparison engine for accurate validation
 * - Performance monitoring and metrics collection
 * - Comprehensive test scenario generation
 * - Integration with vitest patterns
 */
export class ParserTestHarness<TProps extends BaseToolProps> {
	private parser: ToolParser<TProps>;
	private fixtureData: LogEntry[];
	private toolCallEntries: LogEntry[];
	private toolResultEntries: LogEntry[];

	constructor(parser: ToolParser<TProps>, fixtureName: string) {
		this.parser = parser;
		this.fixtureData = FixtureLoader.load<LogEntry[]>(fixtureName);

		// Separate tool calls from tool results for correlated testing
		this.toolCallEntries = this.fixtureData.filter((entry) => {
			if (entry.type === "assistant" && Array.isArray(entry.content)) {
				return entry.content.some((c) => c.type === "tool_use");
			}
			return false;
		});
		this.toolResultEntries = this.fixtureData.filter((entry) => {
			if (entry.type === "user" && Array.isArray(entry.content)) {
				return entry.content.some((c) => c.type === "tool_result");
			}
			return false;
		});
	}

	/**
	 * Run a single test scenario against the parser
	 * @param scenario - Test scenario to execute
	 * @param toolCallIndex - Index of tool call to test (default: 0)
	 * @returns Test result with timing and validation details
	 */
	async runScenario(
		scenario: TestScenario<TProps>,
		toolCallIndex = 0,
	): Promise<ParserTestResult> {
		const startTime = performance.now();

		try {
			// Get tool call and corresponding result
			const toolCall = this.toolCallEntries[toolCallIndex];
			if (!toolCall) {
				throw new Error(`No tool call found at index ${toolCallIndex}`);
			}

			const toolResult = this.findCorrelatedResult(toolCall);

			// Execute parser
			const actualOutput = this.parser.parse(toolCall, toolResult);

			// Validate output
			if (scenario.customValidator) {
				const validationError = scenario.customValidator(
					actualOutput,
					scenario.expected,
				);
				if (validationError) {
					throw new Error(validationError);
				}
			} else {
				this.deepCompare(actualOutput, scenario.expected);
			}

			const executionTime = performance.now() - startTime;

			return {
				scenario: scenario.description,
				success: true,
				executionTime,
				actualOutput,
				expectedOutput: scenario.expected,
			};
		} catch (error) {
			const executionTime = performance.now() - startTime;

			return {
				scenario: scenario.description,
				success: false,
				error: error instanceof Error ? error.message : String(error),
				executionTime,
			};
		}
	}

	/**
	 * Run multiple test scenarios and collect results
	 * @param scenarios - Array of test scenarios to execute
	 * @returns Array of test results
	 */
	async runScenarios(
		scenarios: TestScenario<TProps>[],
	): Promise<ParserTestResult[]> {
		const results: ParserTestResult[] = [];

		for (let i = 0; i < scenarios.length; i++) {
			const scenario = scenarios[i];
			const result = await this.runScenario(
				scenario,
				i % this.toolCallEntries.length,
			);
			results.push(result);
		}

		return results;
	}

	/**
	 * Generate basic test scenarios from fixture data
	 * Useful for creating initial test cases when scenarios aren't manually defined
	 * @returns Array of basic test scenarios
	 */
	generateBasicScenarios(): TestScenario<TProps>[] {
		const scenarios: TestScenario<TProps>[] = [];

		for (let i = 0; i < this.toolCallEntries.length; i++) {
			const toolCall = this.toolCallEntries[i];
			const toolResult = this.findCorrelatedResult(toolCall);

			try {
				const expectedOutput = this.parser.parse(toolCall, toolResult);

				scenarios.push({
					description: `Parse tool call ${i + 1}: ${toolCall.uuid}`,
					expected: expectedOutput,
					tags: ["generated", "basic"],
				});
			} catch (_error) {}
		}

		return scenarios;
	}

	/**
	 * Get comprehensive test statistics
	 * @param results - Array of test results
	 * @returns Test statistics and metrics
	 */
	getTestStatistics(results: ParserTestResult[]) {
		const totalTests = results.length;
		const passedTests = results.filter((r) => r.success).length;
		const failedTests = totalTests - passedTests;
		const totalExecutionTime = results.reduce(
			(sum, r) => sum + r.executionTime,
			0,
		);
		const averageExecutionTime = totalExecutionTime / totalTests;

		const failedScenarios = results
			.filter((r) => !r.success)
			.map((r) => ({ scenario: r.scenario, error: r.error }));

		return {
			total: totalTests,
			passed: passedTests,
			failed: failedTests,
			passRate: (passedTests / totalTests) * 100,
			totalExecutionTime,
			averageExecutionTime,
			failedScenarios,
		};
	}

	/**
	 * Find correlated tool result for a given tool call
	 * @param toolCall - Tool call entry to find result for
	 * @returns Correlated tool result or undefined
	 */
	private findCorrelatedResult(toolCall: LogEntry): LogEntry | undefined {
		return this.toolResultEntries.find(
			(result) =>
				result.uuid === toolCall.uuid || result.parentUuid === toolCall.uuid,
		);
	}

	/**
	 * Deep comparison of actual vs expected output
	 * @param actual - Actual parser output
	 * @param expected - Expected parser output
	 * @throws Error if comparison fails
	 */
	private deepCompare(actual: TProps, expected: TProps): void {
		try {
			deepEqual(actual, expected);
		} catch (error) {
			throw new Error(
				"Parser output validation failed:\n" +
					`Expected: ${JSON.stringify(expected, null, 2)}\n` +
					`Actual: ${JSON.stringify(actual, null, 2)}\n` +
					`Difference: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Get fixture metadata for debugging and reporting
	 * @returns Fixture metadata
	 */
	getFixtureMetadata() {
		return {
			totalEntries: this.fixtureData.length,
			toolCallCount: this.toolCallEntries.length,
			toolResultCount: this.toolResultEntries.length,
			correlatedPairs: this.toolCallEntries.filter(
				(call) => this.findCorrelatedResult(call) !== undefined,
			).length,
		};
	}

	/**
	 * Export test results in various formats for reporting
	 * @param results - Test results to export
	 * @param format - Export format ('json' | 'junit' | 'markdown')
	 * @returns Formatted test results
	 */
	exportResults(
		results: ParserTestResult[],
		format: "json" | "junit" | "markdown" = "json",
	): string {
		const stats = this.getTestStatistics(results);

		switch (format) {
			case "json":
				return JSON.stringify({ statistics: stats, results }, null, 2);

			case "markdown": {
				let markdown = "# Parser Test Results\n\n";
				markdown += `**Summary**: ${stats.passed}/${stats.total} tests passed (${stats.passRate.toFixed(1)}%)\n\n`;

				if (stats.failed > 0) {
					markdown += "## Failed Tests\n\n";
					for (const failure of stats.failedScenarios) {
						markdown += `- **${failure.scenario}**: ${failure.error}\n`;
					}
					markdown += "\n";
				}

				markdown += "## Performance\n\n";
				markdown += `- Total execution time: ${stats.totalExecutionTime.toFixed(2)}ms\n`;
				markdown += `- Average per test: ${stats.averageExecutionTime.toFixed(2)}ms\n`;

				return markdown;
			}

			case "junit": {
				// Basic JUnit XML format for CI integration
				let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
				xml += `<testsuite tests="${stats.total}" failures="${stats.failed}" time="${(stats.totalExecutionTime / 1000).toFixed(3)}">\n`;

				for (const result of results) {
					xml += `  <testcase name="${result.scenario}" time="${(result.executionTime / 1000).toFixed(3)}"`;
					if (!result.success) {
						xml += `>\n    <failure message="${result.error || "Unknown error"}"/>\n  </testcase>\n`;
					} else {
						xml += "/>\n";
					}
				}

				xml += "</testsuite>";
				return xml;
			}

			default:
				return JSON.stringify(results, null, 2);
		}
	}
}

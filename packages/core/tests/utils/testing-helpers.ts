import type { BaseToolProps, LogEntry, ToolStatus } from "@claude-codex/types";
import { expect } from "vitest";

/**
 * Custom vitest matchers for parser testing
 */
export interface CustomMatchers<R = unknown> {
	toHaveValidToolProps(): R;
	toHaveValidStatus(): R;
	toMatchFixtureOutput(expected: unknown): R;
	toHaveCorrelatedUuids(): R;
}

declare module "vitest" {
	interface Assertion extends CustomMatchers {}
	interface AsymmetricMatchersContaining extends CustomMatchers {}
}

/**
 * Validate that parser output contains all required BaseToolProps fields
 * @param props - Parser output to validate
 */
export function validateBaseToolProps(props: BaseToolProps): void {
	expect(props).toBeDefined();
	expect(props.uuid).toBeDefined();
	expect(typeof props.uuid).toBe("string");
	expect(props.uuid.length).toBeGreaterThan(0);

	expect(props.timestamp).toBeDefined();
	expect(typeof props.timestamp).toBe("string");

	expect(props.status).toBeDefined();
	expect(props.status.normalized).toBeDefined();
	expect(props.status.original).toBeDefined();

	// Validate status values
	const validStatuses = [
		"pending",
		"running",
		"completed",
		"failed",
		"interrupted",
		"unknown",
	];
	expect(validStatuses).toContain(props.status.normalized);
}

/**
 * Validate tool status structure and values
 * @param status - Tool status to validate
 */
export function validateToolStatus(status: ToolStatus): void {
	expect(status).toBeDefined();
	expect(status.normalized).toBeDefined();
	expect(status.original).toBeDefined();

	const validStatuses = [
		"pending",
		"running",
		"completed",
		"failed",
		"interrupted",
		"unknown",
	];
	expect(validStatuses).toContain(status.normalized);
	expect(typeof status.original).toBe("string");
}

/**
 * Validate UUID correlation between tool call and result
 * @param toolCall - Tool call log entry
 * @param toolResult - Tool result log entry (optional)
 */
export function validateUuidCorrelation(
	toolCall: LogEntry,
	toolResult?: LogEntry,
): void {
	expect(toolCall.uuid).toBeDefined();
	expect(typeof toolCall.uuid).toBe("string");

	if (toolResult) {
		// Tool result should either have same UUID or reference tool call as parent
		const isCorrelated =
			toolResult.uuid === toolCall.uuid ||
			toolResult.parentUuid === toolCall.uuid;

		expect(isCorrelated).toBe(true);
	}
}

/**
 * Deep comparison with detailed error reporting
 * @param actual - Actual value
 * @param expected - Expected value
 * @param path - Current path for error reporting
 */
export function deepCompareWithPath(
	actual: unknown,
	expected: unknown,
	path = "root",
): void {
	if (actual === expected) return;

	if (
		actual === null ||
		expected === null ||
		actual === undefined ||
		expected === undefined
	) {
		throw new Error(
			`Value mismatch at ${path}: expected ${expected}, got ${actual}`,
		);
	}

	if (typeof actual !== typeof expected) {
		throw new Error(
			`Type mismatch at ${path}: expected ${typeof expected}, got ${typeof actual}`,
		);
	}

	if (Array.isArray(actual) && Array.isArray(expected)) {
		if (actual.length !== expected.length) {
			throw new Error(
				`Array length mismatch at ${path}: expected ${expected.length}, got ${actual.length}`,
			);
		}

		for (let i = 0; i < actual.length; i++) {
			deepCompareWithPath(actual[i], expected[i], `${path}[${i}]`);
		}
		return;
	}

	if (typeof actual === "object" && typeof expected === "object") {
		const actualKeys = Object.keys(actual as object).sort();
		const expectedKeys = Object.keys(expected as object).sort();

		if (actualKeys.length !== expectedKeys.length) {
			throw new Error(
				`Object key count mismatch at ${path}: expected ${expectedKeys.length}, got ${actualKeys.length}`,
			);
		}

		for (const key of expectedKeys) {
			if (!actualKeys.includes(key)) {
				throw new Error(`Missing key at ${path}.${key}`);
			}

			deepCompareWithPath(
				(actual as Record<string, unknown>)[key],
				(expected as Record<string, unknown>)[key],
				`${path}.${key}`,
			);
		}
		return;
	}

	throw new Error(
		`Value mismatch at ${path}: expected ${expected}, got ${actual}`,
	);
}

/**
 * Create a mock LogEntry for testing
 * @param overrides - Properties to override in the mock
 * @returns Mock LogEntry
 */
export function createMockLogEntry(
	overrides: Partial<LogEntry> = {},
): LogEntry {
	return {
		uuid: "test-uuid-123",
		timestamp: new Date().toISOString(),
		type: "assistant",
		content: "test content",
		isSidechain: false,
		...overrides,
	};
}

/**
 * Create a mock BaseToolProps for testing
 * @param overrides - Properties to override in the mock
 * @returns Mock BaseToolProps
 */
export function createMockBaseToolProps(
	overrides: Partial<BaseToolProps> = {},
): BaseToolProps {
	return {
		id: "test-id-123",
		uuid: "test-uuid-123",
		timestamp: new Date().toISOString(),
		status: {
			normalized: "completed",
			original: "success",
		},
		...overrides,
	};
}

/**
 * Extract tool call and result pairs from fixture data
 * @param fixtureData - Array of LogEntry from fixture
 * @returns Array of correlated tool call/result pairs
 */
export function extractToolPairs(
	fixtureData: LogEntry[],
): Array<{ call: LogEntry; result?: LogEntry }> {
	const toolCalls = fixtureData.filter((entry) => {
		if (entry.type === "assistant" && Array.isArray(entry.content)) {
			return entry.content.some((c) => c.type === "tool_use");
		}
		return false;
	});
	const toolResults = fixtureData.filter((entry) => {
		if (entry.type === "user" && Array.isArray(entry.content)) {
			return entry.content.some((c) => c.type === "tool_result");
		}
		return false;
	});

	return toolCalls.map((call) => {
		const result = toolResults.find(
			(r) => r.uuid === call.uuid || r.parentUuid === call.uuid,
		);
		return { call, result };
	});
}

/**
 * Validate fixture data structure
 * @param fixtureData - Fixture data to validate
 * @param expectedEntryCount - Expected number of entries (optional)
 */
export function validateFixtureStructure(
	fixtureData: LogEntry[],
	expectedEntryCount?: number,
): void {
	expect(Array.isArray(fixtureData)).toBe(true);
	expect(fixtureData.length).toBeGreaterThan(0);

	if (expectedEntryCount !== undefined) {
		expect(fixtureData.length).toBe(expectedEntryCount);
	}

	// Validate each entry has required fields
	for (let i = 0; i < fixtureData.length; i++) {
		const entry = fixtureData[i];
		expect(entry.uuid).toBeDefined();
		expect(typeof entry.uuid).toBe("string");
		expect(entry.type).toBeDefined();
		expect(typeof entry.type).toBe("string");
		expect(entry.timestamp).toBeDefined();
		expect(typeof entry.timestamp).toBe("string");
	}
}

/**
 * Generate test description based on tool call content
 * @param toolCall - Tool call to generate description for
 * @returns Human-readable test description
 */
export function generateTestDescription(toolCall: LogEntry): string {
	try {
		const content =
			typeof toolCall.content === "string"
				? JSON.parse(toolCall.content)
				: toolCall.content;

		if (content.type) {
			const params = content.parameters || {};
			const paramSummary = Object.keys(params).slice(0, 2).join(", ");
			return `${content.type} tool with ${paramSummary || "no parameters"}`;
		}

		return `Tool call ${toolCall.uuid}`;
	} catch {
		return `Tool call ${toolCall.uuid}`;
	}
}

/**
 * Performance timing utilities for test optimization
 */
export function createPerformanceTimer() {
	const start = performance.now();

	return {
		elapsed: () => performance.now() - start,
		mark: (label: string) => ({
			label,
			time: performance.now() - start,
		}),
	};
}

/**
 * Custom vitest matchers implementation
 */
export function setupCustomMatchers() {
	expect.extend({
		toHaveValidToolProps(received: BaseToolProps) {
			try {
				validateBaseToolProps(received);
				return {
					message: () => "Expected invalid tool props",
					pass: true,
				};
			} catch (error) {
				return {
					message: () =>
						`Expected valid tool props: ${error instanceof Error ? error.message : String(error)}`,
					pass: false,
				};
			}
		},

		toHaveValidStatus(received: ToolStatus) {
			try {
				validateToolStatus(received);
				return {
					message: () => "Expected invalid status",
					pass: true,
				};
			} catch (error) {
				return {
					message: () =>
						`Expected valid status: ${error instanceof Error ? error.message : String(error)}`,
					pass: false,
				};
			}
		},

		toMatchFixtureOutput(received: unknown, expected: unknown) {
			try {
				deepCompareWithPath(received, expected);
				return {
					message: () => "Expected values to not match",
					pass: true,
				};
			} catch (error) {
				return {
					message: () =>
						`Fixture output mismatch: ${error instanceof Error ? error.message : String(error)}`,
					pass: false,
				};
			}
		},

		toHaveCorrelatedUuids(received: {
			toolCall: LogEntry;
			toolResult?: LogEntry;
		}) {
			try {
				validateUuidCorrelation(received.toolCall, received.toolResult);
				return {
					message: () => "Expected UUIDs to not be correlated",
					pass: true,
				};
			} catch (error) {
				return {
					message: () =>
						`UUID correlation failed: ${error instanceof Error ? error.message : String(error)}`,
					pass: false,
				};
			}
		},
	});
}

// Legacy class export for backward compatibility
export const TestingHelpers = {
	validateBaseToolProps,
	validateToolStatus,
	validateUuidCorrelation,
	deepCompareWithPath,
	createMockLogEntry,
	createMockBaseToolProps,
	extractToolPairs,
	validateFixtureStructure,
	generateTestDescription,
	createPerformanceTimer,
};

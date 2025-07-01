/**
 * Fixture-First Testing Utilities
 *
 * This module provides comprehensive testing infrastructure for Claude Codex parsers
 * using real fixture data from Claude Code tool logs.
 */

// Core utilities - function-based exports
export {
	clearFixtureCache,
	FixtureLoader, // Legacy compatibility
	fixtureExists,
	getAvailableFixtures,
	getFixturePath,
	loadFixture,
	loadFixturesBatch,
} from "./fixture-loader";
// Type exports
export type {
	ParserTestResult,
	TestScenario,
} from "./parser-test-harness";
export { ParserTestHarness } from "./parser-test-harness";

// Import for internal use in setupFixtureBasedTesting
import { loadFixture, loadFixturesBatch } from "./fixture-loader";
import { ParserTestHarness } from "./parser-test-harness";
import {
	createMockBaseToolProps,
	createMockLogEntry,
	setupCustomMatchers,
	validateBaseToolProps,
} from "./testing-helpers";

export type { CustomMatchers } from "./testing-helpers";
export {
	createMockBaseToolProps,
	createMockLogEntry,
	createPerformanceTimer,
	deepCompareWithPath,
	extractToolPairs,
	generateTestDescription,
	setupCustomMatchers,
	TestingHelpers, // Legacy compatibility
	validateBaseToolProps,
	validateFixtureStructure,
	validateToolStatus,
	validateUuidCorrelation,
} from "./testing-helpers";

/**
 * Quick setup function for fixture-based testing
 * Sets up custom matchers and returns commonly used utilities
 */
export function setupFixtureBasedTesting() {
	setupCustomMatchers();

	return {
		loadFixture,
		loadFixturesBatch,
		ParserTestHarness,
		validateBaseToolProps,
		createMockLogEntry,
		createMockBaseToolProps,
	};
}

/**
 * Re-export commonly used types from the types package
 */
export type {
	BaseToolProps,
	LogEntry,
	ToolParser,
	ToolStatus,
} from "@claude-codex/types";

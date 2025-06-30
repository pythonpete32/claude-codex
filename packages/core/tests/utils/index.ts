/**
 * Fixture-First Testing Utilities
 *
 * This module provides comprehensive testing infrastructure for Claude Codex parsers
 * using real fixture data from Claude Code tool logs.
 */

// Core utilities
export { FixtureLoader } from './fixture-loader';
export { ParserTestHarness } from './parser-test-harness';
export { TestingHelpers, setupCustomMatchers } from './testing-helpers';

// Type exports
export type {
  TestScenario,
  ParserTestResult,
} from './parser-test-harness';

export type { CustomMatchers } from './testing-helpers';

/**
 * Quick setup function for fixture-based testing
 * Sets up custom matchers and returns commonly used utilities
 */
export function setupFixtureBasedTesting() {
  setupCustomMatchers();

  return {
    FixtureLoader,
    ParserTestHarness,
    TestingHelpers,
  };
}

/**
 * Re-export commonly used types from the types package
 */
export type {
  LogEntry,
  BaseToolProps,
  ToolStatus,
  ToolParser,
} from '@claude-codex/types';

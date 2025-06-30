/**
 * @fileoverview Fixture data exports for read-tool testing
 * @module @dao/chat-items-read-tool/fixtures
 */

import fixtureData from "./fixtures.json";
import type { ReadToolChatItem } from "./types";

/**
 * Type definition for fixture data structure
 */
export interface ReadFixtureData {
	basic: ReadToolChatItem[];
	withOffsetAndLimit: ReadToolChatItem[];
	errors: ReadToolChatItem[];
	edgeCases: ReadToolChatItem[];
}

/**
 * Typed fixture data
 */
export const fixtures = fixtureData as unknown as ReadFixtureData;

/**
 * Individual fixture categories
 */
export const basicFixtures = fixtures.basic;
export const offsetLimitFixtures = fixtures.withOffsetAndLimit;
export const errorFixtures = fixtures.errors;
export const edgeCaseFixtures = fixtures.edgeCases;

/**
 * All fixtures combined
 */
export const allFixtures = [
	...basicFixtures,
	...offsetLimitFixtures,
	...errorFixtures,
	...edgeCaseFixtures,
];

/**
 * Get fixture by file path
 */
export function getFixtureByFilePath(filePath: string): ReadToolChatItem | undefined {
	return allFixtures.find((fixture) => fixture.toolUse.input.file_path === filePath);
}

/**
 * Get fixtures by status
 */
export function getFixturesByStatus(status: "completed" | "failed"): ReadToolChatItem[] {
	return allFixtures.filter((fixture) => fixture.toolResult.status === status);
}

/**
 * Get successful read fixtures
 */
export function getSuccessfulFixtures(): ReadToolChatItem[] {
	return getFixturesByStatus("completed");
}

/**
 * Get failed read fixtures
 */
export function getFailedFixtures(): ReadToolChatItem[] {
	return getFixturesByStatus("failed");
}

/**
 * Get fixtures with offset/limit
 */
export function getFixturesWithPagination(): ReadToolChatItem[] {
	return allFixtures.filter(
		(fixture) =>
			fixture.toolUse.input.offset !== undefined || fixture.toolUse.input.limit !== undefined,
	);
}

/**
 * Export fixture data for testing
 */
export default fixtures;

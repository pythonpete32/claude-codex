/**
 * @fileoverview Fixture data exports for multiedit-tool testing
 * @module @dao/chat-items-multiedit-tool/fixtures
 */

import fixtureData from "./fixtures.json";
import type { MultiEditToolChatItem } from "./types";

/**
 * Type definition for fixture data structure
 */
export interface MultiEditFixtureData {
	basic: MultiEditToolChatItem[];
	withReplaceAll: MultiEditToolChatItem[];
	partialFailures: MultiEditToolChatItem[];
	errors: MultiEditToolChatItem[];
	edgeCases: MultiEditToolChatItem[];
}

/**
 * Typed fixture data
 */
export const fixtures = fixtureData as unknown as MultiEditFixtureData;

/**
 * Individual fixture categories
 */
export const basicFixtures = fixtures.basic;
export const replaceAllFixtures = fixtures.withReplaceAll;
export const partialFailureFixtures = fixtures.partialFailures;
export const errorFixtures = fixtures.errors;
export const edgeCaseFixtures = fixtures.edgeCases;

/**
 * All fixtures combined
 */
export const allFixtures = [
	...basicFixtures,
	...replaceAllFixtures,
	...partialFailureFixtures,
	...errorFixtures,
	...edgeCaseFixtures,
];

/**
 * Get fixture by file path
 */
export function getFixtureByFilePath(filePath: string): MultiEditToolChatItem | undefined {
	return allFixtures.find((fixture) => fixture.toolUse.input.file_path === filePath);
}

/**
 * Get fixtures by status
 */
export function getFixturesByStatus(status: "completed" | "failed"): MultiEditToolChatItem[] {
	return allFixtures.filter((fixture) => fixture.toolResult.status === status);
}

/**
 * Get successful multiedit fixtures
 */
export function getSuccessfulFixtures(): MultiEditToolChatItem[] {
	return getFixturesByStatus("completed");
}

/**
 * Get failed multiedit fixtures
 */
export function getFailedFixtures(): MultiEditToolChatItem[] {
	return getFixturesByStatus("failed");
}

/**
 * Get fixtures with replace_all operations
 */
export function getFixturesWithReplaceAll(): MultiEditToolChatItem[] {
	return allFixtures.filter((fixture) =>
		fixture.toolUse.input.edits.some((edit) => edit.replace_all),
	);
}

/**
 * Get fixtures with partial failures
 */
export function getPartialFailureFixtures(): MultiEditToolChatItem[] {
	return allFixtures.filter((fixture) => {
		if (fixture.toolResult.status !== "completed") {
			return false;
		}

		if (typeof fixture.toolResult.output === "string") {
			return false;
		}

		return !fixture.toolResult.output.all_successful;
	});
}

/**
 * Get fixtures with multiple edits
 */
export function getMultipleEditFixtures(): MultiEditToolChatItem[] {
	return allFixtures.filter((fixture) => fixture.toolUse.input.edits.length > 1);
}

/**
 * Get fixtures by number of edits
 */
export function getFixturesByEditCount(count: number): MultiEditToolChatItem[] {
	return allFixtures.filter((fixture) => fixture.toolUse.input.edits.length === count);
}

/**
 * Export fixture data for testing
 */
export default fixtures;

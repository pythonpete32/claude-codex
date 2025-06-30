/**
 * @fileoverview Fixture exports for write-tool testing
 * @module @dao/chat-items-write-tool/fixtures
 */

import fixtureData from "./fixtures.json";
import type { WriteToolChatItem } from "./types";

/**
 * All write tool fixtures
 */
export const fixtures = fixtureData;

/**
 * Basic write operation fixtures
 */
export const basicFixtures = fixtures.basic as unknown as WriteToolChatItem[];

/**
 * Source code file creation fixtures
 */
export const sourceCodeFixtures = fixtures.sourceCode as unknown as WriteToolChatItem[];

/**
 * Configuration file creation fixtures
 */
export const configurationFixtures = fixtures.configuration as unknown as WriteToolChatItem[];

/**
 * Documentation file creation fixtures
 */
export const documentationFixtures = fixtures.documentation as unknown as WriteToolChatItem[];

/**
 * Error case fixtures
 */
export const errorFixtures = fixtures.errors as unknown as WriteToolChatItem[];

/**
 * Edge case fixtures
 */
export const edgeCaseFixtures = fixtures.edgeCases as unknown as WriteToolChatItem[];

/**
 * All fixtures combined
 */
export const allFixtures: WriteToolChatItem[] = [
	...basicFixtures,
	...sourceCodeFixtures,
	...configurationFixtures,
	...documentationFixtures,
	...errorFixtures,
	...edgeCaseFixtures,
];

/**
 * Get fixture by category
 */
export function getFixturesByCategory(category: keyof typeof fixtures): WriteToolChatItem[] {
	return fixtures[category] as unknown as WriteToolChatItem[];
}

/**
 * Get fixture by ID
 */
export function getFixtureById(id: string): WriteToolChatItem | null {
	for (const fixture of allFixtures) {
		if (fixture.toolUse.id === id) {
			return fixture;
		}
	}
	return null;
}

/**
 * Get successful write fixtures
 */
export function getSuccessfulFixtures(): WriteToolChatItem[] {
	return allFixtures.filter((fixture) => fixture.toolUseResult.status === "completed");
}

/**
 * Get failed write fixtures
 */
export function getFailedFixtures(): WriteToolChatItem[] {
	return allFixtures.filter((fixture) => fixture.toolUseResult.status === "failed");
}

/**
 * Get fixtures by file extension
 */
export function getFixturesByFileExtension(extension: string): WriteToolChatItem[] {
	return allFixtures.filter((fixture) =>
		fixture.toolUse.input.file_path.toLowerCase().endsWith(`.${extension.toLowerCase()}`),
	);
}

/**
 * Get fixtures with content
 */
export function getFixturesWithContent(): WriteToolChatItem[] {
	return allFixtures.filter((fixture) => fixture.toolUse.input.content.length > 0);
}

/**
 * Get fixtures with empty content
 */
export function getFixturesWithEmptyContent(): WriteToolChatItem[] {
	return allFixtures.filter((fixture) => fixture.toolUse.input.content.length === 0);
}

/**
 * Get fixtures by content size category
 */
export function getFixturesByContentSize(size: "small" | "medium" | "large"): WriteToolChatItem[] {
	return allFixtures.filter((fixture) => {
		const contentLength = fixture.toolUse.input.content.length;
		switch (size) {
			case "small":
				return contentLength < 100;
			case "medium":
				return contentLength >= 100 && contentLength < 1000;
			case "large":
				return contentLength >= 1000;
			default:
				return false;
		}
	});
}

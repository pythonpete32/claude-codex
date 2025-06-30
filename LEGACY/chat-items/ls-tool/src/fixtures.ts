/**
 * Fixture data and exports for ls-tool
 * @packageDocumentation
 * @module @dao/codex-chat-item-ls-tool/fixtures
 */

import fixturesData from "./fixtures.json" with { type: "json" };
import { parseLsTool } from "./parsers";
import type { LsFixtureData, LsFixturesMetadata } from "./types";

/**
 * Validated fixtures from the fixtures.json file.
 * Only includes fixtures with complete data that pass validation.
 */
export const ValidatedFixtures: LsFixturesMetadata = (() => {
	// Validate the imported fixtures data structure
	const metadata = fixturesData as LsFixturesMetadata;

	// Filter and validate fixtures that have complete data
	const validatedFixtures = metadata.fixtures.filter((fixture, index) => {
		try {
			// Only include fixtures that have complete toolUseResult data
			if (
				fixture.toolResult?.toolUseResult === null ||
				fixture.toolResult?.toolUseResult === undefined
			) {
				return false; // Skip incomplete fixtures
			}

			// Parse the fixture to validate it can be transformed correctly
			parseLsTool(fixture);

			// Return true to include this fixture
			return true;
		} catch (error) {
			console.warn(`Skipping fixture ${index} due to validation error:`, error);
			return false; // Skip invalid fixtures
		}
	});

	return {
		...metadata,
		fixtures: validatedFixtures,
		fixtureCount: validatedFixtures.length, // Update count to reflect actual validated fixtures
	};
})();

/**
 * All fixtures for easy access to test cases and validation.
 */
export namespace AllFixtures {
	/**
	 * First fixture - successful ls with entries.
	 */
	export const successfulLs: LsFixtureData = ValidatedFixtures.fixtures[0];

	/**
	 * Find an empty directory ls fixture from the collection.
	 */
	export const emptyLs: LsFixtureData =
		ValidatedFixtures.fixtures.find((fixture) => {
			const result = fixture.toolResult.toolUseResult;
			if (Array.isArray(result) && result.length === 0) {
				return true;
			}
			if (
				typeof result === "object" &&
				result !== null &&
				"entries" in result &&
				Array.isArray(result.entries) &&
				result.entries.length === 0 &&
				!result.isError
			) {
				return true;
			}
			return false;
		}) || ValidatedFixtures.fixtures[1]; // Fallback to second fixture

	/**
	 * Find a failed ls fixture from the collection.
	 */
	export const failedLs: LsFixtureData =
		ValidatedFixtures.fixtures.find((fixture) => {
			const result = fixture.toolResult.toolUseResult;
			return (
				typeof result === "string" ||
				(typeof result === "object" && result !== null && "isError" in result && result.isError) ||
				fixture.toolResult.result.is_error
			);
		}) || ValidatedFixtures.fixtures[2]; // Fallback to third fixture

	/**
	 * All fixtures for comprehensive testing.
	 */
	export const allFixtures: LsFixtureData[] = ValidatedFixtures.fixtures;
}

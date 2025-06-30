/**
 * Fixture data and exports for glob-tool
 * @packageDocumentation
 * @module @dao/codex-chat-item-glob-tool/fixtures
 */

import fixturesData from "./fixtures.json" with { type: "json" };
import { parseGlobTool } from "./parsers";
import type { GlobFixtureData, GlobFixturesMetadata } from "./types";

/**
 * Validated fixtures from the fixtures.json file.
 * Only includes fixtures with complete data that pass validation.
 */
export const ValidatedFixtures: GlobFixturesMetadata = (() => {
	// Validate the imported fixtures data structure
	const metadata = fixturesData as GlobFixturesMetadata;

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
			parseGlobTool(fixture);

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
	 * First fixture - successful glob with matches.
	 */
	export const successfulGlob: GlobFixtureData = ValidatedFixtures.fixtures[0];

	/**
	 * Find a failed glob fixture from the collection.
	 */
	export const failedGlob: GlobFixtureData =
		ValidatedFixtures.fixtures.find((fixture) => {
			const result = fixture.toolResult.toolUseResult;
			return (
				typeof result === "string" ||
				(typeof result === "object" && result !== null && "isError" in result && result.isError) ||
				fixture.toolResult.result.is_error
			);
		}) || ValidatedFixtures.fixtures[0]; // Fallback to first if no failed glob found

	/**
	 * Find a fixture with no matches.
	 */
	export const emptyGlob: GlobFixtureData =
		ValidatedFixtures.fixtures.find((fixture) => {
			const result = fixture.toolResult.toolUseResult;
			if (Array.isArray(result) && result.length === 0) {
				return true;
			}
			if (
				typeof result === "object" &&
				result !== null &&
				"matches" in result &&
				Array.isArray(result.matches) &&
				result.matches.length === 0
			) {
				return true;
			}
			return false;
		}) || ValidatedFixtures.fixtures[1]; // Fallback to second fixture

	/**
	 * All fixtures for comprehensive testing.
	 */
	export const allFixtures: GlobFixtureData[] = ValidatedFixtures.fixtures;
}

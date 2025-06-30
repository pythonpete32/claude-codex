/**
 * Fixture data and exports for edit-tool
 * @packageDocumentation
 * @module @dao/codex-chat-item-edit-tool/fixtures
 */

import fixturesData from "./fixtures.json" with { type: "json" };
import { parseEditTool } from "./parsers";
import type { EditFixtureData, EditFixturesMetadata } from "./types";

/**
 * Validated fixtures from the fixtures.json file.
 * Only includes fixtures with complete data that pass validation.
 */
export const ValidatedFixtures: EditFixturesMetadata = (() => {
	// Validate the imported fixtures data structure
	const metadata = fixturesData as EditFixturesMetadata;

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
			parseEditTool(fixture);

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
	 * First fixture - typical file edit operation.
	 */
	export const successfulEdit: EditFixtureData = ValidatedFixtures.fixtures[0];

	/**
	 * Find a failed edit fixture from the collection.
	 */
	export const failedEdit: EditFixtureData =
		ValidatedFixtures.fixtures.find((fixture) => {
			const result = fixture.toolResult.toolUseResult;
			return (
				typeof result === "string" ||
				(typeof result === "object" && result.isError) ||
				fixture.toolResult.result.is_error
			);
		}) || ValidatedFixtures.fixtures[0]; // Fallback to first if no failed edit found

	/**
	 * All fixtures for comprehensive testing.
	 */
	export const allFixtures: EditFixtureData[] = ValidatedFixtures.fixtures;
}

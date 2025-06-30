/**
 * @fileoverview Fixture exports and utilities for Context7 MCP integration
 */

import fixturesData from "./fixtures.json";
import type { Context7McpFixture } from "./types";

/**
 * All Context7 MCP fixtures
 */
export const fixtures: Context7McpFixture[] = fixturesData as Context7McpFixture[];

/**
 * Resolve operation fixtures
 */
export const resolveFixtures = fixtures.filter((fixture) => fixture.category === "resolve");

/**
 * Documentation operation fixtures
 */
export const documentationFixtures = fixtures.filter(
	(fixture) => fixture.category === "documentation",
);

/**
 * Search operation fixtures
 */
export const searchFixtures = fixtures.filter((fixture) => fixture.category === "search");

/**
 * Code examples operation fixtures
 */
export const examplesFixtures = fixtures.filter((fixture) => fixture.category === "examples");

/**
 * Error scenario fixtures
 */
export const errorFixtures = fixtures.filter((fixture) => fixture.category === "errors");

/**
 * Library listing fixtures
 */
export const listingFixtures = fixtures.filter((fixture) => fixture.category === "listing");

/**
 * API reference fixtures
 */
export const apiReferenceFixtures = fixtures.filter(
	(fixture) => fixture.category === "api-reference",
);

/**
 * Validation operation fixtures
 */
export const validationFixtures = fixtures.filter((fixture) => fixture.category === "validation");

/**
 * Library info fixtures
 */
export const infoFixtures = fixtures.filter((fixture) => fixture.category === "info");

/**
 * Named fixture exports for easy access
 */
export const namedFixtures = {
	resolveNextjs: fixtures.find((f) => f.name === "resolve_nextjs_library") as Context7McpFixture,
	getReactDocs: fixtures.find((f) => f.name === "get_react_documentation") as Context7McpFixture,
	searchJavaScript: fixtures.find(
		(f) => f.name === "search_javascript_libraries",
	) as Context7McpFixture,
	getExpressExamples: fixtures.find(
		(f) => f.name === "get_code_examples_express",
	) as Context7McpFixture,
	libraryNotFound: fixtures.find((f) => f.name === "library_not_found_error") as Context7McpFixture,
	listPythonLibraries: fixtures.find(
		(f) => f.name === "list_python_libraries",
	) as Context7McpFixture,
	getLodashApiRef: fixtures.find(
		(f) => f.name === "get_api_reference_lodash",
	) as Context7McpFixture,
	validateReactUsage: fixtures.find(
		(f) => f.name === "validate_library_usage_react",
	) as Context7McpFixture,
	timeoutError: fixtures.find((f) => f.name === "timeout_error_example") as Context7McpFixture,
	getMongoDbInfo: fixtures.find((f) => f.name === "get_library_info_mongodb") as Context7McpFixture,
};

/**
 * Utility functions for working with fixtures
 */
export const fixtureHelpers = {
	/**
	 * Get fixtures by operation type
	 */
	getByOperation: (operation: string) =>
		fixtures.filter((fixture) => fixture.data.toolUse.input.operation === operation),

	/**
	 * Get successful operation fixtures
	 */
	getSuccessfulOperations: () =>
		fixtures.filter((fixture) => fixture.data.toolUseResult.output.success === true),

	/**
	 * Get failed operation fixtures
	 */
	getFailedOperations: () =>
		fixtures.filter((fixture) => fixture.data.toolUseResult.output.success === false),

	/**
	 * Get fixtures with documentation content
	 */
	getWithDocumentation: () =>
		fixtures.filter(
			(fixture) =>
				fixture.data.toolUseResult.output.documentation &&
				fixture.data.toolUseResult.output.documentation.length > 0,
		),

	/**
	 * Get fixtures with code examples
	 */
	getWithExamples: () =>
		fixtures.filter(
			(fixture) =>
				fixture.data.toolUseResult.output.examples &&
				fixture.data.toolUseResult.output.examples.length > 0,
		),

	/**
	 * Get fixtures with library metadata
	 */
	getWithLibraryData: () =>
		fixtures.filter((fixture) => fixture.data.toolUseResult.output.library !== undefined),

	/**
	 * Get fixtures with multiple libraries
	 */
	getWithLibrariesData: () =>
		fixtures.filter(
			(fixture) =>
				fixture.data.toolUseResult.output.libraries &&
				fixture.data.toolUseResult.output.libraries.length > 0,
		),

	/**
	 * Get fixtures by programming language
	 */
	getByLanguage: (language: string) =>
		fixtures.filter((fixture) => {
			const input = fixture.data.toolUse.input;
			return (
				input.resolve?.language?.toLowerCase() === language.toLowerCase() ||
				input.search?.language?.toLowerCase() === language.toLowerCase()
			);
		}),

	/**
	 * Get fixtures by library ID
	 */
	getByLibraryId: (libraryId: string) =>
		fixtures.filter((fixture) => {
			const input = fixture.data.toolUse.input;
			const output = fixture.data.toolUseResult.output;
			return (
				input.documentation?.libraryId === libraryId ||
				output.library?.id === libraryId ||
				output.libraries?.some((lib) => lib.id === libraryId)
			);
		}),

	/**
	 * Get fixtures with caching enabled
	 */
	getCachedOperations: () =>
		fixtures.filter((fixture) => fixture.data.toolUse.input.useCache === true),

	/**
	 * Get fixtures with debug enabled
	 */
	getDebugOperations: () => fixtures.filter((fixture) => fixture.data.toolUse.input.debug === true),

	/**
	 * Get fixtures by trust score threshold
	 */
	getByTrustScore: (minScore: number) =>
		fixtures.filter((fixture) => {
			const output = fixture.data.toolUseResult.output;
			if (output.library) {
				return (output.library.trustScore || 0) >= minScore;
			}
			if (output.libraries) {
				return output.libraries.some((lib) => (lib.trustScore || 0) >= minScore);
			}
			return false;
		}),

	/**
	 * Get fixtures by package manager
	 */
	getByPackageManager: (packageManager: string) =>
		fixtures.filter((fixture) => {
			const input = fixture.data.toolUse.input;
			const output = fixture.data.toolUseResult.output;
			return (
				input.resolve?.packageManager === packageManager ||
				output.library?.packageManager === packageManager ||
				output.libraries?.some((lib) => lib.packageManager === packageManager)
			);
		}),

	/**
	 * Get fixtures with specific content types
	 */
	getByContentType: (contentType: string) =>
		fixtures.filter((fixture) => {
			const input = fixture.data.toolUse.input;
			const output = fixture.data.toolUseResult.output;
			return (
				input.documentation?.contentTypes?.includes(
					contentType as "guide" | "reference" | "tutorial" | "example" | "changelog" | "readme",
				) || output.documentation?.some((doc) => doc.type === contentType)
			);
		}),

	/**
	 * Get fixtures with timing information
	 */
	getWithTiming: () =>
		fixtures.filter((fixture) => fixture.data.toolUseResult.output.timing !== undefined),

	/**
	 * Get fixtures by operation duration (in milliseconds)
	 */
	getByDuration: (maxDuration: number) =>
		fixtures.filter((fixture) => {
			const timing = fixture.data.toolUseResult.output.timing;
			return timing && timing.duration <= maxDuration;
		}),

	/**
	 * Get cache hit fixtures
	 */
	getCacheHits: () =>
		fixtures.filter((fixture) => {
			const timing = fixture.data.toolUseResult.output.timing;
			return timing?.cacheHit === true;
		}),

	/**
	 * Get fixtures by error code
	 */
	getByErrorCode: (errorCode: string) =>
		fixtures.filter((fixture) => fixture.data.toolUseResult.output.error?.code === errorCode),
};

/**
 * Get fixture by name
 */
export function getFixtureByName(name: string): Context7McpFixture | undefined {
	return fixtures.find((fixture) => fixture.name === name);
}

/**
 * Get fixtures by category
 */
export function getFixturesByCategory(category: string): Context7McpFixture[] {
	return fixtures.filter((fixture) => fixture.category === category);
}

/**
 * Fixture validation utilities
 */
export const fixtureValidation = {
	/**
	 * Validates that all fixtures have required structure
	 */
	validateStructure: () => {
		const errors: string[] = [];

		fixtures.forEach((fixture, index) => {
			if (!fixture.name) {
				errors.push(`Fixture ${index}: Missing name`);
			}
			if (!fixture.category) {
				errors.push(`Fixture ${index}: Missing category`);
			}
			if (!fixture.data) {
				errors.push(`Fixture ${index}: Missing data`);
			}
			if (!fixture.data?.toolUse) {
				errors.push(`Fixture ${index}: Missing toolUse`);
			}
			if (!fixture.data?.toolUseResult) {
				errors.push(`Fixture ${index}: Missing toolUseResult`);
			}
		});

		return {
			valid: errors.length === 0,
			errors,
		};
	},

	/**
	 * Validates that operation types are valid
	 */
	validateOperations: () => {
		const validOperations = [
			"resolve-library-id",
			"get-library-docs",
			"search-documentation",
			"get-library-info",
			"list-libraries",
			"get-code-examples",
			"validate-library-usage",
			"get-api-reference",
		];

		const invalidOperations: string[] = [];

		fixtures.forEach((fixture) => {
			const operation = fixture.data.toolUse.input.operation;
			if (!validOperations.includes(operation)) {
				invalidOperations.push(`${fixture.name}: ${operation}`);
			}
		});

		return {
			valid: invalidOperations.length === 0,
			invalidOperations,
		};
	},

	/**
	 * Validates that success/error states are consistent
	 */
	validateResultConsistency: () => {
		const inconsistencies: string[] = [];

		fixtures.forEach((fixture) => {
			const result = fixture.data.toolUseResult.output;
			const isSuccess = result.success;
			const hasError = result.error !== undefined;

			if (isSuccess && hasError) {
				inconsistencies.push(`${fixture.name}: Success=true but has error object`);
			}
			if (!isSuccess && !hasError) {
				inconsistencies.push(`${fixture.name}: Success=false but no error object`);
			}
		});

		return {
			valid: inconsistencies.length === 0,
			inconsistencies,
		};
	},

	/**
	 * Validates that library IDs follow Context7 format
	 */
	validateLibraryIds: () => {
		const invalidIds: string[] = [];
		const libraryIdRegex = /^\/[^/]+\/[^/]+(?:\/.*)?$/;

		fixtures.forEach((fixture) => {
			const result = fixture.data.toolUseResult.output;

			// Check library ID in single library result
			if (result.library?.id && !libraryIdRegex.test(result.library.id)) {
				invalidIds.push(`${fixture.name}: ${result.library.id}`);
			}

			// Check library IDs in multiple libraries result
			if (result.libraries) {
				result.libraries.forEach((lib) => {
					if (lib.id && !libraryIdRegex.test(lib.id)) {
						invalidIds.push(`${fixture.name}: ${lib.id}`);
					}
				});
			}

			// Check library ID in input
			const input = fixture.data.toolUse.input;
			if (input.documentation?.libraryId && !libraryIdRegex.test(input.documentation.libraryId)) {
				invalidIds.push(`${fixture.name} (input): ${input.documentation.libraryId}`);
			}
		});

		return {
			valid: invalidIds.length === 0,
			invalidIds,
		};
	},

	/**
	 * Runs all validations
	 */
	validateAll: () => {
		const structure = fixtureValidation.validateStructure();
		const operations = fixtureValidation.validateOperations();
		const consistency = fixtureValidation.validateResultConsistency();
		const libraryIds = fixtureValidation.validateLibraryIds();

		const allValid = structure.valid && operations.valid && consistency.valid && libraryIds.valid;

		return {
			valid: allValid,
			report: {
				structure,
				operations,
				consistency,
				libraryIds,
				summary: {
					totalFixtures: fixtures.length,
					categories: [...new Set(fixtures.map((f) => f.category))],
					operationTypes: [...new Set(fixtures.map((f) => f.data.toolUse.input.operation))],
					successfulOperations: fixtures.filter((f) => f.data.toolUseResult.output.success).length,
					failedOperations: fixtures.filter((f) => !f.data.toolUseResult.output.success).length,
				},
			},
		};
	},
};

/**
 * Fixture statistics
 */
export const fixtureStats = {
	total: fixtures.length,
	byCategory: fixtures.reduce(
		(acc, fixture) => {
			acc[fixture.category] = (acc[fixture.category] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	),
	operations: [...new Set(fixtures.map((f) => f.data.toolUse.input.operation))],
	successfulOperations: fixtures.filter((f) => f.data.toolUseResult.output.success).length,
	failedOperations: fixtures.filter((f) => !f.data.toolUseResult.output.success).length,
	withExamples: fixtures.filter(
		(f) => f.data.toolUseResult.output.examples && f.data.toolUseResult.output.examples.length > 0,
	).length,
	withDocumentation: fixtures.filter(
		(f) =>
			f.data.toolUseResult.output.documentation &&
			f.data.toolUseResult.output.documentation.length > 0,
	).length,
	withLibraryData: fixtures.filter((f) => f.data.toolUseResult.output.library).length,
	withLibrariesData: fixtures.filter(
		(f) =>
			f.data.toolUseResult.output.libraries && f.data.toolUseResult.output.libraries.length > 0,
	).length,
	cachedOperations: fixtures.filter((f) => f.data.toolUse.input.useCache).length,
	debugOperations: fixtures.filter((f) => f.data.toolUse.input.debug).length,
	averageDuration:
		fixtures
			.filter((f) => f.data.toolUseResult.output.timing)
			.reduce((sum, f) => sum + (f.data.toolUseResult.output.timing?.duration || 0), 0) /
		fixtures.filter((f) => f.data.toolUseResult.output.timing).length,
	cacheHitRate:
		fixtures.filter((f) => f.data.toolUseResult.output.timing?.cacheHit).length /
		fixtures.filter((f) => f.data.toolUseResult.output.timing).length,
};

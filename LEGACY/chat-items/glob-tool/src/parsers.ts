/**
 * Parser functions for glob-tool
 * @packageDocumentation
 * @module @dao/codex-chat-item-glob-tool/parsers
 */

import * as Schemas from "./schemas";
import type {
	GlobConfig,
	GlobFixtureData,
	GlobToolProps,
	GlobToolResult,
	GlobToolUse,
} from "./types";
import { validateGlobToolData } from "./validators";

/**
 * Parses raw glob tool data into normalized component props.
 * Validates output using Zod schemas.
 * @param fixtureData - Raw data from tool usage
 * @param config - Optional configuration object
 * @returns Validated and normalized component props
 * @throws If data is invalid
 *
 * @example
 * ```typescript
 * const props = parseGlobTool(toolData);
 * ```
 */
export function parseGlobTool(
	fixtureData: GlobFixtureData,
	config: GlobConfig = {},
): GlobToolProps {
	// Validate input data (TypeScript-based)
	const validation = validateGlobToolData(fixtureData);
	if (!validation.isValid) {
		throw new Error(`Invalid fixture data: ${validation.errors.join(", ")}`);
	}

	if (config.debug && validation.warnings.length > 0) {
		console.warn("Glob tool warnings:", validation.warnings);
	}

	// Extract tool use information
	const toolUse: GlobToolUse = {
		type: fixtureData.toolCall.tool.type,
		id: fixtureData.toolCall.tool.id,
		name: fixtureData.toolCall.tool.name,
		input: {
			pattern: fixtureData.toolCall.tool.input.pattern,
			path: fixtureData.toolCall.tool.input.path,
		},
	};

	// Extract tool result information
	const rawResult = fixtureData.toolResult.toolUseResult;
	let toolResult: GlobToolResult;

	if (typeof rawResult === "string") {
		// Handle case where toolUseResult is a string (error message)
		const isActualError = fixtureData.toolResult.result.is_error || false;
		toolResult = {
			matches: [],
			matchCount: 0,
			isError: isActualError,
			errorMessage: isActualError ? rawResult : undefined,
		};
	} else if (rawResult === null || rawResult === undefined) {
		// Handle null/undefined result
		toolResult = {
			matches: [],
			matchCount: 0,
			isError: true,
			errorMessage: "No result returned",
		};
	} else {
		// Handle structured result
		const result = rawResult;
		if (Array.isArray(result)) {
			// Result is an array of matches
			toolResult = {
				matches: result,
				matchCount: result.length,
				isError: false,
			};
		} else if (typeof result === "object" && result !== null) {
			// Result is an object with matches property
			toolResult = {
				matches: result.matches || [],
				matchCount: result.matchCount || (result.matches ? result.matches.length : 0),
				isError: result.isError || fixtureData.toolResult.result.is_error || false,
				errorMessage: result.errorMessage,
			};
		} else {
			// Unexpected format
			toolResult = {
				matches: [],
				matchCount: 0,
				isError: true,
				errorMessage: "Unexpected result format",
			};
		}
	}

	// Determine status based on error state
	const status = toolResult.isError ? "failed" : "completed";

	// Use provided timestamp or current time
	const timestamp = config.preserveTimestamps
		? fixtureData.expectedComponentData.props.timestamp
		: new Date().toISOString();

	// Create the props object
	const props: GlobToolProps = {
		toolUse,
		status,
		timestamp,
		toolResult,
	};

	// Validate output using Zod
	const validatedProps = Schemas.GlobToolProps.parse(props);
	return validatedProps;
}

/**
 * Processes multiple glob tool data in batch.
 * @param fixtures - Array of tool data to process
 * @param config - Optional configuration object
 * @returns Array of validated component props
 * @throws If any data processing fails
 *
 * @example
 * ```typescript
 * const allProps = processGlobTools(toolDataArray);
 * ```
 */
export function processGlobTools(
	fixtures: GlobFixtureData[],
	config: GlobConfig = {},
): GlobToolProps[] {
	return fixtures.map((fixture, index) => {
		try {
			return parseGlobTool(fixture, config);
		} catch (error) {
			if (config.debug) {
				console.error(`Failed to process fixture ${index}:`, error);
			}
			throw error;
		}
	});
}

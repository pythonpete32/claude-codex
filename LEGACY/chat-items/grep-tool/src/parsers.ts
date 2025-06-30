/**
 * Parser functions for grep-tool
 * @packageDocumentation
 * @module @dao/codex-chat-item-grep-tool/parsers
 */

import * as Schemas from "./schemas";
import type {
	GrepConfig,
	GrepFixtureData,
	GrepToolProps,
	GrepToolResult,
	GrepToolUse,
} from "./types";
import { validateGrepToolData } from "./validators";

/**
 * Parses raw grep tool data into normalized component props.
 * Validates output using Zod schemas.
 * @param fixtureData - Raw data from tool usage
 * @param config - Optional configuration object
 * @returns Validated and normalized component props
 * @throws If data is invalid
 *
 * @example
 * ```typescript
 * const props = parseGrepTool(toolData);
 * ```
 */
export function parseGrepTool(
	fixtureData: GrepFixtureData,
	config: GrepConfig = {},
): GrepToolProps {
	// Validate input data (TypeScript-based)
	const validation = validateGrepToolData(fixtureData);
	if (!validation.isValid) {
		throw new Error(`Invalid fixture data: ${validation.errors.join(", ")}`);
	}

	if (config.debug && validation.warnings.length > 0) {
		console.warn("Grep tool warnings:", validation.warnings);
	}

	// Extract tool use information
	const toolUse: GrepToolUse = {
		type: fixtureData.toolCall.tool.type,
		id: fixtureData.toolCall.tool.id,
		name: fixtureData.toolCall.tool.name,
		input: {
			pattern: fixtureData.toolCall.tool.input.pattern,
			include: fixtureData.toolCall.tool.input.include,
			path: fixtureData.toolCall.tool.input.path,
		},
	};

	// Extract tool result information
	const rawResult = fixtureData.toolResult.toolUseResult;
	let toolResult: GrepToolResult;

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
	const props: GrepToolProps = {
		toolUse,
		status,
		timestamp,
		toolResult,
	};

	// Validate output using Zod
	const validatedProps = Schemas.GrepToolProps.parse(props);
	return validatedProps;
}

/**
 * Processes multiple grep tool data in batch.
 * @param fixtures - Array of tool data to process
 * @param config - Optional configuration object
 * @returns Array of validated component props
 * @throws If any data processing fails
 *
 * @example
 * ```typescript
 * const allProps = processGrepTools(toolDataArray);
 * ```
 */
export function processGrepTools(
	fixtures: GrepFixtureData[],
	config: GrepConfig = {},
): GrepToolProps[] {
	return fixtures.map((fixture, index) => {
		try {
			return parseGrepTool(fixture, config);
		} catch (error) {
			if (config.debug) {
				console.error(`Failed to process fixture ${index}:`, error);
			}
			throw error;
		}
	});
}

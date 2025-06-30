/**
 * Parser functions for bash-tool
 * @packageDocumentation
 * @module @dao/codex-chat-item-bash-tool/parsers
 */

import * as Schemas from "./schemas";
import type {
	BashConfig,
	BashFixtureData,
	BashToolProps,
	BashToolResult,
	BashToolUse,
} from "./types";
import { validateBashToolData } from "./validators";

/**
 * Parses raw bash tool data into normalized component props.
 * Validates output using Zod schemas.
 * @param fixtureData - Raw data from tool usage
 * @param config - Optional configuration object
 * @returns Validated and normalized component props
 * @throws If data is invalid
 *
 * @example
 * ```typescript
 * const props = parseBashTool(toolData);
 * ```
 */
export function parseBashTool(
	fixtureData: BashFixtureData,
	config: BashConfig = {},
): BashToolProps {
	// Validate input data (TypeScript-based)
	const validation = validateBashToolData(fixtureData);
	if (!validation.isValid) {
		throw new Error(`Invalid fixture data: ${validation.errors.join(", ")}`);
	}

	if (config.debug && validation.warnings.length > 0) {
		console.warn("Bash tool warnings:", validation.warnings);
	}

	// Extract tool use information
	const toolUse: BashToolUse = {
		type: fixtureData.toolCall.tool.type,
		id: fixtureData.toolCall.tool.id,
		name: fixtureData.toolCall.tool.name,
		input: {
			command: fixtureData.toolCall.tool.input.command,
			description: fixtureData.toolCall.tool.input.description || "",
		},
	};

	// Extract tool result information
	const rawResult = fixtureData.toolResult.toolUseResult;
	let toolResult: BashToolResult;

	if (typeof rawResult === "string") {
		// Handle case where toolUseResult is a string (could be success or error)
		// Check the is_error flag from the result to determine if it's actually an error
		const isActualError = fixtureData.toolResult.result.is_error || false;
		toolResult = {
			stdout: isActualError ? "" : rawResult, // Success output goes to stdout
			stderr: isActualError ? rawResult : "", // Error output goes to stderr
			interrupted: false,
			isImage: false,
			isError: isActualError,
		};
	} else {
		toolResult = {
			stdout: rawResult.stdout || "",
			stderr: rawResult.stderr || "",
			interrupted: rawResult.interrupted || false,
			isImage: rawResult.isImage || false,
			isError: rawResult.isError || fixtureData.toolResult.result.is_error || false,
		};
	}

	// Determine status based on error state
	const status = toolResult.isError ? "failed" : "completed";

	// Use provided timestamp or current time
	const timestamp = config.preserveTimestamps
		? fixtureData.expectedComponentData.props.timestamp
		: new Date().toISOString();

	// Create the props object
	const props: BashToolProps = {
		toolUse,
		status,
		timestamp,
		toolResult,
	};

	// Validate output using Zod
	const validatedProps = Schemas.BashToolProps.parse(props);
	return validatedProps;
}

/**
 * Processes multiple bash tool data in batch.
 * @param fixtures - Array of tool data to process
 * @param config - Optional configuration object
 * @returns Array of validated component props
 * @throws If any data processing fails
 *
 * @example
 * ```typescript
 * const allProps = processBashTools(toolDataArray);
 * ```
 */
export function processBashTools(
	fixtures: BashFixtureData[],
	config: BashConfig = {},
): BashToolProps[] {
	return fixtures.map((fixture, index) => {
		try {
			return parseBashTool(fixture, config);
		} catch (error) {
			if (config.debug) {
				console.error(`Failed to process fixture ${index}:`, error);
			}
			throw error;
		}
	});
}

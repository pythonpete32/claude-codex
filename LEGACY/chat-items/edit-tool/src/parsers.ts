/**
 * Parser functions for edit-tool
 * @packageDocumentation
 * @module @dao/codex-chat-item-edit-tool/parsers
 */

import * as Schemas from "./schemas";
import type {
	EditConfig,
	EditFixtureData,
	EditToolProps,
	EditToolResult,
	EditToolUse,
} from "./types";
import { validateEditToolData } from "./validators";

/**
 * Parses raw edit tool data into normalized component props.
 * Validates output using Zod schemas.
 * @param fixtureData - Raw data from tool usage
 * @param config - Optional configuration object
 * @returns Validated and normalized component props
 * @throws If data is invalid
 *
 * @example
 * ```typescript
 * const props = parseEditTool(toolData);
 * ```
 */
export function parseEditTool(
	fixtureData: EditFixtureData,
	config: EditConfig = {},
): EditToolProps {
	// Validate input data (TypeScript-based)
	const validation = validateEditToolData(fixtureData);
	if (!validation.isValid) {
		throw new Error(`Invalid fixture data: ${validation.errors.join(", ")}`);
	}

	if (config.debug && validation.warnings.length > 0) {
		console.warn("Edit tool warnings:", validation.warnings);
	}

	// Extract tool use information
	const toolUse: EditToolUse = {
		type: fixtureData.toolCall.tool.type,
		id: fixtureData.toolCall.tool.id,
		name: fixtureData.toolCall.tool.name,
		input: {
			file_path: fixtureData.toolCall.tool.input.file_path,
			old_string: fixtureData.toolCall.tool.input.old_string,
			new_string: fixtureData.toolCall.tool.input.new_string,
			replace_all: fixtureData.toolCall.tool.input.replace_all,
		},
	};

	// Extract tool result information
	const rawResult = fixtureData.toolResult.toolUseResult;
	let toolResult: EditToolResult;

	if (typeof rawResult === "string") {
		// Handle case where toolUseResult is a string (error case)
		const isActualError = fixtureData.toolResult.result.is_error || false;
		toolResult = {
			isError: isActualError,
			errorMessage: isActualError ? rawResult : undefined,
			stdout: isActualError ? "" : rawResult,
			stderr: isActualError ? rawResult : "",
		};
	} else if (rawResult && typeof rawResult === "object") {
		// Handle normal result object
		toolResult = {
			filePath: rawResult.filePath,
			oldString: rawResult.oldString,
			newString: rawResult.newString,
			originalFile: rawResult.originalFile,
			structuredPatch: rawResult.structuredPatch,
			isError: rawResult.isError || fixtureData.toolResult.result.is_error || false,
			errorMessage: rawResult.errorMessage,
			userModified: rawResult.userModified,
			replaceAll: rawResult.replaceAll,
			stdout: rawResult.stdout,
			stderr: rawResult.stderr,
			interrupted: rawResult.interrupted,
			isImage: rawResult.isImage,
		};
	} else {
		// Handle empty or null result
		toolResult = {
			isError: true,
			errorMessage: "No result data available",
		};
	}

	// Determine status based on error state
	const status = toolResult.isError ? "failed" : "completed";

	// Use provided timestamp or current time
	const timestamp = config.preserveTimestamps
		? fixtureData.expectedComponentData.props.timestamp
		: new Date().toISOString();

	// Create the props object
	const props: EditToolProps = {
		toolUse,
		status,
		timestamp,
		toolResult,
	};

	// Validate output using Zod
	const validatedProps = Schemas.EditToolProps.parse(props);
	return validatedProps;
}

/**
 * Processes multiple edit tool data in batch.
 * @param fixtures - Array of tool data to process
 * @param config - Optional configuration object
 * @returns Array of validated component props
 * @throws If any data processing fails
 *
 * @example
 * ```typescript
 * const allProps = processEditTools(toolDataArray);
 * ```
 */
export function processEditTools(
	fixtures: EditFixtureData[],
	config: EditConfig = {},
): EditToolProps[] {
	return fixtures.map((fixture, index) => {
		try {
			return parseEditTool(fixture, config);
		} catch (error) {
			if (config.debug) {
				console.error(`Failed to process fixture ${index}:`, error);
			}
			throw error;
		}
	});
}

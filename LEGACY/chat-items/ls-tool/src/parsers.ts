/**
 * Parser functions for ls-tool
 * @packageDocumentation
 * @module @dao/codex-chat-item-ls-tool/parsers
 */

import * as Schemas from "./schemas";
import type {
	LsConfig,
	LsFileInfo,
	LsFixtureData,
	LsToolProps,
	LsToolResult,
	LsToolStatus,
	LsToolUse,
} from "./types";
import { validateLsToolData } from "./validators";

/**
 * Parses raw ls tool data into normalized component props.
 * Validates output using Zod schemas.
 * @param fixtureData - Raw data from tool usage
 * @param config - Optional configuration object
 * @returns Validated and normalized component props
 * @throws If data is invalid
 *
 * @example
 * ```typescript
 * const props = parseLsTool(toolData);
 * ```
 */
export function parseLsTool(fixtureData: LsFixtureData, config: LsConfig = {}): LsToolProps {
	// Validate input data (TypeScript-based)
	const validation = validateLsToolData(fixtureData);
	if (!validation.isValid) {
		throw new Error(`Invalid fixture data: ${validation.errors.join(", ")}`);
	}

	if (config.debug && validation.warnings.length > 0) {
		console.warn("LS tool warnings:", validation.warnings);
	}

	// Extract tool use information
	const toolUse: LsToolUse = {
		type: fixtureData.toolCall.tool.type,
		id: fixtureData.toolCall.tool.id,
		name: fixtureData.toolCall.tool.name,
		input: {
			path: fixtureData.toolCall.tool.input.path,
			ignore: fixtureData.toolCall.tool.input.ignore,
		},
	};

	// Extract tool result information
	const rawResult = fixtureData.toolResult.toolUseResult;
	let toolResult: LsToolResult;

	if (typeof rawResult === "string") {
		// Handle case where toolUseResult is a string (error message)
		const isActualError = fixtureData.toolResult.result.is_error || false;
		toolResult = {
			entries: [],
			entryCount: 0,
			path: fixtureData.toolCall.tool.input.path,
			isError: isActualError,
			errorMessage: isActualError ? rawResult : undefined,
		};
	} else if (rawResult === null || rawResult === undefined) {
		// Handle null/undefined result
		toolResult = {
			entries: [],
			entryCount: 0,
			path: fixtureData.toolCall.tool.input.path,
			isError: true,
			errorMessage: "No result returned",
		};
	} else {
		// Handle structured result
		const result = rawResult;
		if (Array.isArray(result)) {
			// Result is an array of entries (legacy format)
			const entries: LsFileInfo[] = result.map((item) => {
				if (typeof item === "string") {
					// Simple string format - just file names
					return {
						name: item,
						type: "file" as const, // Default to file
						hidden: item.startsWith("."),
					};
				} else if (typeof item === "object" && item !== null) {
					// Object format with more details
					return {
						name: item.name || "unknown",
						type: item.type || "file",
						size: item.size,
						hidden: item.hidden !== undefined ? item.hidden : item.name?.startsWith("."),
						permissions: item.permissions,
						lastModified: item.lastModified,
					};
				} else {
					// Fallback
					return {
						name: String(item),
						type: "file" as const,
						hidden: false,
					};
				}
			});
			toolResult = {
				entries,
				entryCount: entries.length,
				path: fixtureData.toolCall.tool.input.path,
				isError: false,
			};
		} else if (typeof result === "object" && result !== null) {
			// Result is an object with entries property
			const entries = result.entries || [];
			toolResult = {
				entries: entries.map((entry: unknown) => {
					const e = entry as Record<string, unknown>;
					return {
						name: (e.name as string) || "unknown",
						type: (e.type as LsFileInfo["type"]) || "file",
						size: e.size as number | undefined,
						hidden:
							e.hidden !== undefined ? (e.hidden as boolean) : (e.name as string)?.startsWith("."),
						permissions: e.permissions as string | undefined,
						lastModified: e.lastModified as string | undefined,
					};
				}),
				entryCount: result.entryCount || entries.length,
				path: result.path || fixtureData.toolCall.tool.input.path,
				isError: result.isError || fixtureData.toolResult.result.is_error || false,
				errorMessage: result.errorMessage,
			};
		} else {
			// Unexpected format
			toolResult = {
				entries: [],
				entryCount: 0,
				path: fixtureData.toolCall.tool.input.path,
				isError: true,
				errorMessage: "Unexpected result format",
			};
		}
	}

	// Determine status based on error state
	const status: LsToolStatus = toolResult.isError ? "failed" : "completed";

	// Use provided timestamp or current time
	const timestamp = config.preserveTimestamps
		? fixtureData.expectedComponentData.props.timestamp
		: new Date().toISOString();

	// Create the props object
	const props: LsToolProps = {
		toolUse,
		status,
		timestamp,
		toolResult,
	};

	// Validate output using Zod
	const validatedProps = Schemas.LsToolProps.parse(props);
	return validatedProps;
}

/**
 * Processes multiple ls tool data in batch.
 * @param fixtures - Array of tool data to process
 * @param config - Optional configuration object
 * @returns Array of validated component props
 * @throws If any data processing fails
 *
 * @example
 * ```typescript
 * const allProps = processLsTools(toolDataArray);
 * ```
 */
export function processLsTools(fixtures: LsFixtureData[], config: LsConfig = {}): LsToolProps[] {
	return fixtures.map((fixture, index) => {
		try {
			return parseLsTool(fixture, config);
		} catch (error) {
			if (config.debug) {
				console.error(`Failed to process fixture ${index}:`, error);
			}
			throw error;
		}
	});
}

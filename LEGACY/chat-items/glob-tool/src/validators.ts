/**
 * Validation functions for glob-tool
 * @packageDocumentation
 * @module @dao/codex-chat-item-glob-tool/validators
 */

import type { GlobFixtureData, ValidationResult } from "./types";

/**
 * Validates glob tool fixture data against expected schema using TypeScript.
 * @param data - Data to validate
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const result = validateGlobToolData(data);
 * if (!result.isValid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateGlobToolData(data: unknown): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (!data || typeof data !== "object") {
		errors.push("Data must be a valid object");
		return { isValid: false, errors, warnings };
	}

	const fixture = data as Partial<GlobFixtureData>;

	// Validate toolCall structure
	if (!fixture.toolCall) {
		errors.push("Missing required field: toolCall");
	} else {
		if (!fixture.toolCall.tool) {
			errors.push("Missing required field: toolCall.tool");
		} else {
			const tool = fixture.toolCall.tool;

			// Validate tool type
			if (tool.type && tool.type !== "tool_use") {
				errors.push(`Invalid tool type: expected "tool_use", got "${tool.type}"`);
			}

			// Validate tool name
			if (tool.name && tool.name !== "Glob") {
				errors.push(`Expected tool name "Glob", got "${tool.name}"`);
			}

			// Validate input structure
			if (!tool.input || typeof tool.input !== "object") {
				errors.push("Missing or invalid toolCall.tool.input");
			} else {
				// pattern is required (but can be empty string)
				if (tool.input.pattern === undefined) {
					errors.push("Missing required field: toolCall.tool.input.pattern");
				}
				// Optional field validation
				if (tool.input.path !== undefined && typeof tool.input.path !== "string") {
					errors.push("toolCall.tool.input.path must be a string");
				}
			}
		}
	}

	// Validate toolResult structure
	if (!fixture.toolResult) {
		errors.push("Missing required field: toolResult");
	} else {
		// toolUseResult can be null (indicating no result), but not undefined
		if (fixture.toolResult.toolUseResult === undefined) {
			errors.push("Missing required field: toolResult.toolUseResult");
		} else if (fixture.toolResult.toolUseResult !== null) {
			const result = fixture.toolResult.toolUseResult;
			if (typeof result === "object" && result !== null && !Array.isArray(result)) {
				// Validate the properties of the result object
				if ("matches" in result && !Array.isArray(result.matches)) {
					errors.push("toolResult.matches must be an array");
				}
				if ("matchCount" in result && typeof result.matchCount !== "number") {
					errors.push("toolResult.matchCount must be a number");
				}
				if ("isError" in result && typeof result.isError !== "boolean") {
					errors.push("toolResult.isError must be a boolean");
				}
				if (
					"errorMessage" in result &&
					result.errorMessage !== undefined &&
					typeof result.errorMessage !== "string"
				) {
					errors.push("toolResult.errorMessage must be a string when present");
				}
			}
		}
	}

	// Validate expectedComponentData
	if (!fixture.expectedComponentData) {
		errors.push("Missing required field: expectedComponentData");
	} else {
		if (fixture.expectedComponentData.type !== "glob_tool") {
			errors.push(
				`Expected component type "glob_tool", got "${fixture.expectedComponentData.type}"`,
			);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

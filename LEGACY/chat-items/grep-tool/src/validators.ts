/**
 * Validation functions for grep-tool
 * @packageDocumentation
 * @module @dao/codex-chat-item-grep-tool/validators
 */

import type { GrepFixtureData, ValidationResult } from "./types";

/**
 * Validates grep tool fixture data against expected schema using TypeScript.
 * @param data - Data to validate
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const result = validateGrepToolData(data);
 * if (!result.isValid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateGrepToolData(data: unknown): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (!data || typeof data !== "object") {
		errors.push("Data must be a valid object");
		return { isValid: false, errors, warnings };
	}

	const fixture = data as Partial<GrepFixtureData>;

	// Validate toolCall structure
	if (!fixture.toolCall) {
		errors.push("Missing required field: toolCall");
	} else {
		if (!fixture.toolCall.tool) {
			errors.push("Missing required field: toolCall.tool");
		} else {
			const tool = fixture.toolCall.tool;
			if (tool.name !== "Grep") {
				errors.push(`Expected tool name "Grep", got "${tool.name}"`);
			}
			if (!tool.input?.pattern) {
				errors.push("Missing required field: toolCall.tool.input.pattern");
			}
			// Optional fields
			if (tool.input?.include !== undefined && typeof tool.input.include !== "string") {
				errors.push("toolCall.tool.input.include must be a string");
			}
			if (tool.input?.path !== undefined && typeof tool.input.path !== "string") {
				errors.push("toolCall.tool.input.path must be a string");
			}
		}
	}

	// Validate toolResult structure
	if (!fixture.toolResult) {
		errors.push("Missing required field: toolResult");
	} else {
		if (
			fixture.toolResult.toolUseResult === undefined ||
			fixture.toolResult.toolUseResult === null
		) {
			errors.push("Missing required field: toolResult.toolUseResult");
		} else {
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
		if (fixture.expectedComponentData.type !== "grep_tool") {
			errors.push(
				`Expected component type "grep_tool", got "${fixture.expectedComponentData.type}"`,
			);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

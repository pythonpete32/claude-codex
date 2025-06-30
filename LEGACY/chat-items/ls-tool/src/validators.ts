/**
 * Validation functions for ls-tool
 * @packageDocumentation
 * @module @dao/codex-chat-item-ls-tool/validators
 */

import type { LsFixtureData, ValidationResult } from "./types";

/**
 * Validates ls tool fixture data against expected schema using TypeScript.
 * @param data - Data to validate
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const result = validateLsToolData(data);
 * if (!result.isValid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateLsToolData(data: unknown): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (!data || typeof data !== "object") {
		errors.push("Data must be a valid object");
		return { isValid: false, errors, warnings };
	}

	const fixture = data as Partial<LsFixtureData>;

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
			if (tool.name && tool.name !== "LS") {
				errors.push(`Expected tool name "LS", got "${tool.name}"`);
			}

			// Validate input structure
			if (!tool.input || typeof tool.input !== "object") {
				errors.push("Missing or invalid toolCall.tool.input");
			} else {
				// path is required
				if (tool.input.path === undefined) {
					errors.push("Missing required field: toolCall.tool.input.path");
				} else if (typeof tool.input.path !== "string") {
					errors.push("toolCall.tool.input.path must be a string");
				}
				// Optional field validation
				if (tool.input.ignore !== undefined) {
					if (!Array.isArray(tool.input.ignore)) {
						errors.push("toolCall.tool.input.ignore must be an array");
					} else {
						tool.input.ignore.forEach((item, index) => {
							if (typeof item !== "string") {
								errors.push(`toolCall.tool.input.ignore[${index}] must be a string`);
							}
						});
					}
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
				if ("entries" in result) {
					if (!Array.isArray(result.entries)) {
						errors.push("toolResult.entries must be an array");
					} else {
						result.entries.forEach((entry: unknown, index: number) => {
							if (!entry || typeof entry !== "object") {
								errors.push(`toolResult.entries[${index}] must be an object`);
							} else {
								const e = entry as Record<string, unknown>;
								if (!e.name || typeof e.name !== "string") {
									errors.push(`toolResult.entries[${index}].name must be a string`);
								}
								if (
									!e.type ||
									!["file", "directory", "symlink", "other"].includes(e.type as string)
								) {
									errors.push(
										`toolResult.entries[${index}].type must be one of: file, directory, symlink, other`,
									);
								}
								if (e.size !== undefined && typeof e.size !== "number") {
									errors.push(`toolResult.entries[${index}].size must be a number`);
								}
								if (typeof e.hidden !== "boolean") {
									errors.push(`toolResult.entries[${index}].hidden must be a boolean`);
								}
							}
						});
					}
				}
				if ("entryCount" in result && typeof result.entryCount !== "number") {
					errors.push("toolResult.entryCount must be a number");
				}
				if ("path" in result && typeof result.path !== "string") {
					errors.push("toolResult.path must be a string");
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
		if (fixture.expectedComponentData.type !== "ls_tool") {
			errors.push(`Expected component type "ls_tool", got "${fixture.expectedComponentData.type}"`);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

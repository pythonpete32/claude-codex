/**
 * Validation functions for edit-tool
 * @packageDocumentation
 * @module @dao/codex-chat-item-edit-tool/validators
 */

import type { EditFixtureData, ValidationResult } from "./types";

/**
 * Validates edit tool fixture data against expected schema using TypeScript.
 * @param data - Data to validate
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const result = validateEditToolData(data);
 * if (!result.isValid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateEditToolData(data: unknown): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (!data || typeof data !== "object") {
		errors.push("Data must be a valid object");
		return { isValid: false, errors, warnings };
	}

	const fixture = data as Partial<EditFixtureData>;

	// Validate toolCall structure
	if (!fixture.toolCall) {
		errors.push("Missing required field: toolCall");
	} else {
		if (!fixture.toolCall.tool) {
			errors.push("Missing required field: toolCall.tool");
		} else {
			const tool = fixture.toolCall.tool;
			if (tool.name !== "Edit") {
				errors.push(`Expected tool name "Edit", got "${tool.name}"`);
			}
			if (!tool.input?.file_path) {
				errors.push("Missing required field: toolCall.tool.input.file_path");
			}
			if (!tool.input?.old_string) {
				errors.push("Missing required field: toolCall.tool.input.old_string");
			}
			if (!tool.input?.new_string) {
				errors.push("Missing required field: toolCall.tool.input.new_string");
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
		}
	}

	// Validate expectedComponentData
	if (!fixture.expectedComponentData) {
		errors.push("Missing required field: expectedComponentData");
	} else {
		// Accept both "edit_tool" and "file_tool" as valid types
		if (
			fixture.expectedComponentData.type !== "edit_tool" &&
			fixture.expectedComponentData.type !== "file_tool"
		) {
			errors.push(
				`Expected component type "edit_tool" or "file_tool", got "${fixture.expectedComponentData.type}"`,
			);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

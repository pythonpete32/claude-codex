/**
 * Validation functions for bash-tool
 * @packageDocumentation
 * @module @dao/codex-chat-item-bash-tool/validators
 */

import type { BashFixtureData, ValidationResult } from "./types";

/**
 * Validates bash tool fixture data against expected schema using TypeScript.
 * @param data - Data to validate
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const result = validateBashToolData(data);
 * if (!result.isValid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateBashToolData(data: unknown): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (!data || typeof data !== "object") {
		errors.push("Data must be a valid object");
		return { isValid: false, errors, warnings };
	}

	const fixture = data as Partial<BashFixtureData>;

	// Validate toolCall structure
	if (!fixture.toolCall) {
		errors.push("Missing required field: toolCall");
	} else {
		if (!fixture.toolCall.tool) {
			errors.push("Missing required field: toolCall.tool");
		} else {
			const tool = fixture.toolCall.tool;
			if (tool.name !== "Bash") {
				errors.push(`Expected tool name "Bash", got "${tool.name}"`);
			}
			if (!tool.input?.command) {
				errors.push("Missing required field: toolCall.tool.input.command");
			}
			if (!tool.input?.description) {
				warnings.push("Missing description in tool input");
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
		if (fixture.expectedComponentData.type !== "bash_tool") {
			errors.push(
				`Expected component type "bash_tool", got "${fixture.expectedComponentData.type}"`,
			);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

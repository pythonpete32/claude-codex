/**
 * @fileoverview Parser functions for transforming multiedit tool data
 * @module @dao/chat-items-multiedit-tool/parsers
 */

import type {
	EditResult,
	MultiEditOperation,
	MultiEditToolChatItem,
	MultiEditToolComponentProps,
	MultiEditToolResultData,
} from "./types";
import { isMultiEditToolChatItem } from "./types";

/**
 * Parses a chat item into multiedit tool component props
 */
export function parseMultiEditToolChatItem(
	item: unknown,
	options?: {
		className?: string;
		onRetry?: () => void;
	},
): MultiEditToolComponentProps | null {
	if (!isMultiEditToolChatItem(item)) {
		return null;
	}

	return {
		item: item as MultiEditToolChatItem,
		className: options?.className,
		onRetry: options?.onRetry,
	};
}

/**
 * Parses raw tool result output into structured format
 */
export function parseMultiEditToolOutput(output: unknown): MultiEditToolResultData | string {
	// Handle string errors
	if (typeof output === "string") {
		return output;
	}

	// Handle structured results
	if (
		typeof output === "object" &&
		output !== null &&
		"message" in output &&
		"edits_applied" in output &&
		"total_edits" in output &&
		"all_successful" in output
	) {
		const result = output as Record<string, unknown>;
		return {
			message: result.message as string,
			edits_applied: result.edits_applied as number,
			total_edits: result.total_edits as number,
			all_successful: result.all_successful as boolean,
			edit_details: Array.isArray(result.edit_details)
				? (result.edit_details as EditResult[])
				: undefined,
		};
	}

	// Fallback for unexpected formats
	return String(output);
}

/**
 * Formats file path for display
 */
export function formatFilePath(filePath: string): string {
	// Handle home directory
	if (filePath.startsWith("~/")) {
		return filePath;
	}

	// Truncate very long paths
	if (filePath.length > 80) {
		const parts = filePath.split("/");
		if (parts.length > 4) {
			return `${parts[0]}/${parts[1]}/.../${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
		}
	}

	return filePath;
}

/**
 * Extracts error message from tool output
 */
export function extractErrorMessage(output: unknown): string | null {
	if (typeof output === "string") {
		return output;
	}

	if (
		typeof output === "object" &&
		output !== null &&
		"error" in output &&
		typeof (output as Record<string, unknown>).error === "string"
	) {
		return (output as Record<string, unknown>).error as string;
	}

	return null;
}

/**
 * Determines if the multiedit operation was successful
 */
export function isSuccessfulMultiEdit(item: MultiEditToolChatItem): boolean {
	if (item.toolResult.status !== "completed") {
		return false;
	}

	if (typeof item.toolResult.output === "string") {
		return false;
	}

	return item.toolResult.output.all_successful;
}

/**
 * Gets the success rate of edit operations
 */
export function getEditSuccessRate(result: MultiEditToolResultData | string): number | null {
	if (typeof result === "string") {
		return null;
	}

	if (result.total_edits === 0) {
		return 100;
	}

	return (result.edits_applied / result.total_edits) * 100;
}

/**
 * Formats edit operations summary for display
 */
export function formatEditsSummary(input: MultiEditOperation[]): string {
	const editCount = input.length;
	const replaceAllCount = input.filter((edit) => edit.replace_all).length;

	const parts: string[] = [`${editCount} edit${editCount === 1 ? "" : "s"}`];

	if (replaceAllCount > 0) {
		parts.push(`${replaceAllCount} replace-all`);
	}

	return parts.join(", ");
}

/**
 * Formats individual edit operation for display
 */
export function formatEditOperation(operation: MultiEditOperation): string {
	const oldStr =
		operation.old_string.length > 50
			? `${operation.old_string.substring(0, 47)}...`
			: operation.old_string;

	const newStr =
		operation.new_string.length > 50
			? `${operation.new_string.substring(0, 47)}...`
			: operation.new_string;

	const replaceAllSuffix = operation.replace_all ? " (all)" : "";

	return `"${oldStr}" → "${newStr}"${replaceAllSuffix}`;
}

/**
 * Gets failed edit operations from result
 */
export function getFailedEdits(result: MultiEditToolResultData): EditResult[] {
	if (!result.edit_details) {
		return [];
	}

	return result.edit_details.filter((edit) => !edit.success);
}

/**
 * Gets successful edit operations from result
 */
export function getSuccessfulEdits(result: MultiEditToolResultData): EditResult[] {
	if (!result.edit_details) {
		return [];
	}

	return result.edit_details.filter((edit) => edit.success);
}

/**
 * Calculates total replacements made across all edits
 */
export function getTotalReplacements(result: MultiEditToolResultData): number {
	if (!result.edit_details) {
		return 0;
	}

	return result.edit_details.reduce((total, edit) => {
		return total + (edit.replacements_made || 0);
	}, 0);
}

/**
 * Formats multiedit parameters for display
 */
export function formatMultiEditParameters(
	input: MultiEditToolComponentProps["item"]["toolUse"]["input"],
): string {
	const parts: string[] = [formatFilePath(input.file_path)];
	parts.push(formatEditsSummary(input.edits));

	return parts.join(", ");
}

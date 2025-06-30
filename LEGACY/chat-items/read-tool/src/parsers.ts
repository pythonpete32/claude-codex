/**
 * @fileoverview Parser functions for transforming read tool data
 * @module @dao/chat-items-read-tool/parsers
 */

import type { ReadToolChatItem, ReadToolComponentProps, ReadToolResultData } from "./types";
import { isReadToolChatItem } from "./types";

/**
 * Parses a chat item into read tool component props
 */
export function parseReadToolChatItem(
	item: unknown,
	options?: {
		className?: string;
		onRetry?: () => void;
	},
): ReadToolComponentProps | null {
	if (!isReadToolChatItem(item)) {
		return null;
	}

	return {
		item: item as ReadToolChatItem,
		className: options?.className,
		onRetry: options?.onRetry,
	};
}

/**
 * Parses raw tool result output into structured format
 */
export function parseReadToolOutput(output: unknown): ReadToolResultData | string {
	// Handle string errors
	if (typeof output === "string") {
		return output;
	}

	// Handle structured results
	if (
		typeof output === "object" &&
		output !== null &&
		"content" in output &&
		typeof (output as Record<string, unknown>).content === "string"
	) {
		const result = output as Record<string, unknown>;
		return {
			content: result.content as string,
			totalLines: typeof result.totalLines === "number" ? result.totalLines : undefined,
			truncated: typeof result.truncated === "boolean" ? result.truncated : undefined,
			linesRead: typeof result.linesRead === "number" ? result.linesRead : undefined,
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
 * Determines if the read operation was successful
 */
export function isSuccessfulRead(item: ReadToolChatItem): boolean {
	return item.toolResult.status === "completed" && typeof item.toolResult.output !== "string";
}

/**
 * Gets line count from read result
 */
export function getLineCount(result: ReadToolResultData | string): number | null {
	if (typeof result === "string") {
		return null;
	}

	if (result.totalLines !== undefined) {
		return result.totalLines;
	}

	if (result.linesRead !== undefined) {
		return result.linesRead;
	}

	// Count lines in content
	return result.content.split("\n").length;
}

/**
 * Formats read parameters for display
 */
export function formatReadParameters(
	input: ReadToolComponentProps["item"]["toolUse"]["input"],
): string {
	const parts: string[] = [formatFilePath(input.file_path)];

	if (input.offset !== undefined) {
		parts.push(`offset: ${input.offset}`);
	}

	if (input.limit !== undefined) {
		parts.push(`limit: ${input.limit}`);
	}

	return parts.join(", ");
}

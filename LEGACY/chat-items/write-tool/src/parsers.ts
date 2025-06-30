/**
 * @fileoverview Parser functions for transforming write tool data
 * @module @dao/chat-items-write-tool/parsers
 */

import type {
	WriteToolChatItem,
	WriteToolComponentProps,
	WriteToolResultData,
	WriteToolUseInput,
} from "./types";
import { isWriteToolChatItem } from "./types";

/**
 * Parses a chat item into write tool component props
 */
export function parseWriteToolChatItem(
	item: unknown,
	options?: {
		className?: string;
		onRetry?: () => void;
	},
): WriteToolComponentProps | null {
	if (!isWriteToolChatItem(item)) {
		return null;
	}

	return {
		item: item as WriteToolChatItem,
		className: options?.className,
		onRetry: options?.onRetry,
	};
}

/**
 * Parses raw tool use result output into structured format
 */
export function parseWriteToolOutput(output: unknown): WriteToolResultData | string {
	// Handle string errors
	if (typeof output === "string") {
		return output;
	}

	// Handle structured results
	if (
		typeof output === "object" &&
		output !== null &&
		"type" in output &&
		"filePath" in output &&
		"content" in output &&
		"structuredPatch" in output
	) {
		const result = output as Record<string, unknown>;
		return {
			type: "create",
			filePath: result.filePath as string,
			content: result.content as string,
			structuredPatch: [],
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
 * Extracts error message from tool result
 */
export function extractErrorMessage(content: string): string | null {
	// Check if content indicates an error
	if (content.toLowerCase().includes("error:") || content.toLowerCase().includes("failed")) {
		return content;
	}

	return null;
}

/**
 * Determines if the write operation was successful
 */
export function isSuccessfulWrite(item: WriteToolChatItem): boolean {
	if (item.toolUseResult.status !== "completed") {
		return false;
	}

	if (typeof item.toolUseResult.output === "string") {
		return false;
	}

	// Check if file was created successfully
	return item.toolUseResult.output.type === "create";
}

/**
 * Gets the file extension from a file path
 */
export function getFileExtension(filePath: string): string {
	const lastDot = filePath.lastIndexOf(".");
	if (lastDot === -1 || lastDot === filePath.length - 1) {
		return "";
	}

	// Handle hidden files (files starting with dot)
	const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
	if (fileName.startsWith(".") && lastDot === filePath.lastIndexOf("/") + 1) {
		return "";
	}

	return filePath.substring(lastDot + 1).toLowerCase();
}

/**
 * Determines file type category for display
 */
export function getFileTypeCategory(filePath: string): string {
	const extension = getFileExtension(filePath);

	const categories: Record<string, string> = {
		// Code files
		ts: "TypeScript",
		js: "JavaScript",
		tsx: "React",
		jsx: "React",
		py: "Python",
		java: "Java",
		cpp: "C++",
		c: "C",
		rs: "Rust",
		go: "Go",
		php: "PHP",
		rb: "Ruby",
		swift: "Swift",
		kt: "Kotlin",

		// Web files
		html: "HTML",
		css: "CSS",
		scss: "SCSS",
		sass: "SASS",
		less: "LESS",

		// Config files
		json: "JSON",
		yaml: "YAML",
		yml: "YAML",
		toml: "TOML",
		xml: "XML",
		ini: "Config",
		conf: "Config",
		config: "Config",

		// Documentation
		md: "Markdown",
		txt: "Text",
		rst: "reStructuredText",

		// Data files
		csv: "CSV",
		sql: "SQL",

		// Shell scripts
		sh: "Shell",
		bash: "Bash",
		zsh: "Zsh",
		fish: "Fish",

		// Other
		dockerfile: "Docker",
		gitignore: "Git",
	};

	return categories[extension] || "File";
}

/**
 * Calculates content statistics
 */
export function getContentStats(content: string): {
	lines: number;
	characters: number;
	words: number;
	size: string;
} {
	const lines = content.split("\n").length;
	const characters = content.length;
	const words = content
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0).length;

	// Calculate human-readable size
	const bytes = new TextEncoder().encode(content).length;
	let size: string;
	if (bytes < 1024) {
		size = `${bytes} B`;
	} else if (bytes < 1024 * 1024) {
		size = `${(bytes / 1024).toFixed(1)} KB`;
	} else {
		size = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	return { lines, characters, words, size };
}

/**
 * Formats content preview for display (first few lines)
 */
export function formatContentPreview(content: string, maxLines: number = 3): string {
	const lines = content.split("\n");
	if (lines.length <= maxLines) {
		return content;
	}

	const preview = lines.slice(0, maxLines).join("\n");
	const remainingLines = lines.length - maxLines;
	return `${preview}\n... (${remainingLines} more line${remainingLines === 1 ? "" : "s"})`;
}

/**
 * Formats write parameters for display
 */
export function formatWriteParameters(input: WriteToolUseInput): string {
	const stats = getContentStats(input.content);
	const fileType = getFileTypeCategory(input.file_path);
	const formattedPath = formatFilePath(input.file_path);

	return `${formattedPath} (${fileType}, ${stats.lines} lines, ${stats.size})`;
}

/**
 * Gets success message from tool result
 */
export function getSuccessMessage(item: WriteToolChatItem): string | null {
	if (!isSuccessfulWrite(item)) {
		return null;
	}

	// Extract success message from tool result content
	if (item.toolResult.content.includes("successfully")) {
		return item.toolResult.content;
	}

	// Generate default success message
	if (typeof item.toolUseResult.output !== "string") {
		return `File created successfully at: ${item.toolUseResult.output.filePath}`;
	}

	return null;
}

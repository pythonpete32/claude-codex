/**
 * Zod validation schemas for ls-tool
 * @packageDocumentation
 * @module @dao/codex-chat-item-ls-tool/schemas
 */

import { z } from "zod";

/**
 * Schema for LsToolUseInput
 */
export const LsToolUseInput = z.object({
	path: z.string().describe("The absolute path to the directory to list"),
	ignore: z.array(z.string()).optional().describe("List of glob patterns to ignore"),
});

/**
 * Schema for LsToolUse
 */
export const LsToolUse = z.object({
	type: z.literal("tool_use"),
	id: z.string(),
	name: z.literal("LS"),
	input: LsToolUseInput,
});

/**
 * Schema for LsFileInfo
 */
export const LsFileInfo = z.object({
	name: z.string().describe("File or directory name"),
	type: z.enum(["file", "directory", "symlink", "other"]).describe("File type"),
	size: z.number().optional().describe("Size in bytes (for files)"),
	hidden: z.boolean().describe("Whether the item is hidden (starts with .)"),
	permissions: z.string().optional().describe("File permissions"),
	lastModified: z.string().optional().describe("Last modified time"),
});

/**
 * Schema for LsToolResult
 */
export const LsToolResult = z.object({
	entries: z.array(LsFileInfo).describe("Array of file/directory information"),
	entryCount: z.number().describe("Total number of entries found"),
	path: z.string().describe("Directory path that was listed"),
	isError: z.boolean().describe("Whether the operation resulted in an error"),
	errorMessage: z.string().optional().describe("Error message if the listing failed"),
});

/**
 * Schema for tool status
 */
export const LsToolStatus = z.enum(["completed", "failed"]);

/**
 * Schema for LsToolProps
 */
export const LsToolProps = z.object({
	toolUse: LsToolUse,
	status: LsToolStatus,
	timestamp: z.string(),
	toolResult: LsToolResult,
});

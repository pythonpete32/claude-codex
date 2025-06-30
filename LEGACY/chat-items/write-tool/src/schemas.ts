/**
 * @fileoverview Zod schemas for write-tool validation
 * @module @dao/chat-items-write-tool/schemas
 */

import { z } from "zod";

/**
 * Schema for write tool input parameters
 */
export const WriteToolUseInputSchema = z.object({
	file_path: z.string().min(1).describe("The absolute path where the file should be written"),
	content: z.string().describe("The content to write to the file"),
});

/**
 * Schema for write tool result data
 */
export const WriteToolResultDataSchema = z.object({
	type: z.literal("create").describe("Operation type (always 'create' for write operations)"),
	filePath: z.string().describe("Path where the file was created"),
	content: z.string().describe("The content that was written to the file"),
	structuredPatch: z.tuple([]).describe("Empty array for new file creation"),
});

/**
 * Schema for tool use structure
 */
export const WriteToolUseSchema = z.object({
	type: z.literal("tool_use"),
	id: z.string(),
	name: z.literal("Write"),
	input: WriteToolUseInputSchema,
});

/**
 * Schema for tool result structure
 */
export const WriteToolResultSchema = z.object({
	tool_use_id: z.string(),
	type: z.literal("tool_result"),
	content: z.string(),
});

/**
 * Schema for tool use result structure
 */
export const WriteToolUseResultSchema = z.object({
	output: z.union([WriteToolResultDataSchema, z.string()]),
	status: z.enum(["completed", "failed"]),
});

/**
 * Schema for complete write tool chat item
 */
export const WriteToolChatItemSchema = z.object({
	type: z.literal("tool_use"),
	toolUse: WriteToolUseSchema,
	toolResult: WriteToolResultSchema,
	toolUseResult: WriteToolUseResultSchema,
});

/**
 * Schema for component props
 */
export const WriteToolComponentPropsSchema = z.object({
	item: WriteToolChatItemSchema,
	className: z.string().optional(),
	onRetry: z.function().optional(),
});

/**
 * Export schema types
 */
export type WriteToolUseInputType = z.infer<typeof WriteToolUseInputSchema>;
export type WriteToolResultDataType = z.infer<typeof WriteToolResultDataSchema>;
export type WriteToolUseType = z.infer<typeof WriteToolUseSchema>;
export type WriteToolResultType = z.infer<typeof WriteToolResultSchema>;
export type WriteToolUseResultType = z.infer<typeof WriteToolUseResultSchema>;
export type WriteToolChatItemType = z.infer<typeof WriteToolChatItemSchema>;
export type WriteToolComponentPropsType = z.infer<typeof WriteToolComponentPropsSchema>;

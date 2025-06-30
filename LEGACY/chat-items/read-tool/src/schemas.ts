/**
 * @fileoverview Zod schemas for read-tool validation
 * @module @dao/chat-items-read-tool/schemas
 */

import { z } from "zod";

/**
 * Schema for read tool input parameters
 */
export const ReadToolUseInputSchema = z.object({
	file_path: z.string().min(1).describe("The absolute path to the file to read"),
	offset: z
		.number()
		.int()
		.nonnegative()
		.optional()
		.describe("Optional line offset to start reading from"),
	limit: z.number().int().positive().optional().describe("Optional number of lines to read"),
});

/**
 * Schema for successful read tool results
 */
export const ReadToolResultDataSchema = z.object({
	content: z.string().describe("The file content with line numbers"),
	totalLines: z
		.number()
		.int()
		.nonnegative()
		.optional()
		.describe("Total number of lines in the file"),
	truncated: z.boolean().optional().describe("Whether the file was truncated"),
	linesRead: z.number().int().nonnegative().optional().describe("The actual number of lines read"),
});

/**
 * Schema for tool use structure
 */
export const ReadToolUseSchema = z.object({
	type: z.literal("tool_use"),
	id: z.string(),
	name: z.literal("Read"),
	input: ReadToolUseInputSchema,
});

/**
 * Schema for tool result structure
 */
export const ReadToolResultSchema = z.object({
	output: z.union([ReadToolResultDataSchema, z.string()]),
	status: z.enum(["completed", "failed"]),
});

/**
 * Schema for complete read tool chat item
 */
export const ReadToolChatItemSchema = z.object({
	type: z.literal("tool_use"),
	toolUse: ReadToolUseSchema,
	toolResult: ReadToolResultSchema,
});

/**
 * Schema for component props
 */
export const ReadToolComponentPropsSchema = z.object({
	item: ReadToolChatItemSchema,
	className: z.string().optional(),
	onRetry: z.function().optional(),
});

/**
 * Export schema types
 */
export type ReadToolUseInputType = z.infer<typeof ReadToolUseInputSchema>;
export type ReadToolResultDataType = z.infer<typeof ReadToolResultDataSchema>;
export type ReadToolUseType = z.infer<typeof ReadToolUseSchema>;
export type ReadToolResultType = z.infer<typeof ReadToolResultSchema>;
export type ReadToolChatItemType = z.infer<typeof ReadToolChatItemSchema>;
export type ReadToolComponentPropsType = z.infer<typeof ReadToolComponentPropsSchema>;

/**
 * @fileoverview Zod schemas for multiedit-tool validation
 * @module @dao/chat-items-multiedit-tool/schemas
 */

import { z } from "zod";

/**
 * Schema for individual edit operation
 */
export const MultiEditOperationSchema = z.object({
	old_string: z.string().min(1).describe("The text to replace"),
	new_string: z.string().describe("The text to replace it with"),
	replace_all: z
		.boolean()
		.optional()
		.default(false)
		.describe("Replace all occurrences of old_string"),
});

/**
 * Schema for multiedit tool input parameters
 */
export const MultiEditToolUseInputSchema = z.object({
	file_path: z.string().min(1).describe("The absolute path to the file to modify"),
	edits: z
		.array(MultiEditOperationSchema)
		.min(1)
		.describe("Array of edit operations to perform sequentially"),
});

/**
 * Schema for individual edit result
 */
export const EditResultSchema = z.object({
	operation: MultiEditOperationSchema,
	success: z.boolean().describe("Whether this edit was successful"),
	error: z.string().optional().describe("Error message if the edit failed"),
	replacements_made: z
		.number()
		.int()
		.nonnegative()
		.optional()
		.describe("Number of replacements made"),
});

/**
 * Schema for successful multiedit tool results
 */
export const MultiEditToolResultDataSchema = z.object({
	message: z.string().describe("Success message or summary"),
	edits_applied: z.number().int().nonnegative().describe("Number of edits applied successfully"),
	total_edits: z.number().int().nonnegative().describe("Total number of edit operations"),
	all_successful: z.boolean().describe("Whether all edits were successful"),
	edit_details: z.array(EditResultSchema).optional().describe("Optional details about each edit"),
});

/**
 * Schema for tool use structure
 */
export const MultiEditToolUseSchema = z.object({
	type: z.literal("tool_use"),
	id: z.string(),
	name: z.literal("MultiEdit"),
	input: MultiEditToolUseInputSchema,
});

/**
 * Schema for tool result structure
 */
export const MultiEditToolResultSchema = z.object({
	output: z.union([MultiEditToolResultDataSchema, z.string()]),
	status: z.enum(["completed", "failed"]),
});

/**
 * Schema for complete multiedit tool chat item
 */
export const MultiEditToolChatItemSchema = z.object({
	type: z.literal("tool_use"),
	toolUse: MultiEditToolUseSchema,
	toolResult: MultiEditToolResultSchema,
});

/**
 * Schema for component props
 */
export const MultiEditToolComponentPropsSchema = z.object({
	item: MultiEditToolChatItemSchema,
	className: z.string().optional(),
	onRetry: z.function().optional(),
});

/**
 * Export schema types
 */
export type MultiEditOperationType = z.infer<typeof MultiEditOperationSchema>;
export type MultiEditToolUseInputType = z.infer<typeof MultiEditToolUseInputSchema>;
export type EditResultType = z.infer<typeof EditResultSchema>;
export type MultiEditToolResultDataType = z.infer<typeof MultiEditToolResultDataSchema>;
export type MultiEditToolUseType = z.infer<typeof MultiEditToolUseSchema>;
export type MultiEditToolResultType = z.infer<typeof MultiEditToolResultSchema>;
export type MultiEditToolChatItemType = z.infer<typeof MultiEditToolChatItemSchema>;
export type MultiEditToolComponentPropsType = z.infer<typeof MultiEditToolComponentPropsSchema>;

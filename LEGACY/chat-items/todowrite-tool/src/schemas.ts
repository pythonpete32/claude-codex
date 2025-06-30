/**
 * @fileoverview Zod schemas for todowrite-tool validation
 * @module @dao/chat-items-todowrite-tool/schemas
 */

import { z } from "zod";

/**
 * Schema for individual todo item
 */
export const TodoItemSchema = z.object({
	id: z.string().describe("Unique identifier for the todo item"),
	content: z.string().min(1).describe("The content/description of the todo item"),
	status: z
		.enum(["pending", "in_progress", "completed"])
		.describe("Current status of the todo item"),
	priority: z.enum(["high", "medium", "low"]).describe("Priority level of the todo item"),
});

/**
 * Schema for TodoWrite tool input parameters
 */
export const TodoWriteToolUseInputSchema = z.object({
	todos: z.array(TodoItemSchema).min(1).describe("Array of todo items to write/update"),
});

/**
 * Schema for TodoWrite tool result data
 */
export const TodoWriteToolResultDataSchema = z.object({
	totalProcessed: z.number().min(0).describe("Total number of todos processed"),
	added: z.number().min(0).describe("Number of todos successfully added"),
	updated: z.number().min(0).describe("Number of todos successfully updated"),
	failed: z.number().min(0).describe("Number of todos that failed to process"),
	todos: z.array(TodoItemSchema).describe("Array of processed todo items"),
	message: z.string().describe("Success message"),
});

/**
 * Schema for tool use structure
 */
export const TodoWriteToolUseSchema = z.object({
	type: z.literal("tool_use"),
	id: z.string(),
	name: z.literal("TodoWrite"),
	input: TodoWriteToolUseInputSchema,
});

/**
 * Schema for tool result structure
 */
export const TodoWriteToolResultSchema = z.object({
	tool_use_id: z.string(),
	type: z.literal("tool_result"),
	content: z.string(),
});

/**
 * Schema for tool use result structure
 */
export const TodoWriteToolUseResultSchema = z.object({
	output: z.union([TodoWriteToolResultDataSchema, z.string()]),
	status: z.enum(["completed", "failed"]),
});

/**
 * Schema for complete TodoWrite tool chat item
 */
export const TodoWriteToolChatItemSchema = z.object({
	type: z.literal("tool_use"),
	toolUse: TodoWriteToolUseSchema,
	toolResult: TodoWriteToolResultSchema,
	toolUseResult: TodoWriteToolUseResultSchema,
});

/**
 * Schema for component props
 */
export const TodoWriteToolComponentPropsSchema = z.object({
	item: TodoWriteToolChatItemSchema,
	className: z.string().optional(),
	onRetry: z.function().optional(),
});

/**
 * Export schema types
 */
export type TodoWriteToolUseInputType = z.infer<typeof TodoWriteToolUseInputSchema>;
export type TodoItemType = z.infer<typeof TodoItemSchema>;
export type TodoWriteToolResultDataType = z.infer<typeof TodoWriteToolResultDataSchema>;
export type TodoWriteToolUseType = z.infer<typeof TodoWriteToolUseSchema>;
export type TodoWriteToolResultType = z.infer<typeof TodoWriteToolResultSchema>;
export type TodoWriteToolUseResultType = z.infer<typeof TodoWriteToolUseResultSchema>;
export type TodoWriteToolChatItemType = z.infer<typeof TodoWriteToolChatItemSchema>;
export type TodoWriteToolComponentPropsType = z.infer<typeof TodoWriteToolComponentPropsSchema>;

/**
 * @fileoverview Zod schemas for todoread-tool validation
 * @module @dao/chat-items-todoread-tool/schemas
 */

import { z } from "zod";

/**
 * Schema for TodoRead tool input parameters (empty object)
 */
export const TodoReadToolUseInputSchema = z
	.object({})
	.describe("TodoRead tool input (no parameters required)");

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
 * Schema for status counts
 */
export const StatusCountsSchema = z.object({
	pending: z.number().min(0).describe("Number of pending todos"),
	in_progress: z.number().min(0).describe("Number of in-progress todos"),
	completed: z.number().min(0).describe("Number of completed todos"),
});

/**
 * Schema for priority counts
 */
export const PriorityCountsSchema = z.object({
	high: z.number().min(0).describe("Number of high-priority todos"),
	medium: z.number().min(0).describe("Number of medium-priority todos"),
	low: z.number().min(0).describe("Number of low-priority todos"),
});

/**
 * Schema for TodoRead tool result data
 */
export const TodoReadToolResultDataSchema = z.object({
	todos: z.array(TodoItemSchema).describe("Array of todo items"),
	totalCount: z.number().min(0).describe("Total number of todo items"),
	statusCounts: StatusCountsSchema.describe("Count by status"),
	priorityCounts: PriorityCountsSchema.describe("Count by priority"),
});

/**
 * Schema for tool use structure
 */
export const TodoReadToolUseSchema = z.object({
	type: z.literal("tool_use"),
	id: z.string(),
	name: z.literal("TodoRead"),
	input: TodoReadToolUseInputSchema,
});

/**
 * Schema for tool result structure
 */
export const TodoReadToolResultSchema = z.object({
	tool_use_id: z.string(),
	type: z.literal("tool_result"),
	content: z.string(),
});

/**
 * Schema for tool use result structure
 */
export const TodoReadToolUseResultSchema = z.object({
	output: z.union([TodoReadToolResultDataSchema, z.string()]),
	status: z.enum(["completed", "failed"]),
});

/**
 * Schema for complete TodoRead tool chat item
 */
export const TodoReadToolChatItemSchema = z.object({
	type: z.literal("tool_use"),
	toolUse: TodoReadToolUseSchema,
	toolResult: TodoReadToolResultSchema,
	toolUseResult: TodoReadToolUseResultSchema,
});

/**
 * Schema for component props
 */
export const TodoReadToolComponentPropsSchema = z.object({
	item: TodoReadToolChatItemSchema,
	className: z.string().optional(),
	onRetry: z.function().optional(),
});

/**
 * Export schema types
 */
export type TodoReadToolUseInputType = z.infer<typeof TodoReadToolUseInputSchema>;
export type TodoItemType = z.infer<typeof TodoItemSchema>;
export type StatusCountsType = z.infer<typeof StatusCountsSchema>;
export type PriorityCountsType = z.infer<typeof PriorityCountsSchema>;
export type TodoReadToolResultDataType = z.infer<typeof TodoReadToolResultDataSchema>;
export type TodoReadToolUseType = z.infer<typeof TodoReadToolUseSchema>;
export type TodoReadToolResultType = z.infer<typeof TodoReadToolResultSchema>;
export type TodoReadToolUseResultType = z.infer<typeof TodoReadToolUseResultSchema>;
export type TodoReadToolChatItemType = z.infer<typeof TodoReadToolChatItemSchema>;
export type TodoReadToolComponentPropsType = z.infer<typeof TodoReadToolComponentPropsSchema>;

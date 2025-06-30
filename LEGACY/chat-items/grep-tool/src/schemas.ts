/**
 * Zod schemas for grep-tool validation
 * @packageDocumentation
 * @module @dao/codex-chat-item-grep-tool/schemas
 */

import { z } from "zod";

/**
 * Schema for tool use input validation.
 */
export const GrepToolUseInput: z.ZodObject<{
	pattern: z.ZodString;
	include: z.ZodOptional<z.ZodString>;
	path: z.ZodOptional<z.ZodString>;
}> = z.object({
	pattern: z.string(),
	include: z.string().optional(),
	path: z.string().optional(),
});

/**
 * Schema for tool use validation.
 */
export const GrepToolUse: z.ZodObject<{
	type: z.ZodLiteral<"tool_use">;
	id: z.ZodString;
	name: z.ZodLiteral<"Grep">;
	input: typeof GrepToolUseInput;
}> = z.object({
	type: z.literal("tool_use"),
	id: z.string(),
	name: z.literal("Grep"),
	input: GrepToolUseInput,
});

/**
 * Schema for tool result validation.
 */
export const GrepToolResult: z.ZodObject<{
	matches: z.ZodArray<z.ZodString>;
	matchCount: z.ZodNumber;
	isError: z.ZodBoolean;
	errorMessage: z.ZodOptional<z.ZodString>;
}> = z.object({
	matches: z.array(z.string()),
	matchCount: z.number(),
	isError: z.boolean(),
	errorMessage: z.string().optional(),
});

/**
 * Schema for grep tool component props validation.
 */
export const GrepToolProps: z.ZodObject<{
	toolUse: typeof GrepToolUse;
	status: z.ZodEnum<["completed", "failed"]>;
	timestamp: z.ZodString;
	toolResult: typeof GrepToolResult;
}> = z.object({
	toolUse: GrepToolUse,
	status: z.enum(["completed", "failed"]),
	timestamp: z.string(),
	toolResult: GrepToolResult,
});

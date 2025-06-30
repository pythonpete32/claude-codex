/**
 * Zod schemas for glob-tool validation
 * @packageDocumentation
 * @module @dao/codex-chat-item-glob-tool/schemas
 */

import { z } from "zod";

/**
 * Schema for tool use input validation.
 */
export const GlobToolUseInput: z.ZodObject<{
	pattern: z.ZodString;
	path: z.ZodOptional<z.ZodString>;
}> = z.object({
	pattern: z.string(),
	path: z.string().optional(),
});

/**
 * Schema for tool use validation.
 */
export const GlobToolUse: z.ZodObject<{
	type: z.ZodLiteral<"tool_use">;
	id: z.ZodString;
	name: z.ZodLiteral<"Glob">;
	input: typeof GlobToolUseInput;
}> = z.object({
	type: z.literal("tool_use"),
	id: z.string(),
	name: z.literal("Glob"),
	input: GlobToolUseInput,
});

/**
 * Schema for tool result validation.
 */
export const GlobToolResult: z.ZodObject<{
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
 * Schema for glob tool component props validation.
 */
export const GlobToolProps: z.ZodObject<{
	toolUse: typeof GlobToolUse;
	status: z.ZodEnum<["completed", "failed"]>;
	timestamp: z.ZodString;
	toolResult: typeof GlobToolResult;
}> = z.object({
	toolUse: GlobToolUse,
	status: z.enum(["completed", "failed"]),
	timestamp: z.string(),
	toolResult: GlobToolResult,
});

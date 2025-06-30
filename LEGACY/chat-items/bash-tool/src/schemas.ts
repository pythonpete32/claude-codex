/**
 * Zod schemas for bash-tool validation
 * @packageDocumentation
 * @module @dao/codex-chat-item-bash-tool/schemas
 */

import { z } from "zod";

/**
 * Schema for tool use input validation.
 */
export const BashToolUseInput: z.ZodObject<{
	command: z.ZodString;
	description: z.ZodString;
}> = z.object({
	command: z.string(),
	description: z.string(),
});

/**
 * Schema for tool use validation.
 */
export const BashToolUse: z.ZodObject<{
	type: z.ZodLiteral<"tool_use">;
	id: z.ZodString;
	name: z.ZodLiteral<"Bash">;
	input: typeof BashToolUseInput;
}> = z.object({
	type: z.literal("tool_use"),
	id: z.string(),
	name: z.literal("Bash"),
	input: BashToolUseInput,
});

/**
 * Schema for tool result validation.
 */
export const BashToolResult: z.ZodObject<{
	stdout: z.ZodString;
	stderr: z.ZodString;
	interrupted: z.ZodBoolean;
	isImage: z.ZodBoolean;
	isError: z.ZodBoolean;
}> = z.object({
	stdout: z.string(),
	stderr: z.string(),
	interrupted: z.boolean(),
	isImage: z.boolean(),
	isError: z.boolean(),
});

/**
 * Schema for bash tool component props validation.
 */
export const BashToolProps: z.ZodObject<{
	toolUse: typeof BashToolUse;
	status: z.ZodEnum<["completed", "failed"]>;
	timestamp: z.ZodString;
	toolResult: typeof BashToolResult;
}> = z.object({
	toolUse: BashToolUse,
	status: z.enum(["completed", "failed"]),
	timestamp: z.string(),
	toolResult: BashToolResult,
});

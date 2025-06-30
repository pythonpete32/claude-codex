/**
 * Zod schemas for edit-tool validation
 * @packageDocumentation
 * @module @dao/codex-chat-item-edit-tool/schemas
 */

import { z } from "zod";

/**
 * Schema for tool use input validation.
 */
export const EditToolUseInput: z.ZodObject<{
	file_path: z.ZodString;
	old_string: z.ZodString;
	new_string: z.ZodString;
	replace_all: z.ZodOptional<z.ZodBoolean>;
}> = z.object({
	file_path: z.string(),
	old_string: z.string(),
	new_string: z.string(),
	replace_all: z.boolean().optional(),
});

/**
 * Schema for tool use validation.
 */
export const EditToolUse: z.ZodObject<{
	type: z.ZodLiteral<"tool_use">;
	id: z.ZodString;
	name: z.ZodLiteral<"Edit">;
	input: typeof EditToolUseInput;
}> = z.object({
	type: z.literal("tool_use"),
	id: z.string(),
	name: z.literal("Edit"),
	input: EditToolUseInput,
});

/**
 * Schema for structured patch validation.
 */
export const EditStructuredPatch: z.ZodObject<{
	oldStart: z.ZodNumber;
	oldLines: z.ZodNumber;
	newStart: z.ZodNumber;
	newLines: z.ZodNumber;
	lines: z.ZodArray<z.ZodString>;
}> = z.object({
	oldStart: z.number(),
	oldLines: z.number(),
	newStart: z.number(),
	newLines: z.number(),
	lines: z.array(z.string()),
});

/**
 * Schema for tool result validation.
 */
export const EditToolResult: z.ZodObject<{
	filePath: z.ZodOptional<z.ZodString>;
	oldString: z.ZodOptional<z.ZodString>;
	newString: z.ZodOptional<z.ZodString>;
	originalFile: z.ZodOptional<z.ZodString>;
	structuredPatch: z.ZodOptional<z.ZodArray<typeof EditStructuredPatch>>;
	isError: z.ZodOptional<z.ZodBoolean>;
	errorMessage: z.ZodOptional<z.ZodString>;
	userModified: z.ZodOptional<z.ZodBoolean>;
	replaceAll: z.ZodOptional<z.ZodBoolean>;
	stdout: z.ZodOptional<z.ZodString>;
	stderr: z.ZodOptional<z.ZodString>;
	interrupted: z.ZodOptional<z.ZodBoolean>;
	isImage: z.ZodOptional<z.ZodBoolean>;
}> = z.object({
	filePath: z.string().optional(),
	oldString: z.string().optional(),
	newString: z.string().optional(),
	originalFile: z.string().optional(),
	structuredPatch: z.array(EditStructuredPatch).optional(),
	isError: z.boolean().optional(),
	errorMessage: z.string().optional(),
	userModified: z.boolean().optional(),
	replaceAll: z.boolean().optional(),
	stdout: z.string().optional(),
	stderr: z.string().optional(),
	interrupted: z.boolean().optional(),
	isImage: z.boolean().optional(),
});

/**
 * Schema for edit tool component props validation.
 */
export const EditToolProps: z.ZodObject<{
	toolUse: typeof EditToolUse;
	status: z.ZodEnum<["completed", "failed"]>;
	timestamp: z.ZodString;
	toolResult: typeof EditToolResult;
}> = z.object({
	toolUse: EditToolUse,
	status: z.enum(["completed", "failed"]),
	timestamp: z.string(),
	toolResult: EditToolResult,
});

/**
 * @fileoverview Zod schemas for sequential thinking tool validation
 * @module @dao/chat-items-todowrite-mcp-sequential-thinking/schemas
 */

import { z } from "zod";

/**
 * Schema for thinking process types
 */
export const ThinkingProcessTypeSchema = z
	.enum([
		"problem_decomposition",
		"step_by_step_analysis",
		"root_cause_analysis",
		"decision_tree",
		"systematic_approach",
		"iterative_refinement",
	])
	.describe("Type of sequential thinking process");

/**
 * Schema for step priority levels
 */
export const StepPrioritySchema = z
	.enum(["critical", "high", "medium", "low"])
	.describe("Priority level for thinking steps");

/**
 * Schema for step status
 */
export const StepStatusSchema = z
	.enum(["pending", "in_progress", "completed", "blocked", "skipped"])
	.describe("Status of individual thinking steps");

/**
 * Schema for individual thinking step
 */
export const ThinkingStepSchema = z.object({
	id: z.string().min(1).describe("Unique identifier for the thinking step"),
	sequence: z.number().min(1).describe("Order/sequence number of this step"),
	title: z.string().min(1).describe("Title/summary of the thinking step"),
	description: z.string().min(1).describe("Detailed description of what to think about or analyze"),
	status: StepStatusSchema.describe("Current status of this step"),
	priority: StepPrioritySchema.describe("Priority level of this step"),
	expectedOutcome: z.string().optional().describe("Expected outcome or result from this step"),
	result: z.string().optional().describe("Actual result/notes from completing this step"),
	dependencies: z
		.array(z.string())
		.optional()
		.describe("Dependencies - IDs of steps that must be completed first"),
	estimatedMinutes: z
		.number()
		.min(0)
		.optional()
		.describe("Estimated time to complete this step (in minutes)"),
	actualMinutes: z
		.number()
		.min(0)
		.optional()
		.describe("Actual time taken to complete this step (in minutes)"),
	mcpResources: z
		.array(z.string())
		.optional()
		.describe("MCP tools or resources needed for this step"),
	tags: z.array(z.string()).optional().describe("Tags for categorization and filtering"),
});

/**
 * Schema for workflow metadata
 */
export const WorkflowMetadataSchema = z.object({
	createdAt: z.string().optional().describe("Creation timestamp"),
	updatedAt: z.string().optional().describe("Last update timestamp"),
	estimatedTotalMinutes: z.number().min(0).optional().describe("Total estimated time for workflow"),
	actualTotalMinutes: z.number().min(0).optional().describe("Total actual time spent on workflow"),
	completionPercentage: z.number().min(0).max(100).optional().describe("Completion percentage"),
});

/**
 * Schema for workflow status
 */
export const WorkflowStatusSchema = z
	.enum(["draft", "active", "paused", "completed", "cancelled"])
	.describe("Overall workflow status");

/**
 * Schema for thinking workflow
 */
export const ThinkingWorkflowSchema = z.object({
	id: z.string().min(1).describe("Unique identifier for the workflow"),
	name: z.string().min(1).describe("Human-readable name for the workflow"),
	processType: ThinkingProcessTypeSchema.describe(
		"Type of thinking process this workflow represents",
	),
	problemStatement: z
		.string()
		.min(1)
		.describe("Description of the problem or topic being analyzed"),
	targetOutcome: z.string().min(1).describe("Target outcome or goal of the thinking process"),
	steps: z.array(ThinkingStepSchema).describe("Ordered list of thinking steps"),
	status: WorkflowStatusSchema.describe("Overall workflow status"),
	priority: StepPrioritySchema.describe("Priority of the entire workflow"),
	tags: z.array(z.string()).optional().describe("Tags for the workflow"),
	metadata: WorkflowMetadataSchema.optional().describe("Metadata about the workflow"),
});

/**
 * Schema for MCP settings
 */
export const McpSettingsSchema = z.object({
	enableAutoExecution: z.boolean().optional().describe("Enable automatic execution of MCP tools"),
	preferredTools: z.array(z.string()).optional().describe("Preferred MCP tools to use"),
	timeoutMinutes: z.number().min(1).optional().describe("Timeout for MCP operations in minutes"),
});

/**
 * Schema for tool input
 */
export const SequentialThinkingToolUseInputSchema = z.object({
	workflow: ThinkingWorkflowSchema.describe("The thinking workflow to create or update"),
	mode: z
		.enum(["create", "update", "analyze", "execute_next"])
		.optional()
		.describe("Mode of operation"),
	stepId: z
		.string()
		.optional()
		.describe("Specific step ID to focus on (for update/execute operations)"),
	mcpSettings: McpSettingsSchema.optional().describe("MCP integration settings"),
});

/**
 * Schema for changes summary
 */
export const ChangesSummarySchema = z.object({
	stepsAdded: z.number().min(0).describe("Number of steps added"),
	stepsUpdated: z.number().min(0).describe("Number of steps updated"),
	stepsCompleted: z.number().min(0).describe("Number of steps completed"),
	stepsBlocked: z.number().min(0).describe("Number of steps blocked"),
});

/**
 * Schema for progress analytics
 */
export const ProgressSchema = z.object({
	totalSteps: z.number().min(0).describe("Total number of steps"),
	completedSteps: z.number().min(0).describe("Number of completed steps"),
	pendingSteps: z.number().min(0).describe("Number of pending steps"),
	blockedSteps: z.number().min(0).describe("Number of blocked steps"),
	completionPercentage: z.number().min(0).max(100).describe("Completion percentage"),
	estimatedRemainingMinutes: z.number().min(0).optional().describe("Estimated remaining time"),
});

/**
 * Schema for recommendations
 */
export const RecommendationsSchema = z.object({
	nextStepId: z.string().optional().describe("ID of next recommended step"),
	nextStepTitle: z.string().optional().describe("Title of next recommended step"),
	blockedSteps: z.array(z.string()).optional().describe("IDs of blocked steps"),
	suggestedMcpTools: z.array(z.string()).optional().describe("Suggested MCP tools to use"),
});

/**
 * Schema for tool result data
 */
export const SequentialThinkingToolResultDataSchema = z.object({
	workflow: ThinkingWorkflowSchema.describe("The processed workflow"),
	changesSummary: ChangesSummarySchema.describe("Summary of changes made"),
	progress: ProgressSchema.describe("Progress analytics"),
	recommendations: RecommendationsSchema.describe("Next recommended actions"),
	message: z.string().describe("Success message"),
});

/**
 * Schema for tool use structure
 */
export const SequentialThinkingToolUseSchema = z.object({
	type: z.literal("tool_use"),
	id: z.string(),
	name: z.literal("SequentialThinking"),
	input: SequentialThinkingToolUseInputSchema,
});

/**
 * Schema for tool result structure
 */
export const SequentialThinkingToolResultSchema = z.object({
	tool_use_id: z.string(),
	type: z.literal("tool_result"),
	content: z.string(),
});

/**
 * Schema for tool use result structure
 */
export const SequentialThinkingToolUseResultSchema = z.object({
	output: z.union([SequentialThinkingToolResultDataSchema, z.string()]),
	status: z.enum(["completed", "failed"]),
});

/**
 * Schema for complete chat item
 */
export const SequentialThinkingToolChatItemSchema = z.object({
	type: z.literal("tool_use"),
	toolUse: SequentialThinkingToolUseSchema,
	toolResult: SequentialThinkingToolResultSchema,
	toolUseResult: SequentialThinkingToolUseResultSchema,
});

/**
 * Schema for component props
 */
export const SequentialThinkingToolComponentPropsSchema = z.object({
	item: SequentialThinkingToolChatItemSchema,
	className: z.string().optional(),
	onStepClick: z.function().optional(),
	onWorkflowUpdate: z.function().optional(),
	onRetry: z.function().optional(),
});

/**
 * Export schema types
 */
export type ThinkingProcessTypeType = z.infer<typeof ThinkingProcessTypeSchema>;
export type StepPriorityType = z.infer<typeof StepPrioritySchema>;
export type StepStatusType = z.infer<typeof StepStatusSchema>;
export type ThinkingStepType = z.infer<typeof ThinkingStepSchema>;
export type WorkflowMetadataType = z.infer<typeof WorkflowMetadataSchema>;
export type WorkflowStatusType = z.infer<typeof WorkflowStatusSchema>;
export type ThinkingWorkflowType = z.infer<typeof ThinkingWorkflowSchema>;
export type McpSettingsType = z.infer<typeof McpSettingsSchema>;
export type SequentialThinkingToolUseInputType = z.infer<
	typeof SequentialThinkingToolUseInputSchema
>;
export type ChangesSummaryType = z.infer<typeof ChangesSummarySchema>;
export type ProgressType = z.infer<typeof ProgressSchema>;
export type RecommendationsType = z.infer<typeof RecommendationsSchema>;
export type SequentialThinkingToolResultDataType = z.infer<
	typeof SequentialThinkingToolResultDataSchema
>;
export type SequentialThinkingToolUseType = z.infer<typeof SequentialThinkingToolUseSchema>;
export type SequentialThinkingToolResultType = z.infer<typeof SequentialThinkingToolResultSchema>;
export type SequentialThinkingToolUseResultType = z.infer<
	typeof SequentialThinkingToolUseResultSchema
>;
export type SequentialThinkingToolChatItemType = z.infer<
	typeof SequentialThinkingToolChatItemSchema
>;
export type SequentialThinkingToolComponentPropsType = z.infer<
	typeof SequentialThinkingToolComponentPropsSchema
>;

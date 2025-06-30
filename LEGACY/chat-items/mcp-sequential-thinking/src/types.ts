/**
 * @fileoverview Type definitions for sequential thinking TodoWrite tool with MCP integration
 * @module @dao/chat-items-todowrite-mcp-sequential-thinking/types
 */

import type { BaseToolUse, ToolStatus } from "@dao/chat-items-common-types";

/**
 * Types of sequential thinking processes
 */
export type ThinkingProcessType =
	| "problem_decomposition"
	| "step_by_step_analysis"
	| "root_cause_analysis"
	| "decision_tree"
	| "systematic_approach"
	| "iterative_refinement";

/**
 * Priority levels for thinking steps
 */
export type StepPriority = "critical" | "high" | "medium" | "low";

/**
 * Status of individual thinking steps
 */
export type StepStatus = "pending" | "in_progress" | "completed" | "blocked" | "skipped";

/**
 * Individual step in sequential thinking process
 */
export interface ThinkingStep {
	/** Unique identifier for the thinking step */
	id: string;
	/** Order/sequence number of this step */
	sequence: number;
	/** Title/summary of the thinking step */
	title: string;
	/** Detailed description of what to think about or analyze */
	description: string;
	/** Current status of this step */
	status: StepStatus;
	/** Priority level of this step */
	priority: StepPriority;
	/** Expected outcome or result from this step */
	expectedOutcome?: string;
	/** Actual result/notes from completing this step */
	result?: string;
	/** Dependencies - IDs of steps that must be completed first */
	dependencies?: string[];
	/** Estimated time to complete this step (in minutes) */
	estimatedMinutes?: number;
	/** Actual time taken to complete this step (in minutes) */
	actualMinutes?: number;
	/** MCP tools or resources needed for this step */
	mcpResources?: string[];
	/** Tags for categorization and filtering */
	tags?: string[];
}

/**
 * Sequential thinking workflow definition
 */
export interface ThinkingWorkflow {
	/** Unique identifier for the workflow */
	id: string;
	/** Human-readable name for the workflow */
	name: string;
	/** Type of thinking process this workflow represents */
	processType: ThinkingProcessType;
	/** Description of the problem or topic being analyzed */
	problemStatement: string;
	/** Target outcome or goal of the thinking process */
	targetOutcome: string;
	/** Ordered list of thinking steps */
	steps: ThinkingStep[];
	/** Overall workflow status */
	status: "draft" | "active" | "paused" | "completed" | "cancelled";
	/** Priority of the entire workflow */
	priority: StepPriority;
	/** Tags for the workflow */
	tags?: string[];
	/** Metadata about the workflow */
	metadata?: {
		createdAt?: string;
		updatedAt?: string;
		estimatedTotalMinutes?: number;
		actualTotalMinutes?: number;
		completionPercentage?: number;
	};
}

/**
 * Input parameters for the Sequential Thinking TodoWrite tool
 */
export interface SequentialThinkingToolUseInput {
	/** The thinking workflow to create or update */
	workflow: ThinkingWorkflow;
	/** Mode of operation */
	mode?: "create" | "update" | "analyze" | "execute_next";
	/** Specific step ID to focus on (for update/execute operations) */
	stepId?: string;
	/** MCP integration settings */
	mcpSettings?: {
		enableAutoExecution?: boolean;
		preferredTools?: string[];
		timeoutMinutes?: number;
	};
}

/**
 * Result data from sequential thinking operations
 */
export interface SequentialThinkingToolResultData {
	/** The processed workflow */
	workflow: ThinkingWorkflow;
	/** Summary of changes made */
	changesSummary: {
		stepsAdded: number;
		stepsUpdated: number;
		stepsCompleted: number;
		stepsBlocked: number;
	};
	/** Progress analytics */
	progress: {
		totalSteps: number;
		completedSteps: number;
		pendingSteps: number;
		blockedSteps: number;
		completionPercentage: number;
		estimatedRemainingMinutes?: number;
	};
	/** Next recommended actions */
	recommendations: {
		nextStepId?: string;
		nextStepTitle?: string;
		blockedSteps?: string[];
		suggestedMcpTools?: string[];
	};
	/** Success message */
	message: string;
}

/**
 * Tool use structure for Sequential Thinking operations
 */
export interface SequentialThinkingToolUse
	extends BaseToolUse<"SequentialThinking", SequentialThinkingToolUseInput> {
	type: "tool_use";
}

/**
 * Tool result structure for Sequential Thinking operations
 */
export interface SequentialThinkingToolResult {
	tool_use_id: string;
	type: "tool_result";
	content: string;
}

/**
 * Tool use result structure for Sequential Thinking operations
 */
export interface SequentialThinkingToolUseResult {
	output: SequentialThinkingToolResultData | string;
	status: ToolStatus;
}

/**
 * Complete chat item for Sequential Thinking tool
 */
export interface SequentialThinkingToolChatItem {
	type: "tool_use";
	toolUse: SequentialThinkingToolUse;
	toolResult: SequentialThinkingToolResult;
	toolUseResult: SequentialThinkingToolUseResult;
}

/**
 * Props for the Sequential Thinking tool component
 */
export interface SequentialThinkingToolComponentProps {
	item: SequentialThinkingToolChatItem;
	className?: string;
	onStepClick?: (stepId: string) => void;
	onWorkflowUpdate?: (workflow: ThinkingWorkflow) => void;
	onRetry?: () => void;
}

/**
 * Fixture structure with metadata
 */
export interface SequentialThinkingToolFixture {
	name: string;
	category: string;
	data: SequentialThinkingToolChatItem;
}

/**
 * Type guard for SequentialThinkingToolUseInput
 */
export function isSequentialThinkingToolUseInput(
	value: unknown,
): value is SequentialThinkingToolUseInput {
	return (
		typeof value === "object" &&
		value !== null &&
		"workflow" in value &&
		typeof (value as SequentialThinkingToolUseInput).workflow === "object"
	);
}

/**
 * Type guard for ThinkingStep
 */
export function isThinkingStep(value: unknown): value is ThinkingStep {
	return (
		typeof value === "object" &&
		value !== null &&
		"id" in value &&
		"sequence" in value &&
		"title" in value &&
		"description" in value &&
		"status" in value &&
		"priority" in value &&
		typeof (value as ThinkingStep).id === "string" &&
		typeof (value as ThinkingStep).sequence === "number" &&
		typeof (value as ThinkingStep).title === "string" &&
		typeof (value as ThinkingStep).description === "string" &&
		["pending", "in_progress", "completed", "blocked", "skipped"].includes(
			(value as ThinkingStep).status,
		) &&
		["critical", "high", "medium", "low"].includes((value as ThinkingStep).priority)
	);
}

/**
 * Type guard for ThinkingWorkflow
 */
export function isThinkingWorkflow(value: unknown): value is ThinkingWorkflow {
	return (
		typeof value === "object" &&
		value !== null &&
		"id" in value &&
		"name" in value &&
		"processType" in value &&
		"problemStatement" in value &&
		"targetOutcome" in value &&
		"steps" in value &&
		"status" in value &&
		"priority" in value &&
		typeof (value as ThinkingWorkflow).id === "string" &&
		typeof (value as ThinkingWorkflow).name === "string" &&
		Array.isArray((value as ThinkingWorkflow).steps) &&
		[
			"problem_decomposition",
			"step_by_step_analysis",
			"root_cause_analysis",
			"decision_tree",
			"systematic_approach",
			"iterative_refinement",
		].includes((value as ThinkingWorkflow).processType) &&
		["draft", "active", "paused", "completed", "cancelled"].includes(
			(value as ThinkingWorkflow).status,
		)
	);
}

/**
 * Type guard for SequentialThinkingToolResultData
 */
export function isSequentialThinkingToolResultData(
	value: unknown,
): value is SequentialThinkingToolResultData {
	return (
		typeof value === "object" &&
		value !== null &&
		"workflow" in value &&
		"changesSummary" in value &&
		"progress" in value &&
		"recommendations" in value &&
		"message" in value &&
		isThinkingWorkflow((value as SequentialThinkingToolResultData).workflow) &&
		typeof (value as SequentialThinkingToolResultData).message === "string"
	);
}

/**
 * Type guard for SequentialThinkingToolChatItem
 */
export function isSequentialThinkingToolChatItem(
	item: unknown,
): item is SequentialThinkingToolChatItem {
	return (
		typeof item === "object" &&
		item !== null &&
		(item as SequentialThinkingToolChatItem).type === "tool_use" &&
		"toolUse" in item &&
		(item as SequentialThinkingToolChatItem).toolUse.name === "SequentialThinking"
	);
}

/**
 * Export all types
 */
export type {
	BaseToolUse,
	ToolStatus,
} from "@dao/chat-items-common-types";

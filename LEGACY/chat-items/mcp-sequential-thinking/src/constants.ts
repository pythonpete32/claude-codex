/**
 * @fileoverview Constants and configuration for sequential thinking tool
 * @module @dao/chat-items-todowrite-mcp-sequential-thinking/constants
 */

import type { StepPriority, StepStatus, ThinkingProcessType } from "./types";

/**
 * Package metadata
 */
export const PACKAGE_INFO = {
	name: "@dao/chat-items-todowrite-mcp-sequential-thinking",
	version: "1.0.0",
	description:
		"Sequential thinking TodoWrite tool with MCP integration for structured problem-solving workflows",
	author: "DAO",
	license: "MIT",
	repository: "https://github.com/dao/atomic-codex",
	keywords: [
		"todo",
		"sequential-thinking",
		"mcp",
		"workflow",
		"problem-solving",
		"chat-item",
		"typescript",
		"validation",
		"claude",
		"atomic-codex",
	],
} as const;

/**
 * Tool identification constants
 */
export const TOOL_CONSTANTS = {
	name: "SequentialThinking",
	type: "tool_use" as const,
	category: "sequential-thinking",
	displayName: "Sequential Thinking",
	description:
		"MCP-integrated tool for structured sequential thinking and problem-solving workflows",
} as const;

/**
 * Sequential thinking process types and their metadata
 */
export const THINKING_PROCESS_TYPES: Record<
	ThinkingProcessType,
	{
		name: string;
		description: string;
		icon: string;
		color: string;
		suggestedSteps: string[];
	}
> = {
	problem_decomposition: {
		name: "Problem Decomposition",
		description: "Break down complex problems into manageable components",
		icon: "🔍",
		color: "#3B82F6",
		suggestedSteps: [
			"Define the core problem",
			"Identify key stakeholders",
			"Break into sub-problems",
			"Prioritize components",
			"Create action plan",
		],
	},
	step_by_step_analysis: {
		name: "Step-by-Step Analysis",
		description: "Systematic examination through sequential steps",
		icon: "📋",
		color: "#10B981",
		suggestedSteps: [
			"Gather initial information",
			"Define analysis criteria",
			"Execute systematic review",
			"Document findings",
			"Draw conclusions",
		],
	},
	root_cause_analysis: {
		name: "Root Cause Analysis",
		description: "Identify fundamental causes of problems or incidents",
		icon: "🔎",
		color: "#F59E0B",
		suggestedSteps: [
			"Problem identification",
			"Data collection",
			"Timeline reconstruction",
			"Cause mapping",
			"Verification and testing",
		],
	},
	decision_tree: {
		name: "Decision Tree",
		description: "Structured decision-making with branching options",
		icon: "🌳",
		color: "#8B5CF6",
		suggestedSteps: [
			"Define decision criteria",
			"Identify alternatives",
			"Evaluate consequences",
			"Apply decision matrix",
			"Select optimal path",
		],
	},
	systematic_approach: {
		name: "Systematic Approach",
		description: "Methodical and organized problem-solving methodology",
		icon: "⚙️",
		color: "#EF4444",
		suggestedSteps: [
			"System analysis",
			"Process mapping",
			"Requirements definition",
			"Solution design",
			"Implementation planning",
		],
	},
	iterative_refinement: {
		name: "Iterative Refinement",
		description: "Continuous improvement through iterative cycles",
		icon: "🔄",
		color: "#06B6D4",
		suggestedSteps: [
			"Initial implementation",
			"Testing and feedback",
			"Analysis and learning",
			"Refinement planning",
			"Next iteration",
		],
	},
} as const;

/**
 * Step priority levels and their metadata
 */
export const STEP_PRIORITIES: Record<
	StepPriority,
	{
		name: string;
		color: string;
		icon: string;
		urgencyLevel: number;
	}
> = {
	critical: {
		name: "Critical",
		color: "#DC2626",
		icon: "🚨",
		urgencyLevel: 4,
	},
	high: {
		name: "High",
		color: "#F59E0B",
		icon: "⚠️",
		urgencyLevel: 3,
	},
	medium: {
		name: "Medium",
		color: "#3B82F6",
		icon: "📍",
		urgencyLevel: 2,
	},
	low: {
		name: "Low",
		color: "#10B981",
		icon: "💚",
		urgencyLevel: 1,
	},
} as const;

/**
 * Step status types and their metadata
 */
export const STEP_STATUSES: Record<
	StepStatus,
	{
		name: string;
		color: string;
		icon: string;
		isActive: boolean;
		isCompleted: boolean;
	}
> = {
	pending: {
		name: "Pending",
		color: "#6B7280",
		icon: "⏳",
		isActive: false,
		isCompleted: false,
	},
	in_progress: {
		name: "In Progress",
		color: "#3B82F6",
		icon: "🔄",
		isActive: true,
		isCompleted: false,
	},
	completed: {
		name: "Completed",
		color: "#10B981",
		icon: "✅",
		isActive: false,
		isCompleted: true,
	},
	blocked: {
		name: "Blocked",
		color: "#EF4444",
		icon: "🚫",
		isActive: false,
		isCompleted: false,
	},
	skipped: {
		name: "Skipped",
		color: "#8B5CF6",
		icon: "⏭️",
		isActive: false,
		isCompleted: false,
	},
} as const;

/**
 * Workflow status types and their metadata
 */
export const WORKFLOW_STATUSES = {
	draft: {
		name: "Draft",
		color: "#6B7280",
		icon: "📝",
		description: "Workflow is being planned",
	},
	active: {
		name: "Active",
		color: "#3B82F6",
		icon: "🚀",
		description: "Workflow is actively being executed",
	},
	paused: {
		name: "Paused",
		color: "#F59E0B",
		icon: "⏸️",
		description: "Workflow execution is temporarily stopped",
	},
	completed: {
		name: "Completed",
		color: "#10B981",
		icon: "🎉",
		description: "Workflow has been successfully completed",
	},
	cancelled: {
		name: "Cancelled",
		color: "#EF4444",
		icon: "❌",
		description: "Workflow has been cancelled",
	},
} as const;

/**
 * Operation modes and their descriptions
 */
export const OPERATION_MODES = {
	create: {
		name: "Create",
		description: "Create a new sequential thinking workflow",
		icon: "➕",
	},
	update: {
		name: "Update",
		description: "Update existing workflow or specific steps",
		icon: "✏️",
	},
	analyze: {
		name: "Analyze",
		description: "Analyze workflow progress and provide insights",
		icon: "📊",
	},
	execute_next: {
		name: "Execute Next",
		description: "Identify and prepare the next actionable step",
		icon: "▶️",
	},
} as const;

/**
 * MCP integration settings and defaults
 */
export const MCP_SETTINGS = {
	defaultTimeout: 300, // 5 minutes in seconds
	maxRetries: 3,
	preferredTools: [
		"monitoring-dashboard",
		"log-aggregation",
		"database-profiler",
		"performance-testing",
		"security-scanner",
		"code-analyzer",
	],
	autoExecutionDefaults: {
		enableAutoExecution: false,
		requireConfirmation: true,
		timeoutMinutes: 5,
	},
} as const;

/**
 * Validation rules and constraints
 */
export const VALIDATION_RULES = {
	workflow: {
		minNameLength: 1,
		maxNameLength: 200,
		maxDescriptionLength: 1000,
		maxSteps: 50,
		maxTags: 20,
	},
	step: {
		minTitleLength: 1,
		maxTitleLength: 200,
		maxDescriptionLength: 2000,
		maxDependencies: 10,
		maxMcpResources: 20,
		maxTags: 15,
		maxEstimatedMinutes: 10080, // 1 week
		maxActualMinutes: 43200, // 1 month
	},
	ids: {
		pattern: /^[a-zA-Z0-9_-]+$/,
		minLength: 1,
		maxLength: 50,
	},
} as const;

/**
 * Display formatting options
 */
export const DISPLAY_OPTIONS = {
	timeFormats: {
		short: "HH:mm",
		long: "YYYY-MM-DD HH:mm:ss",
		relative: "relative",
	},
	progressFormats: {
		percentage: "percentage",
		fraction: "fraction",
		both: "both",
	},
	sortOptions: {
		sequence: "sequence",
		priority: "priority",
		status: "status",
		createdAt: "createdAt",
		updatedAt: "updatedAt",
	},
} as const;

/**
 * Error messages and codes
 */
export const ERROR_MESSAGES = {
	validation: {
		invalidWorkflow: "Invalid workflow structure",
		invalidStep: "Invalid step structure",
		missingDependency: "Referenced dependency step not found",
		circularDependency: "Circular dependency detected",
		invalidId: "Invalid ID format - use only letters, numbers, hyphens, and underscores",
		duplicateStepId: "Duplicate step ID found",
		invalidTimeEstimate: "Time estimate must be positive",
	},
	processing: {
		workflowNotFound: "Workflow not found",
		stepNotFound: "Step not found",
		cannotUpdateCompleted: "Cannot update completed workflow",
		dependencyNotMet: "Step dependencies not satisfied",
		mcpToolError: "MCP tool execution failed",
		timeoutError: "Operation timed out",
	},
	system: {
		unknownError: "An unknown error occurred",
		validationFailed: "Data validation failed",
		parsingError: "Failed to parse input data",
	},
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
	workflowCreated: "Workflow created successfully",
	workflowUpdated: "Workflow updated successfully",
	stepCompleted: "Step marked as completed",
	analysisComplete: "Workflow analysis completed",
	nextStepReady: "Next step identified and ready for execution",
	validationPassed: "All validations passed",
} as const;

/**
 * Default values and templates
 */
export const DEFAULTS = {
	stepPriority: "medium" as StepPriority,
	stepStatus: "pending" as StepStatus,
	workflowStatus: "draft" as const,
	estimatedMinutes: 30,
	operationMode: "create" as const,
	completionThreshold: 100, // percentage
} as const;

/**
 * Common MCP tool categories and their typical uses
 */
export const MCP_TOOL_CATEGORIES = {
	monitoring: {
		name: "Monitoring & Observability",
		tools: ["monitoring-dashboard", "metrics-collector", "alert-manager"],
		description: "Tools for system monitoring and observability",
	},
	analysis: {
		name: "Analysis & Profiling",
		tools: ["log-analyzer", "performance-profiler", "code-analyzer"],
		description: "Tools for analyzing data and system performance",
	},
	testing: {
		name: "Testing & Validation",
		tools: ["load-testing", "security-scanner", "validation-tools"],
		description: "Tools for testing and validation",
	},
	development: {
		name: "Development & Build",
		tools: ["code-generator", "build-tools", "deployment-manager"],
		description: "Tools for development and deployment",
	},
	database: {
		name: "Database & Storage",
		tools: ["database-profiler", "query-analyzer", "migration-tools"],
		description: "Tools for database management and analysis",
	},
} as const;

/**
 * Export all constants as a single object for easy import
 */
export const SEQUENTIAL_THINKING_CONSTANTS = {
	PACKAGE_INFO,
	TOOL_CONSTANTS,
	THINKING_PROCESS_TYPES,
	STEP_PRIORITIES,
	STEP_STATUSES,
	WORKFLOW_STATUSES,
	OPERATION_MODES,
	MCP_SETTINGS,
	VALIDATION_RULES,
	DISPLAY_OPTIONS,
	ERROR_MESSAGES,
	SUCCESS_MESSAGES,
	DEFAULTS,
	MCP_TOOL_CATEGORIES,
} as const;

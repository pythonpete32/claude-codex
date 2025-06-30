/**
 * @fileoverview Constants for todoread-tool package
 * @module @dao/chat-items-todoread-tool/constants
 */

/**
 * Package metadata
 */
export const PACKAGE_INFO = {
	name: "@dao/chat-items-todoread-tool",
	version: "0.1.0",
	description: "chat-items/todoread-tool atomic package",
	toolName: "TodoRead",
	componentType: "todo_tool",
} as const;

/**
 * Tool configuration
 */
export const TOOL_CONFIG = {
	name: "TodoRead",
	type: "tool_use",
	category: "meta",
	priority: "high",
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
	INVALID_INPUT: "Invalid TodoRead tool input",
	INVALID_RESULT: "Invalid TodoRead tool result",
	INVALID_CHAT_ITEM: "Invalid TodoRead tool chat item",
	INVALID_TODO_ITEM: "Invalid todo item",
	VALIDATION_FAILED: "Validation failed",
	NO_TODOS_FOUND: "No todos found",
	STORAGE_ACCESS_ERROR: "Unable to access todo storage",
	CORRUPTED_DATA: "Todo list data is corrupted",
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
	TODOS_RETRIEVED: "Todos retrieved successfully",
	VALIDATION_PASSED: "Validation passed",
	EMPTY_LIST_OK: "No todos found (empty list)",
} as const;

/**
 * Todo status values
 */
export const TODO_STATUS = {
	PENDING: "pending",
	IN_PROGRESS: "in_progress",
	COMPLETED: "completed",
} as const;

/**
 * Todo priority values
 */
export const TODO_PRIORITY = {
	HIGH: "high",
	MEDIUM: "medium",
	LOW: "low",
} as const;

/**
 * Todo status display names
 */
export const TODO_STATUS_DISPLAY = {
	[TODO_STATUS.PENDING]: "Pending",
	[TODO_STATUS.IN_PROGRESS]: "In Progress",
	[TODO_STATUS.COMPLETED]: "Completed",
} as const;

/**
 * Todo priority display names
 */
export const TODO_PRIORITY_DISPLAY = {
	[TODO_PRIORITY.HIGH]: "High Priority",
	[TODO_PRIORITY.MEDIUM]: "Medium Priority",
	[TODO_PRIORITY.LOW]: "Low Priority",
} as const;

/**
 * Todo status icons
 */
export const TODO_STATUS_ICONS = {
	[TODO_STATUS.PENDING]: "○",
	[TODO_STATUS.IN_PROGRESS]: "◐",
	[TODO_STATUS.COMPLETED]: "●",
} as const;

/**
 * Todo priority indicators
 */
export const TODO_PRIORITY_INDICATORS = {
	[TODO_PRIORITY.HIGH]: "🔥",
	[TODO_PRIORITY.MEDIUM]: "⚡",
	[TODO_PRIORITY.LOW]: "💡",
} as const;

/**
 * Display limits and pagination
 */
export const DISPLAY_LIMITS = {
	MAX_TODOS_PREVIEW: 5,
	MAX_TODOS_FULL_LIST: 50,
	MAX_TODO_CONTENT_LENGTH: 100,
	TRUNCATE_THRESHOLD: 80,
} as const;

/**
 * Sorting and filtering options
 */
export const SORT_OPTIONS = {
	BY_PRIORITY: "priority",
	BY_STATUS: "status",
	BY_CREATED: "created",
	BY_CONTENT: "content",
} as const;

/**
 * Filter options
 */
export const FILTER_OPTIONS = {
	ALL: "all",
	PENDING_ONLY: "pending_only",
	IN_PROGRESS_ONLY: "in_progress_only",
	COMPLETED_ONLY: "completed_only",
	HIGH_PRIORITY_ONLY: "high_priority_only",
	ACTIVE_ONLY: "active_only", // pending + in_progress
} as const;

/**
 * Color schemes for status and priority
 */
export const COLOR_SCHEMES = {
	STATUS: {
		[TODO_STATUS.PENDING]: "#fbbf24", // yellow
		[TODO_STATUS.IN_PROGRESS]: "#3b82f6", // blue
		[TODO_STATUS.COMPLETED]: "#10b981", // green
	},
	PRIORITY: {
		[TODO_PRIORITY.HIGH]: "#ef4444", // red
		[TODO_PRIORITY.MEDIUM]: "#f59e0b", // amber
		[TODO_PRIORITY.LOW]: "#6b7280", // gray
	},
} as const;

/**
 * Analytics and metrics
 */
export const METRICS = {
	COMPLETION_THRESHOLDS: {
		LOW: 25,
		MEDIUM: 50,
		HIGH: 75,
		EXCELLENT: 90,
	},
	PROGRESS_THRESHOLDS: {
		STUCK: 10, // Less than 10% in progress
		ACTIVE: 30, // 30%+ in progress
		MOVING: 60, // 60%+ in progress/completed
	},
} as const;

/**
 * Default values
 */
export const DEFAULTS = {
	TODO_PRIORITY: TODO_PRIORITY.MEDIUM,
	TODO_STATUS: TODO_STATUS.PENDING,
	DISPLAY_MODE: "grouped", // "list" | "grouped" | "compact"
	SHOW_COMPLETED: true,
	MAX_DISPLAY_ITEMS: DISPLAY_LIMITS.MAX_TODOS_PREVIEW,
} as const;

/**
 * Validation patterns and limits
 */
export const VALIDATION = {
	TODO_ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
	MIN_CONTENT_LENGTH: 1,
	MAX_CONTENT_LENGTH: 500,
	MAX_TODOS_PER_LIST: 1000,
} as const;

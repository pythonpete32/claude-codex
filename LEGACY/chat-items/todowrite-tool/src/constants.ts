/**
 * @fileoverview Constants and configuration for todowrite-tool
 * @module @dao/chat-items-todowrite-tool/constants
 */

/**
 * Package information
 */
export const PACKAGE_INFO = {
	name: "@dao/chat-items-todowrite-tool",
	version: "1.0.0",
	description: "TodoWrite tool chat item package with comprehensive type safety and validation",
	toolName: "TodoWrite",
	author: "DAO",
	license: "MIT",
} as const;

/**
 * Tool configuration
 */
export const TOOL_CONFIG = {
	name: "TodoWrite",
	type: "tool_use",
	description: "Write and manage todo items",
	inputRequired: true,
	supportsMultipleTodos: true,
} as const;

/**
 * Todo status constants
 */
export const TODO_STATUS = {
	PENDING: "pending",
	IN_PROGRESS: "in_progress",
	COMPLETED: "completed",
} as const;

/**
 * Todo priority constants
 */
export const TODO_PRIORITY = {
	HIGH: "high",
	MEDIUM: "medium",
	LOW: "low",
} as const;

/**
 * Display constants for todo status
 */
export const TODO_STATUS_DISPLAY = {
	pending: "Pending",
	in_progress: "In Progress",
	completed: "Completed",
} as const;

/**
 * Display constants for todo priority
 */
export const TODO_PRIORITY_DISPLAY = {
	high: "High Priority",
	medium: "Medium Priority",
	low: "Low Priority",
} as const;

/**
 * Status icons for UI display
 */
export const TODO_STATUS_ICONS = {
	pending: "○",
	in_progress: "◐",
	completed: "●",
} as const;

/**
 * Priority indicators for UI display
 */
export const TODO_PRIORITY_INDICATORS = {
	high: "🔥",
	medium: "⚡",
	low: "💡",
} as const;

/**
 * Color schemes for different statuses and priorities
 */
export const COLOR_SCHEMES = {
	STATUS: {
		pending: "#fbbf24", // yellow
		in_progress: "#3b82f6", // blue
		completed: "#10b981", // green
	},
	PRIORITY: {
		high: "#ef4444", // red
		medium: "#f59e0b", // amber
		low: "#6b7280", // gray
	},
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
	INVALID_INPUT: "Invalid TodoWrite input parameters",
	INVALID_TODO_ITEM: "Invalid todo item structure",
	EMPTY_TODOS_ARRAY: "Todos array cannot be empty",
	STORAGE_UNAVAILABLE: "Todo storage system is currently unavailable",
	VALIDATION_FAILED: "Todo validation failed",
	WRITE_OPERATION_FAILED: "Todo write operation failed",
	DUPLICATE_ID: "Todo with this ID already exists",
	INVALID_STATUS: "Invalid todo status",
	INVALID_PRIORITY: "Invalid todo priority",
	EMPTY_CONTENT: "Todo content cannot be empty",
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
	TODOS_WRITTEN: "Successfully wrote todo items",
	TODOS_UPDATED: "Successfully updated todo items",
	TODOS_ADDED: "Successfully added todo items",
	MIXED_OPERATION: "Successfully processed todo items with mixed operations",
	SINGLE_TODO: "Successfully wrote 1 todo item",
	MULTIPLE_TODOS: "Successfully wrote multiple todo items",
} as const;

/**
 * Operation type constants
 */
export const OPERATION_TYPES = {
	ADD: "add",
	UPDATE: "update",
	MIXED: "mixed",
} as const;

/**
 * Validation rules
 */
export const VALIDATION = {
	MIN_CONTENT_LENGTH: 1,
	MAX_CONTENT_LENGTH: 500,
	MIN_TODOS_COUNT: 1,
	MAX_TODOS_COUNT: 100,
	ID_MIN_LENGTH: 1,
	ID_MAX_LENGTH: 50,
} as const;

/**
 * Display limits for UI components
 */
export const DISPLAY_LIMITS = {
	MAX_TODOS_PREVIEW: 5,
	MAX_CONTENT_PREVIEW: 50,
	MAX_SUMMARY_LENGTH: 100,
} as const;

/**
 * Sort options for todo lists
 */
export const SORT_OPTIONS = {
	BY_PRIORITY: "priority",
	BY_STATUS: "status",
	BY_CONTENT: "content",
	BY_ID: "id",
} as const;

/**
 * Filter options for todo lists
 */
export const FILTER_OPTIONS = {
	ALL: "all",
	PENDING: "pending",
	IN_PROGRESS: "in_progress",
	COMPLETED: "completed",
	HIGH_PRIORITY: "high",
	MEDIUM_PRIORITY: "medium",
	LOW_PRIORITY: "low",
} as const;

/**
 * Default values
 */
export const DEFAULTS = {
	TODO_STATUS: "pending",
	TODO_PRIORITY: "medium",
	MAX_DISPLAY_ITEMS: 10,
	SHOW_ICONS: true,
	SHOW_PRIORITY_INDICATORS: true,
	GROUP_BY_STATUS: false,
} as const;

/**
 * Metrics and thresholds
 */
export const METRICS = {
	COMPLETION_THRESHOLDS: {
		LOW: 25,
		MEDIUM: 50,
		HIGH: 75,
		EXCELLENT: 90,
	},
	PRIORITY_WEIGHTS: {
		high: 3,
		medium: 2,
		low: 1,
	},
	BATCH_SIZE_LIMITS: {
		SMALL: 10,
		MEDIUM: 50,
		LARGE: 100,
	},
} as const;

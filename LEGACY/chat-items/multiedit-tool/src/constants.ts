/**
 * @fileoverview Constants and metadata for the multiedit-tool package
 * @module @dao/chat-items-multiedit-tool/constants
 */

/**
 * Package metadata
 */
export const PACKAGE_NAME = "@dao/chat-items-multiedit-tool" as const;
export const PACKAGE_VERSION = "0.1.0" as const;

/**
 * Tool identifiers
 */
export const TOOL_NAME = "MultiEdit" as const;
export const TOOL_TYPE = "tool_use" as const;

/**
 * Display constants
 */
export const DEFAULT_TRUNCATION_LENGTH = 50 as const;
export const MAX_DISPLAY_EDITS = 10 as const;
export const MAX_EDIT_PREVIEW_LENGTH = 100 as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
	INVALID_INPUT: "Invalid multiedit tool input",
	INVALID_RESULT: "Invalid multiedit tool result",
	INVALID_CHAT_ITEM: "Invalid multiedit tool chat item",
	INVALID_OPERATION: "Invalid edit operation",
	FILE_NOT_FOUND: "File not found",
	PERMISSION_DENIED: "Permission denied",
	EMPTY_OLD_STRING: "old_string cannot be empty",
	NO_EDITS: "No edit operations provided",
	SAME_STRINGS: "old_string and new_string cannot be the same",
} as const;

/**
 * Status messages
 */
export const STATUS_MESSAGES = {
	APPLYING_EDITS: "Applying edits...",
	COMPLETED: "Edits applied successfully",
	PARTIAL_SUCCESS: "Some edits applied successfully",
	FAILED: "Failed to apply edits",
	NO_CHANGES: "No changes made",
} as const;

/**
 * CSS class names for component styling
 */
export const CSS_CLASSES = {
	CONTAINER: "multiedit-tool-container",
	HEADER: "multiedit-tool-header",
	FILE_PATH: "multiedit-tool-file-path",
	SUMMARY: "multiedit-tool-summary",
	EDIT_LIST: "multiedit-tool-edit-list",
	EDIT_ITEM: "multiedit-tool-edit-item",
	EDIT_OPERATION: "multiedit-tool-edit-operation",
	OLD_STRING: "multiedit-tool-old-string",
	NEW_STRING: "multiedit-tool-new-string",
	REPLACE_ALL_BADGE: "multiedit-tool-replace-all",
	SUCCESS_INDICATOR: "multiedit-tool-success",
	FAILURE_INDICATOR: "multiedit-tool-failure",
	ERROR: "multiedit-tool-error",
	STATUS: "multiedit-tool-status",
	PROGRESS_BAR: "multiedit-tool-progress",
	DETAILS: "multiedit-tool-details",
} as const;

/**
 * Default component props
 */
export const DEFAULT_PROPS = {
	className: "",
	onRetry: undefined,
} as const;

/**
 * Edit operation limits
 */
export const LIMITS = {
	MAX_EDITS_PER_REQUEST: 50,
	MAX_OLD_STRING_LENGTH: 10000,
	MAX_NEW_STRING_LENGTH: 10000,
	MAX_FILE_SIZE_MB: 10,
} as const;

/**
 * Success rate thresholds
 */
export const SUCCESS_THRESHOLDS = {
	EXCELLENT: 100,
	GOOD: 80,
	FAIR: 60,
	POOR: 40,
} as const;

/**
 * File type patterns for multiedit validation
 */
export const FILE_PATTERNS = {
	TEXT: /\.(txt|md|log|csv|yml|yaml|ini|cfg|conf)$/i,
	CODE: /\.(js|ts|jsx|tsx|py|java|c|cpp|h|hpp|cs|go|rs|rb|php|swift|kt|scala|sh|bash|sql)$/i,
	CONFIG: /\.(json|xml|toml|properties|env)$/i,
	MARKUP: /\.(html|htm|xml|svg)$/i,
	STYLE: /\.(css|scss|sass|less|styl)$/i,
} as const;

/**
 * Export all constants
 */
export const CONSTANTS = {
	PACKAGE_NAME,
	PACKAGE_VERSION,
	TOOL_NAME,
	TOOL_TYPE,
	DEFAULT_TRUNCATION_LENGTH,
	MAX_DISPLAY_EDITS,
	MAX_EDIT_PREVIEW_LENGTH,
	ERROR_MESSAGES,
	STATUS_MESSAGES,
	CSS_CLASSES,
	DEFAULT_PROPS,
	LIMITS,
	SUCCESS_THRESHOLDS,
	FILE_PATTERNS,
} as const;

export default CONSTANTS;

/**
 * @fileoverview Constants and metadata for the read-tool package
 * @module @dao/chat-items-read-tool/constants
 */

/**
 * Package metadata
 */
export const PACKAGE_NAME = "@dao/chat-items-read-tool" as const;
export const PACKAGE_VERSION = "0.1.0" as const;

/**
 * Tool identifiers
 */
export const TOOL_NAME = "Read" as const;
export const TOOL_TYPE = "tool_use" as const;

/**
 * Display constants
 */
export const DEFAULT_TRUNCATION_LENGTH = 80 as const;
export const MAX_DISPLAY_LINES = 1000 as const;
export const LINE_NUMBER_WIDTH = 6 as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
	INVALID_INPUT: "Invalid read tool input",
	INVALID_RESULT: "Invalid read tool result",
	INVALID_CHAT_ITEM: "Invalid read tool chat item",
	FILE_NOT_FOUND: "File not found",
	PERMISSION_DENIED: "Permission denied",
	BINARY_FILE: "Binary file detected",
} as const;

/**
 * Status messages
 */
export const STATUS_MESSAGES = {
	READING: "Reading file...",
	COMPLETED: "File read successfully",
	FAILED: "Failed to read file",
	TRUNCATED: "File content truncated",
} as const;

/**
 * CSS class names for component styling
 */
export const CSS_CLASSES = {
	CONTAINER: "read-tool-container",
	HEADER: "read-tool-header",
	FILE_PATH: "read-tool-file-path",
	PARAMETERS: "read-tool-parameters",
	CONTENT: "read-tool-content",
	LINE_NUMBER: "read-tool-line-number",
	LINE_CONTENT: "read-tool-line-content",
	ERROR: "read-tool-error",
	STATUS: "read-tool-status",
	TRUNCATED_NOTICE: "read-tool-truncated",
} as const;

/**
 * Default component props
 */
export const DEFAULT_PROPS = {
	className: "",
	onRetry: undefined,
} as const;

/**
 * File type patterns
 */
export const FILE_PATTERNS = {
	TEXT: /\.(txt|md|log|json|xml|csv|yml|yaml|ini|cfg|conf)$/i,
	CODE: /\.(js|ts|jsx|tsx|py|java|c|cpp|h|hpp|cs|go|rs|rb|php|swift|kt|scala|sh|bash)$/i,
	BINARY: /\.(jpg|jpeg|png|gif|bmp|ico|pdf|doc|docx|xls|xlsx|zip|tar|gz|exe|dll|so|dylib)$/i,
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
	MAX_DISPLAY_LINES,
	LINE_NUMBER_WIDTH,
	ERROR_MESSAGES,
	STATUS_MESSAGES,
	CSS_CLASSES,
	DEFAULT_PROPS,
	FILE_PATTERNS,
} as const;

export default CONSTANTS;

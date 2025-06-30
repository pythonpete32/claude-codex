/**
 * @fileoverview Constants for write-tool package
 * @module @dao/chat-items-write-tool/constants
 */

/**
 * Package metadata
 */
export const PACKAGE_INFO = {
	name: "@dao/chat-items-write-tool",
	version: "0.1.0",
	description: "chat-items/write-tool atomic package",
	toolName: "Write",
	componentType: "file_tool",
} as const;

/**
 * Tool configuration
 */
export const TOOL_CONFIG = {
	name: "Write",
	type: "tool_use",
	category: "core",
	priority: "high",
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
	INVALID_INPUT: "Invalid write tool input",
	INVALID_RESULT: "Invalid write tool result",
	INVALID_CHAT_ITEM: "Invalid write tool chat item",
	MISSING_FILE_PATH: "File path is required",
	MISSING_CONTENT: "Content is required",
	INVALID_FILE_PATH: "File path must be a non-empty string",
	VALIDATION_FAILED: "Validation failed",
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
	FILE_CREATED: "File created successfully",
	VALIDATION_PASSED: "Validation passed",
} as const;

/**
 * File operation limits
 */
export const LIMITS = {
	MAX_FILE_PATH_LENGTH: 4096,
	MAX_CONTENT_SIZE: 10 * 1024 * 1024, // 10MB
	MIN_FILE_PATH_LENGTH: 1,
} as const;

/**
 * File type categories for classification
 */
export const FILE_TYPE_CATEGORIES = {
	CODE: [
		"ts",
		"js",
		"tsx",
		"jsx",
		"py",
		"java",
		"cpp",
		"c",
		"rs",
		"go",
		"php",
		"rb",
		"swift",
		"kt",
	],
	WEB: ["html", "css", "scss", "sass", "less"],
	CONFIG: ["json", "yaml", "yml", "toml", "xml", "ini", "conf", "config"],
	DOCUMENTATION: ["md", "txt", "rst"],
	DATA: ["csv", "sql"],
	SHELL: ["sh", "bash", "zsh", "fish"],
	OTHER: ["dockerfile", "gitignore"],
} as const;

/**
 * Default content templates
 */
export const CONTENT_TEMPLATES = {
	README:
		"# {projectName}\n\nDescription of the project.\n\n## Installation\n\n```bash\nnpm install\n```\n\n## Usage\n\nDescribe how to use the project.",
	PACKAGE_JSON: `{
  "name": "{packageName}",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}`,
	GITIGNORE: "node_modules/\ndist/\n.env\n.DS_Store\n*.log",
	TSCONFIG: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}`,
} as const;

/**
 * UI display constants
 */
export const DISPLAY = {
	MAX_FILE_PATH_DISPLAY_LENGTH: 80,
	MAX_CONTENT_PREVIEW_LINES: 3,
	TRUNCATE_INDICATOR: "...",
} as const;

/**
 * Validation patterns
 */
export const VALIDATION_PATTERNS = {
	FILE_PATH: /^\/.*$/,
	RELATIVE_PATH: /^\.\.?\//,
	WINDOWS_PATH: /^[A-Za-z]:\\/,
} as const;

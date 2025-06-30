/**
 * @fileoverview Write tool chat item package
 * @module @dao/chat-items-write-tool
 */

// Constants
export {
	CONTENT_TEMPLATES,
	DISPLAY,
	ERROR_MESSAGES,
	FILE_TYPE_CATEGORIES,
	LIMITS,
	PACKAGE_INFO,
	SUCCESS_MESSAGES,
	TOOL_CONFIG,
	VALIDATION_PATTERNS,
} from "./constants";
// Fixtures
export {
	allFixtures,
	basicFixtures,
	configurationFixtures,
	documentationFixtures,
	edgeCaseFixtures,
	errorFixtures,
	fixtures,
	getFailedFixtures,
	getFixtureById,
	getFixturesByCategory,
	getFixturesByContentSize,
	getFixturesByFileExtension,
	getFixturesWithContent,
	getFixturesWithEmptyContent,
	getSuccessfulFixtures,
	sourceCodeFixtures,
} from "./fixtures";
// Parsers
export {
	extractErrorMessage,
	formatContentPreview,
	formatFilePath,
	formatWriteParameters,
	getContentStats,
	getFileExtension,
	getFileTypeCategory,
	getSuccessMessage,
	isSuccessfulWrite,
	parseWriteToolChatItem,
	parseWriteToolOutput,
} from "./parsers";

export type {
	WriteToolChatItemType,
	WriteToolComponentPropsType,
	WriteToolResultDataType,
	WriteToolResultType,
	WriteToolUseInputType,
	WriteToolUseResultType,
	WriteToolUseType,
} from "./schemas";
// Schemas
export {
	WriteToolChatItemSchema,
	WriteToolComponentPropsSchema,
	WriteToolResultDataSchema,
	WriteToolResultSchema,
	WriteToolUseInputSchema,
	WriteToolUseResultSchema,
	WriteToolUseSchema,
} from "./schemas";
// Types
export type {
	BaseToolUse,
	ToolStatus,
	WriteToolChatItem,
	WriteToolComponentProps,
	WriteToolResult,
	WriteToolResultData,
	WriteToolUse,
	WriteToolUseInput,
	WriteToolUseResult,
} from "./types";
export {
	isWriteToolChatItem,
	isWriteToolResultData,
	isWriteToolUseInput,
} from "./types";
// Validators
export {
	safeValidateWriteToolChatItem,
	safeValidateWriteToolComponentProps,
	safeValidateWriteToolResult,
	safeValidateWriteToolResultData,
	safeValidateWriteToolUse,
	safeValidateWriteToolUseInput,
	safeValidateWriteToolUseResult,
	validateWriteToolChatItem,
	validateWriteToolComponentProps,
	validateWriteToolResult,
	validateWriteToolResultData,
	validateWriteToolUse,
	validateWriteToolUseInput,
	validateWriteToolUseResult,
} from "./validators";

/**
 * @fileoverview Context7 MCP integration - Main module exports
 * @module @dao/chat-items-mcp-context7
 * @version 1.0.0
 * @license MIT
 * @author DAO
 */

// Parser exports
export {
	buildLibraryId,
	calculateRelevanceScore,
	createErrorResult,
	createSuccessResult,
	createTiming,
	extractLibraryKeywords,
	filterLibraries,
	formatCodeExampleDisplay,
	formatDocumentationDisplay,
	formatLibraryDisplay,
	generateRequestFingerprint,
	getDefaultTimeout,
	getErrorSuggestion,
	normalizeDocumentationOptions,
	normalizeResolveOptions,
	normalizeSearchCriteria,
	parseContext7McpInput,
	parseLibraryId,
	sanitizeSearchQuery,
	sortLibraries,
	validateContext7LibraryId,
} from "./parsers";
// Schema exports
export {
	CodeExampleSchema,
	Context7McpToolResultDataSchema,
	Context7McpToolUseInputSchema,
	Context7McpToolUseInputSchemaComplete,
	Context7McpToolUseInputSchemaRefined,
	Context7OperationTypeSchema,
	DocumentationContentSchema,
	DocumentationTopicSchema,
	GetDocumentationOptionsSchema,
	LibraryIdSchema,
	LibraryMetadataSchema,
	LibrarySearchCriteriaSchema,
	ResolveLibraryOptionsSchema,
} from "./schemas";
// Type exports
export type {
	BaseToolUse,
	CodeExample,
	Context7McpFixture,
	Context7McpToolChatItem,
	Context7McpToolResult,
	Context7McpToolResultData,
	Context7McpToolUse,
	Context7McpToolUseInput,
	Context7OperationType,
	DocumentationContent,
	DocumentationTopic,
	GetDocumentationOptions,
	LibraryId,
	LibraryMetadata,
	LibrarySearchCriteria,
	ResolveLibraryOptions,
	ToolStatus,
} from "./types";
// Type guards
export {
	isContext7McpToolChatItem,
	isContext7McpToolResultData,
	isContext7McpToolUseInput,
	isDocumentationContent,
	isLibraryMetadata,
} from "./types";
// Validator exports
export {
	safeValidateCodeExample,
	safeValidateContext7McpToolResultData,
	safeValidateContext7McpToolUseInput,
	safeValidateDocumentationContent,
	safeValidateGetDocumentationOptions,
	safeValidateLibraryMetadata,
	safeValidateLibrarySearchCriteria,
	safeValidateResolveLibraryOptions,
	validateCodeExample,
	validateContentType,
	validateContext7McpToolResultData,
	validateContext7McpToolUseInput,
	validateContext7McpToolUseInputComprehensive,
	validateDifficulty,
	validateDocumentationContent,
	validateDocumentationTopic,
	validateGetDocumentationOptions,
	validateLanguage,
	validateLibraryId,
	validateLibraryMetadata,
	validateLibrarySearchCriteria,
	validateOperationRequirements,
	validatePackageManager,
	validateResolveLibraryOptions,
	validateSortOrder,
	validateTimeout,
	validateTokenCount,
	validateTrustScore,
	validateUrl,
} from "./validators";

import { namedFixtures } from "./fixtures";
import { createErrorResult, createSuccessResult, parseContext7McpInput } from "./parsers";
// Import functions needed for default export
import { validateContext7McpToolUseInput } from "./validators";

// Constants exports
export {
	CACHE_CONFIG,
	CONTENT_TYPES,
	CONTEXT7_CONFIG,
	CONTEXT7_OPERATIONS,
	DEFAULTS,
	ERROR_CATEGORIES,
	PACKAGE_INFO,
	PACKAGE_MANAGERS,
	PERFORMANCE_THRESHOLDS,
	PROGRAMMING_LANGUAGES,
	SORT_OPTIONS,
	SUCCESS_MESSAGES,
	TOOL_CONSTANTS,
	VALIDATION_RULES,
} from "./constants";
// Fixture exports
export {
	apiReferenceFixtures,
	documentationFixtures,
	errorFixtures,
	examplesFixtures,
	fixtureHelpers,
	fixtureStats,
	fixtures,
	fixtureValidation,
	getFixtureByName,
	getFixturesByCategory,
	infoFixtures,
	listingFixtures,
	namedFixtures,
	resolveFixtures,
	searchFixtures,
	validationFixtures,
} from "./fixtures";

/**
 * Default export - Package information and main functionality
 */
export default {
	name: "@dao/chat-items-mcp-context7",
	version: "1.0.0",
	description:
		"Context7 MCP integration for documentation lookup and library integration with comprehensive type safety and validation",
	license: "MIT",
	author: "DAO",
	validateInput: validateContext7McpToolUseInput,
	parseInput: parseContext7McpInput,
	createSuccessResult,
	createErrorResult,
	fixtures: namedFixtures,
} as const;

/**
 * Package metadata and version information
 * @readonly
 */
export const PACKAGE_METADATA = {
	name: "@dao/chat-items-mcp-context7",
	version: "1.0.0",
	description:
		"Context7 MCP integration for documentation lookup and library integration with comprehensive type safety and validation",
	license: "MIT",
	author: "DAO",
	exports: {
		types: 28,
		schemas: 11,
		validators: 25,
		parsers: 19,
		fixtures: 10,
		constants: 9,
		utilities: 15,
	},
	features: [
		"Context7 library resolution",
		"Documentation retrieval",
		"Code example fetching",
		"Library search and filtering",
		"Comprehensive type validation",
		"Fixture-driven testing",
		"Performance monitoring",
		"Error handling with suggestions",
		"Caching support",
		"8 operation types",
	],
	compatibility: {
		context7: "v1",
		mcp: "latest",
		typescript: ">=5.0.0",
		frameworks: ["Claude", "MCP", "Context7"],
	},
} as const;

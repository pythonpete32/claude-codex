/**
 * @fileoverview TypeScript validators for Context7 MCP integration
 */

import {
	CodeExampleSchema,
	Context7McpToolResultDataSchema,
	Context7McpToolUseInputSchemaComplete,
	DocumentationContentSchema,
	GetDocumentationOptionsSchema,
	LibraryMetadataSchema,
	LibrarySearchCriteriaSchema,
	ResolveLibraryOptionsSchema,
} from "./schemas";
import type {
	CodeExample,
	Context7McpToolResultData,
	Context7McpToolUseInput,
	DocumentationContent,
	GetDocumentationOptions,
	LibraryMetadata,
	LibrarySearchCriteria,
	ResolveLibraryOptions,
} from "./types";

/**
 * Validates Context7 MCP tool use input and throws on validation errors
 */
export function validateContext7McpToolUseInput(input: unknown): Context7McpToolUseInput {
	const result = Context7McpToolUseInputSchemaComplete.safeParse(input);
	if (!result.success) {
		throw new Error(`Invalid Context7 MCP tool use input: ${result.error.message}`);
	}
	return result.data;
}

/**
 * Validates Context7 MCP tool result data and throws on validation errors
 */
export function validateContext7McpToolResultData(result: unknown): Context7McpToolResultData {
	const validationResult = Context7McpToolResultDataSchema.safeParse(result);
	if (!validationResult.success) {
		throw new Error(`Invalid Context7 MCP tool result data: ${validationResult.error.message}`);
	}
	return validationResult.data;
}

/**
 * Validates library metadata and throws on validation errors
 */
export function validateLibraryMetadata(metadata: unknown): LibraryMetadata {
	const result = LibraryMetadataSchema.safeParse(metadata);
	if (!result.success) {
		throw new Error(`Invalid library metadata: ${result.error.message}`);
	}
	return result.data;
}

/**
 * Validates documentation content and throws on validation errors
 */
export function validateDocumentationContent(content: unknown): DocumentationContent {
	const result = DocumentationContentSchema.safeParse(content);
	if (!result.success) {
		throw new Error(`Invalid documentation content: ${result.error.message}`);
	}
	return result.data;
}

/**
 * Validates code example and throws on validation errors
 */
export function validateCodeExample(example: unknown): CodeExample {
	const result = CodeExampleSchema.safeParse(example);
	if (!result.success) {
		throw new Error(`Invalid code example: ${result.error.message}`);
	}
	return result.data;
}

/**
 * Validates library search criteria and throws on validation errors
 */
export function validateLibrarySearchCriteria(criteria: unknown): LibrarySearchCriteria {
	const result = LibrarySearchCriteriaSchema.safeParse(criteria);
	if (!result.success) {
		throw new Error(`Invalid library search criteria: ${result.error.message}`);
	}
	return result.data;
}

/**
 * Validates resolve library options and throws on validation errors
 */
export function validateResolveLibraryOptions(options: unknown): ResolveLibraryOptions {
	const result = ResolveLibraryOptionsSchema.safeParse(options);
	if (!result.success) {
		throw new Error(`Invalid resolve library options: ${result.error.message}`);
	}
	return result.data;
}

/**
 * Validates get documentation options and throws on validation errors
 */
export function validateGetDocumentationOptions(options: unknown): GetDocumentationOptions {
	const result = GetDocumentationOptionsSchema.safeParse(options);
	if (!result.success) {
		throw new Error(`Invalid get documentation options: ${result.error.message}`);
	}
	return result.data;
}

/**
 * Safe validator for Context7 MCP tool use input (returns null on validation errors)
 */
export function safeValidateContext7McpToolUseInput(
	input: unknown,
): Context7McpToolUseInput | null {
	try {
		return validateContext7McpToolUseInput(input);
	} catch {
		return null;
	}
}

/**
 * Safe validator for Context7 MCP tool result data (returns null on validation errors)
 */
export function safeValidateContext7McpToolResultData(
	result: unknown,
): Context7McpToolResultData | null {
	try {
		return validateContext7McpToolResultData(result);
	} catch {
		return null;
	}
}

/**
 * Safe validator for library metadata (returns null on validation errors)
 */
export function safeValidateLibraryMetadata(metadata: unknown): LibraryMetadata | null {
	try {
		return validateLibraryMetadata(metadata);
	} catch {
		return null;
	}
}

/**
 * Safe validator for documentation content (returns null on validation errors)
 */
export function safeValidateDocumentationContent(content: unknown): DocumentationContent | null {
	try {
		return validateDocumentationContent(content);
	} catch {
		return null;
	}
}

/**
 * Safe validator for code example (returns null on validation errors)
 */
export function safeValidateCodeExample(example: unknown): CodeExample | null {
	try {
		return validateCodeExample(example);
	} catch {
		return null;
	}
}

/**
 * Safe validator for library search criteria (returns null on validation errors)
 */
export function safeValidateLibrarySearchCriteria(criteria: unknown): LibrarySearchCriteria | null {
	try {
		return validateLibrarySearchCriteria(criteria);
	} catch {
		return null;
	}
}

/**
 * Safe validator for resolve library options (returns null on validation errors)
 */
export function safeValidateResolveLibraryOptions(options: unknown): ResolveLibraryOptions | null {
	try {
		return validateResolveLibraryOptions(options);
	} catch {
		return null;
	}
}

/**
 * Safe validator for get documentation options (returns null on validation errors)
 */
export function safeValidateGetDocumentationOptions(
	options: unknown,
): GetDocumentationOptions | null {
	try {
		return validateGetDocumentationOptions(options);
	} catch {
		return null;
	}
}

/**
 * Validates library ID format
 */
export function validateLibraryId(libraryId: string): boolean {
	return /^\/[^/]+\/[^/]+(?:\/.*)?$/.test(libraryId);
}

/**
 * Validates documentation topic format
 */
export function validateDocumentationTopic(topic: string): boolean {
	return /^[a-zA-Z0-9\-_\s]+$/.test(topic) && topic.length >= 1 && topic.length <= 100;
}

/**
 * Validates URL format
 */
export function validateUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

/**
 * Validates trust score range
 */
export function validateTrustScore(score: number): boolean {
	return score >= 0 && score <= 10;
}

/**
 * Validates token count range
 */
export function validateTokenCount(tokens: number): boolean {
	return tokens >= 100 && tokens <= 100000;
}

/**
 * Validates timeout value
 */
export function validateTimeout(timeout: number): boolean {
	return timeout >= 1000 && timeout <= 300000;
}

/**
 * Validates programming language name
 */
export function validateLanguage(language: string): boolean {
	return /^[a-zA-Z][a-zA-Z0-9+\-#]*$/.test(language) && language.length <= 30;
}

/**
 * Validates package manager name
 */
export function validatePackageManager(manager: string): boolean {
	return ["npm", "pypi", "maven", "nuget", "gem", "cargo", "go", "composer"].includes(manager);
}

/**
 * Validates content type
 */
export function validateContentType(type: string): boolean {
	return ["guide", "reference", "tutorial", "example", "changelog", "readme"].includes(type);
}

/**
 * Validates sort order
 */
export function validateSortOrder(sortBy: string): boolean {
	return ["relevance", "trust-score", "popularity", "updated", "name"].includes(sortBy);
}

/**
 * Validates difficulty level
 */
export function validateDifficulty(difficulty: string): boolean {
	return ["beginner", "intermediate", "advanced"].includes(difficulty);
}

/**
 * Complex validation: ensures operation-specific fields are present and valid
 */
export function validateOperationRequirements(input: Context7McpToolUseInput): boolean {
	switch (input.operation) {
		case "resolve-library-id":
			return (
				input.resolve !== undefined &&
				input.resolve.libraryName.length > 0 &&
				input.resolve.libraryName.length <= 100
			);
		case "get-library-docs":
		case "get-code-examples":
		case "get-api-reference":
			return (
				input.documentation !== undefined &&
				validateLibraryId(input.documentation.libraryId) &&
				(input.documentation.topic === undefined ||
					validateDocumentationTopic(input.documentation.topic)) &&
				(input.documentation.tokens === undefined || validateTokenCount(input.documentation.tokens))
			);
		case "search-documentation":
		case "list-libraries":
			return (
				input.search !== undefined &&
				(input.search.query === undefined || input.search.query.length <= 200) &&
				(input.search.limit === undefined ||
					(input.search.limit >= 1 && input.search.limit <= 100)) &&
				(input.search.minTrustScore === undefined || validateTrustScore(input.search.minTrustScore))
			);
		case "get-library-info":
		case "validate-library-usage":
			return true; // These operations have flexible requirements
		default:
			return false;
	}
}

/**
 * Comprehensive validation function that checks all aspects of input
 */
export function validateContext7McpToolUseInputComprehensive(
	input: unknown,
): Context7McpToolUseInput {
	// First validate with schema
	const validatedInput = validateContext7McpToolUseInput(input);

	// Then validate operation-specific requirements
	if (!validateOperationRequirements(validatedInput)) {
		throw new Error(
			`Operation '${validatedInput.operation}' missing required fields or has invalid values`,
		);
	}

	return validatedInput;
}

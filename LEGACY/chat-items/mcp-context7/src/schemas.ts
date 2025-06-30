/**
 * @fileoverview Zod validation schemas for Context7 MCP integration
 */

import { z } from "zod";

/**
 * Context7 operation type schema
 */
export const Context7OperationTypeSchema = z.enum([
	"resolve-library-id",
	"get-library-docs",
	"search-documentation",
	"get-library-info",
	"list-libraries",
	"get-code-examples",
	"validate-library-usage",
	"get-api-reference",
]);

/**
 * Library ID schema - validates Context7 format
 */
export const LibraryIdSchema = z
	.string()
	.min(1, "Library ID cannot be empty")
	.regex(
		/^\/[^/]+\/[^/]+(?:\/.*)?$/,
		"Library ID must be in format '/org/project' or '/org/project/version'",
	)
	.max(200, "Library ID too long");

/**
 * Documentation topic schema
 */
export const DocumentationTopicSchema = z
	.string()
	.min(1, "Topic cannot be empty")
	.max(100, "Topic too long")
	.regex(/^[a-zA-Z0-9\-_\s]+$/, "Topic contains invalid characters");

/**
 * Library metadata schema
 */
export const LibraryMetadataSchema = z.object({
	id: LibraryIdSchema,
	name: z.string().min(1, "Library name required").max(100, "Library name too long"),
	description: z.string().max(500, "Description too long"),
	website: z.string().url("Invalid website URL").optional(),
	repository: z.string().url("Invalid repository URL").optional(),
	packageManager: z
		.enum(["npm", "pypi", "maven", "nuget", "gem", "cargo", "go", "composer"])
		.optional(),
	packageName: z.string().max(100, "Package name too long").optional(),
	version: z.string().max(50, "Version string too long").optional(),
	trustScore: z
		.number()
		.min(0, "Trust score cannot be negative")
		.max(10, "Trust score cannot exceed 10")
		.optional(),
	codeSnippetCount: z.number().min(0, "Code snippet count cannot be negative").optional(),
	sections: z.array(z.string().max(50, "Section name too long")).optional(),
	platforms: z.array(z.string().max(30, "Platform name too long")).optional(),
	languages: z.array(z.string().max(30, "Language name too long")).optional(),
	tags: z.array(z.string().max(30, "Tag too long")).optional(),
});

/**
 * Code example schema
 */
export const CodeExampleSchema = z.object({
	language: z.string().min(1, "Language required").max(30, "Language name too long"),
	code: z.string().min(1, "Code cannot be empty").max(10000, "Code too long"),
	title: z.string().max(100, "Title too long").optional(),
	description: z.string().max(500, "Description too long").optional(),
	filename: z.string().max(100, "Filename too long").optional(),
	dependencies: z.array(z.string().max(50, "Dependency name too long")).optional(),
	context: z.string().max(200, "Context too long").optional(),
});

/**
 * Documentation content schema
 */
export const DocumentationContentSchema = z.object({
	title: z.string().min(1, "Title required").max(200, "Title too long"),
	content: z.string().min(1, "Content cannot be empty").max(50000, "Content too long"),
	type: z.enum(["guide", "reference", "tutorial", "example", "changelog", "readme"]),
	url: z.string().url("Invalid URL").optional(),
	section: z.string().max(50, "Section name too long").optional(),
	codeExamples: z.array(CodeExampleSchema).optional(),
	metadata: z
		.object({
			lastModified: z.string().optional(),
			version: z.string().max(50, "Version too long").optional(),
			difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
			estimatedReadTime: z
				.number()
				.min(0, "Read time cannot be negative")
				.max(1440, "Read time too long")
				.optional(),
		})
		.optional(),
});

/**
 * Library search criteria schema
 */
export const LibrarySearchCriteriaSchema = z.object({
	query: z.string().max(200, "Query too long").optional(),
	language: z.string().max(30, "Language name too long").optional(),
	platform: z.string().max(30, "Platform name too long").optional(),
	category: z.string().max(50, "Category name too long").optional(),
	minTrustScore: z
		.number()
		.min(0, "Trust score cannot be negative")
		.max(10, "Trust score cannot exceed 10")
		.optional(),
	limit: z
		.number()
		.min(1, "Limit must be at least 1")
		.max(100, "Limit cannot exceed 100")
		.optional(),
	sortBy: z.enum(["relevance", "trust-score", "popularity", "updated", "name"]).optional(),
});

/**
 * Resolve library options schema
 */
export const ResolveLibraryOptionsSchema = z.object({
	libraryName: z.string().min(1, "Library name required").max(100, "Library name too long"),
	packageManager: z
		.enum(["npm", "pypi", "maven", "nuget", "gem", "cargo", "go", "composer"])
		.optional(),
	language: z.string().max(30, "Language name too long").optional(),
	context: z.string().max(200, "Context too long").optional(),
});

/**
 * Get documentation options schema
 */
export const GetDocumentationOptionsSchema = z.object({
	libraryId: LibraryIdSchema,
	topic: DocumentationTopicSchema.optional(),
	tokens: z.number().min(100, "Token count too low").max(100000, "Token count too high").optional(),
	includeExamples: z.boolean().optional(),
	sections: z.array(z.string().max(50, "Section name too long")).optional(),
	contentTypes: z
		.array(z.enum(["guide", "reference", "tutorial", "example", "changelog", "readme"]))
		.optional(),
});

/**
 * Context7 MCP tool use input schema
 */
export const Context7McpToolUseInputSchema = z.object({
	operation: Context7OperationTypeSchema,
	resolve: ResolveLibraryOptionsSchema.optional(),
	documentation: GetDocumentationOptionsSchema.optional(),
	search: LibrarySearchCriteriaSchema.optional(),
	timeout: z.number().min(1000, "Timeout too short").max(300000, "Timeout too long").optional(),
	debug: z.boolean().optional(),
	useCache: z.boolean().optional(),
	metadata: z
		.object({
			requestId: z.string().max(100, "Request ID too long").optional(),
			userId: z.string().max(100, "User ID too long").optional(),
			sessionId: z.string().max(100, "Session ID too long").optional(),
			timestamp: z.number().min(0, "Timestamp cannot be negative").optional(),
		})
		.optional(),
});

/**
 * Context7 MCP tool result data schema
 */
export const Context7McpToolResultDataSchema = z.object({
	operation: Context7OperationTypeSchema,
	success: z.boolean(),
	message: z.string().min(1, "Message required").max(1000, "Message too long"),
	library: LibraryMetadataSchema.optional(),
	libraries: z.array(LibraryMetadataSchema).optional(),
	documentation: z.array(DocumentationContentSchema).optional(),
	examples: z.array(CodeExampleSchema).optional(),
	resultCount: z.number().min(0, "Result count cannot be negative").optional(),
	totalResults: z.number().min(0, "Total results cannot be negative").optional(),
	timing: z
		.object({
			startTime: z.number().min(0, "Start time cannot be negative"),
			endTime: z.number().min(0, "End time cannot be negative"),
			duration: z.number().min(0, "Duration cannot be negative"),
			cacheHit: z.boolean().optional(),
		})
		.optional(),
	error: z
		.object({
			code: z.string().min(1, "Error code required").max(50, "Error code too long"),
			message: z.string().min(1, "Error message required").max(500, "Error message too long"),
			details: z.unknown().optional(),
			suggestion: z.string().max(300, "Suggestion too long").optional(),
		})
		.optional(),
	metadata: z
		.object({
			requestId: z.string().max(100, "Request ID too long").optional(),
			version: z.string().max(20, "Version too long").optional(),
			source: z.string().max(50, "Source too long").optional(),
			tokenUsage: z.number().min(0, "Token usage cannot be negative").optional(),
		})
		.optional(),
});

/**
 * Refinement to ensure operation-specific fields are present
 */
export const Context7McpToolUseInputSchemaRefined = Context7McpToolUseInputSchema.refine(
	(data) => {
		switch (data.operation) {
			case "resolve-library-id":
				return data.resolve !== undefined;
			case "get-library-docs":
			case "get-code-examples":
			case "get-api-reference":
				return data.documentation !== undefined;
			case "search-documentation":
			case "list-libraries":
				return data.search !== undefined;
			default:
				return true;
		}
	},
	{
		message: "Required operation-specific fields missing",
		path: ["operation"],
	},
);

/**
 * Export all schemas
 */
export { Context7McpToolUseInputSchemaRefined as Context7McpToolUseInputSchemaComplete };

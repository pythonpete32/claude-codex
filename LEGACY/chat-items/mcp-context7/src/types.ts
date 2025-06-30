/**
 * @fileoverview TypeScript types for Context7 MCP integration
 */

import type { BaseToolUse, ToolStatus } from "@dao/chat-items-common-types";

/**
 * Context7 operation types
 */
export type Context7OperationType =
	| "resolve-library-id"
	| "get-library-docs"
	| "search-documentation"
	| "get-library-info"
	| "list-libraries"
	| "get-code-examples"
	| "validate-library-usage"
	| "get-api-reference";

/**
 * Library ID format (e.g., '/mongodb/docs', '/vercel/next.js', '/supabase/supabase')
 */
export type LibraryId = string;

/**
 * Documentation search topic (e.g., 'hooks', 'routing', 'authentication')
 */
export type DocumentationTopic = string;

/**
 * Library metadata information
 */
export interface LibraryMetadata {
	/** Library ID in Context7 format */
	id: LibraryId;
	/** Display name of the library */
	name: string;
	/** Brief description */
	description: string;
	/** Official website URL */
	website?: string;
	/** Repository URL */
	repository?: string;
	/** Package manager name (npm, pypi, etc.) */
	packageManager?: string;
	/** Package name in package manager */
	packageName?: string;
	/** Latest version */
	version?: string;
	/** Trust score (0-10) */
	trustScore?: number;
	/** Number of code snippets available */
	codeSnippetCount?: number;
	/** Available documentation sections */
	sections?: string[];
	/** Supported platforms/frameworks */
	platforms?: string[];
	/** Programming languages */
	languages?: string[];
	/** Tags/categories */
	tags?: string[];
}

/**
 * Documentation content structure
 */
export interface DocumentationContent {
	/** Content title */
	title: string;
	/** Content body/text */
	content: string;
	/** Content type */
	type: "guide" | "reference" | "tutorial" | "example" | "changelog" | "readme";
	/** Content URL (if available) */
	url?: string;
	/** Section/category */
	section?: string;
	/** Code examples included */
	codeExamples?: CodeExample[];
	/** Content metadata */
	metadata?: {
		lastModified?: string;
		version?: string;
		difficulty?: "beginner" | "intermediate" | "advanced";
		estimatedReadTime?: number;
	};
}

/**
 * Code example structure
 */
export interface CodeExample {
	/** Programming language */
	language: string;
	/** Code content */
	code: string;
	/** Example title/description */
	title?: string;
	/** Example explanation */
	description?: string;
	/** File name (if applicable) */
	filename?: string;
	/** Dependencies required */
	dependencies?: string[];
	/** Usage context */
	context?: string;
}

/**
 * Library search criteria
 */
export interface LibrarySearchCriteria {
	/** Search query/keyword */
	query?: string;
	/** Filter by programming language */
	language?: string;
	/** Filter by platform/framework */
	platform?: string;
	/** Filter by category/tag */
	category?: string;
	/** Minimum trust score */
	minTrustScore?: number;
	/** Maximum results to return */
	limit?: number;
	/** Sort order */
	sortBy?: "relevance" | "trust-score" | "popularity" | "updated" | "name";
}

/**
 * Context7 resolve library operation input
 */
export interface ResolveLibraryOptions {
	/** Library name to resolve */
	libraryName: string;
	/** Preferred package manager context */
	packageManager?: string;
	/** Programming language context */
	language?: string;
	/** Additional context for disambiguation */
	context?: string;
}

/**
 * Context7 get documentation operation input
 */
export interface GetDocumentationOptions {
	/** Context7-compatible library ID */
	libraryId: LibraryId;
	/** Specific topic to focus on */
	topic?: DocumentationTopic;
	/** Maximum tokens to retrieve */
	tokens?: number;
	/** Include code examples */
	includeExamples?: boolean;
	/** Documentation sections to include */
	sections?: string[];
	/** Content types to include */
	contentTypes?: Array<"guide" | "reference" | "tutorial" | "example" | "changelog" | "readme">;
}

/**
 * Context7 MCP tool use input
 */
export interface Context7McpToolUseInput {
	/** Operation to perform */
	operation: Context7OperationType;
	/** Resolve library operation options */
	resolve?: ResolveLibraryOptions;
	/** Get documentation operation options */
	documentation?: GetDocumentationOptions;
	/** Search criteria */
	search?: LibrarySearchCriteria;
	/** Request timeout in milliseconds */
	timeout?: number;
	/** Enable debug output */
	debug?: boolean;
	/** Cache results */
	useCache?: boolean;
	/** Request metadata */
	metadata?: {
		requestId?: string;
		userId?: string;
		sessionId?: string;
		timestamp?: number;
	};
}

/**
 * Context7 MCP tool result data
 */
export interface Context7McpToolResultData {
	/** Operation that was performed */
	operation: Context7OperationType;
	/** Whether the operation was successful */
	success: boolean;
	/** Result message */
	message: string;
	/** Resolved library metadata (for resolve operations) */
	library?: LibraryMetadata;
	/** Multiple libraries (for search operations) */
	libraries?: LibraryMetadata[];
	/** Documentation content (for documentation operations) */
	documentation?: DocumentationContent[];
	/** Code examples (for example operations) */
	examples?: CodeExample[];
	/** Search results count */
	resultCount?: number;
	/** Total available results */
	totalResults?: number;
	/** Request timing information */
	timing?: {
		startTime: number;
		endTime: number;
		duration: number;
		cacheHit?: boolean;
	};
	/** Error details if operation failed */
	error?: {
		code: string;
		message: string;
		details?: unknown;
		suggestion?: string;
	};
	/** Response metadata */
	metadata?: {
		requestId?: string;
		version?: string;
		source?: string;
		tokenUsage?: number;
	};
}

/**
 * Tool use structure for Context7 MCP operations
 */
export interface Context7McpToolUse extends BaseToolUse<"Context7Mcp", Context7McpToolUseInput> {
	type: "tool_use";
}

/**
 * Tool result structure for Context7 MCP operations
 */
export interface Context7McpToolResult {
	tool_use_id: string;
	output: Context7McpToolResultData;
	status: ToolStatus;
}

/**
 * Chat item structure for Context7 MCP tool use
 */
export interface Context7McpToolChatItem {
	type: "tool_use";
	toolUse: Context7McpToolUse;
	toolUseResult: Context7McpToolResult;
}

/**
 * Context7 MCP fixture data structure
 */
export interface Context7McpFixture {
	name: string;
	category: string;
	data: Context7McpToolChatItem;
}

/**
 * Type guard for Context7McpToolUseInput
 */
export function isContext7McpToolUseInput(value: unknown): value is Context7McpToolUseInput {
	return (
		typeof value === "object" &&
		value !== null &&
		"operation" in value &&
		typeof (value as Context7McpToolUseInput).operation === "string" &&
		[
			"resolve-library-id",
			"get-library-docs",
			"search-documentation",
			"get-library-info",
			"list-libraries",
			"get-code-examples",
			"validate-library-usage",
			"get-api-reference",
		].includes((value as Context7McpToolUseInput).operation)
	);
}

/**
 * Type guard for LibraryMetadata
 */
export function isLibraryMetadata(value: unknown): value is LibraryMetadata {
	return (
		typeof value === "object" &&
		value !== null &&
		"id" in value &&
		"name" in value &&
		typeof (value as LibraryMetadata).id === "string" &&
		typeof (value as LibraryMetadata).name === "string"
	);
}

/**
 * Type guard for DocumentationContent
 */
export function isDocumentationContent(value: unknown): value is DocumentationContent {
	return (
		typeof value === "object" &&
		value !== null &&
		"title" in value &&
		"content" in value &&
		"type" in value &&
		typeof (value as DocumentationContent).title === "string" &&
		typeof (value as DocumentationContent).content === "string" &&
		typeof (value as DocumentationContent).type === "string"
	);
}

/**
 * Type guard for Context7McpToolResultData
 */
export function isContext7McpToolResultData(value: unknown): value is Context7McpToolResultData {
	return (
		typeof value === "object" &&
		value !== null &&
		"operation" in value &&
		"success" in value &&
		"message" in value &&
		typeof (value as Context7McpToolResultData).operation === "string" &&
		typeof (value as Context7McpToolResultData).success === "boolean" &&
		typeof (value as Context7McpToolResultData).message === "string"
	);
}

/**
 * Type guard for Context7McpToolChatItem
 */
export function isContext7McpToolChatItem(item: unknown): item is Context7McpToolChatItem {
	return (
		typeof item === "object" &&
		item !== null &&
		(item as Context7McpToolChatItem).type === "tool_use" &&
		"toolUse" in item &&
		(item as Context7McpToolChatItem).toolUse.name === "Context7Mcp"
	);
}

/**
 * Export all types
 */
export type {
	BaseToolUse,
	ToolStatus,
} from "@dao/chat-items-common-types";

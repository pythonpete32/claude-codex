/**
 * @fileoverview Data transformation and parsing utilities for Context7 MCP integration
 */

import type {
	CodeExample,
	Context7McpToolResultData,
	Context7McpToolUseInput,
	Context7OperationType,
	DocumentationContent,
	GetDocumentationOptions,
	LibraryMetadata,
	LibrarySearchCriteria,
	ResolveLibraryOptions,
} from "./types";

/**
 * Parses and normalizes Context7 MCP tool use input
 */
export function parseContext7McpInput(input: Context7McpToolUseInput): Context7McpToolUseInput {
	const parsed: Context7McpToolUseInput = {
		operation: input.operation,
		timeout: input.timeout || getDefaultTimeout(input.operation),
		debug: input.debug || false,
		useCache: input.useCache !== false, // Default to true
	};

	// Add operation-specific fields
	if (input.resolve) {
		parsed.resolve = normalizeResolveOptions(input.resolve);
	}

	if (input.documentation) {
		parsed.documentation = normalizeDocumentationOptions(input.documentation);
	}

	if (input.search) {
		parsed.search = normalizeSearchCriteria(input.search);
	}

	if (input.metadata) {
		parsed.metadata = {
			...input.metadata,
			timestamp: input.metadata.timestamp || Date.now(),
		};
	}

	return parsed;
}

/**
 * Gets default timeout for each operation type
 */
export function getDefaultTimeout(operation: Context7OperationType): number {
	const timeouts: Record<Context7OperationType, number> = {
		"resolve-library-id": 15000, // 15 seconds
		"get-library-docs": 30000, // 30 seconds
		"search-documentation": 20000, // 20 seconds
		"get-library-info": 10000, // 10 seconds
		"list-libraries": 25000, // 25 seconds
		"get-code-examples": 20000, // 20 seconds
		"validate-library-usage": 15000, // 15 seconds
		"get-api-reference": 25000, // 25 seconds
	};
	return timeouts[operation];
}

/**
 * Normalizes resolve library options
 */
export function normalizeResolveOptions(options: ResolveLibraryOptions): ResolveLibraryOptions {
	return {
		libraryName: options.libraryName.trim(),
		packageManager: options.packageManager,
		language: options.language?.toLowerCase(),
		context: options.context?.trim(),
	};
}

/**
 * Normalizes documentation options
 */
export function normalizeDocumentationOptions(
	options: GetDocumentationOptions,
): GetDocumentationOptions {
	return {
		libraryId: options.libraryId.trim(),
		topic: options.topic?.trim().toLowerCase(),
		tokens: options.tokens || 10000,
		includeExamples: options.includeExamples !== false, // Default to true
		sections: options.sections?.map((s) => s.trim()),
		contentTypes: options.contentTypes || ["guide", "reference", "tutorial"],
	};
}

/**
 * Normalizes search criteria
 */
export function normalizeSearchCriteria(criteria: LibrarySearchCriteria): LibrarySearchCriteria {
	return {
		query: criteria.query?.trim(),
		language: criteria.language?.toLowerCase(),
		platform: criteria.platform?.toLowerCase(),
		category: criteria.category?.toLowerCase(),
		minTrustScore: criteria.minTrustScore || 0,
		limit: criteria.limit || 10,
		sortBy: criteria.sortBy || "relevance",
	};
}

/**
 * Creates a success result
 */
export function createSuccessResult(
	operation: Context7OperationType,
	message: string,
	data: Partial<Context7McpToolResultData> = {},
): Context7McpToolResultData {
	return {
		operation,
		success: true,
		message,
		...data,
	};
}

/**
 * Creates an error result
 */
export function createErrorResult(
	operation: Context7OperationType,
	error: Error | string,
	code: string = "CONTEXT7_ERROR",
): Context7McpToolResultData {
	const errorMessage = typeof error === "string" ? error : error.message;

	return {
		operation,
		success: false,
		message: `Context7 operation failed: ${errorMessage}`,
		error: {
			code,
			message: errorMessage,
			suggestion: getErrorSuggestion(code),
		},
	};
}

/**
 * Gets error suggestion based on error code
 */
export function getErrorSuggestion(code: string): string {
	const suggestions: Record<string, string> = {
		LIBRARY_NOT_FOUND: "Try using a more specific library name or check the spelling",
		INVALID_LIBRARY_ID:
			"Ensure the library ID follows the format '/org/project' or '/org/project/version'",
		DOCUMENTATION_NOT_AVAILABLE: "Try a different topic or check if the library has documentation",
		TIMEOUT_ERROR: "The request timed out, try reducing the token count or check your connection",
		RATE_LIMIT_EXCEEDED: "Too many requests, please wait before trying again",
		INVALID_CREDENTIALS: "Check your Context7 API credentials",
		NETWORK_ERROR: "Check your internet connection and try again",
		CONTEXT7_ERROR: "General Context7 error, check the error details for more information",
	};
	return suggestions[code] || "Please check the error details and try again";
}

/**
 * Formats library metadata for display
 */
export function formatLibraryDisplay(library: LibraryMetadata): string {
	let display = `📚 **${library.name}** (${library.id})`;

	if (library.description) {
		display += `\n${library.description}`;
	}

	if (library.version) {
		display += `\n🏷️ Version: ${library.version}`;
	}

	if (library.trustScore !== undefined) {
		const stars = "⭐".repeat(Math.round(library.trustScore / 2));
		display += `\n${stars} Trust Score: ${library.trustScore}/10`;
	}

	if (library.codeSnippetCount) {
		display += `\n📝 ${library.codeSnippetCount} code examples available`;
	}

	if (library.languages && library.languages.length > 0) {
		display += `\n💻 Languages: ${library.languages.join(", ")}`;
	}

	if (library.website) {
		display += `\n🌐 [Website](${library.website})`;
	}

	return display;
}

/**
 * Formats documentation content for display
 */
export function formatDocumentationDisplay(doc: DocumentationContent): string {
	let display = `📖 **${doc.title}**`;

	if (doc.type) {
		const typeEmojis: Record<string, string> = {
			guide: "📘",
			reference: "📚",
			tutorial: "🎓",
			example: "💡",
			changelog: "📋",
			readme: "📄",
		};
		display += ` ${typeEmojis[doc.type] || "📄"}`;
	}

	if (doc.section) {
		display += `\n📂 Section: ${doc.section}`;
	}

	if (doc.metadata?.difficulty) {
		const difficultyEmojis = {
			beginner: "🟢",
			intermediate: "🟡",
			advanced: "🔴",
		};
		display += `\n${difficultyEmojis[doc.metadata.difficulty]} ${doc.metadata.difficulty}`;
	}

	if (doc.metadata?.estimatedReadTime) {
		display += `\n⏱️ ${doc.metadata.estimatedReadTime} min read`;
	}

	if (doc.codeExamples && doc.codeExamples.length > 0) {
		display += `\n💻 ${doc.codeExamples.length} code examples included`;
	}

	// Truncate content for display
	const truncatedContent =
		doc.content.length > 200 ? `${doc.content.substring(0, 200)}...` : doc.content;
	display += `\n\n${truncatedContent}`;

	if (doc.url) {
		display += `\n\n🔗 [View full documentation](${doc.url})`;
	}

	return display;
}

/**
 * Formats code example for display
 */
export function formatCodeExampleDisplay(example: CodeExample): string {
	let display = "";

	if (example.title) {
		display += `💡 **${example.title}**\n`;
	}

	if (example.description) {
		display += `${example.description}\n\n`;
	}

	display += `\`\`\`${example.language}\n${example.code}\n\`\`\``;

	if (example.dependencies && example.dependencies.length > 0) {
		display += `\n\n📦 Dependencies: ${example.dependencies.join(", ")}`;
	}

	if (example.context) {
		display += `\n🎯 Context: ${example.context}`;
	}

	return display;
}

/**
 * Extracts keywords from library metadata for search indexing
 */
export function extractLibraryKeywords(library: LibraryMetadata): string[] {
	const keywords: string[] = [];

	// Add name and ID components
	keywords.push(library.name.toLowerCase());
	keywords.push(...library.id.split("/").filter(Boolean));

	// Add description words
	if (library.description) {
		keywords.push(
			...library.description
				.toLowerCase()
				.split(/\s+/)
				.filter((word) => word.length > 2),
		);
	}

	// Add tags and platforms
	if (library.tags) {
		keywords.push(...library.tags.map((tag) => tag.toLowerCase()));
	}

	if (library.platforms) {
		keywords.push(...library.platforms.map((platform) => platform.toLowerCase()));
	}

	if (library.languages) {
		keywords.push(...library.languages.map((lang) => lang.toLowerCase()));
	}

	// Remove duplicates and return
	return [...new Set(keywords)];
}

/**
 * Calculates relevance score for library search results
 */
export function calculateRelevanceScore(library: LibraryMetadata, query: string): number {
	if (!query) return library.trustScore || 5;

	const queryLower = query.toLowerCase();
	const keywords = extractLibraryKeywords(library);
	let score = 0;

	// Exact name match gets highest score
	if (library.name.toLowerCase() === queryLower) {
		score += 100;
	} else if (library.name.toLowerCase().includes(queryLower)) {
		score += 50;
	}

	// ID match
	if (library.id.toLowerCase().includes(queryLower)) {
		score += 30;
	}

	// Keyword matches
	const matchingKeywords = keywords.filter(
		(keyword) => keyword.includes(queryLower) || queryLower.includes(keyword),
	);
	score += matchingKeywords.length * 10;

	// Trust score bonus
	score += (library.trustScore || 0) * 2;

	// Code snippet availability bonus
	if (library.codeSnippetCount && library.codeSnippetCount > 0) {
		score += 10;
	}

	return score;
}

/**
 * Sorts libraries based on search criteria
 */
export function sortLibraries(
	libraries: LibraryMetadata[],
	sortBy: string,
	query?: string,
): LibraryMetadata[] {
	return libraries.sort((a, b) => {
		switch (sortBy) {
			case "relevance":
				if (!query) return 0;
				return calculateRelevanceScore(b, query) - calculateRelevanceScore(a, query);
			case "trust-score":
				return (b.trustScore || 0) - (a.trustScore || 0);
			case "popularity":
				return (b.codeSnippetCount || 0) - (a.codeSnippetCount || 0);
			case "name":
				return a.name.localeCompare(b.name);
			case "updated":
				// This would require last updated information, fallback to trust score
				return (b.trustScore || 0) - (a.trustScore || 0);
			default:
				return 0;
		}
	});
}

/**
 * Filters libraries based on search criteria
 */
export function filterLibraries(
	libraries: LibraryMetadata[],
	criteria: LibrarySearchCriteria,
): LibraryMetadata[] {
	return libraries.filter((library) => {
		// Language filter
		if (criteria.language) {
			if (library.languages && library.languages.length > 0) {
				const languageQuery = criteria.language.toLowerCase();
				if (!library.languages.some((lang) => lang.toLowerCase().includes(languageQuery))) {
					return false;
				}
			} else {
				// If no languages defined, skip language filter
			}
		}

		// Platform filter
		if (criteria.platform) {
			if (library.platforms && library.platforms.length > 0) {
				const platformQuery = criteria.platform.toLowerCase();
				if (!library.platforms.some((platform) => platform.toLowerCase().includes(platformQuery))) {
					return false;
				}
			} else {
				// If no platforms defined, skip platform filter
			}
		}

		// Category filter
		if (criteria.category) {
			if (library.tags && library.tags.length > 0) {
				const categoryQuery = criteria.category.toLowerCase();
				if (!library.tags.some((tag) => tag.toLowerCase().includes(categoryQuery))) {
					return false;
				}
			} else {
				// If no tags defined, skip category filter
			}
		}

		// Trust score filter
		if (criteria.minTrustScore !== undefined) {
			if ((library.trustScore || 0) < criteria.minTrustScore) {
				return false;
			}
		}

		return true;
	});
}

/**
 * Creates operation timing information
 */
export function createTiming(
	startTime: number,
	cacheHit = false,
): {
	startTime: number;
	endTime: number;
	duration: number;
	cacheHit: boolean;
} {
	const endTime = Date.now();
	return {
		startTime,
		endTime,
		duration: endTime - startTime,
		cacheHit,
	};
}

/**
 * Generates request fingerprint for caching
 */
export function generateRequestFingerprint(input: Context7McpToolUseInput): string {
	const key = {
		operation: input.operation,
		resolve: input.resolve,
		documentation: input.documentation,
		search: input.search,
	};

	return btoa(JSON.stringify(key))
		.replace(/[^a-zA-Z0-9]/g, "")
		.substring(0, 32);
}

/**
 * Validates Context7 library ID format
 */
export function validateContext7LibraryId(libraryId: string): boolean {
	return /^\/[^/]+\/[^/]+(?:\/.*)?$/.test(libraryId);
}

/**
 * Extracts organization and project from library ID
 */
export function parseLibraryId(
	libraryId: string,
): { org: string; project: string; version?: string } | null {
	const match = libraryId.match(/^\/([^/]+)\/([^/]+)(?:\/(.*))?$/);
	if (!match) return null;

	return {
		org: match[1],
		project: match[2],
		version: match[3],
	};
}

/**
 * Builds library ID from components
 */
export function buildLibraryId(org: string, project: string, version?: string): string {
	const base = `/${org}/${project}`;
	return version ? `${base}/${version}` : base;
}

/**
 * Sanitizes search query
 */
export function sanitizeSearchQuery(query: string): string {
	return query
		.trim()
		.replace(/[^\w\s\-_.]/g, "") // Remove special characters except word chars, spaces, hyphens, underscores, dots
		.replace(/\s+/g, " ") // Normalize whitespace
		.substring(0, 200); // Limit length
}

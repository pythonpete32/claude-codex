/**
 * @fileoverview Constants and configuration for Context7 MCP integration
 */

import type { Context7OperationType } from "./types";

/**
 * Package information
 */
export const PACKAGE_INFO = {
	name: "@dao/chat-items-mcp-context7",
	version: "1.0.0",
	description:
		"Context7 MCP integration for documentation lookup and library integration with comprehensive type safety and validation",
	license: "MIT",
	author: "DAO",
	keywords: [
		"context7",
		"mcp",
		"documentation",
		"library-lookup",
		"integration",
		"chat-item",
		"typescript",
		"validation",
		"claude",
		"atomic-codex",
	],
} as const;

/**
 * Tool constants for Context7 MCP
 */
export const TOOL_CONSTANTS = {
	name: "Context7Mcp",
	type: "tool_use",
	category: "documentation",
	displayName: "Context7 MCP",
	description: "Context7 integration for library documentation lookup and code examples",
	version: "1.0.0",
	icon: "📚",
} as const;

/**
 * Context7 operation definitions
 */
export const CONTEXT7_OPERATIONS = {
	"resolve-library-id": {
		name: "resolve-library-id",
		displayName: "Resolve Library ID",
		description: "Resolves a library name to a Context7-compatible library ID",
		category: "resolve",
		icon: "🔍",
		requiresLibraryName: true,
		defaultTimeout: 15000,
		supportsCache: true,
		inputFields: ["libraryName", "packageManager", "language", "context"],
		outputFields: ["library"],
	},
	"get-library-docs": {
		name: "get-library-docs",
		displayName: "Get Library Documentation",
		description: "Fetches comprehensive documentation for a specific library",
		category: "documentation",
		icon: "📖",
		requiresLibraryId: true,
		defaultTimeout: 30000,
		supportsCache: true,
		inputFields: ["libraryId", "topic", "tokens", "includeExamples", "sections", "contentTypes"],
		outputFields: ["documentation", "examples"],
	},
	"search-documentation": {
		name: "search-documentation",
		displayName: "Search Documentation",
		description: "Searches for documentation across multiple libraries",
		category: "search",
		icon: "🔎",
		requiresQuery: true,
		defaultTimeout: 20000,
		supportsCache: true,
		inputFields: ["query", "language", "platform", "category", "minTrustScore", "limit", "sortBy"],
		outputFields: ["libraries", "documentation"],
	},
	"get-library-info": {
		name: "get-library-info",
		displayName: "Get Library Info",
		description: "Retrieves basic information about a library",
		category: "info",
		icon: "ℹ️",
		requiresLibraryName: true,
		defaultTimeout: 10000,
		supportsCache: true,
		inputFields: ["libraryName", "language"],
		outputFields: ["library"],
	},
	"list-libraries": {
		name: "list-libraries",
		displayName: "List Libraries",
		description: "Lists libraries matching specific criteria",
		category: "listing",
		icon: "📋",
		requiresQuery: false,
		defaultTimeout: 25000,
		supportsCache: true,
		inputFields: ["language", "platform", "category", "minTrustScore", "limit", "sortBy"],
		outputFields: ["libraries"],
	},
	"get-code-examples": {
		name: "get-code-examples",
		displayName: "Get Code Examples",
		description: "Retrieves code examples for a specific library and topic",
		category: "examples",
		icon: "💻",
		requiresLibraryId: true,
		defaultTimeout: 20000,
		supportsCache: true,
		inputFields: ["libraryId", "topic", "tokens", "includeExamples"],
		outputFields: ["examples", "documentation"],
	},
	"validate-library-usage": {
		name: "validate-library-usage",
		displayName: "Validate Library Usage",
		description: "Validates library usage patterns and best practices",
		category: "validation",
		icon: "✅",
		requiresLibraryId: true,
		defaultTimeout: 15000,
		supportsCache: true,
		inputFields: ["libraryId", "topic", "includeExamples"],
		outputFields: ["documentation"],
	},
	"get-api-reference": {
		name: "get-api-reference",
		displayName: "Get API Reference",
		description: "Retrieves API reference documentation for specific library features",
		category: "reference",
		icon: "📑",
		requiresLibraryId: true,
		defaultTimeout: 25000,
		supportsCache: true,
		inputFields: ["libraryId", "topic", "tokens", "includeExamples", "sections"],
		outputFields: ["documentation", "examples"],
	},
} as const satisfies Record<
	Context7OperationType,
	{
		name: Context7OperationType;
		displayName: string;
		description: string;
		category: string;
		icon: string;
		requiresLibraryName?: boolean;
		requiresLibraryId?: boolean;
		requiresQuery?: boolean;
		defaultTimeout: number;
		supportsCache: boolean;
		inputFields: string[];
		outputFields: string[];
	}
>;

/**
 * Default configuration values
 */
export const DEFAULTS = {
	operation: "resolve-library-id" as Context7OperationType,
	timeout: 20000,
	debug: false,
	useCache: true,
	tokens: 10000,
	includeExamples: true,
	limit: 10,
	sortBy: "relevance",
	minTrustScore: 0,
	contentTypes: ["guide", "reference", "tutorial"],
} as const;

/**
 * Supported package managers
 */
export const PACKAGE_MANAGERS = {
	npm: {
		name: "npm",
		displayName: "npm",
		description: "Node Package Manager for JavaScript",
		ecosystem: "JavaScript/TypeScript",
		url: "https://www.npmjs.com",
		registryUrl: "https://registry.npmjs.org",
		icon: "📦",
		languages: ["JavaScript", "TypeScript"],
	},
	pypi: {
		name: "pypi",
		displayName: "PyPI",
		description: "Python Package Index",
		ecosystem: "Python",
		url: "https://pypi.org",
		registryUrl: "https://pypi.org/simple",
		icon: "🐍",
		languages: ["Python"],
	},
	maven: {
		name: "maven",
		displayName: "Maven Central",
		description: "Maven Central Repository for Java",
		ecosystem: "Java/JVM",
		url: "https://mvnrepository.com",
		registryUrl: "https://repo1.maven.org/maven2",
		icon: "☕",
		languages: ["Java", "Kotlin", "Scala"],
	},
	nuget: {
		name: "nuget",
		displayName: "NuGet",
		description: "Package manager for .NET",
		ecosystem: ".NET",
		url: "https://www.nuget.org",
		registryUrl: "https://api.nuget.org/v3/index.json",
		icon: "🔷",
		languages: ["C#", "F#", "VB.NET"],
	},
	gem: {
		name: "gem",
		displayName: "RubyGems",
		description: "Package manager for Ruby",
		ecosystem: "Ruby",
		url: "https://rubygems.org",
		registryUrl: "https://rubygems.org/api/v1",
		icon: "💎",
		languages: ["Ruby"],
	},
	cargo: {
		name: "cargo",
		displayName: "Crates.io",
		description: "Package registry for Rust",
		ecosystem: "Rust",
		url: "https://crates.io",
		registryUrl: "https://crates.io/api/v1",
		icon: "🦀",
		languages: ["Rust"],
	},
	go: {
		name: "go",
		displayName: "Go Modules",
		description: "Go module proxy",
		ecosystem: "Go",
		url: "https://pkg.go.dev",
		registryUrl: "https://proxy.golang.org",
		icon: "🐹",
		languages: ["Go"],
	},
	composer: {
		name: "composer",
		displayName: "Packagist",
		description: "PHP package repository",
		ecosystem: "PHP",
		url: "https://packagist.org",
		registryUrl: "https://packagist.org/packages.json",
		icon: "🐘",
		languages: ["PHP"],
	},
} as const;

/**
 * Supported programming languages
 */
export const PROGRAMMING_LANGUAGES = {
	javascript: {
		name: "JavaScript",
		aliases: ["js", "javascript", "ecmascript"],
		ecosystem: "Web/Node.js",
		packageManagers: ["npm"],
		fileExtensions: [".js", ".mjs", ".cjs"],
		icon: "🟨",
		popularity: 1,
	},
	typescript: {
		name: "TypeScript",
		aliases: ["ts", "typescript"],
		ecosystem: "Web/Node.js",
		packageManagers: ["npm"],
		fileExtensions: [".ts", ".tsx"],
		icon: "🔷",
		popularity: 2,
	},
	python: {
		name: "Python",
		aliases: ["py", "python"],
		ecosystem: "General Purpose",
		packageManagers: ["pypi"],
		fileExtensions: [".py", ".pyw"],
		icon: "🐍",
		popularity: 3,
	},
	java: {
		name: "Java",
		aliases: ["java"],
		ecosystem: "JVM",
		packageManagers: ["maven"],
		fileExtensions: [".java"],
		icon: "☕",
		popularity: 4,
	},
	csharp: {
		name: "C#",
		aliases: ["csharp", "c#", "cs"],
		ecosystem: ".NET",
		packageManagers: ["nuget"],
		fileExtensions: [".cs"],
		icon: "🔷",
		popularity: 5,
	},
	ruby: {
		name: "Ruby",
		aliases: ["ruby", "rb"],
		ecosystem: "Ruby",
		packageManagers: ["gem"],
		fileExtensions: [".rb"],
		icon: "💎",
		popularity: 6,
	},
	rust: {
		name: "Rust",
		aliases: ["rust", "rs"],
		ecosystem: "Systems",
		packageManagers: ["cargo"],
		fileExtensions: [".rs"],
		icon: "🦀",
		popularity: 7,
	},
	go: {
		name: "Go",
		aliases: ["go", "golang"],
		ecosystem: "Systems/Cloud",
		packageManagers: ["go"],
		fileExtensions: [".go"],
		icon: "🐹",
		popularity: 8,
	},
	php: {
		name: "PHP",
		aliases: ["php"],
		ecosystem: "Web",
		packageManagers: ["composer"],
		fileExtensions: [".php"],
		icon: "🐘",
		popularity: 9,
	},
} as const;

/**
 * Documentation content types
 */
export const CONTENT_TYPES = {
	guide: {
		name: "guide",
		displayName: "Guide",
		description: "Step-by-step tutorials and how-to guides",
		icon: "📘",
		difficulty: "beginner",
		interactive: true,
	},
	reference: {
		name: "reference",
		displayName: "API Reference",
		description: "Comprehensive API documentation and reference materials",
		icon: "📚",
		difficulty: "intermediate",
		interactive: false,
	},
	tutorial: {
		name: "tutorial",
		displayName: "Tutorial",
		description: "Educational content with examples and exercises",
		icon: "🎓",
		difficulty: "beginner",
		interactive: true,
	},
	example: {
		name: "example",
		displayName: "Code Example",
		description: "Working code examples and snippets",
		icon: "💡",
		difficulty: "intermediate",
		interactive: true,
	},
	changelog: {
		name: "changelog",
		displayName: "Changelog",
		description: "Version history and release notes",
		icon: "📋",
		difficulty: "advanced",
		interactive: false,
	},
	readme: {
		name: "readme",
		displayName: "README",
		description: "Project overview and getting started information",
		icon: "📄",
		difficulty: "beginner",
		interactive: false,
	},
} as const;

/**
 * Sort order options
 */
export const SORT_OPTIONS = {
	relevance: {
		name: "relevance",
		displayName: "Relevance",
		description: "Most relevant to the search query",
		icon: "🎯",
		default: true,
	},
	"trust-score": {
		name: "trust-score",
		displayName: "Trust Score",
		description: "Highest trust score first",
		icon: "⭐",
		default: false,
	},
	popularity: {
		name: "popularity",
		displayName: "Popularity",
		description: "Most popular libraries first",
		icon: "🔥",
		default: false,
	},
	updated: {
		name: "updated",
		displayName: "Recently Updated",
		description: "Most recently updated libraries first",
		icon: "🕒",
		default: false,
	},
	name: {
		name: "name",
		displayName: "Name",
		description: "Alphabetical order by name",
		icon: "🔤",
		default: false,
	},
} as const;

/**
 * Error categories and codes
 */
export const ERROR_CATEGORIES = {
	LIBRARY_NOT_FOUND: {
		code: "LIBRARY_NOT_FOUND",
		category: "Library Resolution",
		description: "Library could not be found in Context7 database",
		icon: "❌",
		severity: "error",
		retryable: true,
		suggestion: "Try using a more specific library name or check the spelling",
	},
	INVALID_LIBRARY_ID: {
		code: "INVALID_LIBRARY_ID",
		category: "Validation",
		description: "Library ID format is invalid",
		icon: "⚠️",
		severity: "error",
		retryable: false,
		suggestion: "Ensure the library ID follows the format '/org/project' or '/org/project/version'",
	},
	DOCUMENTATION_NOT_AVAILABLE: {
		code: "DOCUMENTATION_NOT_AVAILABLE",
		category: "Content",
		description: "No documentation available for the specified topic",
		icon: "📭",
		severity: "warning",
		retryable: true,
		suggestion: "Try a different topic or check if the library has documentation",
	},
	TIMEOUT_ERROR: {
		code: "TIMEOUT_ERROR",
		category: "Network",
		description: "Request timed out",
		icon: "⏰",
		severity: "error",
		retryable: true,
		suggestion: "The request timed out, try reducing the token count or check your connection",
	},
	RATE_LIMIT_EXCEEDED: {
		code: "RATE_LIMIT_EXCEEDED",
		category: "Rate Limiting",
		description: "Too many requests in a short time period",
		icon: "🚫",
		severity: "error",
		retryable: true,
		suggestion: "Too many requests, please wait before trying again",
	},
	INVALID_CREDENTIALS: {
		code: "INVALID_CREDENTIALS",
		category: "Authentication",
		description: "Invalid or missing API credentials",
		icon: "🔐",
		severity: "error",
		retryable: false,
		suggestion: "Check your Context7 API credentials",
	},
	NETWORK_ERROR: {
		code: "NETWORK_ERROR",
		category: "Network",
		description: "Network connectivity issue",
		icon: "🌐",
		severity: "error",
		retryable: true,
		suggestion: "Check your internet connection and try again",
	},
	CONTEXT7_ERROR: {
		code: "CONTEXT7_ERROR",
		category: "General",
		description: "General Context7 service error",
		icon: "⚡",
		severity: "error",
		retryable: true,
		suggestion: "General Context7 error, check the error details for more information",
	},
} as const;

/**
 * Success messages for different operations
 */
export const SUCCESS_MESSAGES = {
	"resolve-library-id": "Successfully resolved library ID",
	"get-library-docs": "Retrieved library documentation successfully",
	"search-documentation": "Found documentation matching search criteria",
	"get-library-info": "Retrieved library information",
	"list-libraries": "Listed libraries successfully",
	"get-code-examples": "Retrieved code examples successfully",
	"validate-library-usage": "Validated library usage patterns",
	"get-api-reference": "Retrieved API reference documentation",
} as const;

/**
 * Validation rules and limits
 */
export const VALIDATION_RULES = {
	timeout: {
		min: 1000,
		max: 300000,
		default: 20000,
		unit: "milliseconds",
	},
	tokens: {
		min: 100,
		max: 100000,
		default: 10000,
		unit: "tokens",
	},
	limit: {
		min: 1,
		max: 100,
		default: 10,
		unit: "results",
	},
	trustScore: {
		min: 0,
		max: 10,
		default: 0,
		unit: "score",
	},
	libraryName: {
		minLength: 1,
		maxLength: 100,
		pattern: /^[a-zA-Z0-9\-_.\s]+$/,
	},
	libraryId: {
		minLength: 5,
		maxLength: 200,
		pattern: /^\/[^/]+\/[^/]+(?:\/.*)?$/,
	},
	topic: {
		minLength: 1,
		maxLength: 100,
		pattern: /^[a-zA-Z0-9\-_\s]+$/,
	},
	query: {
		minLength: 1,
		maxLength: 200,
		pattern: /^[a-zA-Z0-9\-_.\s]+$/,
	},
} as const;

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
	defaultTtl: 3600000, // 1 hour in milliseconds
	maxSize: 1000, // Maximum number of cached entries
	keyPrefix: "context7-mcp:",
	enabled: true,
	strategies: {
		"resolve-library-id": { ttl: 86400000 }, // 24 hours
		"get-library-docs": { ttl: 3600000 }, // 1 hour
		"search-documentation": { ttl: 1800000 }, // 30 minutes
		"get-library-info": { ttl: 86400000 }, // 24 hours
		"list-libraries": { ttl: 3600000 }, // 1 hour
		"get-code-examples": { ttl: 3600000 }, // 1 hour
		"validate-library-usage": { ttl: 1800000 }, // 30 minutes
		"get-api-reference": { ttl: 3600000 }, // 1 hour
	},
} as const;

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
	timing: {
		fast: 1000, // < 1s is fast
		moderate: 5000, // 1-5s is moderate
		slow: 10000, // 5-10s is slow
		timeout: 30000, // > 30s should timeout
	},
	tokens: {
		small: 1000, // < 1k tokens is small
		medium: 10000, // 1-10k tokens is medium
		large: 50000, // 10-50k tokens is large
		huge: 100000, // > 50k tokens is huge
	},
	results: {
		few: 5, // < 5 results is few
		moderate: 20, // 5-20 results is moderate
		many: 50, // 20-50 results is many
		overwhelming: 100, // > 50 results is overwhelming
	},
} as const;

/**
 * Context7 API configuration
 */
export const CONTEXT7_CONFIG = {
	baseUrl: "https://api.context7.ai/v1",
	apiVersion: "v1",
	userAgent: "Context7-MCP-Client/1.0.0",
	defaultHeaders: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
	endpoints: {
		resolve: "/resolve-library-id",
		docs: "/get-library-docs",
		search: "/search-documentation",
		info: "/get-library-info",
		list: "/list-libraries",
		examples: "/get-code-examples",
		validate: "/validate-library-usage",
		reference: "/get-api-reference",
	},
	limits: {
		requestsPerMinute: 60,
		requestsPerHour: 1000,
		requestsPerDay: 10000,
	},
} as const;

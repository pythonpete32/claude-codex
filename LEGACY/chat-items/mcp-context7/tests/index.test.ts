/**
 * @fileoverview Comprehensive tests for Context7 MCP tool
 */

import { beforeEach, describe, expect, it } from "bun:test";
import {
	buildLibraryId,
	CONTEXT7_OPERATIONS,
	type CodeExample,
	type Context7McpToolUseInput,
	type Context7OperationType,
	calculateRelevanceScore,
	createErrorResult,
	createSuccessResult,
	createTiming,
	DEFAULTS,
	type DocumentationContent,
	ERROR_CATEGORIES,
	errorFixtures,
	extractLibraryKeywords,
	filterLibraries,
	fixtureHelpers,
	fixtureStats,
	fixtures,
	fixtureValidation,
	formatCodeExampleDisplay,
	formatDocumentationDisplay,
	formatLibraryDisplay,
	type GetDocumentationOptions,
	generateRequestFingerprint,
	getDefaultTimeout,
	getErrorSuggestion,
	getFixtureByName,
	getFixturesByCategory,
	isContext7McpToolChatItem,
	isContext7McpToolResultData,
	isContext7McpToolUseInput,
	isDocumentationContent,
	isLibraryMetadata,
	type LibraryMetadata,
	type LibrarySearchCriteria,
	namedFixtures,
	normalizeDocumentationOptions,
	normalizeResolveOptions,
	normalizeSearchCriteria,
	PACKAGE_INFO,
	parseContext7McpInput,
	parseLibraryId,
	type ResolveLibraryOptions,
	resolveFixtures,
	safeValidateContext7McpToolResultData,
	safeValidateContext7McpToolUseInput,
	sanitizeSearchQuery,
	sortLibraries,
	TOOL_CONSTANTS,
	validateContext7LibraryId,
	validateContext7McpToolResultData,
	validateContext7McpToolUseInput,
	validateDocumentationTopic,
	validateLibraryId,
	validateOperationRequirements,
	validateTimeout,
	validateTokenCount,
	validateTrustScore,
} from "../src/index";

// Test data setup
let sampleResolveOptions: ResolveLibraryOptions;
let sampleDocumentationOptions: GetDocumentationOptions;
let sampleSearchCriteria: LibrarySearchCriteria;
let sampleInput: Context7McpToolUseInput;
let sampleLibrary: LibraryMetadata;
let sampleDocumentation: DocumentationContent;
let sampleCodeExample: CodeExample;

beforeEach(() => {
	sampleResolveOptions = {
		libraryName: "React",
		packageManager: "npm",
		language: "javascript",
		context: "Frontend UI library",
	};

	sampleDocumentationOptions = {
		libraryId: "/facebook/react",
		topic: "hooks",
		tokens: 5000,
		includeExamples: true,
		sections: ["Tutorial", "API Reference"],
		contentTypes: ["guide", "reference"],
	};

	sampleSearchCriteria = {
		query: "state management",
		language: "javascript",
		platform: "react",
		minTrustScore: 8,
		limit: 10,
		sortBy: "trust-score",
	};

	sampleInput = {
		operation: "resolve-library-id",
		resolve: sampleResolveOptions,
		timeout: 15000,
		debug: false,
		useCache: true,
	};

	sampleLibrary = {
		id: "/facebook/react",
		name: "React",
		description: "A JavaScript library for building user interfaces",
		website: "https://react.dev",
		repository: "https://github.com/facebook/react",
		packageManager: "npm",
		packageName: "react",
		version: "18.2.0",
		trustScore: 9.8,
		codeSnippetCount: 156,
		sections: ["Getting Started", "API Reference"],
		platforms: ["Web", "React Native"],
		languages: ["JavaScript", "TypeScript"],
		tags: ["ui", "frontend", "components"],
	};

	sampleDocumentation = {
		title: "Using State",
		content: "State lets a component remember information like user input.",
		type: "guide",
		url: "https://react.dev/learn/state-a-components-memory",
		section: "Learn React",
		metadata: {
			difficulty: "beginner",
			estimatedReadTime: 5,
		},
	};

	sampleCodeExample = {
		language: "javascript",
		code: "const [count, setCount] = useState(0);",
		title: "Basic useState Example",
		description: "Simple state management with hooks",
		dependencies: ["react"],
		context: "Function component",
	};
});

describe("Package Metadata", () => {
	it("should have correct package info", () => {
		expect(PACKAGE_INFO.name).toBe("@dao/chat-items-mcp-context7");
		expect(PACKAGE_INFO.version).toBe("1.0.0");
		expect(PACKAGE_INFO.license).toBe("MIT");
		expect(PACKAGE_INFO.author).toBe("DAO");
		expect(PACKAGE_INFO.keywords).toContain("context7");
		expect(PACKAGE_INFO.keywords).toContain("mcp");
	});

	it("should have correct tool constants", () => {
		expect(TOOL_CONSTANTS.name).toBe("Context7Mcp");
		expect(TOOL_CONSTANTS.type).toBe("tool_use");
		expect(TOOL_CONSTANTS.category).toBe("documentation");
		expect(TOOL_CONSTANTS.displayName).toBe("Context7 MCP");
	});
});

describe("Type Guards", () => {
	it("should correctly identify Context7McpToolUseInput", () => {
		expect(isContext7McpToolUseInput(sampleInput)).toBe(true);
		expect(isContext7McpToolUseInput({})).toBe(false);
		expect(isContext7McpToolUseInput(null)).toBe(false);
		expect(isContext7McpToolUseInput("string")).toBe(false);
	});

	it("should correctly identify LibraryMetadata", () => {
		expect(isLibraryMetadata(sampleLibrary)).toBe(true);
		expect(isLibraryMetadata({})).toBe(false);
		expect(isLibraryMetadata({ id: "/test/lib" })).toBe(false); // Missing name
		expect(isLibraryMetadata({ name: "Test" })).toBe(false); // Missing id
	});

	it("should correctly identify DocumentationContent", () => {
		expect(isDocumentationContent(sampleDocumentation)).toBe(true);
		expect(isDocumentationContent({})).toBe(false);
		expect(isDocumentationContent({ title: "Test" })).toBe(false); // Missing required fields
	});

	it("should correctly identify Context7McpToolResultData", () => {
		const resultData = {
			operation: "resolve-library-id" as Context7OperationType,
			success: true,
			message: "Success",
		};
		expect(isContext7McpToolResultData(resultData)).toBe(true);
		expect(isContext7McpToolResultData({})).toBe(false);
	});

	it("should correctly identify Context7McpToolChatItem", () => {
		const chatItem = {
			type: "tool_use",
			toolUse: { name: "Context7Mcp" },
		};
		expect(isContext7McpToolChatItem(chatItem)).toBe(true);
		expect(isContext7McpToolChatItem({})).toBe(false);
	});
});

describe("Validators", () => {
	describe("Throwing validators", () => {
		it("should validate valid Context7McpToolUseInput", () => {
			expect(() => validateContext7McpToolUseInput(sampleInput)).not.toThrow();
			const result = validateContext7McpToolUseInput(sampleInput);
			expect(result.operation).toBe("resolve-library-id");
		});

		it("should throw on invalid input", () => {
			expect(() => validateContext7McpToolUseInput({})).toThrow();
			expect(() => validateContext7McpToolUseInput({ operation: "invalid" })).toThrow();
		});

		it("should validate result data", () => {
			const resultData = createSuccessResult("resolve-library-id", "Success");
			expect(() => validateContext7McpToolResultData(resultData)).not.toThrow();
		});
	});

	describe("Safe validators", () => {
		it("should return valid data for correct input", () => {
			const result = safeValidateContext7McpToolUseInput(sampleInput);
			expect(result).not.toBeNull();
			expect(result?.operation).toBe("resolve-library-id");
		});

		it("should return null for invalid input", () => {
			expect(safeValidateContext7McpToolUseInput({})).toBeNull();
			expect(safeValidateContext7McpToolResultData({})).toBeNull();
		});
	});

	describe("Individual validators", () => {
		it("should validate library IDs", () => {
			expect(validateLibraryId("/org/project")).toBe(true);
			expect(validateLibraryId("/org/project/v1.0.0")).toBe(true);
			expect(validateLibraryId("invalid")).toBe(false);
			expect(validateLibraryId("/org")).toBe(false);
		});

		it("should validate documentation topics", () => {
			expect(validateDocumentationTopic("hooks")).toBe(true);
			expect(validateDocumentationTopic("state-management")).toBe(true);
			expect(validateDocumentationTopic("")).toBe(false);
			expect(validateDocumentationTopic("a".repeat(101))).toBe(false);
		});

		it("should validate numeric ranges", () => {
			expect(validateTrustScore(8.5)).toBe(true);
			expect(validateTrustScore(11)).toBe(false);
			expect(validateTokenCount(5000)).toBe(true);
			expect(validateTokenCount(50)).toBe(false);
			expect(validateTimeout(15000)).toBe(true);
			expect(validateTimeout(500)).toBe(false);
		});
	});

	describe("Operation requirements", () => {
		it("should validate resolve operation requirements", () => {
			expect(validateOperationRequirements(sampleInput)).toBe(true);

			const invalidInput = { ...sampleInput, resolve: undefined };
			expect(validateOperationRequirements(invalidInput)).toBe(false);
		});

		it("should validate documentation operation requirements", () => {
			const docInput: Context7McpToolUseInput = {
				operation: "get-library-docs",
				documentation: sampleDocumentationOptions,
			};
			expect(validateOperationRequirements(docInput)).toBe(true);
		});
	});
});

describe("Parsers", () => {
	describe("parseContext7McpInput", () => {
		it("should parse input and add defaults", () => {
			const result = parseContext7McpInput(sampleInput);
			expect(result.operation).toBe("resolve-library-id");
			expect(result.timeout).toBe(15000);
			expect(result.debug).toBe(false);
			expect(result.useCache).toBe(true);
		});

		it("should preserve provided values", () => {
			const customInput = {
				...sampleInput,
				timeout: 30000,
				debug: true,
			};
			const result = parseContext7McpInput(customInput);
			expect(result.timeout).toBe(30000);
			expect(result.debug).toBe(true);
		});
	});

	describe("getDefaultTimeout", () => {
		it("should return correct timeout for each operation", () => {
			expect(getDefaultTimeout("resolve-library-id")).toBe(15000);
			expect(getDefaultTimeout("get-library-docs")).toBe(30000);
			expect(getDefaultTimeout("search-documentation")).toBe(20000);
		});
	});

	describe("Normalization functions", () => {
		it("should normalize resolve options", () => {
			const result = normalizeResolveOptions(sampleResolveOptions);
			expect(result.libraryName).toBe("React");
			expect(result.language).toBe("javascript");
		});

		it("should normalize documentation options", () => {
			const result = normalizeDocumentationOptions(sampleDocumentationOptions);
			expect(result.tokens).toBe(5000);
			expect(result.includeExamples).toBe(true);
		});

		it("should normalize search criteria", () => {
			const result = normalizeSearchCriteria(sampleSearchCriteria);
			expect(result.limit).toBe(10);
			expect(result.sortBy).toBe("trust-score");
		});
	});

	describe("Result creation", () => {
		it("should create success result", () => {
			const result = createSuccessResult("resolve-library-id", "Success", {
				library: sampleLibrary,
			});
			expect(result.operation).toBe("resolve-library-id");
			expect(result.success).toBe(true);
			expect(result.message).toBe("Success");
			expect(result.library).toBe(sampleLibrary);
		});

		it("should create error result", () => {
			const error = new Error("Test error");
			const result = createErrorResult("resolve-library-id", error, "TEST_ERROR");
			expect(result.operation).toBe("resolve-library-id");
			expect(result.success).toBe(false);
			expect(result.message).toContain("Test error");
			expect(result.error?.code).toBe("TEST_ERROR");
		});

		it("should provide error suggestions", () => {
			const suggestion = getErrorSuggestion("LIBRARY_NOT_FOUND");
			expect(suggestion).toContain("specific library name");
		});
	});

	describe("Formatting functions", () => {
		it("should format library display", () => {
			const display = formatLibraryDisplay(sampleLibrary);
			expect(display).toContain("React");
			expect(display).toContain("/facebook/react");
			expect(display).toContain("18.2.0");
		});

		it("should format documentation display", () => {
			const display = formatDocumentationDisplay(sampleDocumentation);
			expect(display).toContain("Using State");
			expect(display).toContain("beginner");
		});

		it("should format code example display", () => {
			const display = formatCodeExampleDisplay(sampleCodeExample);
			expect(display).toContain("useState");
			expect(display).toContain("javascript");
		});
	});

	describe("Search and filtering", () => {
		it("should extract library keywords", () => {
			const keywords = extractLibraryKeywords(sampleLibrary);
			expect(keywords).toContain("react");
			expect(keywords).toContain("ui");
			expect(keywords).toContain("frontend");
		});

		it("should calculate relevance scores", () => {
			const score = calculateRelevanceScore(sampleLibrary, "react");
			expect(score).toBeGreaterThan(0);
		});

		it("should sort libraries", () => {
			const libraries: LibraryMetadata[] = [sampleLibrary];
			const sorted = sortLibraries(libraries, "trust-score");
			expect(sorted).toHaveLength(1);
			expect(sorted[0]).toBeDefined();
			expect(sorted[0].trustScore).toBe(9.8);
		});

		it("should filter libraries", () => {
			const libraries: LibraryMetadata[] = [sampleLibrary];
			const filtered = filterLibraries(libraries, {
				language: "javascript",
				minTrustScore: 9,
			});
			expect(filtered).toHaveLength(1);
		});
	});

	describe("Utility functions", () => {
		it("should create timing information", () => {
			const startTime = Date.now() - 1000;
			const timing = createTiming(startTime);
			expect(timing.startTime).toBe(startTime);
			expect(timing.duration).toBeGreaterThanOrEqual(1000);
		});

		it("should generate request fingerprints", () => {
			const fingerprint1 = generateRequestFingerprint(sampleInput);
			const fingerprint2 = generateRequestFingerprint(sampleInput);
			expect(fingerprint1).toBe(fingerprint2);
			expect(fingerprint1).toHaveLength(32);
		});

		it("should validate Context7 library IDs", () => {
			expect(validateContext7LibraryId("/org/project")).toBe(true);
			expect(validateContext7LibraryId("invalid")).toBe(false);
		});

		it("should parse library IDs", () => {
			const parsed = parseLibraryId("/facebook/react/v18.2.0");
			expect(parsed?.org).toBe("facebook");
			expect(parsed?.project).toBe("react");
			expect(parsed?.version).toBe("v18.2.0");
		});

		it("should build library IDs", () => {
			const id = buildLibraryId("facebook", "react", "v18.2.0");
			expect(id).toBe("/facebook/react/v18.2.0");
		});

		it("should sanitize search queries", () => {
			const sanitized = sanitizeSearchQuery("  test@#$query  ");
			expect(sanitized).toBe("testquery");
		});
	});
});

describe("Constants", () => {
	it("should have context7 operations", () => {
		expect(Object.keys(CONTEXT7_OPERATIONS)).toContain("resolve-library-id");
		expect(Object.keys(CONTEXT7_OPERATIONS)).toContain("get-library-docs");
		expect(CONTEXT7_OPERATIONS["resolve-library-id"].defaultTimeout).toBe(15000);
		expect(CONTEXT7_OPERATIONS["get-library-docs"].icon).toBe("📖");
	});

	it("should have error categories", () => {
		expect(Object.keys(ERROR_CATEGORIES)).toContain("LIBRARY_NOT_FOUND");
		expect(Object.keys(ERROR_CATEGORIES)).toContain("TIMEOUT_ERROR");
		expect(ERROR_CATEGORIES.LIBRARY_NOT_FOUND.retryable).toBe(true);
	});

	it("should have default values", () => {
		expect(DEFAULTS.operation).toBe("resolve-library-id");
		expect(DEFAULTS.timeout).toBe(20000);
		expect(DEFAULTS.useCache).toBe(true);
	});
});

describe("Fixtures", () => {
	it("should load fixtures correctly", () => {
		expect(fixtures).toBeDefined();
		expect(fixtures.length).toBeGreaterThan(0);
		expect(Array.isArray(fixtures)).toBe(true);
	});

	it("should have fixture statistics", () => {
		expect(fixtureStats.total).toBeGreaterThan(0);
		expect(fixtureStats.byCategory).toBeDefined();
		expect(fixtureStats.operations.length).toBeGreaterThan(0);
		expect(fixtureStats.successfulOperations).toBeGreaterThan(0);
	});

	describe("Fixture categories", () => {
		it("should have resolve fixtures", () => {
			expect(resolveFixtures.length).toBeGreaterThan(0);
			expect(getFixturesByCategory("resolve")).toEqual(resolveFixtures);
		});

		it("should have error fixtures", () => {
			expect(errorFixtures.length).toBeGreaterThan(0);
			expect(getFixturesByCategory("errors")).toEqual(errorFixtures);
		});
	});

	describe("Named fixtures", () => {
		it("should have named fixture exports", () => {
			expect(namedFixtures.resolveNextjs).toBeDefined();
			expect(namedFixtures.getReactDocs).toBeDefined();
			expect(namedFixtures.searchJavaScript).toBeDefined();
			expect(namedFixtures.libraryNotFound).toBeDefined();
		});

		it("should find fixtures by name", () => {
			const fixture = getFixtureByName("resolve_nextjs_library");
			expect(fixture).toBeDefined();
			expect(fixture?.name).toBe("resolve_nextjs_library");
		});
	});

	describe("Fixture helpers", () => {
		it("should filter by operation", () => {
			const resolveOps = fixtureHelpers.getByOperation("resolve-library-id");
			expect(resolveOps.length).toBeGreaterThan(0);
			resolveOps.forEach((f) => {
				expect(f.data.toolUse.input.operation).toBe("resolve-library-id");
			});
		});

		it("should filter successful operations", () => {
			const successful = fixtureHelpers.getSuccessfulOperations();
			expect(successful.length).toBeGreaterThan(0);
			successful.forEach((f) => {
				expect(f.data.toolUseResult.output.success).toBe(true);
			});
		});

		it("should filter failed operations", () => {
			const failed = fixtureHelpers.getFailedOperations();
			expect(failed.length).toBeGreaterThan(0);
			failed.forEach((f) => {
				expect(f.data.toolUseResult.output.success).toBe(false);
			});
		});

		it("should find fixtures with library data", () => {
			const withLibrary = fixtureHelpers.getWithLibraryData();
			expect(withLibrary.length).toBeGreaterThan(0);
			withLibrary.forEach((f) => {
				expect(f.data.toolUseResult.output.library).toBeDefined();
			});
		});

		it("should find cached operations", () => {
			const cached = fixtureHelpers.getCachedOperations();
			expect(cached.length).toBeGreaterThan(0);
		});

		it("should filter by language", () => {
			const jsFixtures = fixtureHelpers.getByLanguage("javascript");
			expect(jsFixtures.length).toBeGreaterThan(0);
		});

		it("should filter by trust score", () => {
			const highTrust = fixtureHelpers.getByTrustScore(9);
			expect(highTrust.length).toBeGreaterThan(0);
		});
	});

	describe("Fixture validation", () => {
		it("should validate fixture structure", () => {
			const validation = fixtureValidation.validateStructure();
			expect(validation.valid).toBe(true);
			if (!validation.valid) {
				console.log("Structure validation errors:", validation.errors);
			}
		});

		it("should validate operations", () => {
			const validation = fixtureValidation.validateOperations();
			expect(validation.valid).toBe(true);
			if (!validation.valid) {
				console.log("Invalid operations:", validation.invalidOperations);
			}
		});

		it("should validate result consistency", () => {
			const validation = fixtureValidation.validateResultConsistency();
			expect(validation.valid).toBe(true);
			if (!validation.valid) {
				console.log("Consistency errors:", validation.inconsistencies);
			}
		});

		it("should validate library IDs", () => {
			const validation = fixtureValidation.validateLibraryIds();
			expect(validation.valid).toBe(true);
			if (!validation.valid) {
				console.log("Invalid library IDs:", validation.invalidIds);
			}
		});

		it("should run all validations", () => {
			const validation = fixtureValidation.validateAll();
			expect(validation.valid).toBe(true);
			expect(validation.report.summary.totalFixtures).toBeGreaterThan(0);
		});
	});
});

describe("Chat Item Integration", () => {
	it("should identify valid chat items", () => {
		const fixture = namedFixtures.resolveNextjs;
		expect(fixture).toBeDefined();
		if (fixture) {
			expect(isContext7McpToolChatItem(fixture.data)).toBe(true);
		}
	});

	it("should identify valid result data", () => {
		const fixture = namedFixtures.getReactDocs;
		expect(fixture).toBeDefined();
		if (fixture) {
			const output = fixture.data.toolUseResult.output;
			expect(isContext7McpToolResultData(output)).toBe(true);
		}
	});
});

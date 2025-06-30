/**
 * @fileoverview Comprehensive tests for write-tool package
 */

import { describe, expect, test } from "bun:test";
import {
	// Fixtures
	allFixtures,
	basicFixtures,
	// Constants
	DISPLAY,
	ERROR_MESSAGES,
	errorFixtures,
	// Parsers
	extractErrorMessage,
	FILE_TYPE_CATEGORIES,
	formatContentPreview,
	formatFilePath,
	formatWriteParameters,
	getContentStats,
	getFailedFixtures,
	getFileExtension,
	getFileTypeCategory,
	getFixtureById,
	getFixturesByCategory,
	getFixturesByContentSize,
	getFixturesByFileExtension,
	getFixturesWithContent,
	getFixturesWithEmptyContent,
	getSuccessfulFixtures,
	getSuccessMessage,
	isSuccessfulWrite,
	isWriteToolChatItem,
	isWriteToolResultData,
	isWriteToolUseInput,
	LIMITS,
	PACKAGE_INFO,
	parseWriteToolChatItem,
	parseWriteToolOutput,
	SUCCESS_MESSAGES,
	safeValidateWriteToolUseInput,
	TOOL_CONFIG,
	VALIDATION_PATTERNS,
	validateWriteToolChatItem,
	validateWriteToolUseInput,
	// Schemas
	WriteToolChatItemSchema,
	type WriteToolResultData,
	WriteToolResultDataSchema,
	type WriteToolUseInput,
	WriteToolUseInputSchema,
} from "../src/index";

describe("write-tool", () => {
	describe("Type Guards", () => {
		test("isWriteToolUseInput validates correct input", () => {
			const validInput = {
				file_path: "/Users/user/test.txt",
				content: "Hello world",
			};
			expect(isWriteToolUseInput(validInput)).toBe(true);
		});

		test("isWriteToolUseInput rejects invalid input", () => {
			expect(isWriteToolUseInput({})).toBe(false);
			expect(isWriteToolUseInput({ file_path: "/test" })).toBe(false);
			expect(isWriteToolUseInput({ content: "test" })).toBe(false);
			expect(isWriteToolUseInput(null)).toBe(false);
			expect(isWriteToolUseInput(undefined)).toBe(false);
		});

		test("isWriteToolResultData validates correct result", () => {
			const validResult = {
				type: "create",
				filePath: "/Users/user/test.txt",
				content: "Hello world",
				structuredPatch: [],
			};
			expect(isWriteToolResultData(validResult)).toBe(true);
		});

		test("isWriteToolResultData rejects invalid result", () => {
			expect(isWriteToolResultData({})).toBe(false);
			expect(isWriteToolResultData({ type: "update" })).toBe(false);
			expect(isWriteToolResultData(null)).toBe(false);
		});

		test("isWriteToolChatItem validates correct chat item", () => {
			const validItem = basicFixtures[0];
			expect(isWriteToolChatItem(validItem)).toBe(true);
		});

		test("isWriteToolChatItem rejects invalid items", () => {
			expect(isWriteToolChatItem({})).toBe(false);
			expect(isWriteToolChatItem({ type: "tool_use", toolUse: { name: "Read" } })).toBe(false);
			expect(isWriteToolChatItem(null)).toBe(false);
		});
	});

	describe("Schemas", () => {
		test("WriteToolUseInputSchema validates input", () => {
			const validInput = {
				file_path: "/Users/user/test.txt",
				content: "Hello world",
			};
			const result = WriteToolUseInputSchema.parse(validInput);
			expect(result.file_path).toBe("/Users/user/test.txt");
			expect(result.content).toBe("Hello world");
		});

		test("WriteToolUseInputSchema rejects invalid input", () => {
			expect(() => WriteToolUseInputSchema.parse({})).toThrow();
			expect(() => WriteToolUseInputSchema.parse({ file_path: "" })).toThrow();
			expect(() => WriteToolUseInputSchema.parse({ file_path: "/test" })).toThrow();
		});

		test("WriteToolResultDataSchema validates results", () => {
			const validResult = {
				type: "create",
				filePath: "/Users/user/test.txt",
				content: "Hello world",
				structuredPatch: [],
			};
			const result = WriteToolResultDataSchema.parse(validResult);
			expect(result.type).toBe("create");
			expect(result.filePath).toBe("/Users/user/test.txt");
		});

		test("WriteToolChatItemSchema validates complete items", () => {
			const validItem = basicFixtures[0];
			const result = WriteToolChatItemSchema.parse(validItem);
			expect(result.type).toBe("tool_use");
			expect(result.toolUse.name).toBe("Write");
		});
	});

	describe("Validators", () => {
		test("validateWriteToolUseInput validates and returns input", () => {
			const validInput = {
				file_path: "/Users/user/test.txt",
				content: "Hello world",
			};
			const result = validateWriteToolUseInput(validInput);
			expect(result.file_path).toBe("/Users/user/test.txt");
		});

		test("validateWriteToolUseInput throws on invalid input", () => {
			expect(() => validateWriteToolUseInput({})).toThrow();
			expect(() => validateWriteToolUseInput({ file_path: "" })).toThrow();
		});

		test("safeValidateWriteToolUseInput returns null on error", () => {
			expect(safeValidateWriteToolUseInput({})).toBeNull();
			expect(safeValidateWriteToolUseInput({ file_path: "" })).toBeNull();
		});

		test("validateWriteToolChatItem validates fixtures", () => {
			for (const fixture of basicFixtures) {
				expect(() => validateWriteToolChatItem(fixture)).not.toThrow();
			}
		});
	});

	describe("Parsers", () => {
		test("parseWriteToolChatItem creates component props", () => {
			const fixture = basicFixtures[0];
			const props = parseWriteToolChatItem(fixture, { className: "test-class" });
			expect(props).not.toBeNull();
			expect(props?.className).toBe("test-class");
			expect(props?.item).toBe(fixture);
		});

		test("parseWriteToolChatItem returns null for non-write items", () => {
			const invalidItem = { type: "tool_use", toolUse: { name: "Read" } };
			expect(parseWriteToolChatItem(invalidItem)).toBeNull();
		});

		test("parseWriteToolOutput handles different output formats", () => {
			// Test string output
			const stringOutput = "Error: File not found";
			expect(parseWriteToolOutput(stringOutput)).toBe(stringOutput);

			// Test structured output
			const structuredOutput = {
				type: "create",
				filePath: "/Users/user/test.txt",
				content: "Hello world",
				structuredPatch: [],
			};
			const result = parseWriteToolOutput(structuredOutput);
			expect(typeof result).toBe("object");
			expect((result as WriteToolResultData).type).toBe("create");

			// Test fallback
			const unknownOutput = { unknown: "format" };
			expect(parseWriteToolOutput(unknownOutput)).toBe("[object Object]");
		});

		test("formatFilePath handles different path formats", () => {
			// Home directory
			expect(formatFilePath("~/project/file.txt")).toBe("~/project/file.txt");

			// Long paths
			const longPath =
				"/very/long/path/that/exceeds/eighty/characters/in/length/and/should/be/truncated/file.txt";
			const formatted = formatFilePath(longPath);
			expect(formatted.length).toBeLessThan(longPath.length);
			expect(formatted).toContain("...");

			// Normal paths
			expect(formatFilePath("/Users/user/file.txt")).toBe("/Users/user/file.txt");
		});

		test("extractErrorMessage extracts errors correctly", () => {
			expect(extractErrorMessage("Error: File not found")).toBe("Error: File not found");
			expect(extractErrorMessage("Failed to write file")).toBe("Failed to write file");
			expect(extractErrorMessage("File created successfully")).toBeNull();
		});

		test("isSuccessfulWrite identifies successful operations", () => {
			const successfulFixture = basicFixtures[0];
			expect(isSuccessfulWrite(successfulFixture)).toBe(true);

			const failedFixture = errorFixtures[0];
			expect(isSuccessfulWrite(failedFixture)).toBe(false);
		});

		test("getFileExtension extracts extensions correctly", () => {
			expect(getFileExtension("/Users/user/test.txt")).toBe("txt");
			expect(getFileExtension("/Users/user/script.js")).toBe("js");
			expect(getFileExtension("/Users/user/component.tsx")).toBe("tsx");
			expect(getFileExtension("/Users/user/noextension")).toBe("");
			expect(getFileExtension("/Users/user/.hidden")).toBe("");
		});

		test("getFileTypeCategory categorizes files correctly", () => {
			expect(getFileTypeCategory("/Users/user/script.js")).toBe("JavaScript");
			expect(getFileTypeCategory("/Users/user/component.tsx")).toBe("React");
			expect(getFileTypeCategory("/Users/user/config.json")).toBe("JSON");
			expect(getFileTypeCategory("/Users/user/README.md")).toBe("Markdown");
			expect(getFileTypeCategory("/Users/user/unknown.xyz")).toBe("File");
		});

		test("getContentStats calculates statistics correctly", () => {
			const content = "Line 1\nLine 2\nLine 3";
			const stats = getContentStats(content);
			expect(stats.lines).toBe(3);
			expect(stats.characters).toBe(20);
			expect(stats.words).toBe(6);
			expect(stats.size).toContain("B");
		});

		test("formatContentPreview truncates content", () => {
			const content = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
			const preview = formatContentPreview(content, 2);
			expect(preview).toContain("Line 1\nLine 2");
			expect(preview).toContain("... (3 more lines)");
		});

		test("formatWriteParameters formats input parameters", () => {
			const input: WriteToolUseInput = {
				file_path: "/Users/user/test.js",
				content: "console.log('Hello world');",
			};
			const formatted = formatWriteParameters(input);
			expect(formatted).toContain("test.js");
			expect(formatted).toContain("JavaScript");
		});

		test("getSuccessMessage extracts success messages", () => {
			const successfulFixture = basicFixtures[0];
			const message = getSuccessMessage(successfulFixture);
			expect(message).toContain("successfully");

			const failedFixture = errorFixtures[0];
			expect(getSuccessMessage(failedFixture)).toBeNull();
		});
	});

	describe("Fixtures", () => {
		test("fixtures are properly typed", () => {
			expect(Array.isArray(allFixtures)).toBe(true);
			expect(allFixtures.length).toBeGreaterThan(0);
		});

		test("fixture helper functions work correctly", () => {
			expect(getSuccessfulFixtures().length).toBeGreaterThan(0);
			expect(getFailedFixtures().length).toBeGreaterThan(0);
			expect(getFixturesWithContent().length).toBeGreaterThan(0);
			expect(getFixturesWithEmptyContent().length).toBeGreaterThan(0);
		});

		test("getFixturesByCategory returns correct fixtures", () => {
			const basics = getFixturesByCategory("basic");
			expect(basics.length).toBeGreaterThan(0);
			expect(basics.every((f) => f.toolUse.name === "Write")).toBe(true);
		});

		test("getFixtureById finds fixtures correctly", () => {
			const firstFixture = allFixtures[0];
			const found = getFixtureById(firstFixture.toolUse.id);
			expect(found).toBe(firstFixture);
			expect(getFixtureById("nonexistent")).toBeNull();
		});

		test("getFixturesByFileExtension filters correctly", () => {
			const mdFixtures = getFixturesByFileExtension("md");
			expect(mdFixtures.every((f) => f.toolUse.input.file_path.endsWith(".md"))).toBe(true);
		});

		test("getFixturesByContentSize categorizes correctly", () => {
			const smallFixtures = getFixturesByContentSize("small");
			const largeFixtures = getFixturesByContentSize("large");
			expect(smallFixtures.every((f) => f.toolUse.input.content.length < 100)).toBe(true);
			expect(largeFixtures.every((f) => f.toolUse.input.content.length >= 1000)).toBe(true);
		});

		test("all fixtures have valid structure", () => {
			for (const fixture of allFixtures) {
				expect(fixture.type).toBe("tool_use");
				expect(fixture.toolUse.name).toBe("Write");
				expect(typeof fixture.toolUse.input.file_path).toBe("string");
				expect(typeof fixture.toolUse.input.content).toBe("string");
			}
		});
	});

	describe("Constants", () => {
		test("package constants are defined", () => {
			expect(PACKAGE_INFO.name).toBe("@dao/chat-items-write-tool");
			expect(PACKAGE_INFO.toolName).toBe("Write");
			expect(TOOL_CONFIG.name).toBe("Write");
			expect(TOOL_CONFIG.type).toBe("tool_use");
		});

		test("error messages are defined", () => {
			expect(typeof ERROR_MESSAGES.INVALID_INPUT).toBe("string");
			expect(typeof ERROR_MESSAGES.VALIDATION_FAILED).toBe("string");
		});

		test("success messages are defined", () => {
			expect(typeof SUCCESS_MESSAGES.FILE_CREATED).toBe("string");
			expect(typeof SUCCESS_MESSAGES.VALIDATION_PASSED).toBe("string");
		});

		test("limits are defined", () => {
			expect(typeof LIMITS.MAX_FILE_PATH_LENGTH).toBe("number");
			expect(typeof LIMITS.MAX_CONTENT_SIZE).toBe("number");
			expect(LIMITS.MAX_FILE_PATH_LENGTH).toBeGreaterThan(0);
		});

		test("file type categories are defined", () => {
			expect(Array.isArray(FILE_TYPE_CATEGORIES.CODE)).toBe(true);
			expect(Array.isArray(FILE_TYPE_CATEGORIES.WEB)).toBe(true);
			expect(FILE_TYPE_CATEGORIES.CODE).toContain("ts");
			expect(FILE_TYPE_CATEGORIES.WEB).toContain("html");
		});

		test("display constants are defined", () => {
			expect(typeof DISPLAY.MAX_FILE_PATH_DISPLAY_LENGTH).toBe("number");
			expect(typeof DISPLAY.MAX_CONTENT_PREVIEW_LINES).toBe("number");
		});

		test("validation patterns are defined", () => {
			expect(VALIDATION_PATTERNS.FILE_PATH).toBeInstanceOf(RegExp);
			expect(VALIDATION_PATTERNS.FILE_PATH.test("/Users/user/file.txt")).toBe(true);
			expect(VALIDATION_PATTERNS.FILE_PATH.test("relative/path")).toBe(false);
		});
	});

	describe("Integration", () => {
		test("complete workflow with valid fixture", () => {
			const fixture = basicFixtures[0];

			// Validate the complete item
			const validatedItem = validateWriteToolChatItem(fixture);
			expect(validatedItem.toolUse.name).toBe("Write");

			// Parse into component props
			const props = parseWriteToolChatItem(validatedItem);
			expect(props).not.toBeNull();
			expect(props?.item).toBe(validatedItem);

			// Check if operation was successful
			const isSuccess = isSuccessfulWrite(validatedItem);
			expect(isSuccess).toBe(true);

			// Get success message
			const message = getSuccessMessage(validatedItem);
			expect(message).toContain("successfully");
		});

		test("complete workflow with error fixture", () => {
			const fixture = errorFixtures[0];

			// Validate the complete item
			const validatedItem = validateWriteToolChatItem(fixture);
			expect(validatedItem.toolUse.name).toBe("Write");

			// Check if operation failed
			const isSuccess = isSuccessfulWrite(validatedItem);
			expect(isSuccess).toBe(false);

			// Extract error message
			const errorMessage = extractErrorMessage(validatedItem.toolResult.content);
			expect(errorMessage).not.toBeNull();
			expect(errorMessage).toContain("Error:");
		});

		test("input validation and parsing workflow", () => {
			const input: WriteToolUseInput = {
				file_path: "/Users/user/example.ts",
				content: "export const greeting = 'Hello World';",
			};

			// Validate input
			const validatedInput = validateWriteToolUseInput(input);
			expect(validatedInput.file_path).toBe(input.file_path);

			// Format parameters
			const formatted = formatWriteParameters(input);
			expect(formatted).toContain("example.ts");
			expect(formatted).toContain("TypeScript");

			// Get content stats
			const stats = getContentStats(input.content);
			expect(stats.lines).toBe(1);
			expect(stats.words).toBe(6);
		});
	});
});

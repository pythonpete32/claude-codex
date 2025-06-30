import { describe, expect, test } from "bun:test";
import {
	basicFixtures,
	ERROR_MESSAGES,
	errorFixtures,
	extractErrorMessage,
	// Fixtures
	fixtures,
	formatFilePath,
	formatReadParameters,
	getFailedFixtures,
	getLineCount,
	getSuccessfulFixtures,
	isReadToolChatItem,
	isReadToolResultData,
	isReadToolUseInput,
	isSuccessfulRead,
	PACKAGE_NAME,
	// Parsers
	parseReadToolChatItem,
	parseReadToolOutput,
	ReadToolChatItemSchema,
	type ReadToolResultData,
	ReadToolResultDataSchema,
	// Types
	type ReadToolUseInput,
	// Schemas
	ReadToolUseInputSchema,
	safeValidateReadToolUseInput,
	// Constants
	TOOL_NAME,
	validateReadToolChatItem,
	// Validators
	validateReadToolUseInput,
} from "../src/index";

describe("read-tool", () => {
	describe("Type Guards", () => {
		test("isReadToolUseInput validates correct input", () => {
			const validInput: ReadToolUseInput = {
				file_path: "/test/file.txt",
			};
			expect(isReadToolUseInput(validInput)).toBe(true);
		});

		test("isReadToolUseInput rejects invalid input", () => {
			expect(isReadToolUseInput({})).toBe(false);
			expect(isReadToolUseInput({ file_path: 123 })).toBe(false);
			expect(isReadToolUseInput(null)).toBe(false);
		});

		test("isReadToolResultData validates correct result", () => {
			const validResult: ReadToolResultData = {
				content: "file content",
				totalLines: 10,
				truncated: false,
			};
			expect(isReadToolResultData(validResult)).toBe(true);
		});

		test("isReadToolResultData rejects invalid result", () => {
			expect(isReadToolResultData({})).toBe(false);
			expect(isReadToolResultData({ content: 123 })).toBe(false);
			expect(isReadToolResultData("string")).toBe(false);
		});

		test("isReadToolChatItem validates correct chat item", () => {
			const validItem = basicFixtures[0];
			expect(isReadToolChatItem(validItem)).toBe(true);
		});

		test("isReadToolChatItem rejects invalid items", () => {
			expect(isReadToolChatItem({ type: "text" } as unknown)).toBe(false);
			expect(isReadToolChatItem({ type: "tool_use", toolUse: { name: "Write" } } as unknown)).toBe(
				false,
			);
		});
	});

	describe("Schemas", () => {
		test("ReadToolUseInputSchema validates input", () => {
			const valid = { file_path: "/test.txt" };
			expect(() => ReadToolUseInputSchema.parse(valid)).not.toThrow();

			const withOptions = { file_path: "/test.txt", offset: 10, limit: 50 };
			expect(() => ReadToolUseInputSchema.parse(withOptions)).not.toThrow();
		});

		test("ReadToolUseInputSchema rejects invalid input", () => {
			expect(() => ReadToolUseInputSchema.parse({})).toThrow();
			expect(() => ReadToolUseInputSchema.parse({ file_path: "" })).toThrow();
			expect(() => ReadToolUseInputSchema.parse({ file_path: "/test.txt", offset: -1 })).toThrow();
			expect(() => ReadToolUseInputSchema.parse({ file_path: "/test.txt", limit: 0 })).toThrow();
		});

		test("ReadToolResultDataSchema validates results", () => {
			const valid = { content: "file content" };
			expect(() => ReadToolResultDataSchema.parse(valid)).not.toThrow();

			const withMetadata = {
				content: "file content",
				totalLines: 100,
				truncated: true,
				linesRead: 50,
			};
			expect(() => ReadToolResultDataSchema.parse(withMetadata)).not.toThrow();
		});

		test("ReadToolChatItemSchema validates complete items", () => {
			basicFixtures.forEach((fixture) => {
				expect(() => ReadToolChatItemSchema.parse(fixture)).not.toThrow();
			});
		});
	});

	describe("Validators", () => {
		test("validateReadToolUseInput validates and returns input", () => {
			const input = { file_path: "/test.txt" };
			const result = validateReadToolUseInput(input);
			expect(result).toEqual(input);
		});

		test("validateReadToolUseInput throws on invalid input", () => {
			expect(() => validateReadToolUseInput({})).toThrow();
			expect(() => validateReadToolUseInput({ file_path: 123 })).toThrow();
		});

		test("safeValidateReadToolUseInput returns null on error", () => {
			expect(safeValidateReadToolUseInput({})).toBeNull();
			expect(safeValidateReadToolUseInput({ file_path: "" })).toBeNull();
			expect(safeValidateReadToolUseInput({ file_path: "/test.txt" })).not.toBeNull();
		});

		test("validateReadToolChatItem validates fixtures", () => {
			allFixtures.forEach((fixture) => {
				expect(() => validateReadToolChatItem(fixture)).not.toThrow();
			});
		});
	});

	describe("Parsers", () => {
		test("parseReadToolChatItem creates component props", () => {
			const item = basicFixtures[0];
			const props = parseReadToolChatItem(item, {
				className: "test-class",
				onRetry: () => {},
			});

			expect(props).not.toBeNull();
			expect(props?.item).toBe(item);
			expect(props?.className).toBe("test-class");
			expect(typeof props?.onRetry).toBe("function");
		});

		test("parseReadToolChatItem returns null for non-read items", () => {
			const nonReadItem = { type: "text", text: "hello" } as unknown;
			expect(parseReadToolChatItem(nonReadItem)).toBeNull();
		});

		test("parseReadToolOutput handles different output formats", () => {
			// String error
			expect(parseReadToolOutput("Error: File not found")).toBe("Error: File not found");

			// Structured result
			const structured = {
				content: "file content",
				totalLines: 10,
				truncated: false,
			};
			expect(parseReadToolOutput(structured)).toEqual(structured);

			// Partial result
			const partial = { content: "file content" };
			expect(parseReadToolOutput(partial)).toEqual({
				content: "file content",
				totalLines: undefined,
				truncated: undefined,
				linesRead: undefined,
			});

			// Unexpected format
			expect(parseReadToolOutput(123)).toBe("123");
			expect(parseReadToolOutput(null)).toBe("null");
		});

		test("formatFilePath handles different path formats", () => {
			expect(formatFilePath("~/Documents/file.txt")).toBe("~/Documents/file.txt");
			expect(formatFilePath("/short/path.txt")).toBe("/short/path.txt");

			const longPath =
				"/very/long/path/that/exceeds/eighty/characters/limit/for/display/in/the/ui/component/file.txt";
			const formatted = formatFilePath(longPath);
			expect(formatted.length).toBeLessThan(longPath.length);
			expect(formatted).toContain("...");
		});

		test("extractErrorMessage extracts errors correctly", () => {
			expect(extractErrorMessage("Error: File not found")).toBe("Error: File not found");
			expect(extractErrorMessage({ error: "Permission denied" })).toBe("Permission denied");
			expect(extractErrorMessage({ message: "Failed" })).toBeNull();
			expect(extractErrorMessage(123)).toBeNull();
		});

		test("isSuccessfulRead identifies successful reads", () => {
			const successful = basicFixtures[0];
			expect(isSuccessfulRead(successful)).toBe(true);

			const failed = errorFixtures[0];
			expect(isSuccessfulRead(failed)).toBe(false);
		});

		test("getLineCount returns correct counts", () => {
			expect(getLineCount("error")).toBeNull();

			const withTotal: ReadToolResultData = {
				content: "line1\nline2",
				totalLines: 100,
			};
			expect(getLineCount(withTotal)).toBe(100);

			const withLinesRead: ReadToolResultData = {
				content: "line1\nline2",
				linesRead: 2,
			};
			expect(getLineCount(withLinesRead)).toBe(2);

			const contentOnly: ReadToolResultData = {
				content: "line1\nline2\nline3",
			};
			expect(getLineCount(contentOnly)).toBe(3);
		});

		test("formatReadParameters formats input parameters", () => {
			expect(formatReadParameters({ file_path: "/test.txt" })).toBe("/test.txt");

			expect(
				formatReadParameters({
					file_path: "/test.txt",
					offset: 100,
					limit: 50,
				}),
			).toBe("/test.txt, offset: 100, limit: 50");
		});
	});

	describe("Fixtures", () => {
		test("fixtures are properly typed", () => {
			expect(fixtures.basic).toBeArray();
			expect(fixtures.withOffsetAndLimit).toBeArray();
			expect(fixtures.errors).toBeArray();
			expect(fixtures.edgeCases).toBeArray();
		});

		test("fixture helper functions work correctly", () => {
			const successful = getSuccessfulFixtures();
			expect(successful.length).toBeGreaterThan(0);
			successful.forEach((f) => expect(f.toolResult.status).toBe("completed"));

			const failed = getFailedFixtures();
			expect(failed.length).toBeGreaterThan(0);
			failed.forEach((f) => expect(f.toolResult.status).toBe("failed"));
		});

		test("all fixtures have valid structure", () => {
			allFixtures.forEach((fixture) => {
				expect(fixture.type).toBe("tool_use");
				expect(fixture.toolUse.name).toBe(TOOL_NAME);
				expect(fixture.toolUse.input.file_path).toBeString();
				expect(["completed", "failed"]).toContain(fixture.toolResult.status);
			});
		});
	});

	describe("Constants", () => {
		test("package constants are defined", () => {
			expect(PACKAGE_NAME).toBe("@dao/chat-items-read-tool");
			expect(TOOL_NAME).toBe("Read");
		});

		test("error messages are defined", () => {
			expect(ERROR_MESSAGES.FILE_NOT_FOUND).toBeString();
			expect(ERROR_MESSAGES.PERMISSION_DENIED).toBeString();
		});
	});

	describe("Integration", () => {
		test("complete workflow with valid fixture", () => {
			const fixture = basicFixtures[0];

			// Validate the fixture
			const validated = validateReadToolChatItem(fixture);
			expect(validated).toEqual(fixture);

			// Create component props
			const props = parseReadToolChatItem(validated);
			expect(props).not.toBeNull();

			// Check if successful
			expect(isSuccessfulRead(validated)).toBe(true);

			// Format parameters
			const params = formatReadParameters(validated.toolUse.input);
			expect(params).toContain(validated.toolUse.input.file_path);
		});

		test("complete workflow with error fixture", () => {
			const fixture = errorFixtures[0];

			// Validate the fixture
			const validated = validateReadToolChatItem(fixture);
			expect(validated).toEqual(fixture);

			// Check if failed
			expect(isSuccessfulRead(validated)).toBe(false);

			// Extract error message
			const error = extractErrorMessage(validated.toolResult.output);
			expect(error).toBeString();
			expect(error).toContain("Error:");
		});
	});
});

// Import allFixtures for use in tests
import { allFixtures } from "../src/fixtures";

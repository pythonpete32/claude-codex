import { describe, expect, test } from "bun:test";
// Import allFixtures for use in tests
import { allFixtures } from "../src/fixtures";
import {
	basicFixtures,
	ERROR_MESSAGES,
	errorFixtures,
	extractErrorMessage,
	// Fixtures
	fixtures,
	formatEditOperation,
	formatEditsSummary,
	formatFilePath,
	formatMultiEditParameters,
	getEditSuccessRate,
	getFailedEdits,
	getFailedFixtures,
	getFixturesWithReplaceAll,
	getMultipleEditFixtures,
	getPartialFailureFixtures,
	getSuccessfulEdits,
	getSuccessfulFixtures,
	getTotalReplacements,
	isMultiEditOperation,
	isMultiEditToolChatItem,
	isMultiEditToolResultData,
	isMultiEditToolUseInput,
	isSuccessfulMultiEdit,
	LIMITS,
	// Types
	type MultiEditOperation,
	// Schemas
	MultiEditOperationSchema,
	MultiEditToolChatItemSchema,
	type MultiEditToolResultData,
	MultiEditToolResultDataSchema,
	type MultiEditToolUseInput,
	MultiEditToolUseInputSchema,
	PACKAGE_NAME,
	// Parsers
	parseMultiEditToolChatItem,
	parseMultiEditToolOutput,
	partialFailureFixtures,
	safeValidateMultiEditOperation,
	// Constants
	TOOL_NAME,
	// Validators
	validateMultiEditOperation,
	validateMultiEditToolChatItem,
} from "../src/index";

describe("multiedit-tool", () => {
	describe("Type Guards", () => {
		test("isMultiEditOperation validates correct operation", () => {
			const validOperation: MultiEditOperation = {
				old_string: "test",
				new_string: "replacement",
				replace_all: false,
			};
			expect(isMultiEditOperation(validOperation)).toBe(true);
		});

		test("isMultiEditOperation rejects invalid operation", () => {
			expect(isMultiEditOperation({})).toBe(false);
			expect(isMultiEditOperation({ old_string: "test" })).toBe(false);
			expect(isMultiEditOperation({ old_string: 123, new_string: "test" })).toBe(false);
			expect(isMultiEditOperation(null)).toBe(false);
		});

		test("isMultiEditToolUseInput validates correct input", () => {
			const validInput: MultiEditToolUseInput = {
				file_path: "/test/file.txt",
				edits: [
					{ old_string: "old", new_string: "new" },
					{ old_string: "test", new_string: "replacement", replace_all: true },
				],
			};
			expect(isMultiEditToolUseInput(validInput)).toBe(true);
		});

		test("isMultiEditToolUseInput rejects invalid input", () => {
			expect(isMultiEditToolUseInput({})).toBe(false);
			expect(isMultiEditToolUseInput({ file_path: "/test.txt" })).toBe(false);
			expect(isMultiEditToolUseInput({ file_path: "/test.txt", edits: "not-array" })).toBe(false);
			expect(
				isMultiEditToolUseInput({ file_path: "/test.txt", edits: [{ invalid: "edit" }] }),
			).toBe(false);
		});

		test("isMultiEditToolResultData validates correct result", () => {
			const validResult: MultiEditToolResultData = {
				message: "Success",
				edits_applied: 2,
				total_edits: 2,
				all_successful: true,
			};
			expect(isMultiEditToolResultData(validResult)).toBe(true);
		});

		test("isMultiEditToolResultData rejects invalid result", () => {
			expect(isMultiEditToolResultData({})).toBe(false);
			expect(isMultiEditToolResultData({ message: "test" })).toBe(false);
			expect(
				isMultiEditToolResultData({
					message: 123,
					edits_applied: 2,
					total_edits: 2,
					all_successful: true,
				}),
			).toBe(false);
		});

		test("isMultiEditToolChatItem validates correct chat item", () => {
			const validItem = basicFixtures[0];
			expect(isMultiEditToolChatItem(validItem)).toBe(true);
		});

		test("isMultiEditToolChatItem rejects invalid items", () => {
			expect(isMultiEditToolChatItem({ type: "text" } as unknown)).toBe(false);
			expect(
				isMultiEditToolChatItem({ type: "tool_use", toolUse: { name: "Read" } } as unknown),
			).toBe(false);
		});
	});

	describe("Schemas", () => {
		test("MultiEditOperationSchema validates operations", () => {
			const valid = { old_string: "test", new_string: "replacement" };
			expect(() => MultiEditOperationSchema.parse(valid)).not.toThrow();

			const withReplaceAll = { old_string: "test", new_string: "replacement", replace_all: true };
			expect(() => MultiEditOperationSchema.parse(withReplaceAll)).not.toThrow();
		});

		test("MultiEditOperationSchema rejects invalid operations", () => {
			expect(() => MultiEditOperationSchema.parse({})).toThrow();
			expect(() => MultiEditOperationSchema.parse({ old_string: "" })).toThrow();
			expect(() =>
				MultiEditOperationSchema.parse({ old_string: "test", new_string: 123 }),
			).toThrow();
		});

		test("MultiEditToolUseInputSchema validates input", () => {
			const valid = {
				file_path: "/test.txt",
				edits: [{ old_string: "old", new_string: "new" }],
			};
			expect(() => MultiEditToolUseInputSchema.parse(valid)).not.toThrow();
		});

		test("MultiEditToolUseInputSchema rejects invalid input", () => {
			expect(() => MultiEditToolUseInputSchema.parse({})).toThrow();
			expect(() => MultiEditToolUseInputSchema.parse({ file_path: "", edits: [] })).toThrow();
			expect(() =>
				MultiEditToolUseInputSchema.parse({ file_path: "/test.txt", edits: [] }),
			).toThrow();
		});

		test("MultiEditToolResultDataSchema validates results", () => {
			const valid = {
				message: "Success",
				edits_applied: 1,
				total_edits: 1,
				all_successful: true,
			};
			expect(() => MultiEditToolResultDataSchema.parse(valid)).not.toThrow();
		});

		test("MultiEditToolChatItemSchema validates complete items", () => {
			basicFixtures.forEach((fixture) => {
				expect(() => MultiEditToolChatItemSchema.parse(fixture)).not.toThrow();
			});
		});
	});

	describe("Validators", () => {
		test("validateMultiEditOperation validates and returns operation", () => {
			const operation = { old_string: "test", new_string: "replacement" };
			const result = validateMultiEditOperation(operation);
			expect(result).toEqual({ ...operation, replace_all: false });
		});

		test("validateMultiEditOperation throws on invalid operation", () => {
			expect(() => validateMultiEditOperation({})).toThrow();
			expect(() => validateMultiEditOperation({ old_string: "", new_string: "test" })).toThrow();
		});

		test("safeValidateMultiEditOperation returns null on error", () => {
			expect(safeValidateMultiEditOperation({})).toBeNull();
			expect(
				safeValidateMultiEditOperation({ old_string: "test", new_string: "replacement" }),
			).not.toBeNull();
		});

		test("validateMultiEditToolChatItem validates fixtures", () => {
			allFixtures.forEach((fixture) => {
				expect(() => validateMultiEditToolChatItem(fixture)).not.toThrow();
			});
		});
	});

	describe("Parsers", () => {
		test("parseMultiEditToolChatItem creates component props", () => {
			const item = basicFixtures[0];
			const props = parseMultiEditToolChatItem(item, {
				className: "test-class",
				onRetry: () => {},
			});

			expect(props).not.toBeNull();
			expect(props?.item).toBe(item);
			expect(props?.className).toBe("test-class");
			expect(typeof props?.onRetry).toBe("function");
		});

		test("parseMultiEditToolChatItem returns null for non-multiedit items", () => {
			const nonMultiEditItem = { type: "text", text: "hello" } as unknown;
			expect(parseMultiEditToolChatItem(nonMultiEditItem)).toBeNull();
		});

		test("parseMultiEditToolOutput handles different output formats", () => {
			// String error
			expect(parseMultiEditToolOutput("Error: File not found")).toBe("Error: File not found");

			// Structured result
			const structured = {
				message: "Success",
				edits_applied: 1,
				total_edits: 1,
				all_successful: true,
			};
			expect(parseMultiEditToolOutput(structured)).toEqual(structured);

			// Unexpected format
			expect(parseMultiEditToolOutput(123)).toBe("123");
			expect(parseMultiEditToolOutput(null)).toBe("null");
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

		test("isSuccessfulMultiEdit identifies successful operations", () => {
			const successful = basicFixtures[0];
			expect(isSuccessfulMultiEdit(successful)).toBe(true);

			const failed = errorFixtures[0];
			expect(isSuccessfulMultiEdit(failed)).toBe(false);

			const partialFailure = partialFailureFixtures[0];
			expect(isSuccessfulMultiEdit(partialFailure)).toBe(false);
		});

		test("getEditSuccessRate calculates correct rates", () => {
			expect(getEditSuccessRate("error")).toBeNull();

			const fullSuccess: MultiEditToolResultData = {
				message: "Success",
				edits_applied: 3,
				total_edits: 3,
				all_successful: true,
			};
			expect(getEditSuccessRate(fullSuccess)).toBe(100);

			const partialSuccess: MultiEditToolResultData = {
				message: "Partial",
				edits_applied: 2,
				total_edits: 3,
				all_successful: false,
			};
			expect(getEditSuccessRate(partialSuccess)).toBeCloseTo(66.67, 1);

			const noEdits: MultiEditToolResultData = {
				message: "No edits",
				edits_applied: 0,
				total_edits: 0,
				all_successful: true,
			};
			expect(getEditSuccessRate(noEdits)).toBe(100);
		});

		test("formatEditsSummary formats edit counts", () => {
			expect(formatEditsSummary([{ old_string: "a", new_string: "b" }])).toBe("1 edit");

			expect(
				formatEditsSummary([
					{ old_string: "a", new_string: "b" },
					{ old_string: "c", new_string: "d" },
				]),
			).toBe("2 edits");

			expect(
				formatEditsSummary([
					{ old_string: "a", new_string: "b" },
					{ old_string: "c", new_string: "d", replace_all: true },
				]),
			).toBe("2 edits, 1 replace-all");
		});

		test("formatEditOperation formats operations for display", () => {
			const shortEdit = { old_string: "old", new_string: "new" };
			expect(formatEditOperation(shortEdit)).toBe('"old" → "new"');

			const replaceAllEdit = { old_string: "old", new_string: "new", replace_all: true };
			expect(formatEditOperation(replaceAllEdit)).toBe('"old" → "new" (all)');

			const longEdit = {
				old_string:
					"This is a very long string that exceeds the display limit and should be truncated",
				new_string:
					"This is another very long string that also exceeds the display limit and should be truncated",
			};
			const formatted = formatEditOperation(longEdit);
			expect(formatted).toContain("...");
			expect(formatted.length).toBeLessThan(
				longEdit.old_string.length + longEdit.new_string.length,
			);
		});

		test("getFailedEdits and getSuccessfulEdits filter correctly", () => {
			const resultWithDetails: MultiEditToolResultData = {
				message: "Partial success",
				edits_applied: 1,
				total_edits: 2,
				all_successful: false,
				edit_details: [
					{
						operation: { old_string: "a", new_string: "b" },
						success: true,
						replacements_made: 1,
					},
					{
						operation: { old_string: "c", new_string: "d" },
						success: false,
						error: "String not found",
						replacements_made: 0,
					},
				],
			};

			expect(getSuccessfulEdits(resultWithDetails)).toHaveLength(1);
			expect(getFailedEdits(resultWithDetails)).toHaveLength(1);

			const resultWithoutDetails: MultiEditToolResultData = {
				message: "Success",
				edits_applied: 1,
				total_edits: 1,
				all_successful: true,
			};

			expect(getSuccessfulEdits(resultWithoutDetails)).toHaveLength(0);
			expect(getFailedEdits(resultWithoutDetails)).toHaveLength(0);
		});

		test("getTotalReplacements sums correctly", () => {
			const resultWithDetails: MultiEditToolResultData = {
				message: "Success",
				edits_applied: 2,
				total_edits: 2,
				all_successful: true,
				edit_details: [
					{
						operation: { old_string: "a", new_string: "b" },
						success: true,
						replacements_made: 3,
					},
					{
						operation: { old_string: "c", new_string: "d" },
						success: true,
						replacements_made: 2,
					},
				],
			};

			expect(getTotalReplacements(resultWithDetails)).toBe(5);

			const resultWithoutDetails: MultiEditToolResultData = {
				message: "Success",
				edits_applied: 1,
				total_edits: 1,
				all_successful: true,
			};

			expect(getTotalReplacements(resultWithoutDetails)).toBe(0);
		});

		test("formatMultiEditParameters formats input parameters", () => {
			const input: MultiEditToolUseInput = {
				file_path: "/test.txt",
				edits: [
					{ old_string: "old", new_string: "new" },
					{ old_string: "test", new_string: "replacement", replace_all: true },
				],
			};

			const formatted = formatMultiEditParameters(input);
			expect(formatted).toContain("/test.txt");
			expect(formatted).toContain("2 edits");
			expect(formatted).toContain("1 replace-all");
		});
	});

	describe("Fixtures", () => {
		test("fixtures are properly typed", () => {
			expect(fixtures.basic).toBeArray();
			expect(fixtures.withReplaceAll).toBeArray();
			expect(fixtures.partialFailures).toBeArray();
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

			const withReplaceAll = getFixturesWithReplaceAll();
			expect(withReplaceAll.length).toBeGreaterThan(0);
			withReplaceAll.forEach((f) =>
				expect(f.toolUse.input.edits.some((edit) => edit.replace_all)).toBe(true),
			);

			const partialFailures = getPartialFailureFixtures();
			expect(partialFailures.length).toBeGreaterThan(0);

			const multipleEdits = getMultipleEditFixtures();
			expect(multipleEdits.length).toBeGreaterThan(0);
			multipleEdits.forEach((f) => expect(f.toolUse.input.edits.length).toBeGreaterThan(1));
		});

		test("all fixtures have valid structure", () => {
			allFixtures.forEach((fixture) => {
				expect(fixture.type).toBe("tool_use");
				expect(fixture.toolUse.name).toBe(TOOL_NAME);
				expect(fixture.toolUse.input.file_path).toBeString();
				expect(Array.isArray(fixture.toolUse.input.edits)).toBe(true);
				expect(fixture.toolUse.input.edits.length).toBeGreaterThan(0);
				expect(["completed", "failed"]).toContain(fixture.toolResult.status);
			});
		});
	});

	describe("Constants", () => {
		test("package constants are defined", () => {
			expect(PACKAGE_NAME).toBe("@dao/chat-items-multiedit-tool");
			expect(TOOL_NAME).toBe("MultiEdit");
		});

		test("error messages are defined", () => {
			expect(ERROR_MESSAGES.FILE_NOT_FOUND).toBeString();
			expect(ERROR_MESSAGES.EMPTY_OLD_STRING).toBeString();
			expect(ERROR_MESSAGES.NO_EDITS).toBeString();
		});

		test("limits are defined", () => {
			expect(LIMITS.MAX_EDITS_PER_REQUEST).toBeNumber();
			expect(LIMITS.MAX_OLD_STRING_LENGTH).toBeNumber();
			expect(LIMITS.MAX_NEW_STRING_LENGTH).toBeNumber();
		});
	});

	describe("Integration", () => {
		test("complete workflow with valid fixture", () => {
			const fixture = basicFixtures[0];

			// Validate the fixture
			const validated = validateMultiEditToolChatItem(fixture);
			expect(validated).toEqual(fixture);

			// Create component props
			const props = parseMultiEditToolChatItem(validated);
			expect(props).not.toBeNull();

			// Check if successful
			expect(isSuccessfulMultiEdit(validated)).toBe(true);

			// Format parameters
			const params = formatMultiEditParameters(validated.toolUse.input);
			expect(params).toContain(validated.toolUse.input.file_path);

			// Get success rate
			if (typeof validated.toolResult.output !== "string") {
				const successRate = getEditSuccessRate(validated.toolResult.output);
				expect(successRate).toBe(100);
			}
		});

		test("complete workflow with partial failure fixture", () => {
			const fixture = partialFailureFixtures[0];

			// Validate the fixture
			const validated = validateMultiEditToolChatItem(fixture);
			expect(validated).toEqual(fixture);

			// Check if not fully successful
			expect(isSuccessfulMultiEdit(validated)).toBe(false);

			// Get failed edits
			if (typeof validated.toolResult.output !== "string") {
				const failedEdits = getFailedEdits(validated.toolResult.output);
				expect(failedEdits.length).toBeGreaterThan(0);

				const successfulEdits = getSuccessfulEdits(validated.toolResult.output);
				expect(successfulEdits.length).toBeGreaterThan(0);

				const successRate = getEditSuccessRate(validated.toolResult.output);
				expect(successRate).toBeLessThan(100);
				expect(successRate).toBeGreaterThan(0);
			}
		});

		test("complete workflow with error fixture", () => {
			const fixture = errorFixtures[0];

			// Validate the fixture
			const validated = validateMultiEditToolChatItem(fixture);
			expect(validated).toEqual(fixture);

			// Check if failed
			expect(isSuccessfulMultiEdit(validated)).toBe(false);

			// Extract error message
			const error = extractErrorMessage(validated.toolResult.output);
			expect(error).toBeString();
			expect(error).toContain("Error:");
		});
	});
});

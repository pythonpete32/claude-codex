import type { LogEntry, MessageContent } from "@claude-codex/types";
import { beforeEach, describe, expect, test } from "vitest";
import { LsToolParser } from "../../src/parsers/ls-parser";
import {
	loadFixture,
	setupFixtureBasedTesting,
	validateBaseToolProps,
} from "../utils";

// Setup fixture-based testing with custom matchers
setupFixtureBasedTesting();

interface LsFixture {
	toolCall: {
		uuid: string;
		timestamp: string;
		parentUuid: string;
		type: string;
		isSidechain: boolean;
		message: {
			content: MessageContent[];
		};
	};
	toolResult: {
		uuid: string;
		timestamp: string;
		parentUuid: string;
		type: string;
		isSidechain: boolean;
		message: {
			content: MessageContent[];
		};
		toolUseResult?:
			| string
			| {
					entries?: Array<{
						name: string;
						type: string;
						size?: number;
						permissions?: string;
						modified?: string;
					}>;
					totalSize?: number;
					entryCount?: number;
			  };
	};
	expectedComponentData: {
		id: string;
		uuid: string;
		parentUuid: string;
		timestamp: string;
		status: {
			normalized: string;
			original: string;
		};
		input: {
			path: string;
			showHidden: boolean;
			recursive: boolean;
		};
		results: Array<{
			name: string;
			type: string;
		}>;
		entryCount: number;
		ui: {
			totalFiles: number;
			totalDirectories: number;
			totalSize: number;
		};
	};
}

interface LsFixtureData {
	fixtures: LsFixture[];
}

describe("LsToolParser - Fixture-Based Testing", () => {
	let parser: LsToolParser;
	let fixtureData: LsFixtureData;

	beforeEach(() => {
		parser = new LsToolParser();
		// Load the new fixture file
		fixtureData = loadFixture("ls-tool-new.json");
	});

	/**
	 * Transform fixture data to match parser expectations
	 */
	function transformToolCall(fixture: LsFixture): LogEntry {
		return {
			uuid: fixture.toolCall.uuid,
			timestamp: fixture.toolCall.timestamp,
			parentUuid: fixture.toolCall.parentUuid,
			type: fixture.toolCall.type as "assistant",
			isSidechain: fixture.toolCall.isSidechain,
			content: fixture.toolCall.message.content,
		};
	}

	function transformToolResult(fixture: LsFixture): LogEntry {
		const baseEntry: LogEntry = {
			uuid: fixture.toolResult.uuid,
			timestamp: fixture.toolResult.timestamp,
			parentUuid: fixture.toolResult.parentUuid,
			type: fixture.toolResult.type as "user",
			isSidechain: fixture.toolResult.isSidechain,
			content: fixture.toolResult.message.content,
		};

		// Add toolUseResult if it exists (for parser to extract)
		if (fixture.toolResult.toolUseResult) {
			(baseEntry as unknown as Record<string, unknown>).toolUseResult =
				fixture.toolResult.toolUseResult;
		}

		return baseEntry;
	}

	describe("real fixture validation", () => {
		test("should parse all fixture scenarios successfully", () => {
			expect(fixtureData.fixtures).toBeDefined();
			expect(fixtureData.fixtures.length).toBeGreaterThan(0);

			for (const fixture of fixtureData.fixtures) {
				const toolCallEntry = transformToolCall(fixture);
				const toolResultEntry = transformToolResult(fixture);

				// Verify parser can handle the tool call
				expect(parser.canParse(toolCallEntry)).toBe(true);

				// Parse and validate
				const result = parser.parse(toolCallEntry, toolResultEntry);

				// Validate base properties
				validateBaseToolProps(result);

				// Validate against expected data
				const expected = fixture.expectedComponentData;
				expect(result.uuid).toBe(expected.uuid);
				expect(result.id).toBe(expected.id);
				expect(result.status.normalized).toBe(expected.status.normalized);
				// Note: mapFromError returns 'success' for original when no error
				expect(result.status.original).toBe("success");
				expect(result.results?.entryCount).toBe(expected.entryCount);
			}
		});

		test("should parse successful ls operation from fixture", () => {
			const fixture = fixtureData.fixtures[0]; // First fixture is a successful ls

			const toolCallEntry = transformToolCall(fixture);
			const toolResultEntry = transformToolResult(fixture);

			const result = parser.parse(toolCallEntry, toolResultEntry);

			// Verify successful execution
			expect(result.status.normalized).toBe("completed");
			expect(result.input.path).toBe("/Users/abuusama/Desktop/temp/test-data");
			expect(result.input.showHidden).toBe(true); // Parser defaults to true
			expect(result.input.recursive).toBe(false);

			// Verify results
			expect(result.results).toBeDefined();
			expect(result.results!.entries.length).toBe(12);
			expect(result.results!.entryCount).toBe(12);

			// Check some specific files
			const sampleFile = result.results!.entries.find(
				(r) => r.name === "sample.txt",
			);
			expect(sampleFile).toBeDefined();
			expect(sampleFile?.type).toBe("file");

			const subdir = result.results!.entries.find((r) => r.name === "subdir");
			expect(subdir).toBeDefined();
			expect(subdir?.type).toBe("directory");

			// Verify UI helpers
			expect(result.ui.totalFiles).toBe(11);
			expect(result.ui.totalDirectories).toBe(1);
		});

		test("should parse string output from fixture", () => {
			const fixture = fixtureData.fixtures[0];

			const toolCallEntry = transformToolCall(fixture);
			const toolResultEntry = transformToolResult(fixture);

			// The fixture has string output in content
			const result = parser.parse(toolCallEntry, toolResultEntry);

			// Should parse the tree-like output format
			expect(result.status.normalized).toBe("completed");
			expect(result.results!.entries.length).toBe(12);
		});
	});

	describe("canParse validation", () => {
		test("should correctly identify LS tool calls", () => {
			const fixture = fixtureData.fixtures[0];
			const toolCallEntry = transformToolCall(fixture);
			expect(parser.canParse(toolCallEntry)).toBe(true);
		});

		test("should reject non-LS tool entries", () => {
			const nonLsEntry: LogEntry = {
				uuid: "test-uuid",
				timestamp: "2025-06-25T18:20:11.465Z",
				type: "assistant",
				content: [
					{
						type: "tool_use",
						id: "test-id",
						name: "Bash",
						input: { command: "ls" },
					},
				],
			};
			expect(parser.canParse(nonLsEntry)).toBe(false);
		});

		test("should reject user messages", () => {
			const userEntry: LogEntry = {
				uuid: "test-uuid",
				timestamp: "2025-06-25T18:20:11.465Z",
				type: "user",
				content: "List files",
			};
			expect(parser.canParse(userEntry)).toBe(false);
		});

		test("should handle string content normalization", () => {
			const stringContentEntry: LogEntry = {
				uuid: "test-uuid",
				timestamp: "2025-06-25T18:20:11.465Z",
				type: "assistant",
				content: "Just a string",
			};
			expect(parser.canParse(stringContentEntry)).toBe(false);
		});

		test("should handle single object content normalization", () => {
			const singleObjectEntry: LogEntry = {
				uuid: "test-uuid",
				timestamp: "2025-06-25T18:20:11.465Z",
				type: "assistant",
				content: {
					type: "tool_use",
					id: "test-id",
					name: "LS",
					input: { path: "/test" },
				} as MessageContent,
			};
			expect(parser.canParse(singleObjectEntry)).toBe(true);
		});
	});

	describe("edge cases and error handling", () => {
		test("should handle pending status when no result", () => {
			const fixture = fixtureData.fixtures[0];
			const toolCallEntry = transformToolCall(fixture);

			// Parse without result
			const result = parser.parse(toolCallEntry);
			expect(result.status.normalized).toBe("pending");
			expect(result.results?.entries).toEqual([]);
			expect(result.results?.errorMessage).toBeUndefined();
		});

		test("should handle missing path parameter", () => {
			const noPathEntry: LogEntry = {
				uuid: "test-uuid",
				timestamp: "2025-06-25T18:20:11.465Z",
				type: "assistant",
				content: [
					{
						type: "tool_use",
						id: "test-id",
						name: "LS",
						input: {},
					},
				],
			};

			const result = parser.parse(noPathEntry);
			expect(result.input.path).toBeUndefined();
			expect(result.input.ignore).toBeUndefined();
		});

		test("should handle tools with no input gracefully", () => {
			const toolCall: LogEntry = {
				uuid: "test-uuid",
				timestamp: "2025-06-25T18:20:11.465Z",
				type: "assistant",
				content: [
					{
						type: "tool_use",
						id: "test-tool-id",
						name: "LS",
						input: undefined,
					},
				],
			};

			const result = parser.parse(toolCall);
			expect(result.input.path).toBeUndefined();
			expect(result.status.normalized).toBe("pending");
		});

		test("should handle error output from fixture-like structure", () => {
			// Create a fixture-like structure for error case
			const errorFixture: LsFixture = {
				toolCall: {
					uuid: "error-uuid",
					timestamp: "2025-06-25T18:20:11.465Z",
					parentUuid: "error-uuid",
					type: "assistant",
					isSidechain: false,
					message: {
						content: [
							{
								type: "tool_use",
								id: "error-tool-id",
								name: "LS",
								input: {
									path: "/root/private",
								},
							},
						],
					},
				},
				toolResult: {
					uuid: "error-result-uuid",
					timestamp: "2025-06-25T18:20:12.465Z",
					parentUuid: "error-uuid",
					type: "user",
					isSidechain: false,
					message: {
						content: [
							{
								type: "tool_result",
								tool_use_id: "error-tool-id",
								output: "Permission denied: /root/private",
								is_error: true,
							},
						],
					},
				},
				expectedComponentData: {
					id: "error-tool-id",
					uuid: "error-uuid",
					parentUuid: "error-uuid",
					timestamp: "2025-06-25T18:20:11.465Z",
					status: {
						normalized: "failed",
						original: "error",
					},
					input: {
						path: "/root/private",
						showHidden: false,
						recursive: false,
					},
					results: [],
					entryCount: 0,
					ui: {
						totalFiles: 0,
						totalDirectories: 0,
						totalSize: 0,
					},
				},
			};

			const toolCallEntry = transformToolCall(errorFixture);
			const toolResultEntry = transformToolResult(errorFixture);

			const result = parser.parse(toolCallEntry, toolResultEntry);

			expect(result.status.normalized).toBe("failed");
			expect(result.results?.errorMessage).toBe(
				"Permission denied: /root/private",
			);
			expect(result.results?.entries).toEqual([]);
			expect(result.results?.entryCount).toBe(0);
		});

		test("should handle interrupted operations", () => {
			const interruptedResult: LogEntry = {
				uuid: "result-uuid",
				timestamp: "2025-06-25T18:20:11.465Z",
				parentUuid: "test-uuid",
				type: "user",
				content: [
					{
						type: "tool_result",
						tool_use_id: "test-tool-id",
						output: { interrupted: true },
						is_error: false,
					},
				],
			};

			const toolCall: LogEntry = {
				uuid: "test-uuid",
				timestamp: "2025-06-25T18:20:11.465Z",
				type: "assistant",
				content: [
					{
						type: "tool_use",
						id: "test-tool-id",
						name: "LS",
						input: { path: "/test" },
					},
				],
			};

			const result = parser.parse(toolCall, interruptedResult);
			expect(result.status.normalized).toBe("interrupted");
			expect(result.results).toEqual([]);
		});
	});

	describe("type inference and parsing", () => {
		test("should handle malformed entry data", () => {
			const malformedResult: LogEntry = {
				uuid: "result-uuid",
				timestamp: "2025-06-25T18:20:11.465Z",
				parentUuid: "test-uuid",
				type: "user",
				content: [
					{
						type: "tool_result",
						tool_use_id: "test-id",
						output: {
							entries: [
								{ filename: "test.txt" }, // missing standard fields
								{ name: "valid.txt", type: "file", size: 100 },
							],
						},
						is_error: false,
					},
				],
			};

			const toolCall: LogEntry = {
				uuid: "test-uuid",
				timestamp: "2025-06-25T18:20:11.465Z",
				type: "assistant",
				content: [
					{
						type: "tool_use",
						id: "test-id",
						name: "LS",
						input: { path: "/test" },
					},
				],
			};

			const result = parser.parse(toolCall, malformedResult);

			expect(result.results?.entries).toHaveLength(2);
			expect(result.results!.entries[0].name).toBe("test.txt"); // filename → name
			expect(result.results!.entries[0].type).toBe("file"); // default
			expect(result.results!.entries[1].name).toBe("valid.txt");
		});

		test("should infer file types from names", () => {
			const typeInferenceResult: LogEntry = {
				uuid: "result-uuid",
				timestamp: "2025-06-25T18:20:11.465Z",
				parentUuid: "test-uuid",
				type: "user",
				content: [
					{
						type: "tool_result",
						tool_use_id: "test-id",
						output: {
							entries: [
								{ name: "folder/" }, // ends with slash
								{ name: ".hidden" }, // hidden dir pattern
								{ name: "file.txt" }, // regular file
							],
						},
						is_error: false,
					},
				],
			};

			const toolCall: LogEntry = {
				uuid: "test-uuid",
				timestamp: "2025-06-25T18:20:11.465Z",
				type: "assistant",
				content: [
					{
						type: "tool_use",
						id: "test-id",
						name: "LS",
						input: { path: "/test" },
					},
				],
			};

			const result = parser.parse(toolCall, typeInferenceResult);

			expect(result.results!.entries[0].type).toBe("directory");
			expect(result.results!.entries[1].type).toBe("directory");
			expect(result.results!.entries[2].type).toBe("file");
		});

		test("should parse string output format", () => {
			const stringOutputResult: LogEntry = {
				uuid: "result-uuid",
				timestamp: "2025-06-25T18:20:11.465Z",
				parentUuid: "test-uuid",
				type: "user",
				content: [
					{
						type: "tool_result",
						tool_use_id: "test-id",
						output:
							"package.json 1024 file 2025-06-25T10:00:00Z\nsrc 4096 directory 2025-06-25T12:00:00Z",
						is_error: false,
					},
				],
			};

			const toolCall: LogEntry = {
				uuid: "test-uuid",
				timestamp: "2025-06-25T18:20:11.465Z",
				type: "assistant",
				content: [
					{
						type: "tool_use",
						id: "test-id",
						name: "LS",
						input: { path: "/test" },
					},
				],
			};

			const result = parser.parse(toolCall, stringOutputResult);

			expect(result.status.normalized).toBe("completed");
			expect(result.results?.entries).toHaveLength(2);
			expect(result.results!.entries[0].name).toBe("package.json");
			expect(result.results!.entries[0].size).toBe(1024);
			expect(result.results!.entries[1].type).toBe("directory");
		});
	});

	describe("feature support", () => {
		test("should declare supported features", () => {
			const features = parser.getSupportedFeatures();
			expect(features).toContain("basic-parsing");
			expect(features).toContain("status-mapping");
			expect(features).toContain("file-info-parsing");
			expect(features).toContain("interrupted-support");
		});
	});

	describe("performance validation", () => {
		test("should parse fixtures within acceptable time", () => {
			const startTime = performance.now();

			for (const fixture of fixtureData.fixtures) {
				const toolCallEntry = transformToolCall(fixture);
				const toolResultEntry = transformToolResult(fixture);
				parser.parse(toolCallEntry, toolResultEntry);
			}

			const endTime = performance.now();
			const averageTime = (endTime - startTime) / fixtureData.fixtures.length;

			// Each parse should take less than 10ms
			expect(averageTime).toBeLessThan(10);
		});
	});
});

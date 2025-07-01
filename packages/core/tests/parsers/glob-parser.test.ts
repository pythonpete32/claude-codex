import type { LogEntry, MessageContent } from "@claude-codex/types";
import { beforeEach, describe, expect, test } from "vitest";
import { GlobToolParser } from "../../src/parsers/glob-parser";
import {
	loadFixture,
	setupFixtureBasedTesting,
	validateBaseToolProps,
} from "../utils";

// Setup fixture-based testing with custom matchers
setupFixtureBasedTesting();

interface GlobFixture {
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
		toolUseResult?: {
			filenames: string[];
			durationMs: number;
			numFiles: number;
			truncated: boolean;
		};
	};
	expectedComponentData: {
		id: string;
		uuid: string;
		timestamp: string;
		status: {
			normalized: string;
			original: string;
		};
		input: {
			pattern: string;
			searchPath: string;
		};
		results: string[];
		ui: {
			totalMatches: number;
			filesWithMatches: number;
			searchTime: number;
		};
	};
}

interface GlobFixtureData {
	fixtures: GlobFixture[];
}

describe("GlobToolParser - Fixture-Based Testing", () => {
	let parser: GlobToolParser;
	let fixtureData: GlobFixtureData;

	beforeEach(() => {
		parser = new GlobToolParser();
		// Load the new fixture file
		fixtureData = loadFixture("glob-tool-new.json");
	});

	/**
	 * Transform fixture data to match parser expectations
	 * The fixture has structured data in toolUseResult but string in content
	 */
	function transformToolCall(fixture: GlobFixture): LogEntry {
		return {
			uuid: fixture.toolCall.uuid,
			timestamp: fixture.toolCall.timestamp,
			parentUuid: fixture.toolCall.parentUuid,
			type: fixture.toolCall.type as "assistant",
			isSidechain: fixture.toolCall.isSidechain,
			content: fixture.toolCall.message.content,
		};
	}

	function transformToolResult(fixture: GlobFixture): LogEntry {
		const baseEntry: LogEntry = {
			uuid: fixture.toolResult.uuid,
			timestamp: fixture.toolResult.timestamp,
			parentUuid: fixture.toolResult.parentUuid,
			type: fixture.toolResult.type as "user",
			isSidechain: fixture.toolResult.isSidechain,
			content: fixture.toolResult.message.content,
		};

		// Transform the content to include structured output if available
		if (
			fixture.toolResult.toolUseResult &&
			baseEntry.content &&
			Array.isArray(baseEntry.content)
		) {
			const toolResultContent = baseEntry.content.find(
				(c) => c.type === "tool_result",
			) as MessageContent & { type: "tool_result" };
			if (toolResultContent && fixture.toolResult.toolUseResult.filenames) {
				// Set the output as array of filenames for the parser
				toolResultContent.output = fixture.toolResult.toolUseResult.filenames;
			}
		}

		return baseEntry;
	}

	describe("real fixture validation", () => {
		test("should parse all fixture scenarios successfully", () => {
			expect(fixtureData.fixtures).toBeDefined();
			expect(fixtureData.fixtures.length).toBeGreaterThan(0);

			for (const fixture of fixtureData.fixtures) {
				// Convert fixture format to LogEntry format
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

				// Validate input structure
				expect(result.input.pattern).toBe(expected.input.pattern);
				expect(result.input.searchPath).toBe(expected.input.searchPath);

				// Validate results
				expect(result.results).toEqual(expected.results);

				// Validate UI data
				expect(result.ui.totalMatches).toBe(expected.ui.totalMatches);
				expect(result.ui.filesWithMatches).toBe(expected.ui.filesWithMatches);
			}
		});

		test("should parse successful glob operation from fixture", () => {
			const fixture = fixtureData.fixtures[0];
			const toolCallEntry = transformToolCall(fixture);
			const toolResultEntry = transformToolResult(fixture);

			const result = parser.parse(toolCallEntry, toolResultEntry);

			expect(result.input.pattern).toBe("**/*.py");
			expect(result.input.searchPath).toBe(
				"/Users/abuusama/Desktop/temp/test-data",
			);
			expect(result.results).toEqual([
				"/Users/abuusama/Desktop/temp/test-data/subdir/nested.py",
			]);
			expect(result.status.normalized).toBe("completed");
		});
	});

	describe("canParse validation", () => {
		test("should correctly identify Glob tool calls", () => {
			const entry: LogEntry = {
				type: "assistant",
				uuid: "test-uuid",
				timestamp: "2025-01-01T00:00:00Z",
				content: [
					{
						type: "tool_use",
						id: "test-tool-id",
						name: "Glob",
						input: { pattern: "*.js" },
					},
				],
			};

			expect(parser.canParse(entry)).toBe(true);
		});

		test("should reject non-Glob tool entries", () => {
			const entry: LogEntry = {
				type: "assistant",
				uuid: "test-uuid",
				timestamp: "2025-01-01T00:00:00Z",
				content: [
					{
						type: "tool_use",
						id: "test-tool-id",
						name: "Bash",
						input: { command: "ls" },
					},
				],
			};

			expect(parser.canParse(entry)).toBe(false);
		});

		test("should reject user messages", () => {
			const entry: LogEntry = {
				type: "user",
				uuid: "test-uuid",
				timestamp: "2025-01-01T00:00:00Z",
				content: "Search for Python files",
			};

			expect(parser.canParse(entry)).toBe(false);
		});

		test("should handle string content normalization", () => {
			const entry: LogEntry = {
				type: "assistant",
				uuid: "test-uuid",
				timestamp: "2025-01-01T00:00:00Z",
				content: "I will search for files",
			};

			expect(parser.canParse(entry)).toBe(false);
		});

		test("should handle single object content normalization", () => {
			const entry: LogEntry = {
				type: "assistant",
				uuid: "test-uuid",
				timestamp: "2025-01-01T00:00:00Z",
				content: {
					type: "tool_use",
					id: "test-tool-id",
					name: "Glob",
					input: { pattern: "*.ts" },
				} as MessageContent,
			};

			expect(parser.canParse(entry)).toBe(true);
		});
	});

	describe("edge cases and error handling", () => {
		test("should handle pending status when no result", () => {
			const fixture = fixtureData.fixtures[0];
			const toolCallEntry = transformToolCall(fixture);

			const result = parser.parse(toolCallEntry);

			expect(result.status.normalized).toBe("pending");
			expect(result.results).toBeUndefined();
		});

		test("should handle missing pattern parameter", () => {
			const entry: LogEntry = {
				type: "assistant",
				uuid: "test-uuid",
				timestamp: "2025-01-01T00:00:00Z",
				content: [
					{
						type: "tool_use",
						id: "test-tool-id",
						name: "Glob",
						input: {},
					},
				],
			};

			const result = parser.parse(entry);
			expect(result.input.pattern).toBeUndefined();
		});

		test("should handle tools with no input gracefully", () => {
			const entry: LogEntry = {
				type: "assistant",
				uuid: "test-uuid",
				timestamp: "2025-01-01T00:00:00Z",
				content: [
					{
						type: "tool_use",
						id: "test-tool-id",
						name: "Glob",
						input: undefined,
					},
				],
			};

			const result = parser.parse(entry);
			expect(result.input.pattern).toBeUndefined();
			expect(result.input.searchPath).toBeUndefined();
		});

		test("should handle error output", () => {
			const toolCall: LogEntry = {
				type: "assistant",
				uuid: "test-uuid",
				timestamp: "2025-01-01T00:00:00Z",
				content: [
					{
						type: "tool_use",
						id: "test-tool-id",
						name: "Glob",
						input: { pattern: "**/*.py" },
					},
				],
			};

			const toolResult: LogEntry = {
				type: "user",
				uuid: "result-uuid",
				timestamp: "2025-01-01T00:00:01Z",
				content: [
					{
						type: "tool_result",
						tool_use_id: "test-tool-id",
						is_error: true,
						text: "Error: Invalid pattern",
					},
				],
			};

			const result = parser.parse(toolCall, toolResult);
			expect(result.status.normalized).toBe("failed");
			expect(result.results).toBeUndefined();
		});

		test("should handle empty results", () => {
			const toolCall: LogEntry = {
				type: "assistant",
				uuid: "test-uuid",
				timestamp: "2025-01-01T00:00:00Z",
				content: [
					{
						type: "tool_use",
						id: "test-tool-id",
						name: "Glob",
						input: { pattern: "*.nonexistent" },
					},
				],
			};

			const toolResult: LogEntry = {
				type: "user",
				uuid: "result-uuid",
				timestamp: "2025-01-01T00:00:01Z",
				content: [
					{
						type: "tool_result",
						tool_use_id: "test-tool-id",
						output: "",
					},
				],
			};

			const result = parser.parse(toolCall, toolResult);
			expect(result.results).toEqual([]);
			expect(result.ui.totalMatches).toBe(0);
		});

		test("should parse string output format", () => {
			const toolCall: LogEntry = {
				type: "assistant",
				uuid: "test-uuid",
				timestamp: "2025-01-01T00:00:00Z",
				content: [
					{
						type: "tool_use",
						id: "test-tool-id",
						name: "Glob",
						input: { pattern: "*.js" },
					},
				],
			};

			const toolResult: LogEntry = {
				type: "user",
				uuid: "result-uuid",
				timestamp: "2025-01-01T00:00:01Z",
				content: [
					{
						type: "tool_result",
						tool_use_id: "test-tool-id",
						output: "/path/file1.js\n/path/file2.js\n/path/file3.js",
					},
				],
			};

			const result = parser.parse(toolCall, toolResult);
			expect(result.results).toEqual([
				"/path/file1.js",
				"/path/file2.js",
				"/path/file3.js",
			]);
			expect(result.ui.totalMatches).toBe(3);
		});
	});

	describe("feature support", () => {
		test("should declare supported features", () => {
			const metadata = parser.getMetadata();
			expect(metadata.supportedFeatures).toContain("basic-parsing");
			expect(metadata.supportedFeatures).toContain("status-mapping");
			expect(metadata.supportedFeatures).toContain("pattern-matching");
		});
	});

	describe("performance validation", () => {
		test("should parse fixtures within acceptable time", () => {
			const fixture = fixtureData.fixtures[0];
			const toolCallEntry = transformToolCall(fixture);
			const toolResultEntry = transformToolResult(fixture);

			const startTime = performance.now();
			parser.parse(toolCallEntry, toolResultEntry);
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(10); // Should parse in under 10ms
		});
	});
});

import type { LogEntry, MessageContent, ToolProps } from "@claude-codex/types";
import type { Logger } from "pino";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ParserRegistry } from "../../src/parsers/registry";
import { LogTransformer } from "../../src/transformer/log-transformer";

describe("LogTransformer", () => {
	let transformer: LogTransformer;
	let registry: ParserRegistry;
	let mockLogger: Logger;

	beforeEach(() => {
		registry = new ParserRegistry();
		mockLogger = {
			trace: vi.fn(),
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			fatal: vi.fn(),
			child: vi.fn().mockReturnThis(),
			level: 'debug',
			silent: vi.fn(),
		} as unknown as Logger;
		transformer = new LogTransformer(registry, mockLogger);
	});

	describe("transform", () => {
		describe("successful transformations", () => {
			it("should transform a bash tool log", () => {
				const toolCall: LogEntry = {
					uuid: "call-123",
					timestamp: "2024-01-07T10:00:00Z",
					type: "assistant",
					content: [
						{
							type: "tool_use",
							id: "bash-456",
							name: "Bash",
							input: {
								command: "ls -la",
								description: "List files",
							},
						},
					],
				};

				const toolResult: LogEntry = {
					uuid: "result-789",
					parentUuid: "call-123",
					timestamp: "2024-01-07T10:00:01Z",
					type: "assistant",
					content: [
						{
							type: "tool_result",
							tool_use_id: "bash-456",
							output: {
								stdout: "file1.txt\nfile2.txt",
								stderr: "",
								exit_code: 0,
							},
						},
					],
				};

				const result = transformer.transform(toolCall, toolResult);

				expect(result).toBeTruthy();
				expect(result?.toolType).toBe("Bash");
				expect(result?.correlationId).toBe("bash-456");
				expect(result?.props).toMatchObject({
					id: "bash-456",
					uuid: "call-123",
					command: "ls -la",
					promptText: "List files",
					output: "file1.txt\nfile2.txt",
					status: {
						normalized: "completed",
						original: "success",
					},
				});
			});

			it("should transform an edit tool log", () => {
				const toolCall: LogEntry = {
					uuid: "call-edit-123",
					timestamp: "2024-01-07T10:00:00Z",
					type: "assistant",
					content: [
						{
							type: "tool_use",
							id: "edit-789",
							name: "Edit",
							input: {
								file_path: "/test/file.ts",
								old_string: "const x = 1",
								new_string: "const x = 2",
								replace_all: false,
							},
						},
					],
				};

				const toolResult: LogEntry = {
					uuid: "result-edit-456",
					parentUuid: "call-edit-123",
					timestamp: "2024-01-07T10:00:01Z",
					type: "assistant",
					content: [
						{
							type: "tool_result",
							tool_use_id: "edit-789",
							output: "Edit successful",
						},
					],
				};

				const result = transformer.transform(toolCall, toolResult);

				expect(result).toBeTruthy();
				expect(result?.toolType).toBe("Edit");
				expect(result?.correlationId).toBe("edit-789");
				expect(result?.props).toMatchObject({
					id: "edit-789",
					uuid: "call-edit-123",
					filePath: "/test/file.ts",
					oldContent: "const x = 1",
					newContent: "const x = 2",
				});
			});

			it("should transform MCP tool logs", () => {
				const toolCall: LogEntry = {
					uuid: "call-mcp-123",
					timestamp: "2024-01-07T10:00:00Z",
					type: "assistant",
					content: [
						{
							type: "tool_use",
							id: "mcp-789",
							name: "mcp__puppeteer__navigate",
							input: {
								url: "https://example.com",
							},
						},
					],
				};

				const result = transformer.transform(toolCall);

				expect(result).toBeTruthy();
				expect(result?.toolType).toBe("mcp__puppeteer__navigate");
				expect(result?.correlationId).toBe("mcp-789");
				expect(result?.props).toMatchObject({
					id: "mcp-789",
					uuid: "call-mcp-123",
					ui: {
						toolName: "mcp__puppeteer__navigate",
					},
				});
			});
		});

		describe("error handling", () => {
			it("should return null for non-assistant log entries", () => {
				const userEntry: LogEntry = {
					uuid: "user-123",
					timestamp: "2024-01-07T10:00:00Z",
					type: "user",
					content: "Hello",
				};

				const result = transformer.transform(userEntry);

				expect(result).toBeNull();
				expect(mockLogger.debug).toHaveBeenCalledWith(
					"No tool type found in log entry",
					{ uuid: "user-123" },
				);
			});

			it("should return null when no tool type is found", () => {
				const noToolEntry: LogEntry = {
					uuid: "notool-123",
					timestamp: "2024-01-07T10:00:00Z",
					type: "assistant",
					content: [
						{
							type: "text",
							text: "Just a text message",
						},
					],
				};

				const result = transformer.transform(noToolEntry);

				expect(result).toBeNull();
				expect(mockLogger.debug).toHaveBeenCalledWith(
					"No tool type found in log entry",
					{ uuid: "notool-123" },
				);
			});

			it("should return null when parser fails", () => {
				const invalidTool: LogEntry = {
					uuid: "invalid-123",
					timestamp: "2024-01-07T10:00:00Z",
					type: "assistant",
					content: [
						{
							type: "tool_use",
							id: "invalid-456",
							name: "UnknownTool",
							input: {},
						},
					],
				};

				const result = transformer.transform(invalidTool);

				expect(result).toBeNull();
				expect(mockLogger.warn).toHaveBeenCalledWith(
					"Failed to parse tool: UnknownTool",
					{ uuid: "invalid-123" },
				);
			});

			it("should return null when no correlation ID is found", () => {
				const noIdEntry: LogEntry = {
					uuid: "noid-123",
					timestamp: "2024-01-07T10:00:00Z",
					type: "assistant",
					content: [
						{
							type: "tool_use",
							// Missing id field
							name: "Bash",
							input: { command: "ls" },
						} as MessageContent,
					],
				};

				const result = transformer.transform(noIdEntry);

				expect(result).toBeNull();
				expect(mockLogger.warn).toHaveBeenCalledWith(
					"No correlation ID found",
					{ uuid: "noid-123" },
				);
			});

			it("should handle parser exceptions gracefully", () => {
				// Mock registry to throw
				const throwingRegistry = {
					parse: vi.fn().mockImplementation(() => {
						throw new Error("Parser exploded!");
					}),
				} as unknown as ParserRegistry;

				const throwingTransformer = new LogTransformer(
					throwingRegistry,
					mockLogger,
				);

				const toolCall: LogEntry = {
					uuid: "throw-123",
					timestamp: "2024-01-07T10:00:00Z",
					type: "assistant",
					content: [
						{
							type: "tool_use",
							id: "bash-456",
							name: "Bash",
							input: { command: "ls" },
						},
					],
				};

				const result = throwingTransformer.transform(toolCall);

				expect(result).toBeNull();
				expect(mockLogger.error).toHaveBeenCalledWith("Transform failed", {
					error: "Parser exploded!",
					uuid: "throw-123",
				});
			});
		});

		describe("edge cases", () => {
			it("should handle single content object (not array)", () => {
				const singleContent: LogEntry = {
					uuid: "single-123",
					timestamp: "2024-01-07T10:00:00Z",
					type: "assistant",
					content: {
						type: "tool_use",
						id: "bash-789",
						name: "Bash",
						input: { command: "pwd" },
					},
				};

				const result = transformer.transform(singleContent);

				expect(result).toBeTruthy();
				expect(result?.toolType).toBe("Bash");
				expect(result?.correlationId).toBe("bash-789");
			});

			it("should handle empty content array", () => {
				const emptyContent: LogEntry = {
					uuid: "empty-123",
					timestamp: "2024-01-07T10:00:00Z",
					type: "assistant",
					content: [],
				};

				const result = transformer.transform(emptyContent);

				expect(result).toBeNull();
			});

			it("should handle string content", () => {
				const stringContent: LogEntry = {
					uuid: "string-123",
					timestamp: "2024-01-07T10:00:00Z",
					type: "assistant",
					content: "Just a string",
				};

				const result = transformer.transform(stringContent);

				expect(result).toBeNull();
			});

			it("should work without a logger", () => {
				const noLoggerTransformer = new LogTransformer(registry);

				const toolCall: LogEntry = {
					uuid: "nolog-123",
					timestamp: "2024-01-07T10:00:00Z",
					type: "assistant",
					content: [
						{
							type: "tool_use",
							id: "bash-456",
							name: "Bash",
							input: { command: "echo test" },
						},
					],
				};

				const result = noLoggerTransformer.transform(toolCall);

				expect(result).toBeTruthy();
				expect(result?.toolType).toBe("Bash");
			});
		});
	});

	describe("extractToolType", () => {
		it("should extract tool type from various content formats", () => {
			// Test through the public transform method
			const formats = [
				{
					name: "array with tool_use",
					content: [{ type: "tool_use", id: "1", name: "TestTool", input: {} }],
					expected: "TestTool",
				},
				{
					name: "single object",
					content: { type: "tool_use", id: "2", name: "SingleTool", input: {} },
					expected: "SingleTool",
				},
				{
					name: "mixed content",
					content: [
						{ type: "text", text: "Some text" },
						{ type: "tool_use", id: "3", name: "MixedTool", input: {} },
					],
					expected: "MixedTool",
				},
			];

			formats.forEach(({ name, content, expected }) => {
				const entry: LogEntry = {
					uuid: `test-${name}`,
					timestamp: "2024-01-07T10:00:00Z",
					type: "assistant",
					content: content as MessageContent | MessageContent[],
				};

				// Mock registry to return a simple result
				vi.spyOn(registry, "parse").mockReturnValue({
					id: "test",
					uuid: "test",
					timestamp: "2024-01-07T10:00:00Z",
					status: { normalized: "completed" },
				} as ToolProps);

				const result = transformer.transform(entry);
				expect(result?.toolType).toBe(expected);
			});
		});
	});
});

/**
 * @fileoverview Tests for the log entry transformer
 */

import { beforeEach, describe, expect, it } from "bun:test";
import { LogEntryTransformer } from "../src/transformer";
import type { LogEntry } from "../src/types";

describe("LogEntryTransformer", () => {
	let transformer: LogEntryTransformer;

	beforeEach(() => {
		transformer = new LogEntryTransformer({ debug: false });
	});

	describe("process", () => {
		it("should emit pending item when tool call arrives", async () => {
			const toolCallEntry: LogEntry = {
				type: "assistant",
				uuid: "call-123",
				timestamp: "2025-01-01T00:00:00.000Z",
				sessionId: "session-123",
				message: {
					id: "msg-123",
					type: "message",
					role: "assistant",
					content: [
						{
							type: "tool_use",
							id: "toolu_123",
							name: "Bash",
							input: {
								command: 'echo "test"',
								description: "Test command",
							},
						},
					],
				},
			};

			const result = await transformer.process(toolCallEntry);

			expect(result).toBeTruthy();
			expect(result?.item).toBeDefined();
			expect(result?.item?.status).toBe("pending");
			expect(result?.item?.type).toBe("bash_tool");
			expect(result?.item?.id).toBe("toolu_123");
		});

		it("should emit complete item when matching result arrives", async () => {
			// First, send tool call
			const toolCallEntry: LogEntry = {
				type: "assistant",
				uuid: "call-123",
				timestamp: "2025-01-01T00:00:00.000Z",
				sessionId: "session-123",
				message: {
					id: "msg-123",
					type: "message",
					role: "assistant",
					content: [
						{
							type: "tool_use",
							id: "toolu_123",
							name: "Bash",
							input: {
								command: 'echo "test"',
								description: "Test command",
							},
						},
					],
				},
			};

			await transformer.process(toolCallEntry);

			// Then send matching result
			const toolResultEntry: LogEntry = {
				type: "user",
				uuid: "result-123",
				timestamp: "2025-01-01T00:00:01.000Z",
				sessionId: "session-123",
				message: {
					id: "msg-124",
					type: "message",
					role: "user",
					content: [
						{
							type: "tool_result",
							tool_use_id: "toolu_123",
							content: "test",
							is_error: false,
						},
					],
				},
				toolUseResult: {
					stdout: "test",
					stderr: "",
					interrupted: false,
					isImage: false,
					isError: false,
				},
			};

			const result = await transformer.process(toolResultEntry);

			expect(result).toBeTruthy();
			expect(result?.item).toBeDefined();
			expect(result?.item?.status).toBe("completed");
			expect(result?.item?.type).toBe("bash_tool");
			expect(result?.item?.id).toBe("toolu_123");
		});

		it("should handle failed tool results", async () => {
			// Send tool call
			const toolCallEntry: LogEntry = {
				type: "assistant",
				uuid: "call-123",
				timestamp: "2025-01-01T00:00:00.000Z",
				sessionId: "session-123",
				message: {
					id: "msg-123",
					type: "message",
					role: "assistant",
					content: [
						{
							type: "tool_use",
							id: "toolu_123",
							name: "Bash",
							input: {
								command: "invalid-command",
								description: "Invalid command",
							},
						},
					],
				},
			};

			await transformer.process(toolCallEntry);

			// Send error result
			const toolResultEntry: LogEntry = {
				type: "user",
				uuid: "result-123",
				timestamp: "2025-01-01T00:00:01.000Z",
				sessionId: "session-123",
				message: {
					id: "msg-124",
					type: "message",
					role: "user",
					content: [
						{
							type: "tool_result",
							tool_use_id: "toolu_123",
							content: "command not found: invalid-command",
							is_error: true,
						},
					],
				},
				toolUseResult: "Error: command not found: invalid-command",
			};

			const result = await transformer.process(toolResultEntry);

			expect(result).toBeTruthy();
			expect(result?.item).toBeDefined();
			expect(result?.item?.status).toBe("failed");
		});

		it("should handle out-of-order delivery", async () => {
			// Send result first
			const toolResultEntry: LogEntry = {
				type: "user",
				uuid: "result-123",
				timestamp: "2025-01-01T00:00:01.000Z",
				sessionId: "session-123",
				message: {
					id: "msg-124",
					type: "message",
					role: "user",
					content: [
						{
							type: "tool_result",
							tool_use_id: "toolu_456",
							content: "test output",
							is_error: false,
						},
					],
				},
			};

			const result1 = await transformer.process(toolResultEntry);
			expect(result1).toBeNull(); // Result buffered, nothing emitted

			// Then send call
			const toolCallEntry: LogEntry = {
				type: "assistant",
				uuid: "call-456",
				timestamp: "2025-01-01T00:00:00.000Z",
				sessionId: "session-123",
				message: {
					id: "msg-123",
					type: "message",
					role: "assistant",
					content: [
						{
							type: "tool_use",
							id: "toolu_456",
							name: "Bash",
							input: {
								command: 'echo "test"',
								description: "Test command",
							},
						},
					],
				},
			};

			const result2 = await transformer.process(toolCallEntry);

			expect(result2).toBeTruthy();
			expect(result2?.item).toBeDefined();
			expect(result2?.item?.status).toBe("completed"); // Immediately complete
			expect(result2?.item?.id).toBe("toolu_456");
		});

		it("should handle non-tool entries gracefully", async () => {
			const textEntry: LogEntry = {
				type: "assistant",
				uuid: "text-123",
				timestamp: "2025-01-01T00:00:00.000Z",
				sessionId: "session-123",
				message: {
					id: "msg-123",
					type: "message",
					role: "assistant",
					content: [
						{
							type: "text",
							text: "This is just text",
						},
					],
				},
			};

			const result = await transformer.process(textEntry);
			expect(result).toBeNull();
		});

		it("should map tool names to correct component types", async () => {
			const tools = [
				{ name: "Edit", expectedType: "file_tool" },
				{ name: "Read", expectedType: "file_tool" },
				{ name: "Grep", expectedType: "search_tool" },
				{ name: "Task", expectedType: "meta_tool" },
				{ name: "WebSearch", expectedType: "web_tool" },
				{ name: "mcp__test__tool", expectedType: "mcp_tool" },
			];

			for (const { name, expectedType } of tools) {
				const entry: LogEntry = {
					type: "assistant",
					uuid: `call-${name}`,
					timestamp: "2025-01-01T00:00:00.000Z",
					sessionId: "session-123",
					message: {
						id: `msg-${name}`,
						type: "message",
						role: "assistant",
						content: [
							{
								type: "tool_use",
								id: `toolu_${name}`,
								name,
								input: {},
							},
						],
					},
				};

				const result = await transformer.process(entry);
				expect(result?.item?.type).toBe(expectedType);
			}
		});
	});

	describe("correlation management", () => {
		it("should track pending correlations", async () => {
			expect(transformer.getPendingCount()).toBe(0);

			const toolCallEntry: LogEntry = {
				type: "assistant",
				uuid: "call-123",
				timestamp: "2025-01-01T00:00:00.000Z",
				sessionId: "session-123",
				message: {
					id: "msg-123",
					type: "message",
					role: "assistant",
					content: [
						{
							type: "tool_use",
							id: "toolu_123",
							name: "Bash",
							input: { command: "test" },
						},
					],
				},
			};

			await transformer.process(toolCallEntry);
			expect(transformer.getPendingCount()).toBe(1);

			const pending = transformer.getPending();
			expect(pending).toHaveLength(1);
			expect(pending[0].entry.uuid).toBe("call-123");
		});

		it("should clear pending correlations", async () => {
			// Add some pending entries
			const entry: LogEntry = {
				type: "assistant",
				uuid: "call-123",
				timestamp: "2025-01-01T00:00:00.000Z",
				sessionId: "session-123",
				message: {
					id: "msg-123",
					type: "message",
					role: "assistant",
					content: [
						{
							type: "tool_use",
							id: "toolu_123",
							name: "Bash",
							input: { command: "test" },
						},
					],
				},
			};

			await transformer.process(entry);
			expect(transformer.getPendingCount()).toBe(1);

			transformer.clearPending();
			expect(transformer.getPendingCount()).toBe(0);
		});

		it("should get oldest pending correlation", async () => {
			// Add multiple entries with delays
			for (let i = 0; i < 3; i++) {
				const entry: LogEntry = {
					type: "assistant",
					uuid: `call-${i}`,
					timestamp: `2025-01-01T00:00:0${i}.000Z`,
					sessionId: "session-123",
					message: {
						id: `msg-${i}`,
						type: "message",
						role: "assistant",
						content: [
							{
								type: "tool_use",
								id: `toolu_${i}`,
								name: "Bash",
								input: { command: `test ${i}` },
							},
						],
					},
				};

				await transformer.process(entry);
				await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
			}

			const oldest = transformer.getOldestPending();
			expect(oldest).toBeTruthy();
			expect(oldest?.entry.uuid).toBe("call-0");
		});
	});
});

/**
 * @fileoverview Tests using real fixture data from Claude conversations
 */

import { beforeEach, describe, expect, it } from "bun:test";
import { LogEntryTransformer } from "../src/transformer";
import type { LogEntry } from "../src/types";

describe("Real Fixture Tests", () => {
	let transformer: LogEntryTransformer;

	beforeEach(() => {
		transformer = new LogEntryTransformer({ debug: false });
	});

	describe("Bash tool scenarios", () => {
		// Real scenario: toolu_01GPL8y2muQwUayJUmd8x2yz - "git log -1 --oneline"
		it("should handle successful bash command (git log)", async () => {
			// Tool call entry (converted from fixture format)
			const toolCallEntry: LogEntry = {
				type: "assistant",
				uuid: "49aa294a-2f12-4197-8478-127f9fc9d4b7",
				timestamp: "2025-06-25T18:20:11.465Z",
				parentUuid: "dde3c669-70e7-46b7-8a83-8b4f9c26fad4",
				sessionId: "140ff683-32fc-4600-b3cb-52da55fcfaba",
				message: {
					id: "msg-49aa294a",
					type: "message",
					role: "assistant",
					content: [
						{
							type: "tool_use",
							id: "toolu_01GPL8y2muQwUayJUmd8x2yz",
							name: "Bash",
							input: {
								command: "git log -1 --oneline",
								description: "Check the most recent commit",
							},
						},
					],
				},
			};

			// Should emit pending component immediately
			const pendingResult = await transformer.process(toolCallEntry);
			expect(pendingResult).toBeTruthy();
			expect(pendingResult?.item?.status).toBe("pending");
			expect(pendingResult?.item?.type).toBe("bash_tool");
			expect(pendingResult?.item?.id).toBe("toolu_01GPL8y2muQwUayJUmd8x2yz");

			// Tool result entry
			const toolResultEntry: LogEntry = {
				type: "user",
				uuid: "2c1ad171-3778-4dcc-a644-1aea39b35d33",
				timestamp: "2025-06-25T18:20:11.465Z",
				parentUuid: "49aa294a-2f12-4197-8478-127f9fc9d4b7",
				sessionId: "140ff683-32fc-4600-b3cb-52da55fcfaba",
				message: {
					id: "msg-2c1ad171",
					type: "message",
					role: "user",
					content: [
						{
							type: "tool_result",
							tool_use_id: "toolu_01GPL8y2muQwUayJUmd8x2yz",
							content: "5e122ce Merge dev into main: Template path resolution fix and release prep",
							is_error: false,
						},
					],
				},
				toolUseResult: "5e122ce Merge dev into main: Template path resolution fix and release prep",
			};

			// Should emit completed component
			const completeResult = await transformer.process(toolResultEntry);
			expect(completeResult).toBeTruthy();
			expect(completeResult?.item?.status).toBe("completed");
			expect(completeResult?.item?.type).toBe("bash_tool");
			expect(completeResult?.item?.id).toBe("toolu_01GPL8y2muQwUayJUmd8x2yz");
		});

		// Real scenario: toolu_01CudWr2ghPSscWdhe6aZkUj - Failed command
		it("should handle failed bash command (directory not found)", async () => {
			// Tool call entry
			const toolCallEntry: LogEntry = {
				type: "assistant",
				uuid: "680fa633-4de5-45b8-b282-5b365cd4ee46",
				timestamp: "2025-06-25T18:25:16.463Z",
				parentUuid: "5e81746b-9ef2-4e0c-93ea-d3d29503d752",
				sessionId: "140ff683-32fc-4600-b3cb-52da55fcfaba",
				message: {
					id: "msg-680fa633",
					type: "message",
					role: "assistant",
					content: [
						{
							type: "tool_use",
							id: "toolu_01CudWr2ghPSscWdhe6aZkUj",
							name: "Bash",
							input: {
								command:
									"cd claude-log-processor && bun add -d vitest @types/node typescript && bun add rxjs ndjson socket.io chokidar",
								description: "Install project dependencies",
							},
						},
					],
				},
			};

			// Should emit pending component
			const pendingResult = await transformer.process(toolCallEntry);
			expect(pendingResult?.item?.status).toBe("pending");

			// Tool result entry with error
			const toolResultEntry: LogEntry = {
				type: "user",
				uuid: "4f513711-42e5-4898-9dbb-227ef091bc89",
				timestamp: "2025-06-25T18:25:19.401Z",
				parentUuid: "680fa633-4de5-45b8-b282-5b365cd4ee46",
				sessionId: "140ff683-32fc-4600-b3cb-52da55fcfaba",
				message: {
					id: "msg-4f513711",
					type: "message",
					role: "user",
					content: [
						{
							type: "tool_result",
							tool_use_id: "toolu_01CudWr2ghPSscWdhe6aZkUj",
							content: "(eval):cd:1: no such file or directory: claude-log-processor",
							is_error: true,
						},
					],
				},
				toolUseResult: "(eval):cd:1: no such file or directory: claude-log-processor",
			};

			// Should emit failed component
			const completeResult = await transformer.process(toolResultEntry);
			expect(completeResult).toBeTruthy();
			expect(completeResult?.item?.status).toBe("failed");
			expect(completeResult?.item?.type).toBe("bash_tool");
			expect(completeResult?.item?.id).toBe("toolu_01CudWr2ghPSscWdhe6aZkUj");
		});
	});

	describe("Read tool scenarios", () => {
		// Real scenario: toolu_013N49ZeNgYVdr9VfHFvWg7v - Large HTML file read
		it("should handle read tool with large file content", async () => {
			// Tool call entry
			const toolCallEntry: LogEntry = {
				type: "assistant",
				uuid: "36883157-fd2e-4292-810a-bf235152e500",
				timestamp: "2025-06-25T18:20:25.482Z",
				parentUuid: "74dff9c1-9dee-48f7-bf2f-5b6eea180add",
				sessionId: "140ff683-32fc-4600-b3cb-52da55fcfaba",
				message: {
					id: "msg-36883157",
					type: "message",
					role: "assistant",
					content: [
						{
							type: "tool_use",
							id: "toolu_013N49ZeNgYVdr9VfHFvWg7v",
							name: "Read",
							input: {
								file_path: "/Users/abuusama/Desktop/temp/claude-codex/log-processing-analysis.html",
							},
						},
					],
				},
			};

			// Should emit pending file_tool component
			const pendingResult = await transformer.process(toolCallEntry);
			expect(pendingResult).toBeTruthy();
			expect(pendingResult?.item?.status).toBe("pending");
			expect(pendingResult?.item?.type).toBe("file_tool");
			expect(pendingResult?.item?.id).toBe("toolu_013N49ZeNgYVdr9VfHFvWg7v");

			// Tool result entry with large content (truncated for test)
			const toolResultEntry: LogEntry = {
				type: "user",
				uuid: "e628067c-a845-45cd-8b2e-15c0c3472c25",
				timestamp: "2025-06-25T18:20:26.700Z",
				parentUuid: "36883157-fd2e-4292-810a-bf235152e500",
				sessionId: "140ff683-32fc-4600-b3cb-52da55fcfaba",
				message: {
					id: "msg-e628067c",
					type: "message",
					role: "user",
					content: [
						{
							type: "tool_result",
							tool_use_id: "toolu_013N49ZeNgYVdr9VfHFvWg7v",
							content:
								'     1→<!DOCTYPE html>\n     2→<html lang="en">\n... [large content truncated for test]',
							is_error: false,
						},
					],
				},
			};

			// Should emit completed file_tool component
			const completeResult = await transformer.process(toolResultEntry);
			expect(completeResult).toBeTruthy();
			expect(completeResult?.item?.status).toBe("completed");
			expect(completeResult?.item?.type).toBe("file_tool");
			expect(completeResult?.item?.id).toBe("toolu_013N49ZeNgYVdr9VfHFvWg7v");
		});
	});

	describe("Out-of-order delivery with real IDs", () => {
		it("should handle result arriving before call (real scenario)", async () => {
			// Result arrives first
			const toolResultEntry: LogEntry = {
				type: "user",
				uuid: "result-first-uuid",
				timestamp: "2025-06-25T18:20:26.700Z",
				sessionId: "140ff683-32fc-4600-b3cb-52da55fcfaba",
				message: {
					id: "msg-result-first",
					type: "message",
					role: "user",
					content: [
						{
							type: "tool_result",
							tool_use_id: "toolu_01GPL8y2muQwUayJUmd8x2yz",
							content: "test output",
							is_error: false,
						},
					],
				},
			};

			// Should return null (buffered)
			const result1 = await transformer.process(toolResultEntry);
			expect(result1).toBeNull();

			// Call arrives later
			const toolCallEntry: LogEntry = {
				type: "assistant",
				uuid: "call-second-uuid",
				timestamp: "2025-06-25T18:20:25.482Z",
				sessionId: "140ff683-32fc-4600-b3cb-52da55fcfaba",
				message: {
					id: "msg-call-second",
					type: "message",
					role: "assistant",
					content: [
						{
							type: "tool_use",
							id: "toolu_01GPL8y2muQwUayJUmd8x2yz",
							name: "Bash",
							input: {
								command: "echo test",
								description: "Test command",
							},
						},
					],
				},
			};

			// Should immediately emit completed (not pending)
			const result2 = await transformer.process(toolCallEntry);
			expect(result2).toBeTruthy();
			expect(result2?.item?.status).toBe("completed");
			expect(result2?.item?.id).toBe("toolu_01GPL8y2muQwUayJUmd8x2yz");
		});
	});

	describe("Tool type mapping validation", () => {
		it("should map real tool names to correct component types", async () => {
			const realToolMappings = [
				{ name: "Bash", expectedType: "bash_tool" },
				{ name: "Read", expectedType: "file_tool" },
				{ name: "Edit", expectedType: "file_tool" },
				{ name: "Write", expectedType: "file_tool" },
				{ name: "MultiEdit", expectedType: "file_tool" },
				{ name: "Glob", expectedType: "search_tool" },
				{ name: "Grep", expectedType: "search_tool" },
				{ name: "LS", expectedType: "search_tool" },
				{ name: "Task", expectedType: "meta_tool" },
				{ name: "TodoRead", expectedType: "meta_tool" },
				{ name: "TodoWrite", expectedType: "meta_tool" },
				{ name: "WebFetch", expectedType: "web_tool" },
				{ name: "WebSearch", expectedType: "web_tool" },
				{ name: "mcp__sequential_thinking__sequentialthinking", expectedType: "mcp_tool" },
			];

			for (const { name, expectedType } of realToolMappings) {
				const entry: LogEntry = {
					type: "assistant",
					uuid: `test-${name}`,
					timestamp: "2025-06-25T18:20:25.482Z",
					sessionId: "test-session",
					message: {
						id: `msg-${name}`,
						type: "message",
						role: "assistant",
						content: [
							{
								type: "tool_use",
								id: `toolu_test_${name}`,
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
});

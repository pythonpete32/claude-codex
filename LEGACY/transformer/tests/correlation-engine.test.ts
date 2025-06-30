/**
 * @fileoverview Tests for the correlation engine
 */

import { beforeEach, describe, expect, it } from "bun:test";
import { CorrelationEngine } from "../src/correlation-engine";
import type { LogEntry } from "../src/types";

describe("CorrelationEngine", () => {
	let engine: CorrelationEngine;

	beforeEach(() => {
		engine = new CorrelationEngine();
	});

	const createToolCallEntry = (id: string): LogEntry => ({
		type: "assistant",
		uuid: `call-${id}`,
		timestamp: new Date().toISOString(),
		sessionId: "test-session",
		message: {
			id: `msg-${id}`,
			type: "message",
			role: "assistant",
			content: [
				{
					type: "tool_use",
					id: `toolu_${id}`,
					name: "Bash",
					input: { command: "test" },
				},
			],
		},
	});

	const createToolResultEntry = (id: string, isError = false): LogEntry => ({
		type: "user",
		uuid: `result-${id}`,
		timestamp: new Date().toISOString(),
		sessionId: "test-session",
		message: {
			id: `msg-result-${id}`,
			type: "message",
			role: "user",
			content: [
				{
					type: "tool_result",
					tool_use_id: `toolu_${id}`,
					content: isError ? "Error" : "Success",
					is_error: isError,
				},
			],
		},
	});

	describe("process", () => {
		it("should return null when processing a tool call without matching result", () => {
			const call = createToolCallEntry("123");
			const result = engine.process(call);

			expect(result).toBeNull();
			expect(engine.getPendingCount()).toBe(1);
		});

		it("should return null when processing a tool result without matching call", () => {
			const result = createToolResultEntry("123");
			const correlation = engine.process(result);

			expect(correlation).toBeNull();
			expect(engine.getPendingCount()).toBe(1);
		});

		it("should correlate when call arrives before result", () => {
			const call = createToolCallEntry("123");
			const result = createToolResultEntry("123");

			// Process call first
			expect(engine.process(call)).toBeNull();

			// Process result - should correlate
			const correlation = engine.process(result);
			expect(correlation).toBeTruthy();
			expect(correlation?.call.uuid).toBe("call-123");
			expect(correlation?.result.uuid).toBe("result-123");

			// Should be removed from pending
			expect(engine.getPendingCount()).toBe(0);
		});

		it("should correlate when result arrives before call", () => {
			const call = createToolCallEntry("123");
			const result = createToolResultEntry("123");

			// Process result first
			expect(engine.process(result)).toBeNull();

			// Process call - should correlate immediately
			const correlation = engine.process(call);
			expect(correlation).toBeTruthy();
			expect(correlation?.call.uuid).toBe("call-123");
			expect(correlation?.result.uuid).toBe("result-123");

			// Should be removed from pending
			expect(engine.getPendingCount()).toBe(0);
		});

		it("should handle multiple pending correlations", () => {
			// Add multiple calls
			for (let i = 1; i <= 3; i++) {
				engine.process(createToolCallEntry(String(i)));
			}

			expect(engine.getPendingCount()).toBe(3);

			// Resolve them out of order
			const result2 = engine.process(createToolResultEntry("2"));
			expect(result2).toBeTruthy();
			expect(engine.getPendingCount()).toBe(2);

			const result1 = engine.process(createToolResultEntry("1"));
			expect(result1).toBeTruthy();
			expect(engine.getPendingCount()).toBe(1);

			const result3 = engine.process(createToolResultEntry("3"));
			expect(result3).toBeTruthy();
			expect(engine.getPendingCount()).toBe(0);
		});

		it("should ignore non-tool entries", () => {
			const textEntry: LogEntry = {
				type: "assistant",
				uuid: "text-123",
				timestamp: new Date().toISOString(),
				sessionId: "test-session",
				message: {
					id: "msg-text",
					type: "message",
					role: "assistant",
					content: [
						{
							type: "text",
							text: "Just text",
						},
					],
				},
			};

			const result = engine.process(textEntry);
			expect(result).toBeNull();
			expect(engine.getPendingCount()).toBe(0);
		});
	});

	describe("clearExpired", () => {
		it("should clear expired correlations", async () => {
			// Add some correlations
			engine.process(createToolCallEntry("1"));
			engine.process(createToolCallEntry("2"));

			expect(engine.getPendingCount()).toBe(2);

			// Wait a bit
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Add a fresh one
			engine.process(createToolCallEntry("3"));

			// Clear with a short timeout
			const cleared = engine.clearExpired(50);

			expect(cleared).toBe(2); // First two should be cleared
			expect(engine.getPendingCount()).toBe(1); // Only the fresh one remains
		});

		it("should not clear non-expired correlations", () => {
			engine.process(createToolCallEntry("1"));
			engine.process(createToolCallEntry("2"));

			// Clear with a long timeout
			const cleared = engine.clearExpired(60 * 60 * 1000); // 1 hour

			expect(cleared).toBe(0);
			expect(engine.getPendingCount()).toBe(2);
		});
	});

	describe("getPending", () => {
		it("should return all pending correlations", () => {
			engine.process(createToolCallEntry("1"));
			engine.process(createToolResultEntry("2")); // No matching call

			const pending = engine.getPending();
			expect(pending).toHaveLength(2);

			const uuids = pending.map((p) => p.entry.uuid).sort();
			expect(uuids).toEqual(["call-1", "result-2"]);
		});
	});

	describe("getOldestPending", () => {
		it("should return the oldest pending correlation", async () => {
			engine.process(createToolCallEntry("1"));
			await new Promise((resolve) => setTimeout(resolve, 10));
			engine.process(createToolCallEntry("2"));
			await new Promise((resolve) => setTimeout(resolve, 10));
			engine.process(createToolCallEntry("3"));

			const oldest = engine.getOldestPending();
			expect(oldest).toBeTruthy();
			expect(oldest?.entry.uuid).toBe("call-1");
		});

		it("should return null when no pending correlations", () => {
			const oldest = engine.getOldestPending();
			expect(oldest).toBeNull();
		});
	});

	describe("clearPending", () => {
		it("should clear all pending correlations", () => {
			engine.process(createToolCallEntry("1"));
			engine.process(createToolCallEntry("2"));
			engine.process(createToolResultEntry("3"));

			expect(engine.getPendingCount()).toBe(3);

			engine.clearPending();

			expect(engine.getPendingCount()).toBe(0);
			expect(engine.getPending()).toHaveLength(0);
		});
	});
});

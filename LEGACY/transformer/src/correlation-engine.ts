/**
 * @fileoverview Correlation engine for matching tool calls with their results
 * @module @dao/transformer/correlation-engine
 */

import type { LogEntry, PendingCorrelation, ToolResult, ToolUse } from "./types";

/**
 * Manages correlation of tool calls with their results
 */
export class CorrelationEngine {
	private pendingCalls = new Map<string, PendingCorrelation>();
	private pendingResults = new Map<string, PendingCorrelation>();

	/**
	 * Process a log entry for correlation
	 * @returns The matching entry if correlation found, null otherwise
	 */
	process(entry: LogEntry): { call: LogEntry; result: LogEntry } | null {
		// Extract tool data from message content
		const toolUse = this.extractToolUse(entry);
		const toolResult = this.extractToolResult(entry);

		if (toolUse) {
			// Check if we already have a result waiting
			const pendingResult = this.pendingResults.get(toolUse.id);
			if (pendingResult) {
				// Found matching result - remove from pending and return correlated pair
				this.pendingResults.delete(toolUse.id);
				return { call: entry, result: pendingResult.entry };
			}

			// No result yet - store call as pending
			this.pendingCalls.set(toolUse.id, {
				entry,
				timestamp: Date.now(),
				attempts: 0,
			});
			return null;
		}

		if (toolResult) {
			// Check if we have a call waiting
			const pendingCall = this.pendingCalls.get(toolResult.tool_use_id);
			if (pendingCall) {
				// Found matching call - remove from pending and return correlated pair
				this.pendingCalls.delete(toolResult.tool_use_id);
				return { call: pendingCall.entry, result: entry };
			}

			// No call yet - store result as pending
			this.pendingResults.set(toolResult.tool_use_id, {
				entry,
				timestamp: Date.now(),
				attempts: 0,
			});
			return null;
		}

		// Not a tool-related entry
		return null;
	}

	/**
	 * Extract tool use from log entry
	 */
	private extractToolUse(entry: LogEntry): ToolUse | null {
		if (entry.type !== "assistant" || !entry.message?.content) {
			return null;
		}

		const toolUse = entry.message.content.find((item): item is ToolUse => item.type === "tool_use");

		return toolUse || null;
	}

	/**
	 * Extract tool result from log entry
	 */
	private extractToolResult(entry: LogEntry): ToolResult | null {
		if (entry.type !== "user" || !entry.message?.content) {
			return null;
		}

		const toolResult = entry.message.content.find(
			(item): item is ToolResult => item.type === "tool_result",
		);

		return toolResult || null;
	}

	/**
	 * Get all pending correlations
	 */
	getPending(): PendingCorrelation[] {
		return [...Array.from(this.pendingCalls.values()), ...Array.from(this.pendingResults.values())];
	}

	/**
	 * Get count of pending correlations
	 */
	getPendingCount(): number {
		return this.pendingCalls.size + this.pendingResults.size;
	}

	/**
	 * Get oldest pending correlation
	 */
	getOldestPending(): PendingCorrelation | null {
		const allPending = this.getPending();
		if (allPending.length === 0) return null;

		return allPending.reduce((oldest, current) =>
			current.timestamp < oldest.timestamp ? current : oldest,
		);
	}

	/**
	 * Clear all pending correlations
	 */
	clearPending(): void {
		this.pendingCalls.clear();
		this.pendingResults.clear();
	}

	/**
	 * Clear expired correlations
	 * @param maxAge Maximum age in milliseconds
	 * @returns Number of cleared correlations
	 */
	clearExpired(maxAge: number): number {
		const now = Date.now();
		let cleared = 0;

		// Clear expired calls
		for (const [id, pending] of this.pendingCalls) {
			if (now - pending.timestamp > maxAge) {
				this.pendingCalls.delete(id);
				cleared++;
			}
		}

		// Clear expired results
		for (const [id, pending] of this.pendingResults) {
			if (now - pending.timestamp > maxAge) {
				this.pendingResults.delete(id);
				cleared++;
			}
		}

		return cleared;
	}
}

/**
 * @fileoverview JSONL history reading service
 * @module @dao/codex-api-server/services/history-reader
 */

import { readFile } from "node:fs/promises";
import type { LogEntry, PaginatedResponse, SessionHistoryQuery } from "../types/api";

/**
 * Service for reading and processing session history from JSONL files
 */
export class HistoryReader {
	/**
	 * Read session history with pagination and filtering
	 */
	static async getSessionHistory(
		filePath: string,
		options: SessionHistoryQuery = {},
	): Promise<PaginatedResponse<LogEntry>> {
		const { limit = 100, offset = 0, type, since } = options;

		try {
			// Read and parse JSONL file
			const content = await readFile(filePath, "utf-8");
			const lines = content.split("\n").filter((line) => line.trim());

			// Parse all entries
			const allEntries: LogEntry[] = [];
			for (const line of lines) {
				try {
					const parsed = JSON.parse(line);
					const logEntry = HistoryReader.parseLogEntry(parsed);
					if (logEntry) {
						allEntries.push(logEntry);
					}
				} catch (error) {
					console.warn(`Failed to parse JSONL line: ${line.substring(0, 100)}...`, error);
				}
			}

			// Apply filters
			let filteredEntries = allEntries;

			// Filter by message type
			if (type) {
				filteredEntries = filteredEntries.filter((entry) => entry.type === type);
			}

			// Filter by timestamp
			if (since) {
				const sinceDate = new Date(since);
				filteredEntries = filteredEntries.filter((entry) => new Date(entry.timestamp) >= sinceDate);
			}

			// Sort by timestamp (chronological order)
			filteredEntries.sort(
				(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
			);

			// Apply pagination
			const total = filteredEntries.length;
			const paginatedEntries = filteredEntries.slice(offset, offset + limit);
			const hasMore = offset + limit < total;

			return {
				data: paginatedEntries,
				total,
				limit,
				offset,
				hasMore,
			};
		} catch (error) {
			console.error(`Error reading session history from ${filePath}:`, error);
			throw new Error(
				`Failed to read session history: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Parse raw JSONL entry into LogEntry format
	 */
	private static parseLogEntry(raw: any): LogEntry | null {
		try {
			// Extract basic fields
			const entry: LogEntry = {
				uuid: raw.uuid,
				parentUuid: raw.parentUuid || undefined,
				sessionId: raw.sessionId,
				timestamp: raw.timestamp,
				type: raw.type === "assistant" ? "assistant" : "user",
				content: "",
				isSidechain: raw.isSidechain || false,
			};

			// Process content based on message structure
			if (raw.message) {
				// Handle structured message content
				if (Array.isArray(raw.message.content)) {
					// Multiple content blocks (text + tool usage)
					const textBlocks = raw.message.content
						.filter((block: any) => block.type === "text")
						.map((block: any) => block.text);

					const toolUses = raw.message.content.filter((block: any) => block.type === "tool_use");

					// Set main content to text
					entry.content = textBlocks.join("\n") || "";

					// Add tool usage information
					if (toolUses.length > 0) {
						const toolUse = toolUses[0]; // Take first tool use
						entry.toolUse = {
							id: toolUse.id,
							name: toolUse.name,
							input: toolUse.input,
							status: "pending", // Will be updated when result comes
						};
					}
				} else if (typeof raw.message.content === "string") {
					// Simple string content
					entry.content = raw.message.content;
				} else if (raw.message.content?.text) {
					// Single text block
					entry.content = raw.message.content.text;
				}
			} else if (typeof raw.content === "string") {
				// Direct content field
				entry.content = raw.content;
			}

			// Handle tool results
			if (raw.toolUseResult && entry.toolUse) {
				entry.toolUse.result = raw.toolUseResult;
				entry.toolUse.status = "completed";
			}

			// Handle tool result messages (user messages with tool_result)
			if (raw.message?.content && Array.isArray(raw.message.content)) {
				const toolResults = raw.message.content.filter(
					(block: any) => block.type === "tool_result",
				);

				if (toolResults.length > 0) {
					const toolResult = toolResults[0];
					entry.toolUse = {
						id: toolResult.tool_use_id,
						name: "unknown", // Tool name not available in result
						input: {},
						result: toolResult.content,
						status: toolResult.is_error ? "failed" : "completed",
					};
				}
			}

			// Validate required fields
			if (!entry.uuid || !entry.sessionId || !entry.timestamp) {
				console.warn("Invalid log entry missing required fields:", raw);
				return null;
			}

			return entry;
		} catch (error) {
			console.warn("Failed to parse log entry:", error, raw);
			return null;
		}
	}

	/**
	 * Get a specific entry by UUID
	 */
	static async getEntryByUuid(filePath: string, uuid: string): Promise<LogEntry | null> {
		try {
			const content = await readFile(filePath, "utf-8");
			const lines = content.split("\n").filter((line) => line.trim());

			for (const line of lines) {
				try {
					const parsed = JSON.parse(line);
					if (parsed.uuid === uuid) {
						return HistoryReader.parseLogEntry(parsed);
					}
				} catch {}
			}

			return null;
		} catch (error) {
			console.error(`Error reading entry ${uuid} from ${filePath}:`, error);
			return null;
		}
	}

	/**
	 * Get session statistics
	 */
	static async getSessionStats(filePath: string): Promise<{
		totalEntries: number;
		userMessages: number;
		assistantMessages: number;
		toolUsages: number;
		firstTimestamp: string | null;
		lastTimestamp: string | null;
	}> {
		try {
			const content = await readFile(filePath, "utf-8");
			const lines = content.split("\n").filter((line) => line.trim());

			let userMessages = 0;
			let assistantMessages = 0;
			let toolUsages = 0;
			let firstTimestamp: string | null = null;
			let lastTimestamp: string | null = null;

			for (const line of lines) {
				try {
					const parsed = JSON.parse(line);

					// Count message types
					if (parsed.type === "user") {
						userMessages++;
					} else if (parsed.type === "assistant") {
						assistantMessages++;
					}

					// Count tool usages
					if (parsed.message?.content && Array.isArray(parsed.message.content)) {
						const hasToolUse = parsed.message.content.some(
							(block: any) => block.type === "tool_use",
						);
						if (hasToolUse) {
							toolUsages++;
						}
					}

					// Track timestamps
					if (parsed.timestamp) {
						if (!firstTimestamp) {
							firstTimestamp = parsed.timestamp;
						}
						lastTimestamp = parsed.timestamp;
					}
				} catch {}
			}

			return {
				totalEntries: lines.length,
				userMessages,
				assistantMessages,
				toolUsages,
				firstTimestamp,
				lastTimestamp,
			};
		} catch (error) {
			console.error(`Error getting session stats from ${filePath}:`, error);
			return {
				totalEntries: 0,
				userMessages: 0,
				assistantMessages: 0,
				toolUsages: 0,
				firstTimestamp: null,
				lastTimestamp: null,
			};
		}
	}
}

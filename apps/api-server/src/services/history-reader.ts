/**
 * @fileoverview JSONL history reading service
 * @module @dao/codex-api-server/services/history-reader
 */

import { readFile } from "node:fs/promises";
import type {
	LogEntry as CoreLogEntry,
	MessageContent,
} from "@claude-codex/types";
import type {
	LogEntry as ApiLogEntry,
	PaginatedResponse,
	SessionHistoryQuery,
} from "../types/api";
import {
	type EnhancedLogEntry,
	TransformationService,
} from "./transformation-service";

/**
 * Service for reading and processing session history from JSONL files
 */
export class HistoryReader {
	private static transformationService = new TransformationService();

	/**
	 * Convert API LogEntry to Core LogEntry format
	 */
	private static convertToCoreLogEntry(apiEntry: ApiLogEntry): CoreLogEntry {
		// Convert content to MessageContent format
		let content: string | MessageContent | MessageContent[];

		if (apiEntry.toolUse) {
			// Convert toolUse to MessageContent
			const messageContent: MessageContent = {
				type: "tool_use",
				id: apiEntry.toolUse.id,
				name: apiEntry.toolUse.name,
				input: apiEntry.toolUse.input,
			};

			if (apiEntry.toolUse.result) {
				// If we have a result, add it as a separate MessageContent
				const resultContent: MessageContent = {
					type: "tool_result",
					tool_use_id: apiEntry.toolUse.id,
					content:
						typeof apiEntry.toolUse.result === "string"
							? apiEntry.toolUse.result
							: JSON.stringify(apiEntry.toolUse.result),
					is_error: apiEntry.toolUse.status === "failed",
				};
				content = [messageContent, resultContent];
			} else {
				content = messageContent;
			}
		} else if (Array.isArray(apiEntry.content)) {
			// Already in MessageContent[] format
			content = apiEntry.content as MessageContent[];
		} else {
			// Handle structured content - already validated as string | object
			content = apiEntry.content as unknown as
				| string
				| MessageContent
				| MessageContent[];
		}

		return {
			uuid: apiEntry.uuid,
			parentUuid: apiEntry.parentUuid,
			timestamp: apiEntry.timestamp,
			type: apiEntry.type,
			content,
			isSidechain: apiEntry.isSidechain,
		};
	}

	/**
	 * Read session history with pagination and filtering
	 */
	static async getSessionHistory(
		filePath: string,
		options: SessionHistoryQuery = {},
	): Promise<PaginatedResponse<ApiLogEntry>> {
		const { limit = 100, offset = 0, type, since } = options;

		try {
			// Read and parse JSONL file
			const content = await readFile(filePath, "utf-8");
			const lines = content.split("\n").filter((line) => line.trim());

			// Parse all entries
			const allEntries: ApiLogEntry[] = [];
			for (const line of lines) {
				try {
					const parsed = JSON.parse(line);
					const logEntry = HistoryReader.parseLogEntry(parsed);
					if (logEntry) {
						allEntries.push(logEntry);
					}
				} catch (error) {
					console.warn(
						`Failed to parse JSONL line: ${line.substring(0, 100)}...`,
						error,
					);
				}
			}

			// Apply filters
			let filteredEntries = allEntries;

			// Filter by message type
			if (type) {
				filteredEntries = filteredEntries.filter(
					(entry) => entry.type === type,
				);
			}

			// Filter by timestamp
			if (since) {
				const sinceDate = new Date(since);
				filteredEntries = filteredEntries.filter(
					(entry) => new Date(entry.timestamp) >= sinceDate,
				);
			}

			// Sort by timestamp (chronological order)
			filteredEntries.sort(
				(a, b) =>
					new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
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
	private static parseLogEntry(raw: unknown): ApiLogEntry | null {
		// Type guard for basic structure
		if (!raw || typeof raw !== "object") {
			return null;
		}
		
		const rawEntry = raw as Record<string, unknown>;
		try {
			// Extract basic fields
			const entry: ApiLogEntry = {
				uuid: rawEntry.uuid as string,
				parentUuid: (rawEntry.parentUuid as string) || undefined,
				sessionId: rawEntry.sessionId as string,
				timestamp: rawEntry.timestamp as string,
				type: rawEntry.type === "assistant" ? "assistant" : "user",
				content: "",
				isSidechain: (rawEntry.isSidechain as boolean) || false,
			};

			// Process content based on message structure
			if (rawEntry.message) {
				const message = rawEntry.message as Record<string, unknown>;
				// Handle structured message content
				if (Array.isArray(message.content)) {
					// Check if this is a tool result message
					const hasToolResult = message.content.some(
						(block: unknown) => (block as Record<string, unknown>)?.type === "tool_result"
					);

					if (hasToolResult) {
						// Keep the content as-is for proper parsing
						entry.content = message.content;
					} else {
						// Multiple content blocks (text + tool usage)
						const textBlocks = message.content
							.filter((block: unknown) => (block as Record<string, unknown>)?.type === "text")
							.map((block: unknown) => (block as Record<string, unknown>).text as string);

						const toolUses = message.content.filter(
							(block: unknown) => (block as Record<string, unknown>)?.type === "tool_use",
						);

						// Set main content to text
						entry.content = textBlocks.join("\n") || "";

						// Add tool usage information
						if (toolUses.length > 0) {
							const toolUse = toolUses[0] as Record<string, unknown>; // Take first tool use
							entry.toolUse = {
								id: toolUse.id as string,
								name: toolUse.name as string,
								input: toolUse.input as Record<string, unknown>,
								status: "pending", // Will be updated when result comes
							};
						}
					}
				} else if (typeof message.content === "string") {
					// Simple string content
					entry.content = message.content;
				} else if (message.content && typeof message.content === "object") {
					const content = message.content as Record<string, unknown>;
					if (content.text) {
						// Single text block
						entry.content = content.text as string;
					}
				}
			} else if (typeof rawEntry.content === "string") {
				// Direct content field
				entry.content = rawEntry.content;
			}

			// Handle tool results
			if (rawEntry.toolUseResult && entry.toolUse) {
				entry.toolUse.result = rawEntry.toolUseResult;
				entry.toolUse.status = "completed";
			}

			// Handle tool result messages (user messages with tool_result)
			if (rawEntry.message) {
				const message = rawEntry.message as Record<string, unknown>;
				if (message.content && Array.isArray(message.content)) {
					const toolResults = message.content.filter(
						(block: unknown) => (block as Record<string, unknown>)?.type === "tool_result",
					);

					if (toolResults.length > 0) {
						// Don't create a toolUse field for tool results - they are already in content
						// The transformation service will handle correlation
					}
				}
			}

			// Validate required fields
			if (!entry.uuid || !entry.sessionId || !entry.timestamp) {
				console.warn("Invalid log entry missing required fields:", rawEntry);
				return null;
			}

			return entry;
		} catch (error) {
			console.warn("Failed to parse log entry:", error, rawEntry);
			return null;
		}
	}

	/**
	 * Get a specific entry by UUID
	 */
	static async getEntryByUuid(
		filePath: string,
		uuid: string,
	): Promise<ApiLogEntry | null> {
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
	 * Read session history with parsed tool props
	 */
	static async getEnhancedHistory(
		filePath: string,
		options: SessionHistoryQuery = {},
	): Promise<PaginatedResponse<EnhancedLogEntry>> {
		const { limit = 100, offset = 0, type, since } = options;

		try {
			// Read and parse JSONL file
			const content = await readFile(filePath, "utf-8");
			const lines = content.split("\n").filter((line) => line.trim());

			// Parse all entries
			const allEntries: CoreLogEntry[] = [];
			for (const line of lines) {
				try {
					const parsed = JSON.parse(line);
					const apiEntry = HistoryReader.parseLogEntry(parsed);
					if (apiEntry) {
						// Convert to core format for transformation
						const coreEntry = HistoryReader.convertToCoreLogEntry(apiEntry);
						allEntries.push(coreEntry);
					}
				} catch (error) {
					console.warn(
						`Failed to parse JSONL line: ${line.substring(0, 100)}...`,
						error,
					);
				}
			}

			// Transform entries with parsed props
			const enhancedEntries =
				await HistoryReader.transformationService.transformEntries(allEntries);

			// Apply filters
			let filteredEntries = enhancedEntries;

			// Filter by message type
			if (type) {
				filteredEntries = filteredEntries.filter(
					(entry) => entry.type === type,
				);
			}

			// Filter by timestamp
			if (since) {
				const sinceDate = new Date(since);
				filteredEntries = filteredEntries.filter(
					(entry) => new Date(entry.timestamp) >= sinceDate,
				);
			}

			// Sort by timestamp (chronological order)
			filteredEntries.sort(
				(a, b) =>
					new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
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
			console.error(
				`Error reading enhanced session history from ${filePath}:`,
				error,
			);
			throw new Error(
				`Failed to read session history: ${error instanceof Error ? error.message : String(error)}`,
			);
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
					if (
						parsed.message?.content &&
						Array.isArray(parsed.message.content)
					) {
						const hasToolUse = parsed.message.content.some(
							(block: unknown) => (block as Record<string, unknown>)?.type === "tool_use",
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

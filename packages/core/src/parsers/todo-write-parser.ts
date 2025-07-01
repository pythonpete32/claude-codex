import type {
	LogEntry,
	MessageContent,
	ParseConfig,
	ParsedToolOutput,
	RawLogEntry,
	RawToolResult,
	TodoChange,
	TodoItem,
	TodoWriteToolProps,
} from "@claude-codex/types";
import { mapFromError } from "@claude-codex/types";
import { BaseToolParser } from "./base-parser";

/**
 * TodoWrite tool parser - outputs structured props for todo list updates
 * Complex tool with structured format from hybrid schema architecture
 */
export class TodoWriteToolParser extends BaseToolParser<TodoWriteToolProps> {
	readonly toolName = "TodoWrite";
	readonly toolType = "other";
	readonly version = "1.0.0";

	parse(
		toolCall: LogEntry,
		toolResult?: LogEntry,
		config?: ParseConfig,
	): TodoWriteToolProps {
		// Extract base props for correlation
		const baseProps = this.extractBaseProps(toolCall, toolResult, config);

		// Extract tool input using optional chaining
		const toolUse = this.extractToolUse(toolCall);
		const todos = toolUse.input?.todos as TodoItem[] | undefined;

		// Initialize result data
		let writtenCount = 0;
		let addedCount = 0;
		let updatedCount = 0;
		let removedCount = 0;
		let message: string | undefined;
		let errorMessage: string | undefined;
		let interrupted = false;
		let status = mapFromError(false, !toolResult);

		if (toolResult) {
			const result = this.extractToolResult(toolResult, toolUse.id!);

			if (!result.is_error) {
				// Parse successful output
				const output = this.parseOutput(result, toolResult);
				writtenCount = output.writtenCount;
				addedCount = output.addedCount;
				updatedCount = output.updatedCount;
				removedCount = output.removedCount;
				message = output.message;
				interrupted = output.interrupted || false;
			} else {
				// Extract error message from toolUseResult
				const rawResult = this.extractRawToolResult(toolResult);
				errorMessage = this.extractErrorMessage(rawResult);
			}

			// Map status including interrupted state
			status = mapFromError(result.is_error, false, interrupted);
		}

		// Calculate operation type
		const operation = this.determineOperation(todos, writtenCount);

		// Create change tracking
		const changes: TodoChange[] = this.createChanges(
			todos || [],
			addedCount,
			updatedCount,
			removedCount,
		);

		// Return structured props for UI consumption
		return {
			// Base props
			...baseProps,
			status,

			// Input - structured per SOT
			input: {
				todos: todos || [],
			},

			// Results - structured per SOT
			results: {
				changes,
				operation,
				message,
				errorMessage,
			},

			// UI helpers with statistics
			ui: {
				totalTodos: todos?.length || 0,
				addedCount,
				modifiedCount: updatedCount,
				deletedCount: removedCount,
				writtenCount,
			},
		};
	}

	private parseOutput(
		result: MessageContent & { type: "tool_result" },
		toolResult?: LogEntry,
	): {
		writtenCount: number;
		addedCount: number;
		updatedCount: number;
		removedCount: number;
		message?: string;
		interrupted?: boolean;
	} {
		// First try to get toolUseResult from the log entry (preferred - structured data)
		const rawResult = this.extractRawToolResult(toolResult);

		if (rawResult && typeof rawResult === "object") {
			// Parse fixture-style output - handle nested content structure
			let output = rawResult.output || rawResult;

			// Handle complex fixture format: toolUseResult.content[0].output
			if (Array.isArray(rawResult.content)) {
				const toolResultContent = rawResult.content.find(
					(c) => c.type === "tool_result",
				);
				if (toolResultContent?.output) {
					output = toolResultContent.output;
				}
			}

			if (typeof output === "object" && output !== null) {
				const outputObj = output as Record<string, unknown>;
				// Look for structured data from real logs OR test alternative field names
				if (
					outputObj.totalProcessed !== undefined ||
					outputObj.added !== undefined ||
					outputObj.written !== undefined ||
					outputObj.writtenCount !== undefined
				) {
					return {
						writtenCount:
							typeof outputObj.totalProcessed === "number"
								? outputObj.totalProcessed
								: typeof outputObj.writtenCount === "number"
									? outputObj.writtenCount
									: typeof outputObj.written === "number"
										? outputObj.written
										: 0,
						addedCount:
							typeof outputObj.added === "number"
								? outputObj.added
								: typeof outputObj.addedCount === "number"
									? outputObj.addedCount
									: 0,
						updatedCount:
							typeof outputObj.updated === "number"
								? outputObj.updated
								: typeof outputObj.updatedCount === "number"
									? outputObj.updatedCount
									: 0,
						removedCount:
							typeof outputObj.failed === "number"
								? outputObj.failed
								: typeof outputObj.removedCount === "number"
									? outputObj.removedCount
									: 0,
						message:
							typeof outputObj.message === "string"
								? outputObj.message
								: undefined,
						interrupted: outputObj.interrupted === true,
					};
				}
			}
		}

		// Fallback to structured output from tool result
		if (result.output && typeof result.output === "object") {
			const output = result.output as ParsedToolOutput;

			// Check for interrupted flag
			if (output.interrupted === true) {
				return {
					writtenCount:
						typeof output.writtenCount === "number" ? output.writtenCount : 0,
					addedCount:
						typeof output.addedCount === "number" ? output.addedCount : 0,
					updatedCount:
						typeof output.updatedCount === "number" ? output.updatedCount : 0,
					removedCount:
						typeof output.removedCount === "number" ? output.removedCount : 0,
					message:
						typeof output.message === "string"
							? output.message
							: "Operation interrupted",
					interrupted: true,
				};
			}

			return {
				writtenCount:
					typeof output.writtenCount === "number"
						? output.writtenCount
						: typeof output.written === "number"
							? output.written
							: 0,
				addedCount:
					typeof output.addedCount === "number"
						? output.addedCount
						: typeof output.added === "number"
							? output.added
							: 0,
				updatedCount:
					typeof output.updatedCount === "number"
						? output.updatedCount
						: typeof output.updated === "number"
							? output.updated
							: 0,
				removedCount:
					typeof output.removedCount === "number"
						? output.removedCount
						: typeof output.removed === "number"
							? output.removed
							: 0,
				message:
					typeof output.message === "string" ? output.message : undefined,
				interrupted: false,
			};
		}

		// Fallback for string output (simple legacy support only)
		if (typeof result.output === "string") {
			return {
				writtenCount: 0,
				addedCount: 0,
				updatedCount: 0,
				removedCount: 0,
				message: result.output,
				interrupted: result.output.toLowerCase().includes("interrupted"),
			};
		}

		// Default to no items written
		return {
			writtenCount: 0,
			addedCount: 0,
			updatedCount: 0,
			removedCount: 0,
			interrupted: false,
		};
	}

	private determineOperation(
		todos: TodoItem[] | undefined,
		writtenCount: number,
	): "create" | "update" | "replace" | "clear" {
		if (!todos || todos.length === 0) {
			return "clear"; // Empty todo list
		}

		// Analyze todo characteristics regardless of writtenCount
		// Check if all todos are new (no existing IDs or temp IDs only)
		const allNewTodos = todos.every(
			(todo) =>
				!todo.id || todo.id.startsWith("temp-") || todo.id.startsWith("todo-"),
		);

		// Check if we have mix of new and existing todos (based on updatedAt presence)
		// Exclude temp- and todo- prefixed IDs as they are considered "new"
		const hasExistingIds = todos.some(
			(todo) =>
				todo.id &&
				!todo.id.startsWith("temp-") &&
				!todo.id.startsWith("todo-") &&
				todo.updatedAt,
		);

		// If no structured counts available, base decision on todo characteristics
		if (writtenCount === 0) {
			if (allNewTodos && !hasExistingIds) {
				return "create"; // All todos appear to be new
			}
			if (hasExistingIds) {
				return "update"; // Has existing todos being updated
			}
			return "replace"; // Default for ambiguous cases
		}

		// When we have structured counts, use them with todo analysis
		if (allNewTodos && !hasExistingIds) {
			return "create"; // All new todos
		}

		if (hasExistingIds) {
			return "update"; // Has existing todos being updated
		}

		return "replace"; // Full replacement scenario
	}

	// calculateStats method removed - not used in current implementation

	private extractRawToolResult(toolResult?: LogEntry): RawToolResult | null {
		if (!toolResult) return null;

		// Look for toolUseResult in the log entry
		const entry = toolResult as unknown as RawLogEntry;

		// First check if there's a toolUseResult field
		if (entry.toolUseResult) {
			return entry.toolUseResult;
		}

		// Then check content array for tool_result
		const content = entry.content;
		if (Array.isArray(content)) {
			const toolResultContent = content.find((c) => c.type === "tool_result");
			if (toolResultContent) {
				return toolResultContent;
			}
		}

		return null;
	}

	private extractErrorMessage(rawResult: RawToolResult | null): string {
		if (typeof rawResult === "string") {
			return rawResult;
		}

		if (rawResult && typeof rawResult === "object") {
			// Check if rawResult itself has the error message (for LogEntry.content format)
			if (typeof rawResult.output === "string") {
				return rawResult.output;
			}

			const output = rawResult.output || rawResult;
			if (typeof output === "object" && output !== null) {
				const outputObj = output as Record<string, unknown>;
				return typeof outputObj.error === "string"
					? outputObj.error
					: typeof outputObj.message === "string"
						? outputObj.message
						: "Failed to write todos";
			}

			// Check for direct error fields
			if (typeof rawResult.error === "string") {
				return rawResult.error;
			}
			if (typeof rawResult.message === "string") {
				return rawResult.message;
			}
		}

		return "TodoWrite operation failed";
	}

	private createChanges(
		todos: TodoItem[],
		addedCount: number,
		updatedCount: number,
		removedCount: number,
	): TodoChange[] {
		const changes: TodoChange[] = [];

		// If we have explicit counts, use them
		if (addedCount > 0 || updatedCount > 0 || removedCount > 0) {
			// Added items
			for (let i = 0; i < addedCount && i < todos.length; i++) {
				changes.push({
					type: "add",
					todoId: todos[i].id,
					newValue: todos[i],
				});
			}

			// Updated items
			for (let i = 0; i < updatedCount && i + addedCount < todos.length; i++) {
				const todo = todos[i + addedCount];
				changes.push({
					type: "update",
					todoId: todo.id,
					oldValue: { ...todo, content: "Previous content" } as TodoItem,
					newValue: todo,
				});
			}

			// Removed items
			for (let i = 0; i < removedCount; i++) {
				changes.push({
					type: "delete",
					todoId: `removed-${i}`,
					oldValue: {
						id: `removed-${i}`,
						content: "Removed item",
						status: "completed",
						priority: "low",
						createdAt: new Date().toISOString(),
					} as TodoItem,
				});
			}
		} else if (todos.length > 0) {
			// If no explicit counts but we have todos, assume they are all added
			for (const todo of todos) {
				changes.push({
					type: "add",
					todoId: todo.id,
					newValue: todo,
				});
			}
		}

		return changes;
	}

	public getSupportedFeatures(): string[] {
		// Declare parser capabilities
		return [
			"basic-parsing",
			"status-mapping",
			"correlation",
			"structured-output",
			"batch-operations",
			"operation-detection",
			"change-tracking",
			"statistics",
			"interrupted-support",
		];
	}
}

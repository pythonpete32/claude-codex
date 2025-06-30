/**
 * @fileoverview Parser functions for transforming TodoWrite tool data
 * @module @dao/chat-items-todowrite-tool/parsers
 */

import type {
	TodoItem,
	TodoWriteToolChatItem,
	TodoWriteToolComponentProps,
	TodoWriteToolResultData,
} from "./types";
import { isTodoWriteToolChatItem } from "./types";

/**
 * Parses a chat item into TodoWrite tool component props
 */
export function parseTodoWriteToolChatItem(
	item: unknown,
	options?: {
		className?: string;
		onRetry?: () => void;
	},
): TodoWriteToolComponentProps | null {
	if (!isTodoWriteToolChatItem(item)) {
		return null;
	}

	return {
		item: item as TodoWriteToolChatItem,
		className: options?.className,
		onRetry: options?.onRetry,
	};
}

/**
 * Parses raw tool use result output into structured format
 */
export function parseTodoWriteToolOutput(output: unknown): TodoWriteToolResultData | string {
	// Handle string errors
	if (typeof output === "string") {
		return output;
	}

	// Handle structured results
	if (
		typeof output === "object" &&
		output !== null &&
		"totalProcessed" in output &&
		"added" in output &&
		"updated" in output &&
		"failed" in output &&
		"todos" in output &&
		"message" in output
	) {
		return output as TodoWriteToolResultData;
	}

	// Fallback to string representation
	return String(output);
}

/**
 * Extracts error message from tool result content
 */
export function extractErrorMessage(content: string): string | null {
	if (content.includes("Error:") || content.includes("Failed")) {
		return content;
	}
	return null;
}

/**
 * Gets success message from tool result
 */
export function getSuccessMessage(chatItem: TodoWriteToolChatItem): string | null {
	if (chatItem.toolUseResult.status === "completed") {
		if (typeof chatItem.toolUseResult.output === "object") {
			return chatItem.toolUseResult.output.message;
		}
	}
	return null;
}

/**
 * Checks if TodoWrite operation was successful
 */
export function isSuccessfulTodoWrite(chatItem: TodoWriteToolChatItem): boolean {
	return (
		chatItem.toolUseResult.status === "completed" &&
		typeof chatItem.toolUseResult.output === "object"
	);
}

/**
 * Formats todo write summary for display
 */
export function formatTodoWriteSummary(resultData: TodoWriteToolResultData): string {
	const { totalProcessed, added, updated, failed } = resultData;

	const parts: string[] = [];

	if (totalProcessed > 0) {
		parts.push(`${totalProcessed} todos processed`);
	}

	if (added > 0) {
		parts.push(`${added} added`);
	}

	if (updated > 0) {
		parts.push(`${updated} updated`);
	}

	if (failed > 0) {
		parts.push(`${failed} failed`);
	}

	return parts.length > 0 ? parts.join(", ") : "No todos processed";
}

/**
 * Formats todo item for display
 */
export function formatTodoItem(todo: TodoItem): string {
	const statusIcon = {
		pending: "○",
		in_progress: "◐",
		completed: "●",
	}[todo.status];

	const priorityFlag = todo.priority === "high" ? " 🔥" : "";

	return `${statusIcon} ${todo.content}${priorityFlag}`;
}

/**
 * Formats todo list for display
 */
export function formatTodoList(
	todos: TodoItem[],
	options?: {
		maxItems?: number;
		groupByStatus?: boolean;
	},
): string {
	const { maxItems = 10, groupByStatus = false } = options || {};

	if (todos.length === 0) {
		return "No todos to display";
	}

	let displayTodos = todos;

	if (maxItems && todos.length > maxItems) {
		displayTodos = todos.slice(0, maxItems);
	}

	if (groupByStatus) {
		const grouped = {
			pending: displayTodos.filter((todo) => todo.status === "pending"),
			in_progress: displayTodos.filter((todo) => todo.status === "in_progress"),
			completed: displayTodos.filter((todo) => todo.status === "completed"),
		};

		const sections: string[] = [];

		Object.entries(grouped).forEach(([status, statusTodos]) => {
			if (statusTodos.length > 0) {
				const title = status.replace("_", " ").toUpperCase();
				const items = statusTodos.map(formatTodoItem).join("\n");
				sections.push(`${title}:\n${items}`);
			}
		});

		return sections.join("\n\n");
	}

	const formatted = displayTodos.map(formatTodoItem).join("\n");

	if (maxItems && todos.length > maxItems) {
		const remaining = todos.length - maxItems;
		return `${formatted}\n... and ${remaining} more`;
	}

	return formatted;
}

/**
 * Gets todos by status
 */
export function getTodosByStatus(todos: TodoItem[], status: TodoItem["status"]): TodoItem[] {
	return todos.filter((todo) => todo.status === status);
}

/**
 * Gets todos by priority
 */
export function getTodosByPriority(todos: TodoItem[], priority: TodoItem["priority"]): TodoItem[] {
	return todos.filter((todo) => todo.priority === priority);
}

/**
 * Convenience functions for filtering todos
 */
export function getPendingTodos(todos: TodoItem[]): TodoItem[] {
	return getTodosByStatus(todos, "pending");
}

export function getInProgressTodos(todos: TodoItem[]): TodoItem[] {
	return getTodosByStatus(todos, "in_progress");
}

export function getCompletedTodos(todos: TodoItem[]): TodoItem[] {
	return getTodosByStatus(todos, "completed");
}

export function getHighPriorityTodos(todos: TodoItem[]): TodoItem[] {
	return getTodosByPriority(todos, "high");
}

export function getMediumPriorityTodos(todos: TodoItem[]): TodoItem[] {
	return getTodosByPriority(todos, "medium");
}

export function getLowPriorityTodos(todos: TodoItem[]): TodoItem[] {
	return getTodosByPriority(todos, "low");
}

/**
 * Validates todo input array
 */
export function validateTodoInput(todos: unknown[]): TodoItem[] {
	return todos.filter((todo) => {
		return (
			typeof todo === "object" &&
			todo !== null &&
			"id" in todo &&
			"content" in todo &&
			"status" in todo &&
			"priority" in todo
		);
	}) as TodoItem[];
}

/**
 * Generates unique ID for todo item
 */
export function generateTodoId(): string {
	return `todo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates a new todo item with default values
 */
export function createTodoItem(
	content: string,
	options?: {
		id?: string;
		status?: TodoItem["status"];
		priority?: TodoItem["priority"];
	},
): TodoItem {
	return {
		id: options?.id || generateTodoId(),
		content,
		status: options?.status || "pending",
		priority: options?.priority || "medium",
	};
}

/**
 * Updates an existing todo item
 */
export function updateTodoItem(
	todo: TodoItem,
	updates: Partial<Pick<TodoItem, "content" | "status" | "priority">>,
): TodoItem {
	return {
		...todo,
		...updates,
	};
}

/**
 * Calculates write operation statistics
 */
export function calculateWriteStats(
	originalTodos: TodoItem[],
	processedTodos: TodoItem[],
): {
	added: number;
	updated: number;
	failed: number;
	totalProcessed: number;
} {
	const originalIds = new Set(originalTodos.map((t) => t.id));
	const _processedIds = new Set(processedTodos.map((t) => t.id));

	const added = processedTodos.filter((t) => !originalIds.has(t.id)).length;
	const updated = processedTodos.filter((t) => originalIds.has(t.id)).length;
	const failed = Math.max(0, originalTodos.length - updated);
	const totalProcessed = added + updated;

	return { added, updated, failed, totalProcessed };
}

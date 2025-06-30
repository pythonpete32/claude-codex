/**
 * @fileoverview Parser functions for transforming TodoRead tool data
 * @module @dao/chat-items-todoread-tool/parsers
 */

import type {
	TodoItem,
	TodoReadToolChatItem,
	TodoReadToolComponentProps,
	TodoReadToolResultData,
} from "./types";
import { isTodoReadToolChatItem } from "./types";

/**
 * Parses a chat item into TodoRead tool component props
 */
export function parseTodoReadToolChatItem(
	item: unknown,
	options?: {
		className?: string;
		onRetry?: () => void;
	},
): TodoReadToolComponentProps | null {
	if (!isTodoReadToolChatItem(item)) {
		return null;
	}

	return {
		item: item as TodoReadToolChatItem,
		className: options?.className,
		onRetry: options?.onRetry,
	};
}

/**
 * Parses raw tool use result output into structured format
 */
export function parseTodoReadToolOutput(output: unknown): TodoReadToolResultData | string {
	// Handle string errors
	if (typeof output === "string") {
		return output;
	}

	// Handle structured results
	if (
		typeof output === "object" &&
		output !== null &&
		"todos" in output &&
		"totalCount" in output &&
		"statusCounts" in output &&
		"priorityCounts" in output
	) {
		return output as TodoReadToolResultData;
	}

	// Fallback for unexpected formats
	return String(output);
}

/**
 * Extracts error message from tool result
 */
export function extractErrorMessage(content: string): string | null {
	// Check if content indicates an error
	if (content.toLowerCase().includes("error:") || content.toLowerCase().includes("failed")) {
		return content;
	}

	return null;
}

/**
 * Determines if the TodoRead operation was successful
 */
export function isSuccessfulTodoRead(item: TodoReadToolChatItem): boolean {
	if (item.toolUseResult.status !== "completed") {
		return false;
	}

	if (typeof item.toolUseResult.output === "string") {
		return false;
	}

	// Check if todos were retrieved successfully
	return Array.isArray(item.toolUseResult.output.todos);
}

/**
 * Gets todos filtered by status
 */
export function getTodosByStatus(todos: TodoItem[], status: TodoItem["status"]): TodoItem[] {
	return todos.filter((todo) => todo.status === status);
}

/**
 * Gets todos filtered by priority
 */
export function getTodosByPriority(todos: TodoItem[], priority: TodoItem["priority"]): TodoItem[] {
	return todos.filter((todo) => todo.priority === priority);
}

/**
 * Gets pending todos (convenience function)
 */
export function getPendingTodos(todos: TodoItem[]): TodoItem[] {
	return getTodosByStatus(todos, "pending");
}

/**
 * Gets in-progress todos (convenience function)
 */
export function getInProgressTodos(todos: TodoItem[]): TodoItem[] {
	return getTodosByStatus(todos, "in_progress");
}

/**
 * Gets completed todos (convenience function)
 */
export function getCompletedTodos(todos: TodoItem[]): TodoItem[] {
	return getTodosByStatus(todos, "completed");
}

/**
 * Gets high-priority todos (convenience function)
 */
export function getHighPriorityTodos(todos: TodoItem[]): TodoItem[] {
	return getTodosByPriority(todos, "high");
}

/**
 * Calculates completion percentage
 */
export function getCompletionPercentage(todos: TodoItem[]): number {
	if (todos.length === 0) {
		return 0;
	}
	const completedCount = getCompletedTodos(todos).length;
	return Math.round((completedCount / todos.length) * 100);
}

/**
 * Calculates progress percentage (in-progress + completed)
 */
export function getProgressPercentage(todos: TodoItem[]): number {
	if (todos.length === 0) {
		return 0;
	}
	const progressCount = getInProgressTodos(todos).length + getCompletedTodos(todos).length;
	return Math.round((progressCount / todos.length) * 100);
}

/**
 * Formats todo count summary
 */
export function formatTodoCountSummary(resultData: TodoReadToolResultData): string {
	const { totalCount, statusCounts } = resultData;

	if (totalCount === 0) {
		return "No todos found";
	}

	if (totalCount === 1) {
		return "1 todo";
	}

	const parts: string[] = [];

	if (statusCounts.pending > 0) {
		parts.push(`${statusCounts.pending} pending`);
	}

	if (statusCounts.in_progress > 0) {
		parts.push(`${statusCounts.in_progress} in progress`);
	}

	if (statusCounts.completed > 0) {
		parts.push(`${statusCounts.completed} completed`);
	}

	return `${totalCount} todos (${parts.join(", ")})`;
}

/**
 * Formats priority distribution summary
 */
export function formatPriorityDistribution(resultData: TodoReadToolResultData): string {
	const { priorityCounts } = resultData;
	const parts: string[] = [];

	if (priorityCounts.high > 0) {
		parts.push(`${priorityCounts.high} high`);
	}

	if (priorityCounts.medium > 0) {
		parts.push(`${priorityCounts.medium} medium`);
	}

	if (priorityCounts.low > 0) {
		parts.push(`${priorityCounts.low} low`);
	}

	return parts.length > 0 ? `Priority: ${parts.join(", ")}` : "No priority data";
}

/**
 * Gets the next todo to work on (highest priority pending/in-progress)
 */
export function getNextTodo(todos: TodoItem[]): TodoItem | null {
	// First, try high-priority pending todos
	const highPriorityPending = todos.filter(
		(todo) => todo.priority === "high" && todo.status === "pending",
	);
	if (highPriorityPending.length > 0) {
		return highPriorityPending[0];
	}

	// Then, try any pending todos
	const pending = getPendingTodos(todos);
	if (pending.length > 0) {
		// Sort by priority (high first)
		const priorityOrder = { high: 0, medium: 1, low: 2 };
		pending.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
		return pending[0];
	}

	// Finally, check in-progress todos
	const inProgress = getInProgressTodos(todos);
	if (inProgress.length > 0) {
		return inProgress[0];
	}

	return null;
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
			pending: getPendingTodos(displayTodos),
			in_progress: getInProgressTodos(displayTodos),
			completed: getCompletedTodos(displayTodos),
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
 * Gets success message from tool result
 */
export function getSuccessMessage(item: TodoReadToolChatItem): string | null {
	if (!isSuccessfulTodoRead(item)) {
		return null;
	}

	if (typeof item.toolUseResult.output === "string") {
		return null;
	}

	const resultData = item.toolUseResult.output;
	return formatTodoCountSummary(resultData);
}

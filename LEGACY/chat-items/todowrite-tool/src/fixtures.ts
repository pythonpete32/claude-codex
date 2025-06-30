/**
 * @fileoverview Fixture exports and utilities for todowrite-tool
 * @module @dao/chat-items-todowrite-tool/fixtures
 */

import fixturesData from "./fixtures.json";
import type { TodoWriteToolChatItem } from "./types";

/**
 * All fixtures from the JSON file
 */
export const fixtures = fixturesData as Record<string, TodoWriteToolChatItem[]>;

/**
 * Basic fixtures for simple scenarios
 */
export const basicFixtures = fixtures.basic || [];

/**
 * Update operation fixtures
 */
export const updateFixtures = fixtures.updates || [];

/**
 * Priority mix fixtures with different priority levels
 */
export const priorityMixFixtures = fixtures.priority_mix || [];

/**
 * Large list fixtures for testing performance
 */
export const largeListFixtures = fixtures.large_lists || [];

/**
 * Error fixtures for testing error handling
 */
export const errorFixtures = fixtures.errors || [];

/**
 * All fixtures combined into a single array
 */
export const allFixtures: TodoWriteToolChatItem[] = [
	...basicFixtures,
	...updateFixtures,
	...priorityMixFixtures,
	...largeListFixtures,
	...errorFixtures,
];

/**
 * Get fixtures by category
 */
export function getFixturesByCategory(category: string): TodoWriteToolChatItem[] {
	return fixtures[category] || [];
}

/**
 * Get fixture by ID
 */
export function getFixtureById(id: string): TodoWriteToolChatItem | null {
	for (const fixture of allFixtures) {
		if (fixture.toolUse.id === id) {
			return fixture;
		}
	}
	return null;
}

/**
 * Get successful TodoWrite fixtures
 */
export function getSuccessfulFixtures(): TodoWriteToolChatItem[] {
	return allFixtures.filter((fixture) => fixture.toolUseResult.status === "completed");
}

/**
 * Get failed TodoWrite fixtures
 */
export function getFailedFixtures(): TodoWriteToolChatItem[] {
	return allFixtures.filter((fixture) => fixture.toolUseResult.status === "failed");
}

/**
 * Get fixtures with specific number of todos
 */
export function getFixturesByTodoCount(
	size: "small" | "medium" | "large",
): TodoWriteToolChatItem[] {
	return allFixtures.filter((fixture) => {
		const todoCount = fixture.toolUse.input.todos.length;
		switch (size) {
			case "small":
				return todoCount <= 2;
			case "medium":
				return todoCount > 2 && todoCount <= 5;
			case "large":
				return todoCount > 5;
			default:
				return false;
		}
	});
}

/**
 * Get fixtures with todos of specific status
 */
export function getFixturesWithPendingTodos(): TodoWriteToolChatItem[] {
	return allFixtures.filter((fixture) =>
		fixture.toolUse.input.todos.some((todo) => todo.status === "pending"),
	);
}

export function getFixturesWithInProgressTodos(): TodoWriteToolChatItem[] {
	return allFixtures.filter((fixture) =>
		fixture.toolUse.input.todos.some((todo) => todo.status === "in_progress"),
	);
}

export function getFixturesWithCompletedTodos(): TodoWriteToolChatItem[] {
	return allFixtures.filter((fixture) =>
		fixture.toolUse.input.todos.some((todo) => todo.status === "completed"),
	);
}

/**
 * Get fixtures with todos of specific priority
 */
export function getFixturesWithHighPriorityTodos(): TodoWriteToolChatItem[] {
	return allFixtures.filter((fixture) =>
		fixture.toolUse.input.todos.some((todo) => todo.priority === "high"),
	);
}

export function getFixturesWithMediumPriorityTodos(): TodoWriteToolChatItem[] {
	return allFixtures.filter((fixture) =>
		fixture.toolUse.input.todos.some((todo) => todo.priority === "medium"),
	);
}

export function getFixturesWithLowPriorityTodos(): TodoWriteToolChatItem[] {
	return allFixtures.filter((fixture) =>
		fixture.toolUse.input.todos.some((todo) => todo.priority === "low"),
	);
}

/**
 * Get fixtures with mixed operations (add and update)
 */
export function getFixturesWithMixedOperations(): TodoWriteToolChatItem[] {
	return allFixtures.filter((fixture) => {
		if (typeof fixture.toolUseResult.output === "object") {
			const { added, updated } = fixture.toolUseResult.output;
			return added > 0 && updated > 0;
		}
		return false;
	});
}

/**
 * Get fixtures with only add operations
 */
export function getFixturesWithAddOperations(): TodoWriteToolChatItem[] {
	return allFixtures.filter((fixture) => {
		if (typeof fixture.toolUseResult.output === "object") {
			const { added, updated } = fixture.toolUseResult.output;
			return added > 0 && updated === 0;
		}
		return false;
	});
}

/**
 * Get fixtures with only update operations
 */
export function getFixturesWithUpdateOperations(): TodoWriteToolChatItem[] {
	return allFixtures.filter((fixture) => {
		if (typeof fixture.toolUseResult.output === "object") {
			const { added, updated } = fixture.toolUseResult.output;
			return added === 0 && updated > 0;
		}
		return false;
	});
}

/**
 * Get fixtures with failed operations
 */
export function getFixturesWithFailedOperations(): TodoWriteToolChatItem[] {
	return allFixtures.filter((fixture) => {
		if (typeof fixture.toolUseResult.output === "object") {
			return fixture.toolUseResult.output.failed > 0;
		}
		return false;
	});
}

/**
 * Get fixtures with validation errors
 */
export function getFixturesWithValidationErrors(): TodoWriteToolChatItem[] {
	return allFixtures.filter((fixture) => {
		if (typeof fixture.toolUseResult.output === "string") {
			return (
				fixture.toolUseResult.output.includes("validation") ||
				fixture.toolUseResult.output.includes("Invalid")
			);
		}
		return false;
	});
}

/**
 * Get fixtures with storage errors
 */
export function getFixturesWithStorageErrors(): TodoWriteToolChatItem[] {
	return allFixtures.filter((fixture) => {
		if (typeof fixture.toolUseResult.output === "string") {
			return (
				fixture.toolUseResult.output.includes("storage") ||
				fixture.toolUseResult.output.includes("unavailable")
			);
		}
		return false;
	});
}

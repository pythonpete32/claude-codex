/**
 * @fileoverview Fixture exports for todoread-tool testing
 * @module @dao/chat-items-todoread-tool/fixtures
 */

import fixtureData from "./fixtures.json";
import type { TodoReadToolChatItem } from "./types";

/**
 * All TodoRead tool fixtures
 */
export const fixtures = fixtureData;

/**
 * Basic TodoRead operation fixtures
 */
export const basicFixtures = fixtures.basic as unknown as TodoReadToolChatItem[];

/**
 * Empty todo list fixtures
 */
export const emptyFixtures = fixtures.empty as unknown as TodoReadToolChatItem[];

/**
 * Large todo list fixtures
 */
export const largeListFixtures = fixtures.largeLists as unknown as TodoReadToolChatItem[];

/**
 * Priority mix fixtures
 */
export const priorityMixFixtures = fixtures.priorityMix as unknown as TodoReadToolChatItem[];

/**
 * Error case fixtures
 */
export const errorFixtures = fixtures.errors as unknown as TodoReadToolChatItem[];

/**
 * All fixtures combined
 */
export const allFixtures: TodoReadToolChatItem[] = [
	...basicFixtures,
	...emptyFixtures,
	...largeListFixtures,
	...priorityMixFixtures,
	...errorFixtures,
];

/**
 * Get fixture by category
 */
export function getFixturesByCategory(category: keyof typeof fixtures): TodoReadToolChatItem[] {
	return fixtures[category] as unknown as TodoReadToolChatItem[];
}

/**
 * Get fixture by ID
 */
export function getFixtureById(id: string): TodoReadToolChatItem | null {
	for (const fixture of allFixtures) {
		if (fixture.toolUse.id === id) {
			return fixture;
		}
	}
	return null;
}

/**
 * Get successful TodoRead fixtures
 */
export function getSuccessfulFixtures(): TodoReadToolChatItem[] {
	return allFixtures.filter((fixture) => fixture.toolUseResult.status === "completed");
}

/**
 * Get failed TodoRead fixtures
 */
export function getFailedFixtures(): TodoReadToolChatItem[] {
	return allFixtures.filter((fixture) => fixture.toolUseResult.status === "failed");
}

/**
 * Get fixtures with todo data
 */
export function getFixturesWithTodos(): TodoReadToolChatItem[] {
	return allFixtures.filter((fixture) => {
		if (typeof fixture.toolUseResult.output === "string") {
			return false;
		}
		return fixture.toolUseResult.output.todos.length > 0;
	});
}

/**
 * Get fixtures with empty todo lists
 */
export function getFixturesWithEmptyTodos(): TodoReadToolChatItem[] {
	return allFixtures.filter((fixture) => {
		if (typeof fixture.toolUseResult.output === "string") {
			return false;
		}
		return fixture.toolUseResult.output.todos.length === 0;
	});
}

/**
 * Get fixtures by todo count range
 */
export function getFixturesByTodoCount(
	range: "small" | "medium" | "large",
): TodoReadToolChatItem[] {
	return allFixtures.filter((fixture) => {
		if (typeof fixture.toolUseResult.output === "string") {
			return false;
		}

		const todoCount = fixture.toolUseResult.output.totalCount;
		switch (range) {
			case "small":
				return todoCount <= 3;
			case "medium":
				return todoCount > 3 && todoCount <= 8;
			case "large":
				return todoCount > 8;
			default:
				return false;
		}
	});
}

/**
 * Get fixtures with high priority todos
 */
export function getFixturesWithHighPriorityTodos(): TodoReadToolChatItem[] {
	return allFixtures.filter((fixture) => {
		if (typeof fixture.toolUseResult.output === "string") {
			return false;
		}
		return fixture.toolUseResult.output.priorityCounts.high > 0;
	});
}

/**
 * Get fixtures with pending todos
 */
export function getFixturesWithPendingTodos(): TodoReadToolChatItem[] {
	return allFixtures.filter((fixture) => {
		if (typeof fixture.toolUseResult.output === "string") {
			return false;
		}
		return fixture.toolUseResult.output.statusCounts.pending > 0;
	});
}

/**
 * Get fixtures with in-progress todos
 */
export function getFixturesWithInProgressTodos(): TodoReadToolChatItem[] {
	return allFixtures.filter((fixture) => {
		if (typeof fixture.toolUseResult.output === "string") {
			return false;
		}
		return fixture.toolUseResult.output.statusCounts.in_progress > 0;
	});
}

/**
 * Get fixtures with completed todos
 */
export function getFixturesWithCompletedTodos(): TodoReadToolChatItem[] {
	return allFixtures.filter((fixture) => {
		if (typeof fixture.toolUseResult.output === "string") {
			return false;
		}
		return fixture.toolUseResult.output.statusCounts.completed > 0;
	});
}

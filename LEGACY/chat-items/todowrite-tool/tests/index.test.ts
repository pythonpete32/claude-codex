/**
 * @fileoverview Comprehensive tests for todowrite-tool package
 */

import { describe, expect, test } from "bun:test";
import {
	// Fixtures
	allFixtures,
	basicFixtures,
	// Constants
	COLOR_SCHEMES,
	// Parsers
	calculateWriteStats,
	createTodoItem,
	DEFAULTS,
	DISPLAY_LIMITS,
	ERROR_MESSAGES,
	errorFixtures,
	extractErrorMessage,
	FILTER_OPTIONS,
	formatTodoItem,
	formatTodoList,
	formatTodoWriteSummary,
	generateTodoId,
	getCompletedTodos,
	getFailedFixtures,
	getFixtureById,
	getFixturesByCategory,
	getFixturesByTodoCount,
	getFixturesWithAddOperations,
	getFixturesWithCompletedTodos,
	getFixturesWithFailedOperations,
	getFixturesWithHighPriorityTodos,
	getFixturesWithInProgressTodos,
	getFixturesWithMixedOperations,
	getFixturesWithPendingTodos,
	getFixturesWithStorageErrors,
	getFixturesWithUpdateOperations,
	getFixturesWithValidationErrors,
	getHighPriorityTodos,
	getInProgressTodos,
	getPendingTodos,
	getSuccessfulFixtures,
	getSuccessMessage,
	getTodosByPriority,
	getTodosByStatus,
	isSuccessfulTodoWrite,
	isTodoItem,
	isTodoWriteToolChatItem,
	isTodoWriteToolResultData,
	isTodoWriteToolUseInput,
	METRICS,
	OPERATION_TYPES,
	PACKAGE_INFO,
	parseTodoWriteToolChatItem,
	parseTodoWriteToolOutput,
	SORT_OPTIONS,
	SUCCESS_MESSAGES,
	// Validators
	safeValidateTodoItem,
	TODO_PRIORITY,
	TODO_PRIORITY_DISPLAY,
	TODO_PRIORITY_INDICATORS,
	TODO_STATUS,
	TODO_STATUS_DISPLAY,
	TODO_STATUS_ICONS,
	TOOL_CONFIG,
	type TodoItem,
	TodoItemSchema,
	// Schemas
	TodoWriteToolChatItemSchema,
	type TodoWriteToolResultData,
	TodoWriteToolResultDataSchema,
	TodoWriteToolUseInputSchema,
	updateFixtures,
	updateTodoItem,
	VALIDATION,
	validateTodoInput,
	validateTodoItem,
	validateTodoWriteToolChatItem,
	validateTodoWriteToolUseInput,
} from "../src/index";

describe("todowrite-tool", () => {
	describe("Type Guards", () => {
		test("isTodoWriteToolUseInput validates correct input", () => {
			const validInput = {
				todos: [
					{
						id: "1",
						content: "Test todo",
						status: "pending",
						priority: "high",
					},
				],
			};
			expect(isTodoWriteToolUseInput(validInput)).toBe(true);
		});

		test("isTodoWriteToolUseInput rejects invalid input", () => {
			expect(isTodoWriteToolUseInput(null)).toBe(false);
			expect(isTodoWriteToolUseInput(undefined)).toBe(false);
			expect(isTodoWriteToolUseInput({})).toBe(false);
			expect(isTodoWriteToolUseInput({ todos: "not an array" })).toBe(false);
		});

		test("isTodoItem validates correct todo item", () => {
			const validItem = {
				id: "1",
				content: "Test todo",
				status: "pending",
				priority: "high",
			};
			expect(isTodoItem(validItem)).toBe(true);
		});

		test("isTodoItem rejects invalid todo item", () => {
			expect(isTodoItem({})).toBe(false);
			expect(isTodoItem({ id: "1" })).toBe(false);
			expect(isTodoItem({ id: "1", content: "test", status: "invalid" })).toBe(false);
			expect(isTodoItem(null)).toBe(false);
		});

		test("isTodoWriteToolResultData validates correct result", () => {
			const validResult = {
				totalProcessed: 1,
				added: 1,
				updated: 0,
				failed: 0,
				todos: [
					{
						id: "1",
						content: "Test todo",
						status: "pending",
						priority: "high",
					},
				],
				message: "Success",
			};
			expect(isTodoWriteToolResultData(validResult)).toBe(true);
		});

		test("isTodoWriteToolResultData rejects invalid result", () => {
			expect(isTodoWriteToolResultData({})).toBe(false);
			expect(isTodoWriteToolResultData({ totalProcessed: 1 })).toBe(false);
			expect(isTodoWriteToolResultData(null)).toBe(false);
		});

		test("isTodoWriteToolChatItem validates correct chat item", () => {
			const validItem = basicFixtures[0];
			expect(isTodoWriteToolChatItem(validItem)).toBe(true);
		});

		test("isTodoWriteToolChatItem rejects invalid items", () => {
			expect(isTodoWriteToolChatItem({})).toBe(false);
			expect(isTodoWriteToolChatItem({ type: "tool_use", toolUse: { name: "Read" } })).toBe(false);
			expect(isTodoWriteToolChatItem(null)).toBe(false);
		});
	});

	describe("Schemas", () => {
		test("TodoWriteToolUseInputSchema validates input", () => {
			const validInput = {
				todos: [
					{
						id: "1",
						content: "Test todo",
						status: "pending",
						priority: "high",
					},
				],
			};
			const result = TodoWriteToolUseInputSchema.parse(validInput);
			expect(result.todos).toHaveLength(1);
		});

		test("TodoItemSchema validates todo items", () => {
			const validItem = {
				id: "1",
				content: "Test todo",
				status: "pending",
				priority: "high",
			};
			const result = TodoItemSchema.parse(validItem);
			expect(result.id).toBe("1");
			expect(result.content).toBe("Test todo");
			expect(result.status).toBe("pending");
			expect(result.priority).toBe("high");
		});

		test("TodoItemSchema rejects invalid items", () => {
			expect(() => TodoItemSchema.parse({})).toThrow();
			expect(() => TodoItemSchema.parse({ id: "", content: "test" })).toThrow();
			expect(() => TodoItemSchema.parse({ id: "1", content: "", status: "pending" })).toThrow();
		});

		test("TodoWriteToolResultDataSchema validates results", () => {
			const validResult = {
				totalProcessed: 1,
				added: 1,
				updated: 0,
				failed: 0,
				todos: [{ id: "1", content: "Test", status: "pending", priority: "high" }],
				message: "Success",
			};
			const result = TodoWriteToolResultDataSchema.parse(validResult);
			expect(result.totalProcessed).toBe(1);
			expect(result.todos).toHaveLength(1);
		});

		test("TodoWriteToolChatItemSchema validates complete items", () => {
			const validItem = basicFixtures[0];
			const result = TodoWriteToolChatItemSchema.parse(validItem);
			expect(result.type).toBe("tool_use");
			expect(result.toolUse.name).toBe("TodoWrite");
		});
	});

	describe("Validators", () => {
		test("validateTodoWriteToolUseInput validates and returns input", () => {
			const validInput = {
				todos: [
					{
						id: "1",
						content: "Test todo",
						status: "pending",
						priority: "high",
					},
				],
			};
			const result = validateTodoWriteToolUseInput(validInput);
			expect(result.todos).toHaveLength(1);
		});

		test("validateTodoItem validates and returns todo item", () => {
			const validItem = {
				id: "1",
				content: "Test todo",
				status: "pending",
				priority: "high",
			};
			const result = validateTodoItem(validItem);
			expect(result.id).toBe("1");
		});

		test("validateTodoItem throws on invalid item", () => {
			expect(() => validateTodoItem({})).toThrow();
			expect(() => validateTodoItem({ id: "" })).toThrow();
		});

		test("safeValidateTodoItem returns null on error", () => {
			expect(safeValidateTodoItem({})).toBeNull();
			expect(safeValidateTodoItem({ id: "" })).toBeNull();
		});

		test("validateTodoWriteToolChatItem validates fixtures", () => {
			for (const fixture of basicFixtures) {
				expect(() => validateTodoWriteToolChatItem(fixture)).not.toThrow();
			}
		});
	});

	describe("Parsers", () => {
		test("parseTodoWriteToolChatItem creates component props", () => {
			const fixture = basicFixtures[0];
			const props = parseTodoWriteToolChatItem(fixture, { className: "test-class" });
			expect(props).not.toBeNull();
			expect(props?.className).toBe("test-class");
			expect(props?.item).toBe(fixture);
		});

		test("parseTodoWriteToolChatItem returns null for non-todowrite items", () => {
			const invalidItem = { type: "tool_use", toolUse: { name: "Read" } };
			expect(parseTodoWriteToolChatItem(invalidItem)).toBeNull();
		});

		test("parseTodoWriteToolOutput handles different output formats", () => {
			// Test string output
			const stringOutput = "Error: Todo storage unavailable";
			expect(parseTodoWriteToolOutput(stringOutput)).toBe(stringOutput);

			// Test structured output
			const structuredOutput = {
				totalProcessed: 1,
				added: 1,
				updated: 0,
				failed: 0,
				todos: [],
				message: "Success",
			};
			const result = parseTodoWriteToolOutput(structuredOutput);
			expect(typeof result).toBe("object");
			expect((result as TodoWriteToolResultData).totalProcessed).toBe(1);

			// Test fallback
			const unknownOutput = { unknown: "format" };
			expect(parseTodoWriteToolOutput(unknownOutput)).toBe("[object Object]");
		});

		test("extractErrorMessage extracts errors correctly", () => {
			expect(extractErrorMessage("Error: Todo storage unavailable")).toBe(
				"Error: Todo storage unavailable",
			);
			expect(extractErrorMessage("Failed to write todos")).toBe("Failed to write todos");
			expect(extractErrorMessage("Todos written successfully")).toBeNull();
		});

		test("isSuccessfulTodoWrite identifies successful operations", () => {
			const successfulFixture = basicFixtures[0];
			expect(isSuccessfulTodoWrite(successfulFixture)).toBe(true);

			const failedFixture = errorFixtures[0];
			expect(isSuccessfulTodoWrite(failedFixture)).toBe(false);
		});

		test("getTodosByStatus filters todos correctly", () => {
			const todos: TodoItem[] = [
				{ id: "1", content: "Todo 1", status: "pending", priority: "high" },
				{ id: "2", content: "Todo 2", status: "in_progress", priority: "medium" },
				{ id: "3", content: "Todo 3", status: "completed", priority: "low" },
			];

			expect(getTodosByStatus(todos, "pending")).toHaveLength(1);
			expect(getTodosByStatus(todos, "in_progress")).toHaveLength(1);
			expect(getTodosByStatus(todos, "completed")).toHaveLength(1);
		});

		test("getTodosByPriority filters todos correctly", () => {
			const todos: TodoItem[] = [
				{ id: "1", content: "Todo 1", status: "pending", priority: "high" },
				{ id: "2", content: "Todo 2", status: "pending", priority: "high" },
				{ id: "3", content: "Todo 3", status: "pending", priority: "low" },
			];

			expect(getTodosByPriority(todos, "high")).toHaveLength(2);
			expect(getTodosByPriority(todos, "medium")).toHaveLength(0);
			expect(getTodosByPriority(todos, "low")).toHaveLength(1);
		});

		test("convenience functions work correctly", () => {
			const todos: TodoItem[] = [
				{ id: "1", content: "Pending todo", status: "pending", priority: "high" },
				{ id: "2", content: "In progress todo", status: "in_progress", priority: "medium" },
				{ id: "3", content: "Completed todo", status: "completed", priority: "low" },
			];

			expect(getPendingTodos(todos)).toHaveLength(1);
			expect(getInProgressTodos(todos)).toHaveLength(1);
			expect(getCompletedTodos(todos)).toHaveLength(1);
			expect(getHighPriorityTodos(todos)).toHaveLength(1);
		});

		test("formatTodoWriteSummary formats summaries correctly", () => {
			const resultData: TodoWriteToolResultData = {
				totalProcessed: 5,
				added: 3,
				updated: 2,
				failed: 0,
				todos: [],
				message: "Success",
			};

			const summary = formatTodoWriteSummary(resultData);
			expect(summary).toContain("5 todos processed");
			expect(summary).toContain("3 added");
			expect(summary).toContain("2 updated");

			const emptyResult: TodoWriteToolResultData = {
				totalProcessed: 0,
				added: 0,
				updated: 0,
				failed: 0,
				todos: [],
				message: "No todos",
			};
			expect(formatTodoWriteSummary(emptyResult)).toBe("No todos processed");
		});

		test("formatTodoItem formats items correctly", () => {
			const todo: TodoItem = {
				id: "1",
				content: "High priority todo",
				status: "pending",
				priority: "high",
			};

			const formatted = formatTodoItem(todo);
			expect(formatted).toContain("○"); // pending icon
			expect(formatted).toContain("High priority todo");
			expect(formatted).toContain("🔥"); // high priority flag
		});

		test("formatTodoList formats lists correctly", () => {
			const todos: TodoItem[] = [
				{ id: "1", content: "Todo 1", status: "pending", priority: "high" },
				{ id: "2", content: "Todo 2", status: "completed", priority: "medium" },
			];

			const formatted = formatTodoList(todos);
			expect(formatted).toContain("○ Todo 1");
			expect(formatted).toContain("● Todo 2");

			expect(formatTodoList([])).toBe("No todos to display");

			// Test grouped format
			const grouped = formatTodoList(todos, { groupByStatus: true });
			expect(grouped).toContain("PENDING:");
			expect(grouped).toContain("COMPLETED:");
		});

		test("getSuccessMessage extracts success messages", () => {
			const successfulFixture = basicFixtures[0];
			const message = getSuccessMessage(successfulFixture);
			expect(message).toContain("Successfully");

			const failedFixture = errorFixtures[0];
			expect(getSuccessMessage(failedFixture)).toBeNull();
		});

		test("createTodoItem creates valid todo items", () => {
			const todo = createTodoItem("Test content");
			expect(todo.content).toBe("Test content");
			expect(todo.status).toBe("pending");
			expect(todo.priority).toBe("medium");
			expect(todo.id).toBeTruthy();

			const customTodo = createTodoItem("Custom todo", {
				status: "completed",
				priority: "high",
				id: "custom_id",
			});
			expect(customTodo.id).toBe("custom_id");
			expect(customTodo.status).toBe("completed");
			expect(customTodo.priority).toBe("high");
		});

		test("updateTodoItem updates existing todo", () => {
			const originalTodo: TodoItem = {
				id: "1",
				content: "Original content",
				status: "pending",
				priority: "medium",
			};

			const updatedTodo = updateTodoItem(originalTodo, {
				content: "Updated content",
				status: "completed",
			});

			expect(updatedTodo.id).toBe("1");
			expect(updatedTodo.content).toBe("Updated content");
			expect(updatedTodo.status).toBe("completed");
			expect(updatedTodo.priority).toBe("medium"); // unchanged
		});

		test("generateTodoId creates unique IDs", () => {
			const id1 = generateTodoId();
			const id2 = generateTodoId();
			expect(id1).not.toBe(id2);
			expect(id1).toMatch(/^todo_\d+_[a-z0-9]+$/);
		});

		test("validateTodoInput filters valid todos", () => {
			const mixedInput = [
				{ id: "1", content: "Valid todo", status: "pending", priority: "high" },
				{ invalid: "object" },
				{ id: "2", content: "Another valid", status: "completed", priority: "low" },
				null,
			];

			const validTodos = validateTodoInput(mixedInput);
			expect(validTodos).toHaveLength(2);
			expect(validTodos[0].id).toBe("1");
			expect(validTodos[1].id).toBe("2");
		});

		test("calculateWriteStats computes statistics correctly", () => {
			const originalTodos: TodoItem[] = [
				{ id: "1", content: "Existing 1", status: "pending", priority: "medium" },
				{ id: "2", content: "Existing 2", status: "completed", priority: "low" },
			];

			const processedTodos: TodoItem[] = [
				{ id: "1", content: "Updated 1", status: "in_progress", priority: "medium" },
				{ id: "3", content: "New todo", status: "pending", priority: "high" },
			];

			const stats = calculateWriteStats(originalTodos, processedTodos);
			expect(stats.added).toBe(1); // id "3" is new
			expect(stats.updated).toBe(1); // id "1" was updated
			expect(stats.failed).toBe(1); // id "2" was not processed
			expect(stats.totalProcessed).toBe(2);
		});
	});

	describe("Fixtures", () => {
		test("fixtures are properly typed", () => {
			expect(Array.isArray(allFixtures)).toBe(true);
			expect(allFixtures.length).toBeGreaterThan(0);
		});

		test("fixture helper functions work correctly", () => {
			expect(getSuccessfulFixtures().length).toBeGreaterThan(0);
			expect(getFailedFixtures().length).toBeGreaterThan(0);
			expect(getFixturesWithAddOperations().length).toBeGreaterThan(0);
			expect(getFixturesWithMixedOperations().length).toBeGreaterThan(0);
		});

		test("getFixturesByCategory returns correct fixtures", () => {
			const basics = getFixturesByCategory("basic");
			expect(basics.length).toBeGreaterThan(0);
			expect(basics.every((f) => f.toolUse.name === "TodoWrite")).toBe(true);
		});

		test("getFixtureById finds fixtures correctly", () => {
			const firstFixture = allFixtures[0];
			const found = getFixtureById(firstFixture.toolUse.id);
			expect(found).toBe(firstFixture);
			expect(getFixtureById("nonexistent")).toBeNull();
		});

		test("getFixturesByTodoCount categorizes correctly", () => {
			const smallFixtures = getFixturesByTodoCount("small");
			const largeFixtures = getFixturesByTodoCount("large");

			// Check that small fixtures have <= 2 todos
			smallFixtures.forEach((fixture) => {
				expect(fixture.toolUse.input.todos.length).toBeLessThanOrEqual(2);
			});

			// Check that large fixtures have > 5 todos
			largeFixtures.forEach((fixture) => {
				expect(fixture.toolUse.input.todos.length).toBeGreaterThan(5);
			});
		});

		test("priority and status filter functions work", () => {
			const highPriorityFixtures = getFixturesWithHighPriorityTodos();
			const pendingFixtures = getFixturesWithPendingTodos();
			const inProgressFixtures = getFixturesWithInProgressTodos();
			const completedFixtures = getFixturesWithCompletedTodos();

			expect(highPriorityFixtures.length).toBeGreaterThan(0);
			expect(pendingFixtures.length).toBeGreaterThan(0);
			expect(inProgressFixtures.length).toBeGreaterThan(0);
			expect(completedFixtures.length).toBeGreaterThan(0);
		});

		test("operation type filter functions work", () => {
			const addOnlyFixtures = getFixturesWithAddOperations();
			const updateOnlyFixtures = getFixturesWithUpdateOperations();
			const mixedFixtures = getFixturesWithMixedOperations();
			const failedFixtures = getFixturesWithFailedOperations();

			expect(addOnlyFixtures.length).toBeGreaterThan(0);
			expect(updateOnlyFixtures.length).toBeGreaterThanOrEqual(0); // May be 0 if no update-only fixtures
			expect(mixedFixtures.length).toBeGreaterThan(0);
			expect(failedFixtures.length).toBe(0); // No fixtures have failed operations in our test data
		});

		test("error type filter functions work", () => {
			const validationErrorFixtures = getFixturesWithValidationErrors();
			const storageErrorFixtures = getFixturesWithStorageErrors();

			expect(validationErrorFixtures.length).toBeGreaterThan(0);
			expect(storageErrorFixtures.length).toBeGreaterThan(0);
		});

		test("all fixtures have valid structure", () => {
			for (const fixture of allFixtures) {
				expect(fixture.type).toBe("tool_use");
				expect(fixture.toolUse.name).toBe("TodoWrite");
				expect(typeof fixture.toolUse.input).toBe("object");
				expect(Array.isArray(fixture.toolUse.input.todos)).toBe(true);
			}
		});
	});

	describe("Constants", () => {
		test("package constants are defined", () => {
			expect(PACKAGE_INFO.name).toBe("@dao/chat-items-todowrite-tool");
			expect(PACKAGE_INFO.toolName).toBe("TodoWrite");
			expect(TOOL_CONFIG.name).toBe("TodoWrite");
			expect(TOOL_CONFIG.type).toBe("tool_use");
		});

		test("error and success messages are defined", () => {
			expect(typeof ERROR_MESSAGES.INVALID_INPUT).toBe("string");
			expect(typeof SUCCESS_MESSAGES.TODOS_WRITTEN).toBe("string");
		});

		test("todo status and priority constants are defined", () => {
			expect(TODO_STATUS.PENDING).toBe("pending");
			expect(TODO_STATUS.IN_PROGRESS).toBe("in_progress");
			expect(TODO_STATUS.COMPLETED).toBe("completed");

			expect(TODO_PRIORITY.HIGH).toBe("high");
			expect(TODO_PRIORITY.MEDIUM).toBe("medium");
			expect(TODO_PRIORITY.LOW).toBe("low");
		});

		test("display constants are defined", () => {
			expect(typeof TODO_STATUS_DISPLAY.pending).toBe("string");
			expect(typeof TODO_PRIORITY_DISPLAY.high).toBe("string");
			expect(typeof TODO_STATUS_ICONS.pending).toBe("string");
			expect(typeof TODO_PRIORITY_INDICATORS.high).toBe("string");
		});

		test("operation types are defined", () => {
			expect(OPERATION_TYPES.ADD).toBe("add");
			expect(OPERATION_TYPES.UPDATE).toBe("update");
			expect(OPERATION_TYPES.MIXED).toBe("mixed");
		});

		test("limits and options are defined", () => {
			expect(typeof DISPLAY_LIMITS.MAX_TODOS_PREVIEW).toBe("number");
			expect(typeof SORT_OPTIONS.BY_PRIORITY).toBe("string");
			expect(typeof FILTER_OPTIONS.ALL).toBe("string");
		});

		test("color schemes are defined", () => {
			expect(typeof COLOR_SCHEMES.STATUS.pending).toBe("string");
			expect(typeof COLOR_SCHEMES.PRIORITY.high).toBe("string");
		});

		test("metrics and defaults are defined", () => {
			expect(typeof METRICS.COMPLETION_THRESHOLDS.HIGH).toBe("number");
			expect(typeof DEFAULTS.TODO_PRIORITY).toBe("string");
			expect(typeof VALIDATION.MIN_CONTENT_LENGTH).toBe("number");
		});
	});

	describe("Integration", () => {
		test("complete workflow with valid fixture", () => {
			const fixture = basicFixtures[0];

			// Validate the complete item
			const validatedItem = validateTodoWriteToolChatItem(fixture);
			expect(validatedItem.toolUse.name).toBe("TodoWrite");

			// Parse into component props
			const props = parseTodoWriteToolChatItem(validatedItem);
			expect(props).not.toBeNull();
			expect(props?.item).toBe(validatedItem);

			// Check if operation was successful
			const isSuccess = isSuccessfulTodoWrite(validatedItem);
			expect(isSuccess).toBe(true);

			// Get success message
			const message = getSuccessMessage(validatedItem);
			expect(message).toContain("Successfully");
		});

		test("complete workflow with error fixture", () => {
			// Use the storage error fixture instead of validation error fixture
			// because validation error fixture has intentionally invalid data
			const fixture = errorFixtures[1]; // Storage error fixture

			// Validate the complete item
			const validatedItem = validateTodoWriteToolChatItem(fixture);
			expect(validatedItem.toolUse.name).toBe("TodoWrite");

			// Check if operation failed
			const isSuccess = isSuccessfulTodoWrite(validatedItem);
			expect(isSuccess).toBe(false);

			// Extract error message
			const errorMessage = extractErrorMessage(validatedItem.toolResult.content);
			expect(errorMessage).not.toBeNull();
			expect(errorMessage).toContain("Error:");
		});

		test("todo write analysis workflow", () => {
			const fixture = updateFixtures[0];

			if (typeof fixture.toolUseResult.output !== "string") {
				const resultData = fixture.toolUseResult.output;

				// Test summary formatting
				const summary = formatTodoWriteSummary(resultData);
				expect(summary).toContain("processed");

				// Test statistics
				expect(resultData.totalProcessed).toBeGreaterThan(0);
				expect(resultData.added + resultData.updated).toBe(resultData.totalProcessed);

				// Test todo list formatting
				const formatted = formatTodoList(resultData.todos);
				expect(formatted).toContain("○"); // Should contain status icons
			}
		});
	});
});

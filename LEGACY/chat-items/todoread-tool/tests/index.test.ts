/**
 * @fileoverview Comprehensive tests for todoread-tool package
 */

import { describe, expect, test } from "bun:test";
import {
	// Fixtures
	allFixtures,
	basicFixtures,
	// Constants
	COLOR_SCHEMES,
	DEFAULTS,
	DISPLAY_LIMITS,
	ERROR_MESSAGES,
	errorFixtures,
	// Parsers
	extractErrorMessage,
	FILTER_OPTIONS,
	formatPriorityDistribution,
	formatTodoCountSummary,
	formatTodoItem,
	formatTodoList,
	getCompletedTodos,
	getCompletionPercentage,
	getFailedFixtures,
	getFixtureById,
	getFixturesByCategory,
	getFixturesByTodoCount,
	getFixturesWithCompletedTodos,
	getFixturesWithEmptyTodos,
	getFixturesWithHighPriorityTodos,
	getFixturesWithInProgressTodos,
	getFixturesWithPendingTodos,
	getFixturesWithTodos,
	getHighPriorityTodos,
	getInProgressTodos,
	getNextTodo,
	getPendingTodos,
	getProgressPercentage,
	getSuccessfulFixtures,
	getSuccessMessage,
	getTodosByPriority,
	getTodosByStatus,
	isSuccessfulTodoRead,
	isTodoItem,
	isTodoReadToolChatItem,
	isTodoReadToolResultData,
	isTodoReadToolUseInput,
	largeListFixtures,
	METRICS,
	PACKAGE_INFO,
	parseTodoReadToolChatItem,
	parseTodoReadToolOutput,
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
	TodoReadToolChatItemSchema,
	type TodoReadToolResultData,
	TodoReadToolResultDataSchema,
	TodoReadToolUseInputSchema,
	VALIDATION,
	validateTodoItem,
	validateTodoReadToolChatItem,
	validateTodoReadToolUseInput,
} from "../src/index";

describe("todoread-tool", () => {
	describe("Type Guards", () => {
		test("isTodoReadToolUseInput validates correct input", () => {
			const validInput = {};
			expect(isTodoReadToolUseInput(validInput)).toBe(true);
		});

		test("isTodoReadToolUseInput rejects invalid input", () => {
			expect(isTodoReadToolUseInput(null)).toBe(false);
			expect(isTodoReadToolUseInput(undefined)).toBe(false);
			expect(isTodoReadToolUseInput("string")).toBe(false);
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

		test("isTodoReadToolResultData validates correct result", () => {
			const validResult = {
				todos: [],
				totalCount: 0,
				statusCounts: { pending: 0, in_progress: 0, completed: 0 },
				priorityCounts: { high: 0, medium: 0, low: 0 },
			};
			expect(isTodoReadToolResultData(validResult)).toBe(true);
		});

		test("isTodoReadToolResultData rejects invalid result", () => {
			expect(isTodoReadToolResultData({})).toBe(false);
			expect(isTodoReadToolResultData({ todos: [] })).toBe(false);
			expect(isTodoReadToolResultData(null)).toBe(false);
		});

		test("isTodoReadToolChatItem validates correct chat item", () => {
			const validItem = basicFixtures[0];
			expect(isTodoReadToolChatItem(validItem)).toBe(true);
		});

		test("isTodoReadToolChatItem rejects invalid items", () => {
			expect(isTodoReadToolChatItem({})).toBe(false);
			expect(isTodoReadToolChatItem({ type: "tool_use", toolUse: { name: "Write" } })).toBe(false);
			expect(isTodoReadToolChatItem(null)).toBe(false);
		});
	});

	describe("Schemas", () => {
		test("TodoReadToolUseInputSchema validates input", () => {
			const validInput = {};
			const result = TodoReadToolUseInputSchema.parse(validInput);
			expect(result).toEqual({});
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

		test("TodoReadToolResultDataSchema validates results", () => {
			const validResult = {
				todos: [{ id: "1", content: "Test", status: "pending", priority: "high" }],
				totalCount: 1,
				statusCounts: { pending: 1, in_progress: 0, completed: 0 },
				priorityCounts: { high: 1, medium: 0, low: 0 },
			};
			const result = TodoReadToolResultDataSchema.parse(validResult);
			expect(result.totalCount).toBe(1);
			expect(result.todos).toHaveLength(1);
		});

		test("TodoReadToolChatItemSchema validates complete items", () => {
			const validItem = basicFixtures[0];
			const result = TodoReadToolChatItemSchema.parse(validItem);
			expect(result.type).toBe("tool_use");
			expect(result.toolUse.name).toBe("TodoRead");
		});
	});

	describe("Validators", () => {
		test("validateTodoReadToolUseInput validates and returns input", () => {
			const validInput = {};
			const result = validateTodoReadToolUseInput(validInput);
			expect(result).toEqual({});
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

		test("validateTodoReadToolChatItem validates fixtures", () => {
			for (const fixture of basicFixtures) {
				expect(() => validateTodoReadToolChatItem(fixture)).not.toThrow();
			}
		});
	});

	describe("Parsers", () => {
		test("parseTodoReadToolChatItem creates component props", () => {
			const fixture = basicFixtures[0];
			const props = parseTodoReadToolChatItem(fixture, { className: "test-class" });
			expect(props).not.toBeNull();
			expect(props?.className).toBe("test-class");
			expect(props?.item).toBe(fixture);
		});

		test("parseTodoReadToolChatItem returns null for non-todoread items", () => {
			const invalidItem = { type: "tool_use", toolUse: { name: "Write" } };
			expect(parseTodoReadToolChatItem(invalidItem)).toBeNull();
		});

		test("parseTodoReadToolOutput handles different output formats", () => {
			// Test string output
			const stringOutput = "Error: Todo storage unavailable";
			expect(parseTodoReadToolOutput(stringOutput)).toBe(stringOutput);

			// Test structured output
			const structuredOutput = {
				todos: [],
				totalCount: 0,
				statusCounts: { pending: 0, in_progress: 0, completed: 0 },
				priorityCounts: { high: 0, medium: 0, low: 0 },
			};
			const result = parseTodoReadToolOutput(structuredOutput);
			expect(typeof result).toBe("object");
			expect((result as TodoReadToolResultData).totalCount).toBe(0);

			// Test fallback
			const unknownOutput = { unknown: "format" };
			expect(parseTodoReadToolOutput(unknownOutput)).toBe("[object Object]");
		});

		test("extractErrorMessage extracts errors correctly", () => {
			expect(extractErrorMessage("Error: Todo storage unavailable")).toBe(
				"Error: Todo storage unavailable",
			);
			expect(extractErrorMessage("Failed to load todos")).toBe("Failed to load todos");
			expect(extractErrorMessage("Todos retrieved successfully")).toBeNull();
		});

		test("isSuccessfulTodoRead identifies successful operations", () => {
			const successfulFixture = basicFixtures[0];
			expect(isSuccessfulTodoRead(successfulFixture)).toBe(true);

			const failedFixture = errorFixtures[0];
			expect(isSuccessfulTodoRead(failedFixture)).toBe(false);
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

		test("getCompletionPercentage calculates correctly", () => {
			const todos: TodoItem[] = [
				{ id: "1", content: "Todo 1", status: "completed", priority: "high" },
				{ id: "2", content: "Todo 2", status: "completed", priority: "medium" },
				{ id: "3", content: "Todo 3", status: "pending", priority: "low" },
				{ id: "4", content: "Todo 4", status: "pending", priority: "low" },
			];

			expect(getCompletionPercentage(todos)).toBe(50);
			expect(getCompletionPercentage([])).toBe(0);
		});

		test("getProgressPercentage calculates correctly", () => {
			const todos: TodoItem[] = [
				{ id: "1", content: "Todo 1", status: "completed", priority: "high" },
				{ id: "2", content: "Todo 2", status: "in_progress", priority: "medium" },
				{ id: "3", content: "Todo 3", status: "pending", priority: "low" },
				{ id: "4", content: "Todo 4", status: "pending", priority: "low" },
			];

			expect(getProgressPercentage(todos)).toBe(50); // 2 out of 4 (completed + in_progress)
		});

		test("formatTodoCountSummary formats summaries correctly", () => {
			const resultData: TodoReadToolResultData = {
				todos: [],
				totalCount: 5,
				statusCounts: { pending: 2, in_progress: 1, completed: 2 },
				priorityCounts: { high: 2, medium: 2, low: 1 },
			};

			const summary = formatTodoCountSummary(resultData);
			expect(summary).toContain("5 todos");
			expect(summary).toContain("2 pending");
			expect(summary).toContain("1 in progress");
			expect(summary).toContain("2 completed");

			const emptyResult: TodoReadToolResultData = {
				todos: [],
				totalCount: 0,
				statusCounts: { pending: 0, in_progress: 0, completed: 0 },
				priorityCounts: { high: 0, medium: 0, low: 0 },
			};
			expect(formatTodoCountSummary(emptyResult)).toBe("No todos found");
		});

		test("formatPriorityDistribution formats distribution correctly", () => {
			const resultData: TodoReadToolResultData = {
				todos: [],
				totalCount: 5,
				statusCounts: { pending: 2, in_progress: 1, completed: 2 },
				priorityCounts: { high: 2, medium: 2, low: 1 },
			};

			const distribution = formatPriorityDistribution(resultData);
			expect(distribution).toContain("Priority:");
			expect(distribution).toContain("2 high");
			expect(distribution).toContain("2 medium");
			expect(distribution).toContain("1 low");
		});

		test("getNextTodo returns correct next todo", () => {
			const todos: TodoItem[] = [
				{ id: "1", content: "Low priority pending", status: "pending", priority: "low" },
				{ id: "2", content: "High priority pending", status: "pending", priority: "high" },
				{ id: "3", content: "Completed todo", status: "completed", priority: "high" },
			];

			const nextTodo = getNextTodo(todos);
			expect(nextTodo?.id).toBe("2"); // High priority pending comes first
			expect(nextTodo?.priority).toBe("high");

			expect(getNextTodo([])).toBeNull();
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
			expect(message).toContain("todos");

			const failedFixture = errorFixtures[0];
			expect(getSuccessMessage(failedFixture)).toBeNull();
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
			expect(getFixturesWithTodos().length).toBeGreaterThan(0);
			expect(getFixturesWithEmptyTodos().length).toBeGreaterThan(0);
		});

		test("getFixturesByCategory returns correct fixtures", () => {
			const basics = getFixturesByCategory("basic");
			expect(basics.length).toBeGreaterThan(0);
			expect(basics.every((f) => f.toolUse.name === "TodoRead")).toBe(true);
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

			// Check that small fixtures have <= 3 todos
			smallFixtures.forEach((fixture) => {
				if (typeof fixture.toolUseResult.output !== "string") {
					expect(fixture.toolUseResult.output.totalCount).toBeLessThanOrEqual(3);
				}
			});

			// Check that large fixtures have > 8 todos
			largeFixtures.forEach((fixture) => {
				if (typeof fixture.toolUseResult.output !== "string") {
					expect(fixture.toolUseResult.output.totalCount).toBeGreaterThan(8);
				}
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

		test("all fixtures have valid structure", () => {
			for (const fixture of allFixtures) {
				expect(fixture.type).toBe("tool_use");
				expect(fixture.toolUse.name).toBe("TodoRead");
				expect(typeof fixture.toolUse.input).toBe("object");
			}
		});
	});

	describe("Constants", () => {
		test("package constants are defined", () => {
			expect(PACKAGE_INFO.name).toBe("@dao/chat-items-todoread-tool");
			expect(PACKAGE_INFO.toolName).toBe("TodoRead");
			expect(TOOL_CONFIG.name).toBe("TodoRead");
			expect(TOOL_CONFIG.type).toBe("tool_use");
		});

		test("error and success messages are defined", () => {
			expect(typeof ERROR_MESSAGES.INVALID_INPUT).toBe("string");
			expect(typeof SUCCESS_MESSAGES.TODOS_RETRIEVED).toBe("string");
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
			const validatedItem = validateTodoReadToolChatItem(fixture);
			expect(validatedItem.toolUse.name).toBe("TodoRead");

			// Parse into component props
			const props = parseTodoReadToolChatItem(validatedItem);
			expect(props).not.toBeNull();
			expect(props?.item).toBe(validatedItem);

			// Check if operation was successful
			const isSuccess = isSuccessfulTodoRead(validatedItem);
			expect(isSuccess).toBe(true);

			// Get success message
			const message = getSuccessMessage(validatedItem);
			expect(message).toContain("todos");
		});

		test("complete workflow with error fixture", () => {
			const fixture = errorFixtures[0];

			// Validate the complete item
			const validatedItem = validateTodoReadToolChatItem(fixture);
			expect(validatedItem.toolUse.name).toBe("TodoRead");

			// Check if operation failed
			const isSuccess = isSuccessfulTodoRead(validatedItem);
			expect(isSuccess).toBe(false);

			// Extract error message
			const errorMessage = extractErrorMessage(validatedItem.toolResult.content);
			expect(errorMessage).not.toBeNull();
			expect(errorMessage).toContain("Error:");
		});

		test("todo analysis workflow", () => {
			const fixture = largeListFixtures[0];

			if (typeof fixture.toolUseResult.output !== "string") {
				const resultData = fixture.toolUseResult.output;

				// Test summary formatting
				const summary = formatTodoCountSummary(resultData);
				expect(summary).toContain("todos");

				// Test priority distribution
				const distribution = formatPriorityDistribution(resultData);
				expect(distribution).toContain("Priority:");

				// Test percentage calculations
				const completion = getCompletionPercentage(resultData.todos);
				const progress = getProgressPercentage(resultData.todos);
				expect(completion).toBeGreaterThanOrEqual(0);
				expect(progress).toBeGreaterThanOrEqual(completion);

				// Test next todo recommendation
				const nextTodo = getNextTodo(resultData.todos);
				if (nextTodo) {
					expect(nextTodo.status).toMatch(/pending|in_progress/);
				}
			}
		});
	});
});

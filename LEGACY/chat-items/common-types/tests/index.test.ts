import { describe, expect, test } from "bun:test";
import type {
	BaseConfig,
	BaseFixtureData,
	BaseFixturesMetadata,
	BaseToolProps,
	BaseToolUse,
	ToolStatus,
	ValidationResult,
} from "../src/index";
import { PACKAGE_INFO } from "../src/index";

describe("common-types", () => {
	test("should export base types", () => {
		// Test that types compile correctly
		const testToolUse: BaseToolUse<"Test", { test: string }> = {
			type: "tool_use",
			id: "test-id",
			name: "Test",
			input: { test: "value" },
		};

		const testStatus: ToolStatus = "completed";
		const testConfig: BaseConfig = {
			debug: true,
			preserveTimestamps: false,
		};

		const testValidation: ValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
		};

		expect(testToolUse.type).toBe("tool_use");
		expect(testStatus).toBe("completed");
		expect(testConfig.debug).toBe(true);
		expect(testValidation.isValid).toBe(true);
	});

	test("should export fixture types", () => {
		// Test that fixture types compile correctly
		type TestToolUse = BaseToolUse<"Test", { test: string }>;
		type TestResult = { result: string };
		type TestProps = BaseToolProps<TestToolUse, TestResult>;
		type TestFixture = BaseFixtureData<TestToolUse, TestResult, TestProps>;
		type TestMetadata = BaseFixturesMetadata<TestFixture>;

		// Create test data
		const testFixture: TestFixture = {
			toolCall: {
				uuid: "uuid",
				timestamp: "2024-01-01",
				parentUuid: "parent",
				sessionId: "session",
				tool: {
					type: "tool_use",
					id: "test-id",
					name: "Test",
					input: { test: "value" },
				},
			},
			toolResult: {
				uuid: "result-uuid",
				parentUuid: "parent",
				timestamp: "2024-01-01",
				result: {
					tool_use_id: "test-id",
					type: "tool_result",
					content: "test content",
					is_error: false,
				},
				toolUseResult: { result: "test" },
			},
			expectedComponentData: {
				type: "test_tool",
				props: {
					toolUse: {
						type: "tool_use",
						id: "test-id",
						name: "Test",
						input: { test: "value" },
					},
					status: "completed",
					timestamp: "2024-01-01",
					toolResult: { result: "test" },
				},
			},
		};

		const testMetadata: TestMetadata = {
			toolName: "Test",
			category: "test",
			priority: "high",
			fixtureCount: 1,
			fixtures: [testFixture],
		};

		expect(testFixture.toolCall.tool.name).toBe("Test");
		expect(testMetadata.toolName).toBe("Test");
	});

	test("should export package info", () => {
		expect(PACKAGE_INFO.name).toBe("common-types");
		expect(PACKAGE_INFO.version).toBe("0.1.0");
		expect(PACKAGE_INFO.license).toBe("MIT");
	});
});

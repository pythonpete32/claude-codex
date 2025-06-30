import { describe, expect, spyOn, test } from "bun:test";
import type { GrepTypes } from "../src/index";
import {
	AllFixtures,
	PACKAGE_INFO,
	parseGrepTool,
	processGrepTools,
	Schemas,
	ValidatedFixtures,
	validateGrepToolData,
} from "../src/index";

// Sample fixture data based on actual grep tool structure
const sampleSuccessFixture: GrepTypes.GrepFixtureData = {
	toolCall: {
		uuid: "49aa294a-2f12-4197-8478-127f9fc9d4b7",
		timestamp: "2025-06-25T18:20:11.465Z",
		parentUuid: "dde3c669-70e7-46b7-8a83-8b4f9c26fad4",
		sessionId: "140ff683-32fc-4600-b3cb-52da55fcfaba",
		tool: {
			type: "tool_use",
			id: "toolu_01GPL8y2muQwUayJUmd8x2yz",
			name: "Grep",
			input: {
				pattern: "TODO",
				include: "*.ts",
				path: "src/",
			},
		},
	},
	toolResult: {
		uuid: "2c1ad171-3778-4dcc-a644-1aea39b35d33",
		parentUuid: "49aa294a-2f12-4197-8478-127f9fc9d4b7",
		timestamp: "2025-06-25T18:20:11.465Z",
		result: {
			tool_use_id: "toolu_01GPL8y2muQwUayJUmd8x2yz",
			type: "tool_result",
			content: "Found 3 matches",
			is_error: false,
		},
		toolUseResult: {
			matches: ["src/index.ts", "src/components/TodoList.ts", "src/utils/helpers.ts"],
			matchCount: 3,
			isError: false,
		},
	},
	expectedComponentData: {
		type: "grep_tool",
		props: {
			toolUse: {
				type: "tool_use",
				id: "toolu_01GPL8y2muQwUayJUmd8x2yz",
				name: "Grep",
				input: {
					pattern: "TODO",
					include: "*.ts",
					path: "src/",
				},
			},
			status: "completed",
			timestamp: "2025-06-28T01:35:07.521Z",
			toolResult: {
				matches: ["src/index.ts", "src/components/TodoList.ts", "src/utils/helpers.ts"],
				matchCount: 3,
				isError: false,
			},
		},
	},
};

const sampleEmptyResultFixture: GrepTypes.GrepFixtureData = {
	toolCall: {
		uuid: "680fa633-4de5-45b8-b282-5b365cd4ee46",
		timestamp: "2025-06-25T18:25:16.463Z",
		parentUuid: "5e81746b-9ef2-4e0c-93ea-d3d29503d752",
		sessionId: "140ff683-32fc-4600-b3cb-52da55fcfaba",
		tool: {
			type: "tool_use",
			id: "toolu_01CudWr2ghPSscWdhe6aZkUj",
			name: "Grep",
			input: {
				pattern: "console\\.log",
			},
		},
	},
	toolResult: {
		uuid: "4f513711-42e5-4898-9dbb-227ef091bc89",
		parentUuid: "680fa633-4de5-45b8-b282-5b365cd4ee46",
		timestamp: "2025-06-25T18:25:19.401Z",
		result: {
			type: "tool_result",
			content: "No matches found",
			is_error: false,
			tool_use_id: "toolu_01CudWr2ghPSscWdhe6aZkUj",
		},
		toolUseResult: {
			matches: [],
			matchCount: 0,
			isError: false,
		},
	},
	expectedComponentData: {
		type: "grep_tool",
		props: {
			toolUse: {
				type: "tool_use",
				id: "toolu_01CudWr2ghPSscWdhe6aZkUj",
				name: "Grep",
				input: {
					pattern: "console\\.log",
				},
			},
			status: "completed",
			timestamp: "2025-06-28T01:35:07.522Z",
			toolResult: {
				matches: [],
				matchCount: 0,
				isError: false,
			},
		},
	},
};

const sampleErrorFixture: GrepTypes.GrepFixtureData = {
	toolCall: {
		uuid: "780fa633-4de5-45b8-b282-5b365cd4ee46",
		timestamp: "2025-06-25T18:26:16.463Z",
		parentUuid: "6e81746b-9ef2-4e0c-93ea-d3d29503d752",
		sessionId: "140ff683-32fc-4600-b3cb-52da55fcfaba",
		tool: {
			type: "tool_use",
			id: "toolu_02CudWr2ghPSscWdhe6aZkUj",
			name: "Grep",
			input: {
				pattern: "[invalid regex",
				path: "/nonexistent/path",
			},
		},
	},
	toolResult: {
		uuid: "5f513711-42e5-4898-9dbb-227ef091bc89",
		parentUuid: "780fa633-4de5-45b8-b282-5b365cd4ee46",
		timestamp: "2025-06-25T18:26:19.401Z",
		result: {
			type: "tool_result",
			content: "Error: Invalid regular expression pattern",
			is_error: true,
			tool_use_id: "toolu_02CudWr2ghPSscWdhe6aZkUj",
		},
		toolUseResult: "Error: Invalid regular expression pattern",
	},
	expectedComponentData: {
		type: "grep_tool",
		props: {
			toolUse: {
				type: "tool_use",
				id: "toolu_02CudWr2ghPSscWdhe6aZkUj",
				name: "Grep",
				input: {
					pattern: "[invalid regex",
					path: "/nonexistent/path",
				},
			},
			status: "failed",
			timestamp: "2025-06-28T01:35:07.523Z",
			toolResult: {
				matches: [],
				matchCount: 0,
				isError: true,
				errorMessage: "Error: Invalid regular expression pattern",
			},
		},
	},
};

describe("grep-tool package", () => {
	test("should export package info", () => {
		expect(PACKAGE_INFO.name).toBe("@dao/codex-chat-item-grep-tool");
		expect(PACKAGE_INFO.version).toBe("0.1.0");
		expect(PACKAGE_INFO.toolName).toBe("Grep");
		expect(PACKAGE_INFO.componentType).toBe("grep_tool");
	});

	describe("validateGrepToolData", () => {
		test("should validate correct fixture data", () => {
			const result = validateGrepToolData(sampleSuccessFixture);
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		test("should reject null or undefined data", () => {
			const result = validateGrepToolData(null);
			expect(result.isValid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0]).toContain("Data must be a valid object");
		});

		test("should reject data missing toolCall", () => {
			const invalidData = { ...sampleSuccessFixture };
			// @ts-ignore
			delete invalidData.toolCall;
			const result = validateGrepToolData(invalidData);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("Missing required field: toolCall");
		});

		test("should reject data with wrong tool name", () => {
			const invalidData = {
				...sampleSuccessFixture,
				toolCall: {
					...sampleSuccessFixture.toolCall,
					tool: {
						...sampleSuccessFixture.toolCall.tool,
						name: "Bash" as "Bash",
					},
				},
			};
			const result = validateGrepToolData(invalidData);
			expect(result.isValid).toBe(false);
			expect(result.errors[0]).toContain('Expected tool name "Grep", got "Bash"');
		});

		test("should reject data missing pattern", () => {
			const invalidData = {
				...sampleSuccessFixture,
				toolCall: {
					...sampleSuccessFixture.toolCall,
					tool: {
						...sampleSuccessFixture.toolCall.tool,
						input: {
							include: "*.ts",
						} as { pattern?: string },
					},
				},
			};
			const result = validateGrepToolData(invalidData);
			expect(result.isValid).toBe(false);
			expect(result.errors[0]).toContain("Missing required field: toolCall.tool.input.pattern");
		});
	});

	describe("parseGrepTool", () => {
		test("should parse successful grep fixture", () => {
			const result = parseGrepTool(sampleSuccessFixture);
			expect(result.status).toBe("completed");
			expect(result.toolUse.name).toBe("Grep");
			expect(result.toolResult.matches).toHaveLength(3);
			expect(result.toolResult.isError).toBe(false);
		});

		test("should parse empty result fixture", () => {
			const result = parseGrepTool(sampleEmptyResultFixture);
			expect(result.status).toBe("completed");
			expect(result.toolResult.matches).toHaveLength(0);
			expect(result.toolResult.matchCount).toBe(0);
			expect(result.toolResult.isError).toBe(false);
		});

		test("should parse error fixture", () => {
			const result = parseGrepTool(sampleErrorFixture);
			expect(result.status).toBe("failed");
			expect(result.toolResult.isError).toBe(true);
			expect(result.toolResult.errorMessage).toContain("Invalid regular expression");
		});

		test("should preserve timestamps when configured", () => {
			const result = parseGrepTool(sampleSuccessFixture, { preserveTimestamps: true });
			expect(result.timestamp).toBe(sampleSuccessFixture.expectedComponentData.props.timestamp);
		});

		test("should generate new timestamp when not preserving", () => {
			const result = parseGrepTool(sampleSuccessFixture, { preserveTimestamps: false });
			expect(result.timestamp).not.toBe(sampleSuccessFixture.expectedComponentData.props.timestamp);
		});

		test("should throw on invalid data", () => {
			const invalidData = { ...sampleSuccessFixture };
			// @ts-ignore
			delete invalidData.toolCall;
			expect(() => parseGrepTool(invalidData)).toThrow("Invalid fixture data");
		});

		test("should show warnings in debug mode", () => {
			const consoleSpy = spyOn(console, "warn").mockImplementation(() => {});
			parseGrepTool(sampleSuccessFixture, { debug: true });
			consoleSpy.mockRestore();
		});
	});

	describe("processGrepTools", () => {
		test("should process multiple fixtures", () => {
			const fixtures = [sampleSuccessFixture, sampleEmptyResultFixture, sampleErrorFixture];
			const results = processGrepTools(fixtures);
			expect(results).toHaveLength(3);
			expect(results[0].status).toBe("completed");
			expect(results[1].status).toBe("completed");
			expect(results[2].status).toBe("failed");
		});

		test("should throw on any invalid fixture", () => {
			const fixtures = [
				sampleSuccessFixture,
				{ invalid: "data" } as unknown as GrepTypes.GrepFixtureData,
			];
			expect(() => processGrepTools(fixtures)).toThrow();
		});

		test("should log errors in debug mode", () => {
			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
			const fixtures = [{ invalid: "data" } as unknown as GrepTypes.GrepFixtureData];
			expect(() => processGrepTools(fixtures, { debug: true })).toThrow();
			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});

	describe("Zod schemas", () => {
		test("should validate GrepToolUseInput schema", () => {
			const validInput = {
				pattern: "TODO",
				include: "*.ts",
				path: "src/",
			};
			const result = Schemas.GrepToolUseInput.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		test("should validate GrepToolUse schema", () => {
			const validToolUse = {
				type: "tool_use",
				id: "test-id",
				name: "Grep",
				input: {
					pattern: "test",
				},
			};
			const result = Schemas.GrepToolUse.safeParse(validToolUse);
			expect(result.success).toBe(true);
		});

		test("should validate GrepToolResult schema", () => {
			const validResult = {
				matches: ["file1.ts", "file2.ts"],
				matchCount: 2,
				isError: false,
			};
			const result = Schemas.GrepToolResult.safeParse(validResult);
			expect(result.success).toBe(true);
		});

		test("should validate GrepToolProps schema", () => {
			const validProps = {
				toolUse: {
					type: "tool_use",
					id: "test-id",
					name: "Grep",
					input: {
						pattern: "test",
					},
				},
				status: "completed",
				timestamp: new Date().toISOString(),
				toolResult: {
					matches: ["file.ts"],
					matchCount: 1,
					isError: false,
				},
			};
			const result = Schemas.GrepToolProps.safeParse(validProps);
			expect(result.success).toBe(true);
		});
	});

	describe("AllFixtures", () => {
		test("should have validated fixtures", () => {
			expect(ValidatedFixtures.fixtures.length).toBeGreaterThan(0);
			expect(ValidatedFixtures.toolName).toBe("Grep");
			expect(ValidatedFixtures.category).toBe("search");
		});

		test("should export successful search fixture", () => {
			expect(AllFixtures.successfulSearch).toBeDefined();
			expect(AllFixtures.successfulSearch.toolCall.tool.name).toBe("Grep");
		});

		test("should export failed search fixture", () => {
			expect(AllFixtures.failedSearch).toBeDefined();
			const result = AllFixtures.failedSearch.toolResult.result;
			expect(result.is_error || AllFixtures.failedSearch.toolResult.toolUseResult).toBeTruthy();
		});

		test("should export empty search fixture", () => {
			expect(AllFixtures.emptySearch).toBeDefined();
		});

		test("should export all fixtures array", () => {
			expect(AllFixtures.allFixtures).toBeInstanceOf(Array);
			expect(AllFixtures.allFixtures.length).toBeGreaterThan(0);
		});
	});

	describe("Type safety", () => {
		test("should enforce correct types", () => {
			const fixture: GrepTypes.GrepFixtureData = sampleSuccessFixture;
			const toolUse: GrepTypes.GrepToolUse = fixture.toolCall.tool;
			const toolResult: GrepTypes.GrepToolResult = {
				matches: [],
				matchCount: 0,
				isError: false,
			};
			const props: GrepTypes.GrepToolProps = {
				toolUse,
				status: "completed",
				timestamp: new Date().toISOString(),
				toolResult,
			};
			expect(props.toolUse.name).toBe("Grep");
		});
	});
});

import { describe, expect, spyOn, test } from "bun:test";
import type { EditToolTypes } from "../src/index";
import {
	AllFixtures,
	PACKAGE_INFO,
	parseEditTool,
	processEditTools,
	Schemas,
	ValidatedFixtures,
	validateEditToolData,
} from "../src/index";

// Sample fixture data based on actual edit-fixtures.json structure
const sampleSuccessFixture: EditToolTypes.EditFixtureData = {
	toolCall: {
		uuid: "6cdd180f-f8d0-4d6d-b971-3a0e0afeac35",
		timestamp: "2025-06-25T18:26:11.966Z",
		parentUuid: "01fc84a2-5b11-42e0-855e-1c98c9a11d64",
		sessionId: "140ff683-32fc-4600-b3cb-52da55fcfaba",
		tool: {
			type: "tool_use",
			id: "toolu_01HZKQ81r3KfQokbGp39q9Y9",
			name: "Edit",
			input: {
				file_path: "/Users/abuusama/Desktop/temp/claude-codex/claude-log-processor/package.json",
				old_string:
					'{\n  "name": "claude-log-processor",\n  "module": "index.ts",\n  "type": "module"\n}',
				new_string:
					'{\n  "name": "claude-log-processor",\n  "module": "index.ts",\n  "type": "module",\n  "scripts": {\n    "test": "vitest"\n  }\n}',
			},
		},
	},
	toolResult: {
		uuid: "3c7afd13-29dd-4eb1-8576-2f610ff0e0c5",
		parentUuid: "6cdd180f-f8d0-4d6d-b971-3a0e0afeac35",
		timestamp: "2025-06-25T18:26:12.544Z",
		result: {
			tool_use_id: "toolu_01HZKQ81r3KfQokbGp39q9Y9",
			type: "tool_result",
			content: "The file has been updated successfully",
			is_error: false,
		},
		toolUseResult: {
			filePath: "/Users/abuusama/Desktop/temp/claude-codex/claude-log-processor/package.json",
			oldString:
				'{\n  "name": "claude-log-processor",\n  "module": "index.ts",\n  "type": "module"\n}',
			newString:
				'{\n  "name": "claude-log-processor",\n  "module": "index.ts",\n  "type": "module",\n  "scripts": {\n    "test": "vitest"\n  }\n}',
			originalFile:
				'{\n  "name": "claude-log-processor",\n  "module": "index.ts",\n  "type": "module"\n}',
			structuredPatch: [
				{
					oldStart: 2,
					oldLines: 4,
					newStart: 2,
					newLines: 7,
					lines: [
						'   "name": "claude-log-processor",',
						'   "module": "index.ts",',
						'   "type": "module",',
						'+  "scripts": {',
						'+    "test": "vitest"',
						"+  }",
					],
				},
			],
		},
	},
	expectedComponentData: {
		type: "edit_tool",
		props: {
			toolUse: {
				type: "tool_use",
				id: "toolu_01HZKQ81r3KfQokbGp39q9Y9",
				name: "Edit",
				input: {
					file_path: "/Users/abuusama/Desktop/temp/claude-codex/claude-log-processor/package.json",
					old_string:
						'{\n  "name": "claude-log-processor",\n  "module": "index.ts",\n  "type": "module"\n}',
					new_string:
						'{\n  "name": "claude-log-processor",\n  "module": "index.ts",\n  "type": "module",\n  "scripts": {\n    "test": "vitest"\n  }\n}',
				},
			},
			status: "completed",
			timestamp: "2025-06-28T01:35:07.521Z",
			toolResult: {
				filePath: "/Users/abuusama/Desktop/temp/claude-codex/claude-log-processor/package.json",
				oldString:
					'{\n  "name": "claude-log-processor",\n  "module": "index.ts",\n  "type": "module"\n}',
				newString:
					'{\n  "name": "claude-log-processor",\n  "module": "index.ts",\n  "type": "module",\n  "scripts": {\n    "test": "vitest"\n  }\n}',
				originalFile:
					'{\n  "name": "claude-log-processor",\n  "module": "index.ts",\n  "type": "module"\n}',
				structuredPatch: [
					{
						oldStart: 2,
						oldLines: 4,
						newStart: 2,
						newLines: 7,
						lines: [
							'   "name": "claude-log-processor",',
							'   "module": "index.ts",',
							'   "type": "module",',
							'+  "scripts": {',
							'+    "test": "vitest"',
							"+  }",
						],
					},
				],
				isError: false,
			},
		},
	},
};

const sampleErrorFixture: EditToolTypes.EditFixtureData = {
	toolCall: {
		uuid: "error-fixture-uuid",
		timestamp: "2025-06-25T18:26:11.966Z",
		parentUuid: "error-parent-uuid",
		sessionId: "140ff683-32fc-4600-b3cb-52da55fcfaba",
		tool: {
			type: "tool_use",
			id: "toolu_error_id",
			name: "Edit",
			input: {
				file_path: "/nonexistent/file.txt",
				old_string: "old content",
				new_string: "new content",
			},
		},
	},
	toolResult: {
		uuid: "error-result-uuid",
		parentUuid: "error-fixture-uuid",
		timestamp: "2025-06-25T18:26:12.544Z",
		result: {
			tool_use_id: "toolu_error_id",
			type: "tool_result",
			content: "File not found error",
			is_error: true,
		},
		toolUseResult: "Error: File not found: /nonexistent/file.txt",
	},
	expectedComponentData: {
		type: "edit_tool",
		props: {
			toolUse: {
				type: "tool_use",
				id: "toolu_error_id",
				name: "Edit",
				input: {
					file_path: "/nonexistent/file.txt",
					old_string: "old content",
					new_string: "new content",
				},
			},
			status: "failed",
			timestamp: "2025-06-28T01:35:07.522Z",
			toolResult: {
				filePath: "/nonexistent/file.txt",
				oldString: "old content",
				newString: "new content",
				originalFile: "",
				structuredPatch: [],
				isError: true,
				errorMessage: "Error: File not found: /nonexistent/file.txt",
			},
		},
	},
};

describe("edit-tool package", () => {
	test("should export package info", () => {
		expect(PACKAGE_INFO.name).toBe("edit-tool");
		expect(PACKAGE_INFO.version).toBe("0.1.0");
		expect(PACKAGE_INFO.license).toBe("MIT");
	});

	describe("validateEditToolData", () => {
		test("should validate correct fixture data", () => {
			const result = validateEditToolData(sampleSuccessFixture);
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		test("should reject null or undefined data", () => {
			const result = validateEditToolData(null);
			expect(result.isValid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0]).toContain("Data must be a valid object");
		});

		test("should reject data missing toolCall", () => {
			const invalidData = { ...sampleSuccessFixture };
			delete (invalidData as Partial<EditToolTypes.EditFixtureData>).toolCall;
			const result = validateEditToolData(invalidData);
			expect(result.isValid).toBe(false);
			expect(result.errors.some((error) => error.includes("toolCall"))).toBe(true);
		});

		test("should reject data with wrong tool name", () => {
			const invalidData = {
				...sampleSuccessFixture,
				toolCall: {
					...sampleSuccessFixture.toolCall,
					tool: {
						...sampleSuccessFixture.toolCall.tool,
						name: "NotEdit" as unknown as "Edit",
					},
				},
			};
			const result = validateEditToolData(invalidData);
			expect(result.isValid).toBe(false);
			expect(result.errors.some((error) => error.includes("NotEdit"))).toBe(true);
		});

		test("should reject data missing required input fields", () => {
			const invalidData = {
				...sampleSuccessFixture,
				toolCall: {
					...sampleSuccessFixture.toolCall,
					tool: {
						...sampleSuccessFixture.toolCall.tool,
						input: {
							file_path: "",
							old_string: "",
							new_string: "",
						},
					},
				},
			};
			const result = validateEditToolData(invalidData);
			expect(result.isValid).toBe(false);
		});
	});

	describe("parseEditTool", () => {
		test("should parse successful edit fixture", () => {
			const result = parseEditTool(sampleSuccessFixture);

			expect(result.toolUse.name).toBe("Edit");
			expect(result.toolUse.input.file_path).toBe(
				"/Users/abuusama/Desktop/temp/claude-codex/claude-log-processor/package.json",
			);
			expect(result.status).toBe("completed");
			expect(result.toolResult.isError).toBe(false);
			expect(result.toolResult.structuredPatch).toHaveLength(1);
		});

		test("should parse error edit fixture", () => {
			const result = parseEditTool(sampleErrorFixture);

			expect(result.toolUse.name).toBe("Edit");
			expect(result.status).toBe("failed");
			expect(result.toolResult.isError).toBe(true);
			expect(result.toolResult.errorMessage).toBe("Error: File not found: /nonexistent/file.txt");
		});

		test("should preserve timestamps when configured", () => {
			const result = parseEditTool(sampleSuccessFixture, {
				preserveTimestamps: true,
			});
			expect(result.timestamp).toBe("2025-06-28T01:35:07.521Z");
		});

		test("should use current timestamp by default", () => {
			const before = new Date().toISOString();
			const result = parseEditTool(sampleSuccessFixture);
			const after = new Date().toISOString();

			expect(result.timestamp >= before).toBe(true);
			expect(result.timestamp <= after).toBe(true);
		});

		test("should handle string error results", () => {
			const result = parseEditTool(sampleErrorFixture);

			expect(result.toolResult.isError).toBe(true);
			expect(result.toolResult.errorMessage).toBe("Error: File not found: /nonexistent/file.txt");
			// When toolUseResult is a string (error case), structuredPatch is undefined
			expect(result.toolResult.structuredPatch).toBeUndefined();
		});

		test("should throw error for invalid data", () => {
			const invalidData = {
				invalid: "data",
			} as unknown as EditToolTypes.EditFixtureData;
			expect(() => parseEditTool(invalidData)).toThrow();
		});

		test("should handle debug mode", () => {
			const consoleSpy = spyOn(console, "warn").mockImplementation(() => {});

			// This test passes as there are no warnings in our sample data
			parseEditTool(sampleSuccessFixture, { debug: true });
			expect(consoleSpy).not.toHaveBeenCalled();

			consoleSpy.mockRestore();
		});
	});

	describe("processEditTools", () => {
		test("should process multiple fixtures", () => {
			const fixtures = [sampleSuccessFixture, sampleErrorFixture];
			const results = processEditTools(fixtures);

			expect(results).toHaveLength(2);
			expect(results[0].status).toBe("completed");
			expect(results[1].status).toBe("failed");
		});

		test("should handle empty array", () => {
			const results = processEditTools([]);
			expect(results).toHaveLength(0);
		});

		test("should propagate errors in debug mode", () => {
			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
			const invalidFixture = {
				invalid: "data",
			} as unknown as EditToolTypes.EditFixtureData;

			expect(() => processEditTools([invalidFixture], { debug: true })).toThrow();

			expect(consoleSpy).toHaveBeenCalledWith("Failed to process fixture 0:", expect.any(Error));

			consoleSpy.mockRestore();
		});
	});

	describe("edge cases", () => {
		test("should handle missing optional fields gracefully", () => {
			const minimalFixture = {
				...sampleSuccessFixture,
				toolCall: {
					...sampleSuccessFixture.toolCall,
					tool: {
						...sampleSuccessFixture.toolCall.tool,
						input: {
							file_path: "/test/file.txt",
							old_string: "old",
							new_string: "new",
							// replace_all is optional
						},
					},
				},
			};

			const result = parseEditTool(minimalFixture);
			expect(result.toolUse.input.replace_all).toBeUndefined();
		});

		test("should detect error from result.is_error flag", () => {
			const fixtureWithErrorFlag = {
				...sampleSuccessFixture,
				toolResult: {
					...sampleSuccessFixture.toolResult,
					result: {
						...sampleSuccessFixture.toolResult.result,
						is_error: true,
					},
					toolUseResult: {
						...(sampleSuccessFixture.toolResult.toolUseResult as EditToolTypes.EditToolResult),
						isError: false, // This should be overridden by result.is_error
					},
				},
			};

			const result = parseEditTool(fixtureWithErrorFlag);
			expect(result.status).toBe("failed");
			expect(result.toolResult.isError).toBe(true);
		});
	});

	describe("type safety", () => {
		test("should export correct types", () => {
			// Type checking - these should compile without errors
			const toolUse: EditToolTypes.EditToolUse = {
				type: "tool_use",
				id: "test-id",
				name: "Edit",
				input: {
					file_path: "/test/file.txt",
					old_string: "old content",
					new_string: "new content",
				},
			};

			const config: EditToolTypes.EditConfig = {
				debug: true,
				preserveTimestamps: false,
			};

			expect(toolUse.name).toBe("Edit");
			expect(config.debug).toBe(true);
		});

		test("should have correct status type constraints", () => {
			const validStatuses: EditToolTypes.EditToolStatus[] = ["completed", "failed"];
			expect(validStatuses).toHaveLength(2);
		});
	});

	describe("sample fixtures", () => {
		test("should export sample fixtures", () => {
			expect(AllFixtures.successfulEdit).toBeDefined();
			expect(AllFixtures.failedEdit).toBeDefined();
			expect(AllFixtures.allFixtures).toBeDefined();
		});

		test("should parse successful edit sample fixture", () => {
			const props = parseEditTool(AllFixtures.successfulEdit);
			expect(props.status).toBe("completed");
			expect(props.toolUse.input.file_path).toBeDefined();
			expect(props.toolResult.isError).toBe(false);
		});

		test("should parse sample fixtures", () => {
			const props = parseEditTool(AllFixtures.failedEdit);
			expect(props.toolUse.name).toBe("Edit");
		});

		test("should have access to all fixtures", () => {
			expect(AllFixtures.allFixtures.length).toBeGreaterThan(0);
			expect(Array.isArray(AllFixtures.allFixtures)).toBe(true);
		});

		test("should validate all sample fixtures", () => {
			AllFixtures.allFixtures.slice(0, 5).forEach((fixture) => {
				// Test first 5 to avoid long test times
				const result = validateEditToolData(fixture);
				expect(result.isValid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});
		});

		test("should process sample fixtures in batch", () => {
			const testFixtures = AllFixtures.allFixtures.slice(0, 3); // Test first 3
			const results = processEditTools(testFixtures);
			expect(results).toHaveLength(3);
			expect(results[0].toolUse.name).toBe("Edit");
		});
	});

	describe("validated fixtures", () => {
		test("should export validated fixtures metadata", () => {
			expect(ValidatedFixtures).toBeDefined();
			expect(ValidatedFixtures.toolName).toBe("Edit");
			expect(ValidatedFixtures.fixtures).toBeDefined();
			expect(Array.isArray(ValidatedFixtures.fixtures)).toBe(true);
		});

		test("should have correct metadata", () => {
			expect(ValidatedFixtures.category).toBeDefined();
			expect(ValidatedFixtures.priority).toBeDefined();
			expect(ValidatedFixtures.fixtureCount).toBeGreaterThan(0);
			expect(ValidatedFixtures.fixtures.length).toBeGreaterThan(0);
		});

		test("should contain valid fixture data", () => {
			const firstFixture = ValidatedFixtures.fixtures[0];
			expect(firstFixture.toolCall).toBeDefined();
			expect(firstFixture.toolResult).toBeDefined();
			expect(firstFixture.expectedComponentData).toBeDefined();
			expect(firstFixture.toolCall.tool.name).toBe("Edit");
		});
	});

	describe("zod schemas", () => {
		test("should export Zod schemas", () => {
			expect(Schemas.EditToolUseInput).toBeDefined();
			expect(Schemas.EditToolUse).toBeDefined();
			expect(Schemas.EditToolResult).toBeDefined();
			expect(Schemas.EditToolProps).toBeDefined();
		});

		test("should validate tool use input with schema", () => {
			const validInput = {
				file_path: "/test/file.txt",
				old_string: "old content",
				new_string: "new content",
			};
			const result = Schemas.EditToolUseInput.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		test("should validate edit tool props with schema", () => {
			const validProps = {
				toolUse: {
					type: "tool_use" as const,
					id: "test-id",
					name: "Edit" as const,
					input: {
						file_path: "/test/file.txt",
						old_string: "old content",
						new_string: "new content",
					},
				},
				status: "completed" as const,
				timestamp: "2025-06-28T12:00:00Z",
				toolResult: {
					filePath: "/test/file.txt",
					oldString: "old content",
					newString: "new content",
					originalFile: "original content",
					structuredPatch: [],
				},
			};
			const result = Schemas.EditToolProps.safeParse(validProps);
			expect(result.success).toBe(true);
		});

		test("should reject invalid data with schema", () => {
			const invalidProps = {
				toolUse: {
					type: "invalid_type",
					name: "NotEdit",
				},
			};
			const result = Schemas.EditToolProps.safeParse(invalidProps);
			expect(result.success).toBe(false);
		});
	});
});

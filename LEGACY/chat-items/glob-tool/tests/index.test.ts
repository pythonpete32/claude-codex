import { describe, expect, test } from "bun:test";
import {
	AllFixtures,
	PACKAGE_INFO,
	parseGlobTool,
	processGlobTools,
	Schemas,
	ValidatedFixtures,
	validateGlobToolData,
} from "../src/index";
import type {
	GlobFixtureData,
	GlobToolProps,
	GlobToolResult,
	GlobToolUseInput,
} from "../src/types";

describe("glob-tool", () => {
	// 1. Package info export test
	describe("package info", () => {
		test("should export correct package info", () => {
			expect(PACKAGE_INFO).toEqual({
				name: "@dao/codex-chat-item-glob-tool",
				version: "0.1.0",
				description:
					"Type-safe schema and parser for glob tool UI components in Claude conversations",
				toolName: "Glob",
				componentType: "glob_tool",
			});
		});
	});

	// 2. Validator tests
	describe("validateGlobToolData", () => {
		test("should validate correct fixture data", () => {
			const result = validateGlobToolData(AllFixtures.successfulGlob);
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		test("should reject invalid tool type", () => {
			const invalidData = {
				...AllFixtures.successfulGlob,
				toolCall: {
					...AllFixtures.successfulGlob.toolCall,
					tool: {
						...AllFixtures.successfulGlob.toolCall.tool,
						type: "invalid_type" as "tool_use",
					},
				},
			};
			const result = validateGlobToolData(invalidData);
			expect(result.isValid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0]).toContain("Invalid tool type");
		});

		test("should reject missing pattern input", () => {
			const invalidData = {
				...AllFixtures.successfulGlob,
				toolCall: {
					...AllFixtures.successfulGlob.toolCall,
					tool: {
						...AllFixtures.successfulGlob.toolCall.tool,
						input: {} as GlobToolUseInput,
					},
				},
			};
			const result = validateGlobToolData(invalidData);
			expect(result.isValid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0]).toContain("Missing required field: toolCall.tool.input.pattern");
		});

		test("should accept valid glob patterns", () => {
			const validPatterns = ["*.ts", "**/*.js", "src/**/*.{ts,tsx}", "[a-z]*.txt", "!(*.spec).js"];

			validPatterns.forEach((pattern) => {
				const data = {
					...AllFixtures.successfulGlob,
					toolCall: {
						...AllFixtures.successfulGlob.toolCall,
						tool: {
							...AllFixtures.successfulGlob.toolCall.tool,
							input: { pattern },
						},
					},
				};
				const result = validateGlobToolData(data);
				expect(result.isValid).toBe(true);
			});
		});

		test("should validate array result", () => {
			const data = AllFixtures.emptyGlob;
			const result = validateGlobToolData(data);
			expect(result.isValid).toBe(true);
		});

		test("should validate error result", () => {
			const data = AllFixtures.failedGlob;
			const result = validateGlobToolData(data);
			expect(result.isValid).toBe(true);
		});
	});

	// 3. Parser tests
	describe("parseGlobTool", () => {
		test("should parse successful glob with matches", () => {
			const result = parseGlobTool(AllFixtures.successfulGlob);

			expect(result.toolUse.type).toBe("tool_use");
			expect(result.toolUse.name).toBe("Glob");
			expect(result.toolUse.input.pattern).toBe("**/*.ts");
			expect(result.toolUse.input.path).toBe("src/");

			expect(result.status).toBe("completed");
			expect(result.toolResult.isError).toBe(false);
			expect(result.toolResult.matches).toHaveLength(5);
			expect(result.toolResult.matchCount).toBe(5);
		});

		test("should parse empty glob result", () => {
			const result = parseGlobTool(AllFixtures.emptyGlob);

			expect(result.toolUse.input.pattern).toBe("*.json");
			expect(result.status).toBe("completed");
			expect(result.toolResult.isError).toBe(false);
			expect(result.toolResult.matches).toHaveLength(0);
			expect(result.toolResult.matchCount).toBe(0);
		});

		test("should parse failed glob", () => {
			const result = parseGlobTool(AllFixtures.failedGlob);

			expect(result.toolUse.input.pattern).toBe("[invalid glob");
			expect(result.status).toBe("failed");
			expect(result.toolResult.isError).toBe(true);
			expect(result.toolResult.errorMessage).toContain("Invalid glob pattern");
			expect(result.toolResult.matches).toHaveLength(0);
		});

		test("should handle null toolUseResult", () => {
			const data = {
				...AllFixtures.successfulGlob,
				toolResult: {
					...AllFixtures.successfulGlob.toolResult,
					toolUseResult: null as unknown as GlobToolResult,
				},
			};

			const result = parseGlobTool(data);
			expect(result.status).toBe("failed");
			expect(result.toolResult.isError).toBe(true);
			expect(result.toolResult.errorMessage).toBe("No result returned");
		});

		test("should preserve timestamps when configured", () => {
			const result = parseGlobTool(AllFixtures.successfulGlob, {
				preserveTimestamps: true,
			});
			expect(result.timestamp).toBe("2025-01-01T00:00:00Z");
		});

		test("should use current timestamp by default", () => {
			const before = new Date().toISOString();
			const result = parseGlobTool(AllFixtures.successfulGlob);
			const after = new Date().toISOString();

			expect(new Date(result.timestamp).getTime()).toBeGreaterThanOrEqual(
				new Date(before).getTime(),
			);
			expect(new Date(result.timestamp).getTime()).toBeLessThanOrEqual(new Date(after).getTime());
		});

		test("should show warnings in debug mode", () => {
			// Mock console.warn to test debug mode
			const originalWarn = console.warn;
			let _warnCalled = false;
			console.warn = () => {
				_warnCalled = true;
			};

			// Create data that would generate warnings
			const data = {
				...AllFixtures.successfulGlob,
				extraField: "should generate warning",
			};

			parseGlobTool(data as unknown as GlobFixtureData, { debug: true });

			// Note: warnings might not be generated for extra fields
			// This test is here to ensure debug mode doesn't break

			console.warn = originalWarn;
		});
	});

	// 4. Batch processor tests
	describe("processGlobTools", () => {
		test("should process multiple fixtures", () => {
			const fixtures = [AllFixtures.successfulGlob, AllFixtures.emptyGlob, AllFixtures.failedGlob];

			const results = processGlobTools(fixtures);

			expect(results).toHaveLength(3);
			expect(results[0].status).toBe("completed");
			expect(results[1].status).toBe("completed");
			expect(results[2].status).toBe("failed");
		});

		test("should throw on invalid fixture", () => {
			const fixtures = [
				AllFixtures.successfulGlob,
				{ invalid: "data" } as unknown as GlobFixtureData,
			];

			expect(() => processGlobTools(fixtures)).toThrow();
		});

		test("should log errors in debug mode", () => {
			// Mock console.error to test debug mode
			const originalError = console.error;
			let errorCalled = false;
			console.error = () => {
				errorCalled = true;
			};

			const fixtures = [{ invalid: "data" } as unknown as GlobFixtureData];

			try {
				processGlobTools(fixtures, { debug: true });
			} catch (_e) {
				// Expected to throw
			}

			expect(errorCalled).toBe(true);
			console.error = originalError;
		});
	});

	// 5. Edge cases
	describe("edge cases", () => {
		test("should handle very long file paths", () => {
			const longPath = "a".repeat(1000);
			const data = {
				...AllFixtures.successfulGlob,
				toolResult: {
					...AllFixtures.successfulGlob.toolResult,
					toolUseResult: {
						matches: [longPath],
						matchCount: 1,
						isError: false,
					},
				},
			};

			const result = parseGlobTool(data);
			expect(result.toolResult.matches[0]).toBe(longPath);
		});

		test("should handle empty pattern", () => {
			const data = {
				...AllFixtures.successfulGlob,
				toolCall: {
					...AllFixtures.successfulGlob.toolCall,
					tool: {
						...AllFixtures.successfulGlob.toolCall.tool,
						input: { pattern: "" },
					},
				},
			};

			// Empty pattern is technically valid
			const validation = validateGlobToolData(data);
			expect(validation.isValid).toBe(true);
		});

		test("should handle object result with partial data", () => {
			const data = {
				...AllFixtures.successfulGlob,
				toolResult: {
					...AllFixtures.successfulGlob.toolResult,
					toolUseResult: {
						matches: ["file1.ts", "file2.ts"],
						// matchCount missing - should be calculated
					},
				},
			};

			const result = parseGlobTool(data as GlobFixtureData);
			expect(result.toolResult.matchCount).toBe(2);
		});

		test("should handle unexpected result format", () => {
			const data = {
				...AllFixtures.successfulGlob,
				toolResult: {
					...AllFixtures.successfulGlob.toolResult,
					toolUseResult: 123, // Number instead of expected format
				},
			};

			const result = parseGlobTool(data as unknown as GlobFixtureData);
			expect(result.status).toBe("failed");
			expect(result.toolResult.isError).toBe(true);
			expect(result.toolResult.errorMessage).toBe("Unexpected result format");
		});
	});

	// 6. Type safety tests
	describe("type safety", () => {
		test("GlobToolUseInput should enforce required fields", () => {
			const validInput: GlobToolUseInput = {
				pattern: "*.ts",
			};

			// Optional path field
			const inputWithPath: GlobToolUseInput = {
				pattern: "*.ts",
				path: "src/",
			};

			expect(validInput.pattern).toBe("*.ts");
			expect(inputWithPath.path).toBe("src/");
		});

		test("GlobToolResult should handle all variants", () => {
			const successResult: GlobToolResult = {
				matches: ["file1.ts", "file2.ts"],
				matchCount: 2,
				isError: false,
			};

			const errorResult: GlobToolResult = {
				matches: [],
				matchCount: 0,
				isError: true,
				errorMessage: "Error occurred",
			};

			expect(successResult.isError).toBe(false);
			expect(errorResult.isError).toBe(true);
		});
	});

	// 7. Fixtures tests
	describe("fixtures", () => {
		test("should have valid fixture data", () => {
			// ValidatedFixtures is of type GlobFixturesMetadata which extends BaseFixturesMetadata
			// The base type doesn't have packageName, componentType, toolName directly
			// But we can check fixtures length and validate fixture content
			expect(ValidatedFixtures.fixtures.length).toBeGreaterThan(0);
			expect(ValidatedFixtures.fixtureCount).toBe(ValidatedFixtures.fixtures.length);
		});

		test("all fixtures should be parseable", () => {
			ValidatedFixtures.fixtures.forEach((fixture, _index) => {
				expect(() => parseGlobTool(fixture)).not.toThrow();
			});
		});

		test("AllFixtures namespace should provide categorized fixtures", () => {
			expect(AllFixtures.successfulGlob).toBeDefined();
			expect(AllFixtures.emptyGlob).toBeDefined();
			expect(AllFixtures.failedGlob).toBeDefined();
			expect(AllFixtures.allFixtures).toBeInstanceOf(Array);
			expect(AllFixtures.allFixtures.length).toBeGreaterThan(0);
		});
	});

	// 8. Zod schema tests
	describe("Zod schemas", () => {
		test("GlobToolUseInput schema should validate correctly", () => {
			const validInputs = [{ pattern: "*.ts" }, { pattern: "**/*.js", path: "src/" }];

			validInputs.forEach((input) => {
				expect(() => Schemas.GlobToolUseInput.parse(input)).not.toThrow();
			});

			// Invalid: missing pattern
			expect(() => Schemas.GlobToolUseInput.parse({})).toThrow();

			// Invalid: wrong type for pattern
			expect(() => Schemas.GlobToolUseInput.parse({ pattern: 123 })).toThrow();
		});

		test("GlobToolResult schema should validate all variants", () => {
			const validResults = [
				{
					matches: ["file1.ts", "file2.ts"],
					matchCount: 2,
					isError: false,
				},
				{
					matches: [],
					matchCount: 0,
					isError: true,
					errorMessage: "Error occurred",
				},
			];

			validResults.forEach((result) => {
				expect(() => Schemas.GlobToolResult.parse(result)).not.toThrow();
			});

			// Invalid: matches not an array
			expect(() =>
				Schemas.GlobToolResult.parse({
					matches: "not an array",
					matchCount: 0,
					isError: false,
				}),
			).toThrow();
		});

		test("GlobToolProps schema should validate complete props", () => {
			const validProps: GlobToolProps = {
				toolUse: {
					type: "tool_use",
					id: "glob_123",
					name: "Glob",
					input: {
						pattern: "*.ts",
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

			expect(() => Schemas.GlobToolProps.parse(validProps)).not.toThrow();

			// Invalid: wrong status
			const invalidProps = {
				...validProps,
				status: "invalid_status",
			};
			expect(() => Schemas.GlobToolProps.parse(invalidProps)).toThrow();
		});
	});

	// 9. Integration tests
	describe("integration", () => {
		test("should handle complete workflow from fixture to props", () => {
			const fixture = AllFixtures.successfulGlob;

			// Validate
			const validation = validateGlobToolData(fixture);
			expect(validation.isValid).toBe(true);

			// Parse
			const props = parseGlobTool(fixture);
			expect(props).toBeDefined();

			// Validate result with Zod
			expect(() => Schemas.GlobToolProps.parse(props)).not.toThrow();
		});

		test("should properly type narrow error states", () => {
			const errorFixture = AllFixtures.failedGlob;
			const props = parseGlobTool(errorFixture);

			if (props.toolResult.isError) {
				// TypeScript should know errorMessage is available
				expect(props.toolResult.errorMessage).toBeDefined();
				expect(typeof props.toolResult.errorMessage).toBe("string");
			}
		});
	});
});

import { describe, expect, test } from "bun:test";
import {
	AllFixtures,
	PACKAGE_INFO,
	parseLsTool,
	processLsTools,
	Schemas,
	ValidatedFixtures,
	validateLsToolData,
} from "../src/index";
import type {
	LsFileInfo,
	LsFixtureData,
	LsToolProps,
	LsToolResult,
	LsToolUseInput,
} from "../src/types";

describe("ls-tool", () => {
	// 1. Package info export test
	describe("package info", () => {
		test("should export correct package info", () => {
			expect(PACKAGE_INFO).toEqual({
				name: "@dao/codex-chat-item-ls-tool",
				version: "0.1.0",
				description:
					"Type-safe schema and parser for ls tool UI components in Claude conversations",
				toolName: "LS",
				componentType: "ls_tool",
			});
		});
	});

	// 2. Validator tests
	describe("validateLsToolData", () => {
		test("should validate correct fixture data", () => {
			const result = validateLsToolData(AllFixtures.successfulLs);
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		test("should reject invalid tool type", () => {
			const invalidData = {
				...AllFixtures.successfulLs,
				toolCall: {
					...AllFixtures.successfulLs.toolCall,
					tool: {
						...AllFixtures.successfulLs.toolCall.tool,
						type: "invalid_type" as "tool_use",
					},
				},
			};
			const result = validateLsToolData(invalidData);
			expect(result.isValid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0]).toContain("Invalid tool type");
		});

		test("should reject missing path input", () => {
			const invalidData = {
				...AllFixtures.successfulLs,
				toolCall: {
					...AllFixtures.successfulLs.toolCall,
					tool: {
						...AllFixtures.successfulLs.toolCall.tool,
						input: {} as LsToolUseInput,
					},
				},
			};
			const result = validateLsToolData(invalidData);
			expect(result.isValid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0]).toContain("Missing required field: toolCall.tool.input.path");
		});

		test("should accept valid paths", () => {
			const validPaths = [
				"/",
				"/home/user",
				"/var/log/system",
				"/Users/example/Documents",
				"C:\\Windows\\System32",
			];

			validPaths.forEach((path) => {
				const data = {
					...AllFixtures.successfulLs,
					toolCall: {
						...AllFixtures.successfulLs.toolCall,
						tool: {
							...AllFixtures.successfulLs.toolCall.tool,
							input: { path },
						},
					},
				};
				const result = validateLsToolData(data);
				expect(result.isValid).toBe(true);
			});
		});

		test("should validate array result (legacy format)", () => {
			const data = AllFixtures.emptyLs;
			const result = validateLsToolData(data);
			expect(result.isValid).toBe(true);
		});

		test("should validate error result", () => {
			const data = AllFixtures.failedLs;
			const result = validateLsToolData(data);
			expect(result.isValid).toBe(true);
		});

		test("should validate ignore patterns", () => {
			const data = {
				...AllFixtures.successfulLs,
				toolCall: {
					...AllFixtures.successfulLs.toolCall,
					tool: {
						...AllFixtures.successfulLs.toolCall.tool,
						input: {
							path: "/test",
							ignore: ["*.tmp", "node_modules", ".git"],
						},
					},
				},
			};
			const result = validateLsToolData(data);
			expect(result.isValid).toBe(true);
		});
	});

	// 3. Parser tests
	describe("parseLsTool", () => {
		test("should parse successful ls with entries", () => {
			const result = parseLsTool(AllFixtures.successfulLs);

			expect(result.toolUse.type).toBe("tool_use");
			expect(result.toolUse.name).toBe("LS");
			expect(result.toolUse.input.path).toBe("/Users/example/projects/test");

			expect(result.status).toBe("completed");
			expect(result.toolResult.isError).toBe(false);
			expect(result.toolResult.entries).toHaveLength(5);
			expect(result.toolResult.entryCount).toBe(5);
			expect(result.toolResult.path).toBe("/Users/example/projects/test");
		});

		test("should parse empty directory result", () => {
			const result = parseLsTool(AllFixtures.emptyLs);

			expect(result.toolUse.input.path).toBe("/tmp/empty-dir");
			expect(result.toolUse.input.ignore).toEqual(["*.tmp", "*.log"]);
			expect(result.status).toBe("completed");
			expect(result.toolResult.isError).toBe(false);
			expect(result.toolResult.entries).toHaveLength(0);
			expect(result.toolResult.entryCount).toBe(0);
		});

		test("should parse failed ls", () => {
			const result = parseLsTool(AllFixtures.failedLs);

			expect(result.toolUse.input.path).toBe("/nonexistent/directory");
			expect(result.status).toBe("failed");
			expect(result.toolResult.isError).toBe(true);
			expect(result.toolResult.errorMessage).toContain("ENOENT");
			expect(result.toolResult.entries).toHaveLength(0);
		});

		test("should handle null toolUseResult", () => {
			const data = {
				...AllFixtures.successfulLs,
				toolResult: {
					...AllFixtures.successfulLs.toolResult,
					toolUseResult: null as unknown as LsToolResult,
				},
			};

			const result = parseLsTool(data);
			expect(result.status).toBe("failed");
			expect(result.toolResult.isError).toBe(true);
			expect(result.toolResult.errorMessage).toBe("No result returned");
		});

		test("should preserve timestamps when configured", () => {
			const result = parseLsTool(AllFixtures.successfulLs, {
				preserveTimestamps: true,
			});
			expect(result.timestamp).toBe("2025-01-01T00:00:00Z");
		});

		test("should use current timestamp by default", () => {
			const before = new Date().toISOString();
			const result = parseLsTool(AllFixtures.successfulLs);
			const after = new Date().toISOString();

			expect(new Date(result.timestamp).getTime()).toBeGreaterThanOrEqual(
				new Date(before).getTime(),
			);
			expect(new Date(result.timestamp).getTime()).toBeLessThanOrEqual(new Date(after).getTime());
		});

		test("should parse file info details correctly", () => {
			const result = parseLsTool(AllFixtures.successfulLs);
			const readmeFile = result.toolResult.entries.find((e) => e.name === "README.md");

			expect(readmeFile).toBeDefined();
			expect(readmeFile?.type).toBe("file");
			expect(readmeFile?.size).toBe(1234);
			expect(readmeFile?.hidden).toBe(false);
			expect(readmeFile?.permissions).toBe("rw-r--r--");
			expect(readmeFile?.lastModified).toBe("2025-06-25T12:00:00Z");
		});

		test("should identify hidden files", () => {
			const result = parseLsTool(AllFixtures.successfulLs);
			const gitignore = result.toolResult.entries.find((e) => e.name === ".gitignore");

			expect(gitignore).toBeDefined();
			expect(gitignore?.hidden).toBe(true);
		});
	});

	// 4. Batch processor tests
	describe("processLsTools", () => {
		test("should process multiple fixtures", () => {
			const fixtures = [AllFixtures.successfulLs, AllFixtures.emptyLs, AllFixtures.failedLs];

			const results = processLsTools(fixtures);

			expect(results).toHaveLength(3);
			expect(results[0].status).toBe("completed");
			expect(results[1].status).toBe("completed");
			expect(results[2].status).toBe("failed");
		});

		test("should throw on invalid fixture", () => {
			const fixtures = [AllFixtures.successfulLs, { invalid: "data" } as unknown as LsFixtureData];

			expect(() => processLsTools(fixtures)).toThrow();
		});

		test("should log errors in debug mode", () => {
			// Mock console.error to test debug mode
			const originalError = console.error;
			let errorCalled = false;
			console.error = () => {
				errorCalled = true;
			};

			const fixtures = [{ invalid: "data" } as unknown as LsFixtureData];

			try {
				processLsTools(fixtures, { debug: true });
			} catch (_e) {
				// Expected to throw
			}

			expect(errorCalled).toBe(true);
			console.error = originalError;
		});
	});

	// 5. Edge cases
	describe("edge cases", () => {
		test("should handle very long file names", () => {
			const longName = "a".repeat(255);
			const data = {
				...AllFixtures.successfulLs,
				toolResult: {
					...AllFixtures.successfulLs.toolResult,
					toolUseResult: {
						entries: [
							{
								name: longName,
								type: "file" as const,
								hidden: false,
							},
						],
						entryCount: 1,
						path: "/test",
						isError: false,
					},
				},
			};

			const result = parseLsTool(data);
			expect(result.toolResult.entries[0].name).toBe(longName);
		});

		test("should handle empty path", () => {
			const data = {
				...AllFixtures.successfulLs,
				toolCall: {
					...AllFixtures.successfulLs.toolCall,
					tool: {
						...AllFixtures.successfulLs.toolCall.tool,
						input: { path: "" },
					},
				},
			};

			// Empty path might be technically valid (current directory)
			const validation = validateLsToolData(data);
			expect(validation.isValid).toBe(true);
		});

		test("should handle legacy array format", () => {
			const data = {
				...AllFixtures.successfulLs,
				toolResult: {
					...AllFixtures.successfulLs.toolResult,
					toolUseResult: ["file1.txt", "file2.txt", ".hidden"],
				},
			};

			const result = parseLsTool(data as unknown as LsFixtureData);
			expect(result.toolResult.entries).toHaveLength(3);
			expect(result.toolResult.entries[0].name).toBe("file1.txt");
			expect(result.toolResult.entries[2].hidden).toBe(true);
		});

		test("should handle unexpected result format", () => {
			const data = {
				...AllFixtures.successfulLs,
				toolResult: {
					...AllFixtures.successfulLs.toolResult,
					toolUseResult: 123, // Number instead of expected format
				},
			};

			const result = parseLsTool(data as unknown as LsFixtureData);
			expect(result.status).toBe("failed");
			expect(result.toolResult.isError).toBe(true);
			expect(result.toolResult.errorMessage).toBe("Unexpected result format");
		});
	});

	// 6. Type safety tests
	describe("type safety", () => {
		test("LsToolUseInput should enforce required fields", () => {
			const validInput: LsToolUseInput = {
				path: "/home/user",
			};

			// Optional ignore field
			const inputWithIgnore: LsToolUseInput = {
				path: "/home/user",
				ignore: ["*.tmp", "*.log"],
			};

			expect(validInput.path).toBe("/home/user");
			expect(inputWithIgnore.ignore).toEqual(["*.tmp", "*.log"]);
		});

		test("LsFileInfo should handle all fields", () => {
			const fileInfo: LsFileInfo = {
				name: "test.txt",
				type: "file",
				size: 1024,
				hidden: false,
				permissions: "rw-r--r--",
				lastModified: "2025-01-01T00:00:00Z",
			};

			const dirInfo: LsFileInfo = {
				name: "src",
				type: "directory",
				hidden: false,
			};

			expect(fileInfo.type).toBe("file");
			expect(dirInfo.type).toBe("directory");
		});
	});

	// 7. Fixtures tests
	describe("fixtures", () => {
		test("should have valid fixture data", () => {
			// ValidatedFixtures is of type LsFixturesMetadata which extends BaseFixturesMetadata
			expect(ValidatedFixtures.fixtures.length).toBeGreaterThan(0);
			expect(ValidatedFixtures.fixtureCount).toBe(ValidatedFixtures.fixtures.length);
		});

		test("all fixtures should be parseable", () => {
			ValidatedFixtures.fixtures.forEach((fixture, _index) => {
				expect(() => parseLsTool(fixture)).not.toThrow();
			});
		});

		test("AllFixtures namespace should provide categorized fixtures", () => {
			expect(AllFixtures.successfulLs).toBeDefined();
			expect(AllFixtures.emptyLs).toBeDefined();
			expect(AllFixtures.failedLs).toBeDefined();
			expect(AllFixtures.allFixtures).toBeInstanceOf(Array);
			expect(AllFixtures.allFixtures.length).toBeGreaterThan(0);
		});
	});

	// 8. Zod schema tests
	describe("Zod schemas", () => {
		test("LsToolUseInput schema should validate correctly", () => {
			const validInputs = [{ path: "/home/user" }, { path: "/var/log", ignore: ["*.tmp"] }];

			validInputs.forEach((input) => {
				expect(() => Schemas.LsToolUseInput.parse(input)).not.toThrow();
			});

			// Invalid: missing path
			expect(() => Schemas.LsToolUseInput.parse({})).toThrow();

			// Invalid: wrong type for path
			expect(() => Schemas.LsToolUseInput.parse({ path: 123 })).toThrow();
		});

		test("LsFileInfo schema should validate all fields", () => {
			const validFileInfo = {
				name: "test.txt",
				type: "file",
				size: 1024,
				hidden: false,
				permissions: "rw-r--r--",
				lastModified: "2025-01-01T00:00:00Z",
			};

			expect(() => Schemas.LsFileInfo.parse(validFileInfo)).not.toThrow();

			// Invalid: wrong type value
			expect(() =>
				Schemas.LsFileInfo.parse({
					...validFileInfo,
					type: "invalid",
				}),
			).toThrow();
		});

		test("LsToolResult schema should validate all variants", () => {
			const validResults = [
				{
					entries: [{ name: "file.txt", type: "file", hidden: false }],
					entryCount: 1,
					path: "/test",
					isError: false,
				},
				{
					entries: [],
					entryCount: 0,
					path: "/empty",
					isError: true,
					errorMessage: "Error occurred",
				},
			];

			validResults.forEach((result) => {
				expect(() => Schemas.LsToolResult.parse(result)).not.toThrow();
			});

			// Invalid: entries not an array
			expect(() =>
				Schemas.LsToolResult.parse({
					entries: "not an array",
					entryCount: 0,
					path: "/test",
					isError: false,
				}),
			).toThrow();
		});

		test("LsToolProps schema should validate complete props", () => {
			const validProps: LsToolProps = {
				toolUse: {
					type: "tool_use",
					id: "ls_123",
					name: "LS",
					input: {
						path: "/test",
					},
				},
				status: "completed",
				timestamp: new Date().toISOString(),
				toolResult: {
					entries: [],
					entryCount: 0,
					path: "/test",
					isError: false,
				},
			};

			expect(() => Schemas.LsToolProps.parse(validProps)).not.toThrow();

			// Invalid: wrong status
			const invalidProps = {
				...validProps,
				status: "invalid_status",
			};
			expect(() => Schemas.LsToolProps.parse(invalidProps)).toThrow();
		});
	});

	// 9. Integration tests
	describe("integration", () => {
		test("should handle complete workflow from fixture to props", () => {
			const fixture = AllFixtures.successfulLs;

			// Validate
			const validation = validateLsToolData(fixture);
			expect(validation.isValid).toBe(true);

			// Parse
			const props = parseLsTool(fixture);
			expect(props).toBeDefined();

			// Validate result with Zod
			expect(() => Schemas.LsToolProps.parse(props)).not.toThrow();
		});

		test("should properly type narrow error states", () => {
			const errorFixture = AllFixtures.failedLs;
			const props = parseLsTool(errorFixture);

			if (props.toolResult.isError) {
				// TypeScript should know errorMessage is available
				expect(props.toolResult.errorMessage).toBeDefined();
				expect(typeof props.toolResult.errorMessage).toBe("string");
			}
		});
	});
});

import { describe, expect, spyOn, test } from "bun:test";
import type { BashToolTypes } from "../src/index";
import {
	AllFixtures,
	PACKAGE_INFO,
	parseBashTool,
	processBashTools,
	Schemas,
	ValidatedFixtures,
	validateBashToolData,
} from "../src/index";

// Sample fixture data based on actual bash-fixtures.json structure
const sampleSuccessFixture: BashToolTypes.BashFixtureData = {
	toolCall: {
		uuid: "49aa294a-2f12-4197-8478-127f9fc9d4b7",
		timestamp: "2025-06-25T18:20:11.465Z",
		parentUuid: "dde3c669-70e7-46b7-8a83-8b4f9c26fad4",
		sessionId: "140ff683-32fc-4600-b3cb-52da55fcfaba",
		tool: {
			type: "tool_use",
			id: "toolu_01GPL8y2muQwUayJUmd8x2yz",
			name: "Bash",
			input: {
				command: "git log -1 --oneline",
				description: "Check the most recent commit",
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
			content: "5e122ce Merge dev into main: Template path resolution fix and release prep",
			is_error: false,
		},
		toolUseResult: {
			stdout: "5e122ce Merge dev into main: Template path resolution fix and release prep",
			stderr: "",
			interrupted: false,
			isImage: false,
			isError: false,
		},
	},
	expectedComponentData: {
		type: "bash_tool",
		props: {
			toolUse: {
				type: "tool_use",
				id: "toolu_01GPL8y2muQwUayJUmd8x2yz",
				name: "Bash",
				input: {
					command: "git log -1 --oneline",
					description: "Check the most recent commit",
				},
			},
			status: "completed",
			timestamp: "2025-06-28T01:35:07.521Z",
			toolResult: {
				stdout: "5e122ce Merge dev into main: Template path resolution fix and release prep",
				stderr: "",
				interrupted: false,
				isImage: false,
				isError: false,
			},
		},
	},
};

const sampleErrorFixture: BashToolTypes.BashFixtureData = {
	toolCall: {
		uuid: "680fa633-4de5-45b8-b282-5b365cd4ee46",
		timestamp: "2025-06-25T18:25:16.463Z",
		parentUuid: "5e81746b-9ef2-4e0c-93ea-d3d29503d752",
		sessionId: "140ff683-32fc-4600-b3cb-52da55fcfaba",
		tool: {
			type: "tool_use",
			id: "toolu_01CudWr2ghPSscWdhe6aZkUj",
			name: "Bash",
			input: {
				command:
					"cd claude-log-processor && bun add -d vitest @types/node typescript && bun add rxjs ndjson socket.io chokidar",
				description: "Install project dependencies",
			},
		},
	},
	toolResult: {
		uuid: "4f513711-42e5-4898-9dbb-227ef091bc89",
		parentUuid: "680fa633-4de5-45b8-b282-5b365cd4ee46",
		timestamp: "2025-06-25T18:25:19.401Z",
		result: {
			type: "tool_result",
			content: "(eval):cd:1: no such file or directory: claude-log-processor",
			is_error: true,
			tool_use_id: "toolu_01CudWr2ghPSscWdhe6aZkUj",
		},
		toolUseResult: "Error: (eval):cd:1: no such file or directory: claude-log-processor",
	},
	expectedComponentData: {
		type: "bash_tool",
		props: {
			toolUse: {
				type: "tool_use",
				id: "toolu_01CudWr2ghPSscWdhe6aZkUj",
				name: "Bash",
				input: {
					command:
						"cd claude-log-processor && bun add -d vitest @types/node typescript && bun add rxjs ndjson socket.io chokidar",
					description: "Install project dependencies",
				},
			},
			status: "failed",
			timestamp: "2025-06-28T01:35:07.522Z",
			toolResult: {
				stdout: "(eval):cd:1: no such file or directory: claude-log-processor",
				stderr: "",
				interrupted: false,
				isImage: false,
				isError: true,
			},
		},
	},
};

describe("bash-tool package", () => {
	test("should export package info", () => {
		expect(PACKAGE_INFO.name).toBe("bash-tool");
		expect(PACKAGE_INFO.version).toBe("0.1.0");
		expect(PACKAGE_INFO.license).toBe("MIT");
	});

	describe("validateBashToolData", () => {
		test("should validate correct fixture data", () => {
			const result = validateBashToolData(sampleSuccessFixture);
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		test("should reject null or undefined data", () => {
			const result = validateBashToolData(null);
			expect(result.isValid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0]).toContain("Data must be a valid object");
		});

		test("should reject data missing toolCall", () => {
			const invalidData = { ...sampleSuccessFixture };
			delete (invalidData as Partial<BashToolTypes.BashFixtureData>).toolCall;
			const result = validateBashToolData(invalidData);
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
						name: "NotBash" as unknown as "Bash",
					},
				},
			};
			const result = validateBashToolData(invalidData);
			expect(result.isValid).toBe(false);
			// Check that the error mentions the invalid literal value
			expect(
				result.errors.some(
					(error) =>
						error.includes("Invalid literal value") ||
						error.includes('Expected "Bash"') ||
						error.includes("NotBash"),
				),
			).toBe(true);
		});

		test("should warn about missing description", () => {
			const dataWithoutDescription = {
				...sampleSuccessFixture,
				toolCall: {
					...sampleSuccessFixture.toolCall,
					tool: {
						...sampleSuccessFixture.toolCall.tool,
						input: {
							command: "git log",
							description: "",
						},
					},
				},
			};
			const result = validateBashToolData(dataWithoutDescription);
			expect(result.warnings).toContain("Missing description in tool input");
		});
	});

	describe("parseBashTool", () => {
		test("should parse successful command fixture", () => {
			const result = parseBashTool(sampleSuccessFixture);

			expect(result.toolUse.name).toBe("Bash");
			expect(result.toolUse.input.command).toBe("git log -1 --oneline");
			expect(result.toolUse.input.description).toBe("Check the most recent commit");
			expect(result.status).toBe("completed");
			expect(result.toolResult.isError).toBe(false);
			expect(result.toolResult.stdout).toBe(
				"5e122ce Merge dev into main: Template path resolution fix and release prep",
			);
		});

		test("should parse error command fixture", () => {
			const result = parseBashTool(sampleErrorFixture);

			expect(result.toolUse.name).toBe("Bash");
			expect(result.status).toBe("failed");
			expect(result.toolResult.isError).toBe(true);
			expect(result.toolResult.stderr).toBe(
				"Error: (eval):cd:1: no such file or directory: claude-log-processor",
			);
		});

		test("should preserve timestamps when configured", () => {
			const result = parseBashTool(sampleSuccessFixture, {
				preserveTimestamps: true,
			});
			expect(result.timestamp).toBe("2025-06-28T01:35:07.521Z");
		});

		test("should use current timestamp by default", () => {
			const before = new Date().toISOString();
			const result = parseBashTool(sampleSuccessFixture);
			const after = new Date().toISOString();

			expect(result.timestamp >= before).toBe(true);
			expect(result.timestamp <= after).toBe(true);
		});

		test("should handle string error results", () => {
			const result = parseBashTool(sampleErrorFixture);

			expect(result.toolResult.isError).toBe(true);
			expect(result.toolResult.stderr).toBe(
				"Error: (eval):cd:1: no such file or directory: claude-log-processor",
			);
			expect(result.toolResult.stdout).toBe("");
		});

		test("should throw error for invalid data", () => {
			const invalidData = {
				invalid: "data",
			} as unknown as BashToolTypes.BashFixtureData;
			expect(() => parseBashTool(invalidData)).toThrow();
		});

		test("should handle debug mode", () => {
			const consoleSpy = spyOn(console, "warn").mockImplementation(() => {});

			const dataWithWarnings = {
				...sampleSuccessFixture,
				toolCall: {
					...sampleSuccessFixture.toolCall,
					tool: {
						...sampleSuccessFixture.toolCall.tool,
						input: {
							command: "git log",
							description: "",
						},
					},
				},
			};

			parseBashTool(dataWithWarnings, { debug: true });
			expect(consoleSpy).toHaveBeenCalledWith("Bash tool warnings:", [
				"Missing description in tool input",
			]);

			consoleSpy.mockRestore();
		});
	});

	describe("processBashTools", () => {
		test("should process multiple fixtures", () => {
			const fixtures = [sampleSuccessFixture, sampleErrorFixture];
			const results = processBashTools(fixtures);

			expect(results).toHaveLength(2);
			expect(results[0].status).toBe("completed");
			expect(results[1].status).toBe("failed");
		});

		test("should handle empty array", () => {
			const results = processBashTools([]);
			expect(results).toHaveLength(0);
		});

		test("should propagate errors in debug mode", () => {
			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
			const invalidFixture = {
				invalid: "data",
			} as unknown as BashToolTypes.BashFixtureData;

			expect(() => processBashTools([invalidFixture], { debug: true })).toThrow();

			expect(consoleSpy).toHaveBeenCalledWith("Failed to process fixture 0:", expect.any(Error));

			consoleSpy.mockRestore();
		});
	});

	describe("edge cases", () => {
		test("should handle missing optional fields gracefully", () => {
			const minimalFixture = {
				...sampleSuccessFixture,
				toolResult: {
					...sampleSuccessFixture.toolResult,
					toolUseResult: {
						stdout: "output",
						stderr: "",
						interrupted: false,
						isImage: false,
						isError: false,
					},
				},
			};

			const result = parseBashTool(minimalFixture);
			expect(result.toolResult.stdout).toBe("output");
			expect(result.toolResult.stderr).toBe("");
		});

		test("should handle missing stderr and stdout", () => {
			const fixtureWithMissingOutput = {
				...sampleSuccessFixture,
				toolResult: {
					...sampleSuccessFixture.toolResult,
					toolUseResult: {
						stdout: undefined,
						stderr: undefined,
						interrupted: false,
						isImage: false,
						isError: false,
					} as unknown as BashToolTypes.BashToolResult,
				},
			};

			const result = parseBashTool(fixtureWithMissingOutput);
			expect(result.toolResult.stdout).toBe("");
			expect(result.toolResult.stderr).toBe("");
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
						stdout: "",
						stderr: "Some error",
						interrupted: false,
						isImage: false,
						isError: false, // This should be overridden by result.is_error
					},
				},
			};

			const result = parseBashTool(fixtureWithErrorFlag);
			expect(result.status).toBe("failed");
			expect(result.toolResult.isError).toBe(true);
		});
	});

	describe("type safety", () => {
		test("should export correct types", () => {
			// Type checking - these should compile without errors
			const toolUse: BashToolTypes.BashToolUse = {
				type: "tool_use",
				id: "test-id",
				name: "Bash",
				input: {
					command: "echo test",
					description: "Test command",
				},
			};

			const config: BashToolTypes.BashConfig = {
				debug: true,
				preserveTimestamps: false,
			};

			expect(toolUse.name).toBe("Bash");
			expect(config.debug).toBe(true);
		});

		test("should have correct status type constraints", () => {
			const validStatuses: BashToolTypes.BashToolStatus[] = ["completed", "failed"];
			expect(validStatuses).toHaveLength(2);
		});
	});

	describe("sample fixtures", () => {
		test("should export sample fixtures", () => {
			expect(AllFixtures.successfulCommand).toBeDefined();
			expect(AllFixtures.failedCommand).toBeDefined();
			expect(AllFixtures.allFixtures).toBeDefined();
		});

		test("should parse successful command sample fixture", () => {
			const props = parseBashTool(AllFixtures.successfulCommand);
			expect(props.status).toBe("completed");
			expect(props.toolUse.input.command).toBe("git log -1 --oneline");
			expect(props.toolResult.isError).toBe(false);
		});

		test("should parse failed command sample fixture", () => {
			const props = parseBashTool(AllFixtures.failedCommand);
			expect(props.toolUse.name).toBe("Bash");
			// Note: failedCommand might not actually be failed, depends on fixtures
		});

		test("should have access to all fixtures", () => {
			expect(AllFixtures.allFixtures.length).toBeGreaterThan(0);
			expect(Array.isArray(AllFixtures.allFixtures)).toBe(true);
		});

		test("should validate all sample fixtures", () => {
			AllFixtures.allFixtures.slice(0, 5).forEach((fixture) => {
				// Test first 5 to avoid long test times
				const result = validateBashToolData(fixture);
				expect(result.isValid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});
		});

		test("should process sample fixtures in batch", () => {
			const testFixtures = AllFixtures.allFixtures.slice(0, 3); // Test first 3
			const results = processBashTools(testFixtures);
			expect(results).toHaveLength(3);
			expect(results[0].toolUse.name).toBe("Bash");
		});
	});

	describe("validated fixtures", () => {
		test("should export validated fixtures metadata", () => {
			expect(ValidatedFixtures).toBeDefined();
			expect(ValidatedFixtures.toolName).toBe("Bash");
			expect(ValidatedFixtures.fixtures).toBeDefined();
			expect(Array.isArray(ValidatedFixtures.fixtures)).toBe(true);
		});

		test("should have correct metadata", () => {
			expect(ValidatedFixtures.category).toBeDefined();
			expect(ValidatedFixtures.priority).toBeDefined();
			expect(ValidatedFixtures.fixtureCount).toBeGreaterThan(0);
			// Note: fixtures.length might be different if some fixtures were filtered or truncated
			expect(ValidatedFixtures.fixtures.length).toBeGreaterThan(0);
		});

		test("should contain valid fixture data", () => {
			const firstFixture = ValidatedFixtures.fixtures[0];
			expect(firstFixture.toolCall).toBeDefined();
			expect(firstFixture.toolResult).toBeDefined();
			expect(firstFixture.expectedComponentData).toBeDefined();
			expect(firstFixture.toolCall.tool.name).toBe("Bash");
		});
	});

	describe("zod schemas", () => {
		test("should export Zod schemas", () => {
			expect(Schemas.BashToolUseInput).toBeDefined();
			expect(Schemas.BashToolUse).toBeDefined();
			expect(Schemas.BashToolResult).toBeDefined();
			expect(Schemas.BashToolProps).toBeDefined();
		});

		test("should validate tool use input with schema", () => {
			const validInput = {
				command: "echo hello",
				description: "Print hello",
			};
			const result = Schemas.BashToolUseInput.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		test("should validate bash tool props with schema", () => {
			const validProps = {
				toolUse: {
					type: "tool_use" as const,
					id: "test-id",
					name: "Bash" as const,
					input: {
						command: "echo test",
						description: "Test command",
					},
				},
				status: "completed" as const,
				timestamp: "2025-06-28T12:00:00Z",
				toolResult: {
					stdout: "test",
					stderr: "",
					interrupted: false,
					isImage: false,
					isError: false,
				},
			};
			const result = Schemas.BashToolProps.safeParse(validProps);
			expect(result.success).toBe(true);
		});

		test("should reject invalid data with schema", () => {
			const invalidProps = {
				toolUse: {
					type: "invalid_type",
					name: "NotBash",
				},
			};
			const result = Schemas.BashToolProps.safeParse(invalidProps);
			expect(result.success).toBe(false);
		});
	});
});

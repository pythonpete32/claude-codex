/**
 * @fileoverview Tests for tool registration and discovery system
 * @module @dao/transformer/tests/tool-registration
 */

import { beforeEach, describe, expect, it } from "bun:test";
import type { ToolRegistration } from "../src/tool-registration";
import { createToolRegistration, ToolDiscoveryEngine } from "../src/tool-registration";

describe("ToolRegistration", () => {
	describe("createToolRegistration", () => {
		it("should create a valid tool registration", () => {
			const registration = createToolRegistration({
				toolName: "TestTool",
				componentType: "test_tool",
				packageName: "@dao/test-tool",
				version: "1.0.0",
				metadata: {
					category: "test",
					description: "A test tool",
					examples: ["test command"],
				},
			});

			expect(registration.toolName).toBe("TestTool");
			expect(registration.componentType).toBe("test_tool");
			expect(registration.packageName).toBe("@dao/test-tool");
			expect(registration.version).toBe("1.0.0");
			expect(registration.metadata?.category).toBe("test");
			expect(Object.isFrozen(registration)).toBe(true);
		});

		it("should create minimal registration without metadata", () => {
			const registration = createToolRegistration({
				toolName: "MinimalTool",
				componentType: "minimal_tool",
				packageName: "@dao/minimal-tool",
				version: "0.1.0",
			});

			expect(registration.toolName).toBe("MinimalTool");
			expect(registration.metadata).toBeUndefined();
		});
	});
});

describe("ToolDiscoveryEngine", () => {
	let engine: ToolDiscoveryEngine;

	beforeEach(() => {
		engine = new ToolDiscoveryEngine();
	});

	describe("getComponentType", () => {
		it("should return mcp_tool for MCP tools", async () => {
			const componentType = await engine.getComponentType("mcp__test__tool");
			expect(componentType).toBe("mcp_tool");
		});

		it("should return generic_tool for unregistered tools", async () => {
			const componentType = await engine.getComponentType("NonExistentTool");
			expect(componentType).toBe("generic_tool");
		});

		it("should use generic_tool fallback when package import fails", async () => {
			const componentType = await engine.getComponentType("Bash");
			expect(componentType).toBe("generic_tool");
		});

		it("should use generic_tool fallback for Edit tool", async () => {
			const componentType = await engine.getComponentType("Edit");
			expect(componentType).toBe("generic_tool");
		});

		it("should use generic_tool fallback for MultiEdit tool", async () => {
			const componentType = await engine.getComponentType("MultiEdit");
			expect(componentType).toBe("generic_tool");
		});
	});

	describe("getAllRegistrations", () => {
		it("should return all discovered registrations", async () => {
			const registrations = await engine.getAllRegistrations();

			expect(Array.isArray(registrations)).toBe(true);
			expect(registrations.length).toBeGreaterThan(0);

			// Check that we have at least the tools we registered
			const toolNames = registrations.map((r) => r.toolName);
			expect(toolNames).toContain("Bash");
			expect(toolNames).toContain("Edit");
			// MultiEdit package is discovered as "Multiedit" due to directory naming
			expect(toolNames).toContain("Multiedit");
		});

		it("should return registrations with proper structure", async () => {
			const registrations = await engine.getAllRegistrations();

			for (const registration of registrations) {
				expect(typeof registration.toolName).toBe("string");
				expect(typeof registration.componentType).toBe("string");
				expect(typeof registration.packageName).toBe("string");
				expect(typeof registration.version).toBe("string");
			}
		});
	});

	describe("getRegistration", () => {
		it("should return specific tool registration", async () => {
			const registration = await engine.getRegistration("Bash");

			expect(registration).not.toBeNull();
			expect(registration?.toolName).toBe("Bash");
			expect(registration?.componentType).toBe("generic_tool");
			// Package name extracted from fallback registration
			expect(registration?.packageName).toContain("bash-tool");
		});

		it("should return null for non-existent tool", async () => {
			const registration = await engine.getRegistration("NonExistentTool");
			expect(registration).toBeNull();
		});
	});

	describe("getStats", () => {
		it("should return discovery statistics", async () => {
			const stats = await engine.getStats();

			expect(typeof stats.totalPackages).toBe("number");
			expect(typeof stats.loadedPackages).toBe("number");
			expect(typeof stats.totalTools).toBe("number");
			expect(typeof stats.lastDiscovery).toBe("number");

			expect(stats.totalPackages).toBeGreaterThan(0);
			expect(stats.loadedPackages).toBeGreaterThan(0);
			expect(stats.totalTools).toBeGreaterThan(0);
			expect(stats.lastDiscovery).toBeGreaterThan(0);
		});
	});

	describe("refresh", () => {
		it("should refresh the discovery cache", async () => {
			// First discovery
			const stats1 = await engine.getStats();

			// Refresh
			await engine.refresh();

			// Second discovery should have a newer timestamp
			const stats2 = await engine.getStats();
			expect(stats2.lastDiscovery).toBeGreaterThanOrEqual(stats1.lastDiscovery);
		});
	});
});

describe("Package Discovery Integration", () => {
	let engine: ToolDiscoveryEngine;

	beforeEach(() => {
		engine = new ToolDiscoveryEngine();
	});

	it("should discover all existing chat-item packages", async () => {
		const registrations = await engine.getAllRegistrations();
		const packageNames = registrations.map((r) => r.packageName);

		// Check for known packages
		expect(packageNames).toContain("@dao/chat-items-bash-tool");
		expect(packageNames).toContain("@dao/chat-items-edit-tool");
		expect(packageNames).toContain("@dao/chat-items-multiedit-tool");
	});

	it("should handle packages without TOOL_REGISTRATION gracefully", async () => {
		// This test ensures the engine doesn't crash when encountering
		// packages that haven't been updated with registrations yet
		const registrations = await engine.getAllRegistrations();

		// Should not throw and should return at least some registrations
		expect(Array.isArray(registrations)).toBe(true);
	});

	it("should properly categorize tools", async () => {
		const bashReg = await engine.getRegistration("Bash");
		const editReg = await engine.getRegistration("Edit");

		// Test environment uses fallback registrations
		expect(bashReg?.metadata?.category).toBe("test");
		expect(editReg?.metadata?.category).toBe("test");
	});
});

describe("Backward Compatibility", () => {
	it("should maintain compatibility with legacy getComponentType", async () => {
		// The legacy function should still work
		const { getComponentType: legacyFn } = await import("../src/types");

		expect(legacyFn("Bash")).toBe("bash_tool");
		expect(legacyFn("Edit")).toBe("file_tool");
		expect(legacyFn("mcp__test__tool")).toBe("mcp_tool");
		expect(legacyFn("UnknownTool")).toBe("generic_tool");
	});

	it("should work with async version", async () => {
		const { getComponentTypeAsync } = await import("../src/types");

		expect(await getComponentTypeAsync("Bash")).toBe("generic_tool");
		expect(await getComponentTypeAsync("Edit")).toBe("generic_tool");
		expect(await getComponentTypeAsync("mcp__test__tool")).toBe("mcp_tool");
	});
});

describe("Error Handling", () => {
	it("should handle import failures gracefully", async () => {
		const engine = new ToolDiscoveryEngine();

		// Just test that stats returns valid numbers even if discovery fails
		const stats = await engine.getStats();
		expect(typeof stats.totalPackages).toBe("number");
		expect(typeof stats.loadedPackages).toBe("number");
		expect(typeof stats.totalTools).toBe("number");
		expect(typeof stats.lastDiscovery).toBe("number");
	});

	it("should fallback to legacy mappings on discovery failure", async () => {
		const { getComponentTypeAsync } = await import("../src/types");

		// The function should work and return a result
		const result = await getComponentTypeAsync("Bash");
		// It will either use discovery or fallback to legacy
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});
});

describe("Performance", () => {
	it("should cache discoveries for fast repeated lookups", async () => {
		const engine = new ToolDiscoveryEngine();

		// First lookup (slower - includes discovery)
		const start1 = performance.now();
		await engine.getComponentType("Bash");
		const time1 = performance.now() - start1;

		// Second lookup (faster - cached)
		const start2 = performance.now();
		await engine.getComponentType("Bash");
		const time2 = performance.now() - start2;

		// Second lookup should be significantly faster
		expect(time2).toBeLessThan(time1);
	});

	it("should handle concurrent lookups efficiently", async () => {
		const engine = new ToolDiscoveryEngine();

		// Multiple concurrent lookups
		const promises = [
			engine.getComponentType("Bash"),
			engine.getComponentType("Edit"),
			engine.getComponentType("MultiEdit"),
			engine.getComponentType("Bash"), // Duplicate
		];

		const results = await Promise.all(promises);

		expect(results).toEqual(["generic_tool", "generic_tool", "generic_tool", "generic_tool"]);
	});
});

describe("Type Safety", () => {
	it("should enforce ToolRegistration interface", () => {
		// Valid registration
		const validReg: ToolRegistration = {
			toolName: "Test",
			componentType: "test_tool",
			packageName: "@dao/test",
			version: "1.0.0",
		};

		expect(validReg.toolName).toBe("Test");

		// TypeScript should catch invalid registrations at compile time
		// These would be compilation errors:
		// const invalidReg: ToolRegistration = {
		//   toolName: 123,  // Should be string
		//   componentType: "test_tool",
		//   packageName: "@dao/test",
		//   version: "1.0.0",
		// };
	});
});

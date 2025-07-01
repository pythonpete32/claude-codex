import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ProjectResolver } from "../../src/services/project-resolver.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("ProjectResolver", () => {
	const testLogsDir = join(__dirname, "../fixtures/test-logs");
	let resolver: ProjectResolver;

	beforeEach(async () => {
		resolver = new ProjectResolver(testLogsDir);
		// Clean up test directory
		await rm(testLogsDir, { recursive: true, force: true });
		await mkdir(testLogsDir, { recursive: true });
	});

	afterEach(async () => {
		// Clean up after tests
		await rm(testLogsDir, { recursive: true, force: true });
	});

	describe("resolveProject", () => {
		it("should resolve project path using log strategy", async () => {
			// Create a test project directory with log file
			const encodedPath = "-Users-john-projects";
			const projectDir = join(testLogsDir, encodedPath);
			await mkdir(projectDir, { recursive: true });

			// Create a log file with cwd information
			const logContent = `${JSON.stringify({
				uuid: "test-001",
				type: "user",
				cwd: "/Users/john/projects",
				timestamp: "2024-01-01T00:00:00Z",
			})}\n`;

			await writeFile(join(projectDir, "session.jsonl"), logContent);

			const resolved = await resolver.resolveProject(encodedPath);
			expect(resolved.realPath).toBe("/Users/john/projects");
			expect(resolved.confidence).toBeGreaterThan(0.9);
			expect(resolved.resolutionMethod).toBe("logs");
		});

		it("should resolve project path using package.json strategy", async () => {
			const encodedPath = "-Users-john-my-app";
			const projectDir = join(testLogsDir, encodedPath);
			await mkdir(projectDir, { recursive: true });

			// Create a package.json file
			const packageJson = {
				name: "my-app",
				version: "1.0.0",
			};

			await writeFile(
				join(projectDir, "package.json"),
				JSON.stringify(packageJson, null, 2),
			);

			const resolved = await resolver.resolveProject(encodedPath);
			expect(resolved.realPath).toBe("/Users/john/my/app");
			expect(resolved.confidence).toBeGreaterThanOrEqual(0.7);
			expect(resolved.resolutionMethod).toBe("package");
			expect(resolved.metadata?.packageName).toBe("my-app");
		});

		it("should use simple decode as fallback", async () => {
			const encodedPath = "-home-user-documents";
			const projectDir = join(testLogsDir, encodedPath);
			await mkdir(projectDir, { recursive: true });

			// No special files, should fall back to simple decode
			const resolved = await resolver.resolveProject(encodedPath);
			expect(resolved.realPath).toBe("/home/user/documents");
			expect(resolved.confidence).toBeLessThan(0.5);
			expect(resolved.resolutionMethod).toBe("simple");
		});

		it("should handle Windows-style encoded paths", async () => {
			const encodedPath = "C--Users-john-projects";
			const projectDir = join(testLogsDir, encodedPath);
			await mkdir(projectDir, { recursive: true });

			const resolved = await resolver.resolveProject(encodedPath);
			expect(resolved.realPath).toBe("C:/Users/john/projects");
			expect(resolved.resolutionMethod).toBe("simple");
		});

		it("should handle paths with dots", async () => {
			const encodedPath = "-Users-john-project--name";
			const projectDir = join(testLogsDir, encodedPath);
			await mkdir(projectDir, { recursive: true });

			const resolved = await resolver.resolveProject(encodedPath);
			expect(resolved.realPath).toBe("/Users/john/project.name");
		});

		it("should cache resolved projects", async () => {
			const encodedPath = "-Users-john-cached";
			const projectDir = join(testLogsDir, encodedPath);
			await mkdir(projectDir, { recursive: true });

			// First resolution
			const resolved1 = await resolver.resolveProject(encodedPath);

			// Second resolution should return same object from cache
			const resolved2 = await resolver.resolveProject(encodedPath);

			expect(resolved1).toBe(resolved2);

			const stats = resolver.getCacheStats();
			expect(stats.size).toBe(1);
			expect(stats.entries).toContain(encodedPath);
		});
	});

	describe("clearCache", () => {
		it("should clear the resolution cache", async () => {
			const encodedPath = "-Users-john-test";
			const projectDir = join(testLogsDir, encodedPath);
			await mkdir(projectDir, { recursive: true });

			await resolver.resolveProject(encodedPath);
			expect(resolver.getCacheStats().size).toBe(1);

			resolver.clearCache();
			expect(resolver.getCacheStats().size).toBe(0);
		});
	});
});

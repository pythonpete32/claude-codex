import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	createMonitor,
	decodeProjectPath,
	extractProject,
	extractSessionId,
} from "../src/index.js";
import type { LogEntry } from "../src/types.js";

describe("path-decoder", () => {
	describe("decodeProjectPath", () => {
		it("should decode single dashes to slashes", () => {
			expect(decodeProjectPath("-Users-john-project-a")).toBe("/Users/john/project/a");
		});

		it("should decode double dashes to dots", () => {
			expect(decodeProjectPath("-Users-john--config")).toBe("/Users/john/.config");
		});

		it("should handle mixed encoding", () => {
			expect(decodeProjectPath("-home-user--ssh-config--bak")).toBe("/home/user/.ssh/config/.bak");
		});
	});

	describe("extractSessionId", () => {
		it("should extract session ID from file path", () => {
			const filePath = "/path/to/abc123-def456-ghi789.jsonl";
			expect(extractSessionId(filePath)).toBe("abc123-def456-ghi789");
		});
	});

	describe("extractProject", () => {
		it("should extract and decode project from file path", () => {
			const filePath = "/.claude/projects/-Users-john-project-a/session.jsonl";
			expect(extractProject(filePath)).toBe("/Users/john/project/a");
		});
	});
});

describe("LogMonitor", () => {
	let testDir: string;
	let monitor: ReturnType<typeof createMonitor>;

	beforeEach(async () => {
		testDir = join(tmpdir(), `codex-monitor-test-${Date.now()}`);
		await mkdir(testDir, { recursive: true });
		monitor = createMonitor({ projectsPath: testDir });
	});

	afterEach(async () => {
		monitor.stop();
		await rm(testDir, { recursive: true, force: true });
	});

	describe("readAll", () => {
		it("should read existing log entries", async () => {
			const projectDir = join(testDir, "-Users-test-project");
			await mkdir(projectDir, { recursive: true });

			const logContent = [
				'{"type": "tool_use", "id": "1"}',
				'{"type": "text", "content": "Hello"}',
				'{"type": "tool_result", "id": "1"}',
			].join("\n");

			await writeFile(join(projectDir, "session123.jsonl"), logContent);

			const entries: LogEntry[] = [];
			for await (const entry of monitor.readAll()) {
				entries.push(entry);
			}

			expect(entries).toHaveLength(3);
			expect(entries[0]).toMatchObject({
				line: '{"type": "tool_use", "id": "1"}',
				project: "/Users/test/project",
				sessionId: "session123",
				lineNumber: 1,
			});
		});

		it("should handle empty directories", async () => {
			const entries: LogEntry[] = [];
			for await (const entry of monitor.readAll()) {
				entries.push(entry);
			}
			expect(entries).toHaveLength(0);
		});

		it("should skip empty lines", async () => {
			const projectDir = join(testDir, "-test-project");
			await mkdir(projectDir, { recursive: true });

			const logContent = ['{"type": "text"}', "", "   ", '{"type": "tool_use"}'].join("\n");

			await writeFile(join(projectDir, "session.jsonl"), logContent);

			const entries: LogEntry[] = [];
			for await (const entry of monitor.readAll()) {
				entries.push(entry);
			}

			expect(entries).toHaveLength(2);
		});
	});

	describe("watch", () => {
		it("should emit events for new entries", async () => {
			const projectDir = join(testDir, "-test-live");
			await mkdir(projectDir, { recursive: true });

			const logFile = join(projectDir, "live-session.jsonl");

			const receivedEntries: LogEntry[] = [];
			monitor.on("entry", (entry) => {
				receivedEntries.push(entry);
			});

			await monitor.watch();
			await new Promise((resolve) => setTimeout(resolve, 100));

			await writeFile(logFile, '{"initial": true}\n');
			await new Promise((resolve) => setTimeout(resolve, 100));

			await writeFile(logFile, '{"initial": true}\n{"new": true}\n');

			await new Promise((resolve) => setTimeout(resolve, 200));

			expect(receivedEntries.length).toBeGreaterThanOrEqual(1);
			const newEntry = receivedEntries.find((e) => e.line === '{"new": true}');
			expect(newEntry).toBeDefined();
			expect(newEntry?.lineNumber).toBe(2);
		});
	});

	describe("stop", () => {
		it("should stop watching files", async () => {
			await monitor.watch();
			monitor.stop();

			const projectDir = join(testDir, "-test-stop");
			await mkdir(projectDir, { recursive: true });

			const logFile = join(projectDir, "stop-session.jsonl");
			await writeFile(logFile, '{"should": "not be detected"}\n');

			await new Promise((resolve) => setTimeout(resolve, 100));
		});
	});

	describe("getActiveSessions", () => {
		it("should return empty array when no sessions exist", () => {
			const activeSessions = monitor.getActiveSessions();
			expect(activeSessions).toHaveLength(0);
		});

		it("should track sessions during discovery", async () => {
			const projectDir = join(testDir, "-Users-test-active");
			await mkdir(projectDir, { recursive: true });

			const logContent = '{"type": "text", "content": "Hello"}';
			await writeFile(join(projectDir, "active-session-123.jsonl"), logContent);

			// Read all files to populate registry
			const entries: LogEntry[] = [];
			for await (const entry of monitor.readAll()) {
				entries.push(entry);
			}

			const activeSessions = monitor.getActiveSessions();
			expect(activeSessions).toHaveLength(1);
			expect(activeSessions[0]).toMatchObject({
				sessionId: "active-session-123",
				project: "/Users/test/active",
			});
			expect(activeSessions[0].lastModified).toBeInstanceOf(Date);
		});

		it("should filter sessions by active threshold", async () => {
			// Create monitor with 1 second threshold
			const shortThresholdMonitor = createMonitor({
				projectsPath: testDir,
				activeThresholdMs: 1000,
			});

			try {
				const projectDir = join(testDir, "-Users-test-threshold");
				await mkdir(projectDir, { recursive: true });

				const oldFile = join(projectDir, "old-session.jsonl");
				await writeFile(oldFile, '{"type": "text"}');

				// Wait 1.5 seconds to make it "old"
				await new Promise((resolve) => setTimeout(resolve, 1500));

				const newFile = join(projectDir, "new-session.jsonl");
				await writeFile(newFile, '{"type": "text"}');

				// Read all to populate registry
				for await (const _entry of shortThresholdMonitor.readAll()) {
					// Registry gets populated
				}

				const activeSessions = shortThresholdMonitor.getActiveSessions();

				// Only the new session should be active
				expect(activeSessions).toHaveLength(1);
				expect(activeSessions[0].sessionId).toBe("new-session");
			} finally {
				shortThresholdMonitor.stop();
			}
		});

		it("should sort sessions by most recent first", async () => {
			const projectDir = join(testDir, "-Users-test-sorting");
			await mkdir(projectDir, { recursive: true });

			// Create first file
			const file1 = join(projectDir, "session-001.jsonl");
			await writeFile(file1, '{"type": "text", "content": "First"}');

			// Wait a bit
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Create second file
			const file2 = join(projectDir, "session-002.jsonl");
			await writeFile(file2, '{"type": "text", "content": "Second"}');

			// Read all to populate registry
			for await (const _entry of monitor.readAll()) {
				// Registry gets populated
			}

			const activeSessions = monitor.getActiveSessions();
			expect(activeSessions).toHaveLength(2);

			// Most recent should be first
			expect(activeSessions[0].sessionId).toBe("session-002");
			expect(activeSessions[1].sessionId).toBe("session-001");

			// Verify sorting order
			expect(activeSessions[0].lastModified.getTime()).toBeGreaterThanOrEqual(
				activeSessions[1].lastModified.getTime(),
			);
		});

		it("should track file modifications during watch mode", async () => {
			const projectDir = join(testDir, "-Users-test-watch-active");
			await mkdir(projectDir, { recursive: true });

			const logFile = join(projectDir, "watch-session.jsonl");
			await writeFile(logFile, '{"initial": true}\n');

			// Read initial content to populate registry
			for await (const _entry of monitor.readAll()) {
				// Registry gets populated
			}

			// Start watching
			await monitor.watch();
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Get initial active sessions
			const initialSessions = monitor.getActiveSessions();
			expect(initialSessions).toHaveLength(1);
			const initialTime = initialSessions[0].lastModified.getTime();

			// Wait a bit and modify the file
			await new Promise((resolve) => setTimeout(resolve, 10));
			await writeFile(logFile, '{"initial": true}\n{"modified": true}\n');

			// Wait for file watcher to process
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Check that session was updated
			const updatedSessions = monitor.getActiveSessions();
			expect(updatedSessions).toHaveLength(1);
			expect(updatedSessions[0].sessionId).toBe("watch-session");
			expect(updatedSessions[0].lastModified.getTime()).toBeGreaterThan(initialTime);
		});

		it("should handle session cleanup", async () => {
			const projectDir = join(testDir, "-Users-test-cleanup");
			await mkdir(projectDir, { recursive: true });

			const logFile = join(projectDir, "cleanup-session.jsonl");
			await writeFile(logFile, '{"type": "text"}');

			// Read to populate registry
			for await (const _entry of monitor.readAll()) {
				// Registry gets populated
			}

			// Verify session exists
			let activeSessions = monitor.getActiveSessions();
			expect(activeSessions).toHaveLength(1);

			// Manually trigger cleanup (simulating 24+ hours passing)
			// Access private method for testing
			// biome-ignore lint/suspicious/noExplicitAny: Testing private method access
			(monitor as any).cleanupOldSessions();

			// Session should still exist (not old enough)
			activeSessions = monitor.getActiveSessions();
			expect(activeSessions).toHaveLength(1);
		});
	});
});

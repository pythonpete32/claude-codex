/**
 * @fileoverview Main entry point for @dao/codex-api-server
 * @module @dao/codex-api-server
 */

export type { ServerConfig } from "./config";

// Export configuration
export { config, loadConfig, validateConfig } from "./config";
// Export server functionality
export { createServer, startServer } from "./server";

// Export all API types
export * from "./types/api";

// Export for direct execution
if (import.meta.main) {
	const { startServer } = await import("./server");
	await startServer();
}

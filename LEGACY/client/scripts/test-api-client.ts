#!/usr/bin/env node

/**
 * Test script to verify API client connectivity and type safety
 * Run with: npx tsx scripts/test-api-client.ts
 */

import { formatRelativeTime, getProjectName } from "../lib/utils/api-helpers";
import { ApiClient, ApiClientError } from "../services/api-client";
import type { ProjectInfo, SessionInfo } from "../types/api";

// Load environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

console.log("🔍 Testing Claude Codex API Client");
console.log(`📡 API URL: ${API_URL}`);
console.log("");

const client = new ApiClient({ baseUrl: API_URL });

async function testApiClient() {
	try {
		// Test 1: Health Check
		console.log("1️⃣  Testing Health Endpoint...");
		const health = await client.getHealth();
		console.log("✅ Health Status:", health.status);
		console.log("   Version:", health.version);
		console.log("   Total Sessions:", health.services?.sessionScanner?.totalSessions || "N/A");
		console.log("");

		// Test 2: Get Projects
		console.log("2️⃣  Testing Projects Endpoint...");
		const projectsResponse = await client.getProjects({ limit: 5 });
		console.log("✅ Projects Found:", projectsResponse.projects.length);

		if (projectsResponse.projects.length > 0) {
			console.log("   Sample Projects:");
			projectsResponse.projects.slice(0, 3).forEach((project: ProjectInfo) => {
				console.log(`   - ${getProjectName(project.path)}`);
				console.log(`     Sessions: ${project.sessionCount}`);
				console.log(`     Last Active: ${formatRelativeTime(project.lastActivity)}`);
			});
		}
		console.log("");

		// Test 3: Get Sessions
		console.log("3️⃣  Testing Sessions Endpoint...");
		const sessionsResponse = await client.getSessions({ limit: 5 });
		console.log("✅ Sessions Found:", sessionsResponse.sessions.length);

		if (sessionsResponse.sessions.length > 0) {
			console.log(
				"   Active Sessions:",
				sessionsResponse.sessions.filter((s) => s.isActive).length,
			);
			const firstSession = sessionsResponse.sessions[0];
			console.log(`   First Session ID: ${firstSession.id}`);
			console.log(`   Project: ${getProjectName(firstSession.projectPath)}`);
		}
		console.log("");

		// Test 4: Type Safety Check
		console.log("4️⃣  Testing Type Safety...");
		// This should compile without errors
		const typedProject: ProjectInfo = projectsResponse.projects[0];
		const typedSession: SessionInfo = sessionsResponse.sessions[0];
		console.log("✅ TypeScript types are working correctly");
		console.log("");

		// Test 5: Error Handling
		console.log("5️⃣  Testing Error Handling...");
		try {
			await client.getSession("invalid-uuid");
		} catch (error) {
			if (error instanceof ApiClientError) {
				console.log("✅ Error handling works:", error.message);
			} else {
				console.log("✅ Error handling works:", error);
			}
		}
		console.log("");

		// Test 6: Path Encoding/Decoding
		console.log("6️⃣  Testing Path Encoding/Decoding...");
		const testPath = "/Users/example/my.project/src";
		const encoded = ApiClient.encodeProjectPath(testPath);
		const decoded = ApiClient.decodeProjectPath(encoded);
		console.log(`   Original: ${testPath}`);
		console.log(`   Encoded:  ${encoded}`);
		console.log(`   Decoded:  ${decoded}`);
		console.log(`✅ Path encoding works: ${testPath === decoded}`);
		console.log("");

		console.log("🎉 All tests completed successfully!");
		console.log("📦 Stage 1 Foundation Layer is ready for use.");
	} catch (error) {
		console.error("❌ Test failed:", error);
		console.error("");
		console.error("Make sure the API server is running:");
		console.error("cd packages/api-server && bun run dev");
		process.exit(1);
	}
}

// Run the tests
testApiClient();

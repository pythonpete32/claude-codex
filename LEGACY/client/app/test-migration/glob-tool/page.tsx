"use client";

import { GlobTool } from "@/components/chat-items/glob-tool/glob-tool";

// Test data from fixtures
const successFixture = {
	toolUse: {
		type: "tool_use" as const,
		id: "glob_123",
		name: "Glob" as const,
		input: {
			pattern: "**/*.ts",
			path: "src/",
		},
	},
	status: "completed" as const,
	timestamp: "2025-06-25T18:20:11.465Z",
	toolResult: {
		matches: [
			"src/index.ts",
			"src/types.ts",
			"src/utils.ts",
			"src/components/Button.ts",
			"src/components/Form.ts",
		],
		matchCount: 5,
		isError: false,
	},
};

const noMatchesFixture = {
	toolUse: {
		type: "tool_use" as const,
		id: "glob_456",
		name: "Glob" as const,
		input: {
			pattern: "*.json",
		},
	},
	status: "completed" as const,
	timestamp: "2025-06-25T18:25:16.463Z",
	toolResult: {
		matches: [],
		matchCount: 0,
		isError: false,
	},
};

const errorFixture = {
	toolUse: {
		type: "tool_use" as const,
		id: "glob_789",
		name: "Glob" as const,
		input: {
			pattern: "[invalid glob",
			path: "/nonexistent/path",
		},
	},
	status: "failed" as const,
	timestamp: "2025-06-25T18:26:16.463Z",
	toolResult: {
		matches: [],
		matchCount: 0,
		isError: true,
		errorMessage: "Error: Invalid glob pattern: [invalid glob",
	},
};

export default function GlobToolTestPage() {
	return (
		<div className="p-8 space-y-8 bg-gray-950 min-h-screen">
			<h1 className="text-2xl font-bold text-white mb-6">Glob Tool Migration Test</h1>

			<section className="space-y-4">
				<h2 className="text-xl font-semibold text-white">Success State (5 matches)</h2>
				<GlobTool {...successFixture} />
			</section>

			<section className="space-y-4">
				<h2 className="text-xl font-semibold text-white">No Matches State</h2>
				<GlobTool {...noMatchesFixture} />
			</section>

			<section className="space-y-4">
				<h2 className="text-xl font-semibold text-white">Error State</h2>
				<GlobTool {...errorFixture} />
			</section>
		</div>
	);
}

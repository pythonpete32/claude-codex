"use client";

import { GlobTool } from "@/components/chat-items/glob-tool/glob-tool";
import { BorderBeam } from "@/components/magicui/border-beam";

// Test data from fixtures - exactly what the component expects
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

const pendingFixture = {
	toolUse: {
		type: "tool_use" as const,
		id: "glob_pending",
		name: "Glob" as const,
		input: {
			pattern: "**/*.tsx",
			path: "src/",
		},
	},
	status: "pending" as const,
	timestamp: "2025-06-25T18:25:16.463Z",
	toolResult: {
		matches: [],
		matchCount: 0,
		isError: false,
	},
};

const inProgressFixture = {
	toolUse: {
		type: "tool_use" as const,
		id: "glob_running",
		name: "Glob" as const,
		input: {
			pattern: "**/*.js",
			path: "src/",
		},
	},
	status: "in_progress" as const,
	timestamp: "2025-06-25T18:25:16.463Z",
	toolResult: {
		matches: [],
		matchCount: 0,
		isError: false,
	},
};

const interruptedFixture = {
	toolUse: {
		type: "tool_use" as const,
		id: "glob_interrupted",
		name: "Glob" as const,
		input: {
			pattern: "**/*.py",
			path: "src/",
		},
	},
	status: "interrupted" as const,
	timestamp: "2025-06-25T18:25:16.463Z",
	toolResult: {
		matches: [],
		matchCount: 0,
		isError: true,
		errorMessage: "Operation was interrupted by user",
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

export default function TestGlobOnlyPage() {
	return (
		<div className="px-12 py-8 space-y-8 bg-gray-950 min-h-screen overflow-x-hidden">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold text-white mb-2">✅ Glob Tool Migration Test</h1>
				<p className="text-gray-300 mb-8">
					Testing the migrated Glob Tool with contract-compliant data
				</p>

				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-yellow-400">⏳ Pending State</h2>
					<div className="relative rounded-lg p-2 shadow-2xl shadow-yellow-500/20">
						<div className="absolute inset-0 rounded-lg bg-yellow-500/10 blur-xl"></div>
						<div className="relative bg-gray-950/90 rounded-lg">
							<GlobTool {...pendingFixture} />
						</div>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-blue-400">🔄 In Progress State (Running)</h2>
					<div className="relative rounded-lg p-2 shadow-2xl shadow-blue-500/30">
						{/* Professional pulsing animation for running state - soft glow like others */}
						<div className="absolute inset-0 rounded-lg bg-blue-500/10 blur-xl animate-pulse"></div>
						<div
							className="absolute inset-0 rounded-lg bg-blue-400/5 blur-2xl animate-ping"
							style={{ animationDuration: "2s" }}
						></div>
						{/* BorderBeam animation for active processing */}
						<BorderBeam
							size={180}
							duration={12}
							colorFrom="#60a5fa40"
							colorTo="#3b82f650"
							borderWidth={1}
							className="rounded-lg"
						/>
						<div className="relative bg-gray-950/90 rounded-lg">
							<GlobTool {...inProgressFixture} />
						</div>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-green-400">🎯 Success State (5 matches)</h2>
					<div className="relative rounded-lg p-2 shadow-2xl shadow-green-500/20">
						<div className="absolute inset-0 rounded-lg bg-green-500/10 blur-xl"></div>
						<div className="relative bg-gray-950/90 rounded-lg">
							<GlobTool {...successFixture} />
						</div>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-yellow-400">🔍 No Matches State</h2>
					<div className="relative rounded-lg p-2 shadow-2xl shadow-yellow-500/20">
						<div className="absolute inset-0 rounded-lg bg-yellow-500/10 blur-xl"></div>
						<div className="relative bg-gray-950/90 rounded-lg">
							<GlobTool {...noMatchesFixture} />
						</div>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-red-400">🚫 Interrupted State</h2>
					<div className="relative rounded-lg p-2 shadow-2xl shadow-red-500/20">
						<div className="absolute inset-0 rounded-lg bg-red-500/10 blur-xl"></div>
						<div className="relative bg-gray-950/90 rounded-lg">
							<GlobTool {...interruptedFixture} />
						</div>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-red-400">💥 Failed State</h2>
					<div className="relative rounded-lg p-2 shadow-2xl shadow-red-500/20">
						<div className="absolute inset-0 rounded-lg bg-red-500/10 blur-xl"></div>
						<div className="relative bg-gray-950/90 rounded-lg">
							<GlobTool {...errorFixture} />
						</div>
					</div>
				</section>

				<div className="mt-12 p-6 bg-green-900/20 border border-green-500/30 rounded-lg">
					<h3 className="text-green-400 font-semibold mb-2">✅ Migration Validation</h3>
					<ul className="text-green-300 space-y-1 text-sm">
						<li>• Uses correct contract interface: toolUse + toolResult</li>
						<li>• Handles pattern and optional path parameters</li>
						<li>• Displays matches as simple string array</li>
						<li>• Shows proper error messages for invalid patterns</li>
						<li>• Validates toolUse.type and shows warnings</li>
						<li>• Maps all 5 contract statuses to visual feedback</li>
						<li>• Professional pulsing animation for running state</li>
						<li>• failed/interrupted properly map to error styling</li>
					</ul>
				</div>
			</div>
		</div>
	);
}

"use client";

import { LsTool } from "@/components/chat-items/ls-tool/ls-tool";
import { BorderBeam } from "@/components/magicui/border-beam";

// Test data from fixtures - exactly what the component expects
const successFixture = {
	toolUse: {
		type: "tool_use" as const,
		id: "ls_123",
		name: "LS" as const,
		input: {
			path: "/Users/example/projects/test",
		},
	},
	status: "completed" as const,
	timestamp: "2025-06-25T18:20:11.465Z",
	toolResult: {
		entries: [
			{
				name: "README.md",
				type: "file" as const,
				size: 1234,
				hidden: false,
				permissions: "rw-r--r--",
				lastModified: "2025-06-25T12:00:00Z",
			},
			{
				name: "src",
				type: "directory" as const,
				hidden: false,
				permissions: "rwxr-xr-x",
				lastModified: "2025-06-25T10:00:00Z",
			},
			{
				name: ".gitignore",
				type: "file" as const,
				size: 456,
				hidden: true,
				permissions: "rw-r--r--",
				lastModified: "2025-06-24T08:00:00Z",
			},
			{
				name: "package.json",
				type: "file" as const,
				size: 789,
				hidden: false,
				permissions: "rw-r--r--",
				lastModified: "2025-06-25T11:00:00Z",
			},
			{
				name: "node_modules",
				type: "directory" as const,
				hidden: false,
				permissions: "rwxr-xr-x",
				lastModified: "2025-06-25T09:00:00Z",
			},
		],
		entryCount: 5,
		path: "/Users/example/projects/test",
		isError: false,
	},
};

const emptyDirectoryFixture = {
	toolUse: {
		type: "tool_use" as const,
		id: "ls_456",
		name: "LS" as const,
		input: {
			path: "/tmp/empty-dir",
			ignore: ["*.tmp", "*.log"],
		},
	},
	status: "completed" as const,
	timestamp: "2025-06-25T18:25:19.401Z",
	toolResult: {
		entries: [],
		entryCount: 0,
		path: "/tmp/empty-dir",
		isError: false,
	},
};

const pendingFixture = {
	toolUse: {
		type: "tool_use" as const,
		id: "ls_pending",
		name: "LS" as const,
		input: {
			path: "/home/user/documents",
		},
	},
	status: "pending" as const,
	timestamp: "2025-06-25T18:25:16.463Z",
	toolResult: {
		entries: [],
		entryCount: 0,
		path: "/home/user/documents",
		isError: false,
	},
};

const inProgressFixture = {
	toolUse: {
		type: "tool_use" as const,
		id: "ls_running",
		name: "LS" as const,
		input: {
			path: "/var/log",
		},
	},
	status: "in_progress" as const,
	timestamp: "2025-06-25T18:25:16.463Z",
	toolResult: {
		entries: [],
		entryCount: 0,
		path: "/var/log",
		isError: false,
	},
};

const errorFixture = {
	toolUse: {
		type: "tool_use" as const,
		id: "ls_789",
		name: "LS" as const,
		input: {
			path: "/nonexistent/directory",
		},
	},
	status: "failed" as const,
	timestamp: "2025-06-25T18:26:19.401Z",
	toolResult: {
		entries: [],
		entryCount: 0,
		path: "/nonexistent/directory",
		isError: true,
		errorMessage: "ENOENT: no such file or directory '/nonexistent/directory'",
	},
};

const interruptedFixture = {
	toolUse: {
		type: "tool_use" as const,
		id: "ls_interrupted",
		name: "LS" as const,
		input: {
			path: "/large/directory",
		},
	},
	status: "interrupted" as const,
	timestamp: "2025-06-25T18:25:16.463Z",
	toolResult: {
		entries: [],
		entryCount: 0,
		path: "/large/directory",
		isError: true,
		errorMessage: "Operation was interrupted by user",
	},
};

export default function TestLsOnlyPage() {
	return (
		<div className="px-12 py-8 space-y-8 bg-gray-950 min-h-screen overflow-x-hidden">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold text-white mb-2">📁 LS Tool Migration Test</h1>
				<p className="text-gray-300 mb-8">
					Testing the migrated LS Tool with contract-compliant data
				</p>

				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-yellow-400">⏳ Pending State</h2>
					<div className="relative rounded-lg p-2 shadow-2xl shadow-yellow-500/20">
						<div className="absolute inset-0 rounded-lg bg-yellow-500/10 blur-xl"></div>
						<div className="relative bg-gray-950/90 rounded-lg">
							<LsTool {...pendingFixture} />
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
							<LsTool {...inProgressFixture} />
						</div>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-green-400">📂 Success State (5 entries)</h2>
					<div className="relative rounded-lg p-2 shadow-2xl shadow-green-500/20">
						<div className="absolute inset-0 rounded-lg bg-green-500/10 blur-xl"></div>
						<div className="relative bg-gray-950/90 rounded-lg">
							<LsTool {...successFixture} />
						</div>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-orange-400">📭 Empty Directory State</h2>
					<div className="relative rounded-lg p-2 shadow-2xl shadow-orange-500/20">
						<div className="absolute inset-0 rounded-lg bg-orange-500/10 blur-xl"></div>
						<div className="relative bg-gray-950/90 rounded-lg">
							<LsTool {...emptyDirectoryFixture} />
						</div>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-red-400">🚫 Interrupted State</h2>
					<div className="relative rounded-lg p-2 shadow-2xl shadow-red-500/20">
						<div className="absolute inset-0 rounded-lg bg-red-500/10 blur-xl"></div>
						<div className="relative bg-gray-950/90 rounded-lg">
							<LsTool {...interruptedFixture} />
						</div>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-red-400">💥 Failed State</h2>
					<div className="relative rounded-lg p-2 shadow-2xl shadow-red-500/20">
						<div className="absolute inset-0 rounded-lg bg-red-500/10 blur-xl"></div>
						<div className="relative bg-gray-950/90 rounded-lg">
							<LsTool {...errorFixture} />
						</div>
					</div>
				</section>

				<div className="mt-12 p-6 bg-green-900/20 border border-green-500/30 rounded-lg">
					<h3 className="text-green-400 font-semibold mb-2">✅ Migration Validation</h3>
					<ul className="text-green-300 space-y-1 text-sm">
						<li>• Uses correct contract interface: toolUse + toolResult</li>
						<li>• Handles path and optional ignore parameters</li>
						<li>• Displays entries with file/directory colors and permissions</li>
						<li>• Shows proper error messages for invalid paths</li>
						<li>• Validates toolUse.type and shows warnings</li>
						<li>• Maps all 5 contract statuses to visual feedback</li>
						<li>• Formats lastModified dates properly</li>
						<li>• failed/interrupted properly map to error styling</li>
					</ul>
				</div>
			</div>
		</div>
	);
}

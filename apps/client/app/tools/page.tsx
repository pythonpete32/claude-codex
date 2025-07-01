"use client"

import Link from "next/link"
import {
	Terminal,
	FileText,
	FilePlus,
	FileEdit,
	Files,
	Search,
	FolderSearch,
	FolderOpen,
	Brain,
	ArrowRight,
} from "lucide-react"

const tools = [
	{
		name: "Bash Tool",
		description: "Execute bash commands with real-time output and animations",
		icon: Terminal,
		href: "/tools/bash",
		color: "text-green-400",
		bgColor: "bg-green-900/20",
		borderColor: "border-green-500/30",
	},
	{
		name: "Read Tool",
		description: "Display file contents with syntax highlighting and line numbers",
		icon: FileText,
		href: "/tools/read",
		color: "text-blue-400",
		bgColor: "bg-blue-900/20",
		borderColor: "border-blue-500/30",
	},
	{
		name: "Write Tool",
		description: "Create or overwrite files with content preview",
		icon: FilePlus,
		href: "/tools/write",
		color: "text-purple-400",
		bgColor: "bg-purple-900/20",
		borderColor: "border-purple-500/30",
	},
	{
		name: "Edit Tool",
		description: "Edit files with diff visualization",
		icon: FileEdit,
		href: "/tools/edit",
		color: "text-orange-400",
		bgColor: "bg-orange-900/20",
		borderColor: "border-orange-500/30",
	},
	{
		name: "Multi-Edit Tool",
		description: "Apply multiple edits to a file in one operation",
		icon: Files,
		href: "/tools/multi-edit",
		color: "text-pink-400",
		bgColor: "bg-pink-900/20",
		borderColor: "border-pink-500/30",
	},
	{
		name: "Grep Tool",
		description: "Search for patterns in files with highlighted matches",
		icon: Search,
		href: "/tools/grep",
		color: "text-yellow-400",
		bgColor: "bg-yellow-900/20",
		borderColor: "border-yellow-500/30",
	},
	{
		name: "Glob Tool",
		description: "Find files matching glob patterns",
		icon: FolderSearch,
		href: "/tools/glob",
		color: "text-cyan-400",
		bgColor: "bg-cyan-900/20",
		borderColor: "border-cyan-500/30",
	},
	{
		name: "LS Tool",
		description: "List directory contents with detailed file information",
		icon: FolderOpen,
		href: "/tools/ls",
		color: "text-indigo-400",
		bgColor: "bg-indigo-900/20",
		borderColor: "border-indigo-500/30",
	},
	{
		name: "MCP Sequential Thinking",
		description: "Visualize workflow execution with step-by-step progress",
		icon: Brain,
		href: "/tools/mcp-sequential-thinking",
		color: "text-violet-400",
		bgColor: "bg-violet-900/20",
		borderColor: "border-violet-500/30",
	},
]

export default function ToolsPage() {
	return (
		<div className="min-h-screen bg-gray-950 p-8">
			<div className="max-w-7xl mx-auto">
				<div className="mb-12">
					<h1 className="text-4xl font-bold text-white mb-4">Claude Codex Tool Components</h1>
					<p className="text-gray-400 text-lg">
						Interactive examples of all tool components using parser-generated props
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{tools.map((tool) => {
						const Icon = tool.icon
						return (
							<Link
								key={tool.href}
								href={tool.href}
								className={`
									group relative overflow-hidden rounded-xl border ${tool.borderColor} ${tool.bgColor}
									backdrop-blur-sm transition-all duration-300
									hover:scale-105 hover:shadow-lg hover:shadow-current/20
								`}
							>
								<div className="p-6">
									<div className="flex items-start justify-between mb-4">
										<Icon className={`h-8 w-8 ${tool.color}`} />
										<ArrowRight
											className={`
											h-5 w-5 text-gray-500 transition-transform duration-300
											group-hover:translate-x-1 group-hover:text-gray-300
										`}
										/>
									</div>

									<h3 className="text-xl font-semibold text-white mb-2">{tool.name}</h3>

									<p className="text-gray-400 text-sm">{tool.description}</p>
								</div>

								{/* Animated gradient overlay */}
								<div
									className={`
									absolute inset-0 bg-gradient-to-r ${tool.bgColor} to-transparent
									opacity-0 group-hover:opacity-20 transition-opacity duration-300
									pointer-events-none
								`}
								/>
							</Link>
						)
					})}
				</div>

				<div className="mt-12 p-6 rounded-xl border border-gray-700 bg-gray-900/50">
					<h2 className="text-2xl font-semibold text-white mb-4">About These Tools</h2>
					<div className="space-y-3 text-gray-400">
						<p>
							These tool components are designed to work with parser-generated props from
							<code className="px-2 py-1 bg-gray-800 rounded text-blue-400 mx-1">@claude-codex/types</code>.
						</p>
						<p>
							Each component follows the hybrid schema architecture where parsers transform raw Claude Code logs into
							UI-ready props that components can directly consume.
						</p>
						<p>All components feature:</p>
						<ul className="list-disc list-inside ml-4 space-y-1">
							<li>Consistent terminal-style UI with collapsible functionality</li>
							<li>Smooth animations using Framer Motion</li>
							<li>
								Proper TypeScript typing with no <code className="text-red-400">any</code> types
							</li>
							<li>Status normalization and error handling</li>
							<li>Interactive elements like copy buttons and file navigation</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	)
}

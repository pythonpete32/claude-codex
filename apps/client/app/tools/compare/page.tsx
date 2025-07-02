"use client"

import type { ReadToolProps, GrepToolProps, ToolStatus } from "@claude-codex/types"
import { ReadTool as ReadToolOriginal } from "@/components/tools/read"
import { ReadTool as ReadToolRefactored } from "@/components/tools/read/read-tool-refactored"
import { GrepTool as GrepToolOriginal } from "@/components/tools/grep"
import { GrepTool as GrepToolRefactored } from "@/components/tools/grep/grep-tool-refactored"

const mockStatus: ToolStatus = {
	normalized: "completed",
	original: "completed",
}

const mockReadProps: ReadToolProps = {
	id: "read-1",
	uuid: "uuid-1",
	timestamp: new Date().toISOString(),
	duration: 150,
	status: mockStatus,
	filePath: "/src/components/example.tsx",
	content: `import React from 'react'

export const Example: React.FC = () => {
  return (
    <div className="p-4">
      <h1>Hello World</h1>
      <p>This is an example component</p>
    </div>
  )
}`,
	fileSize: 1024,
	totalLines: 10,
	language: "typescript",
}

// Longer content for demonstrating auto-folding
const longContent = Array.from(
	{ length: 100 },
	(_, i) => `Line ${i + 1}: This is a line of code in the file to demonstrate automatic folding behavior`,
).join("\n")

const mockReadPropsLong: ReadToolProps = {
	...mockReadProps,
	id: "read-2",
	content: longContent,
	totalLines: 100,
	fileSize: 5120,
}

const mockGrepProps: GrepToolProps = {
	id: "grep-1",
	uuid: "uuid-2",
	timestamp: new Date().toISOString(),
	duration: 250,
	status: mockStatus,
	input: {
		pattern: "className",
		searchPath: "./src",
		caseSensitive: false,
		useRegex: false,
	},
	results: [
		{
			filePath: "src/components/example.tsx",
			matchCount: 1,
			matches: [
				{
					lineNumber: 5,
					lineContent: '      <div className="p-4">',
					matchStart: 11,
					matchEnd: 20,
				},
			],
		},
	],
	ui: {
		totalMatches: 1,
		filesWithMatches: 1,
		searchTime: 250,
	},
}

// Large grep results for testing auto-fold
const mockGrepPropsLarge: GrepToolProps = {
	...mockGrepProps,
	id: "grep-2",
	results: Array.from({ length: 10 }, (_, fileIndex) => ({
		filePath: `src/components/file${fileIndex + 1}.tsx`,
		matchCount: 5,
		matches: Array.from({ length: 5 }, (_, matchIndex) => ({
			lineNumber: (matchIndex + 1) * 10,
			lineContent: `        <div className="example-${fileIndex}-${matchIndex}">`,
			matchStart: 13,
			matchEnd: 22,
		})),
	})),
	ui: {
		totalMatches: 50,
		filesWithMatches: 10,
		searchTime: 450,
	},
}

export default function ComparePage() {
	return (
		<div className="max-w-7xl mx-auto p-8">
			<h1 className="text-3xl font-bold mb-8">Component Refactoring Comparison</h1>

			<div className="space-y-8">
				<section>
					<h2 className="text-2xl font-semibold mb-4">ReadTool Comparison</h2>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<h3 className="text-lg font-medium mb-2 text-gray-400">Original Component</h3>
							<ReadToolOriginal {...mockReadProps} description="Reading example file" />
						</div>
						<div>
							<h3 className="text-lg font-medium mb-2 text-green-400">Refactored with Base</h3>
							<ReadToolRefactored {...mockReadProps} description="Reading example file" />
						</div>
					</div>
					<div className="mt-4 grid grid-cols-2 gap-4">
						<div>
							<h3 className="text-lg font-medium mb-2 text-gray-400">Auto-folding (100 lines)</h3>
							<ReadToolOriginal {...mockReadPropsLong} description="Auto-folds when > 50 lines" />
						</div>
						<div>
							<h3 className="text-lg font-medium mb-2 text-green-400">Auto-folding (100 lines)</h3>
							<ReadToolRefactored {...mockReadPropsLong} description="Auto-folds when > 50 lines" />
						</div>
					</div>
					<div className="mt-4 grid grid-cols-2 gap-4">
						<div>
							<h3 className="text-lg font-medium mb-2 text-gray-400">Default folded</h3>
							<ReadToolOriginal {...mockReadPropsLong} description="Starts folded" />
						</div>
						<div>
							<h3 className="text-lg font-medium mb-2 text-green-400">Default folded</h3>
							<ReadToolRefactored
								{...mockReadPropsLong}
								description="Starts folded"
								foldable={true}
								defaultFolded={true}
							/>
						</div>
					</div>
					<div className="mt-4 grid grid-cols-2 gap-4">
						<div>
							<h3 className="text-lg font-medium mb-2 text-gray-400">Force foldable=false</h3>
							<ReadToolOriginal {...mockReadPropsLong} description="Forced non-foldable" />
						</div>
						<div>
							<h3 className="text-lg font-medium mb-2 text-green-400">Force foldable=false</h3>
							<ReadToolRefactored {...mockReadPropsLong} description="Forced non-foldable" foldable={false} />
						</div>
					</div>
				</section>

				<section>
					<h2 className="text-2xl font-semibold mb-4">GrepTool Comparison</h2>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<h3 className="text-lg font-medium mb-2 text-gray-400">Original Component</h3>
							<GrepToolOriginal {...mockGrepProps} description="Searching for className" />
						</div>
						<div>
							<h3 className="text-lg font-medium mb-2 text-green-400">Refactored with Base</h3>
							<GrepToolRefactored {...mockGrepProps} description="Searching for className" />
						</div>
					</div>
					<div className="mt-4 grid grid-cols-2 gap-4">
						<div>
							<h3 className="text-lg font-medium mb-2 text-gray-400">Large results (50 matches) - Auto-fold</h3>
							<GrepToolOriginal {...mockGrepPropsLarge} description="Auto-folds when > 20 matches" />
						</div>
						<div>
							<h3 className="text-lg font-medium mb-2 text-green-400">Large results (50 matches) - Auto-fold</h3>
							<GrepToolRefactored {...mockGrepPropsLarge} description="Auto-folds when > 20 matches" />
						</div>
					</div>
					<div className="mt-4 p-4 bg-gray-800 rounded-lg">
						<p className="text-sm text-gray-400 mb-2">The refactored component supports explicit foldable control:</p>
						<div>
							<h3 className="text-lg font-medium mb-2 text-green-400">With foldable=false (forced)</h3>
							<GrepToolRefactored {...mockGrepPropsLarge} description="Non-foldable example" foldable={false} />
						</div>
					</div>
				</section>

				<section className="mt-12 p-6 bg-gray-800 rounded-lg">
					<h2 className="text-xl font-semibold mb-4">Benefits of Refactoring</h2>
					<ul className="space-y-2 text-gray-300">
						<li>✅ ~70% less code in each component</li>
						<li>✅ Consistent status handling across all tools</li>
						<li>✅ Shared utility functions (formatFileSize, getFileName, etc.)</li>
						<li>✅ Easier to maintain and add new features</li>
						<li>✅ Type-safe with full TypeScript support</li>
						<li>✅ Flexible - can override any behavior or use customRender</li>
						<li>✅ Explicit foldable control with boolean flag</li>
						<li>✅ Smart defaults - auto-fold based on content size</li>
					</ul>

					<div className="mt-4 p-4 bg-gray-700 rounded">
						<h3 className="font-medium mb-2">Foldable Behavior:</h3>
						<ul className="text-sm space-y-1 text-gray-300">
							<li>
								• <code className="bg-gray-600 px-1">foldable={true}</code> - Always foldable
							</li>
							<li>
								• <code className="bg-gray-600 px-1">foldable={false}</code> - Never foldable
							</li>
							<li>
								• <code className="bg-gray-600 px-1">foldable</code> not set - Auto-fold based on content size
							</li>
							<li>
								• <code className="bg-gray-600 px-1">defaultFolded={true}</code> - Start in folded state
							</li>
						</ul>
					</div>
				</section>
			</div>
		</div>
	)
}

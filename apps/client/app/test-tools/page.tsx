"use client"

import { ReadTool } from "@/components/tools/read"
import { WriteTool } from "@/components/tools/write"
import { EditTool } from "@/components/tools/edit"
import { MultiEditTool } from "@/components/tools/multi-edit"
import { GrepTool } from "@/components/tools/grep"
import { GlobTool } from "@/components/tools/glob"
import { LsTool } from "@/components/tools/ls"

export default function TestToolsPage() {
	const timestamp = new Date().toISOString()

	return (
		<div className="p-8 space-y-8 max-w-6xl mx-auto">
			<h1 className="text-3xl font-bold mb-8">Tool Components Test Page</h1>

			{/* WriteTool Example */}
			<section>
				<h2 className="text-2xl font-semibold mb-4">WriteTool</h2>
				<WriteTool
					id="write-1"
					uuid="uuid-write-1"
					timestamp={timestamp}
					status={{ normalized: "completed", original: "success" }}
					filePath="/Users/test/new-file.tsx"
					content={`export function NewComponent() {
  return <div>Hello World!</div>;
}`}
					created={true}
					fileSize={58}
					totalLines={3}
					fileType="tsx"
					description="Creating new React component"
				/>
			</section>

			{/* EditTool Example */}
			<section>
				<h2 className="text-2xl font-semibold mb-4">EditTool</h2>
				<EditTool
					id="edit-1"
					uuid="uuid-edit-1"
					timestamp={timestamp}
					status={{ normalized: "completed" }}
					filePath="/Users/test/component.tsx"
					oldContent="function Component() {"
					newContent="export function Component() {"
					content=""
					diff={[
						{ type: "removed", content: "function Component() {", lineNumber: 1 },
						{ type: "added", content: "export function Component() {", lineNumber: 1 },
					]}
					description="Adding export to component"
				/>
			</section>

			{/* MultiEditTool Example */}
			<section>
				<h2 className="text-2xl font-semibold mb-4">MultiEditTool</h2>
				<MultiEditTool
					id="multi-1"
					uuid="uuid-multi-1"
					timestamp={timestamp}
					status={{ normalized: "completed" }}
					input={{
						filePath: "/Users/test/config.json",
						edits: [
							{ old_string: '"version": "1.0.0"', new_string: '"version": "1.1.0"' },
							{ old_string: '"debug": false', new_string: '"debug": true' },
							{ old_string: '"port": 3000', new_string: '"port": 8080' },
						],
					}}
					results={{
						message: "All edits applied successfully",
						editsApplied: 3,
						totalEdits: 3,
						allSuccessful: true,
						editDetails: [
							{
								operation: { old_string: '"version": "1.0.0"', new_string: '"version": "1.1.0"' },
								success: true,
								replacements_made: 1,
							},
							{
								operation: { old_string: '"debug": false', new_string: '"debug": true' },
								success: true,
								replacements_made: 1,
							},
							{
								operation: { old_string: '"port": 3000', new_string: '"port": 8080' },
								success: true,
								replacements_made: 1,
							},
						],
					}}
					ui={{
						totalEdits: 3,
						successfulEdits: 3,
						failedEdits: 0,
						changeSummary: "Updated version, enabled debug mode, changed port",
					}}
				/>
			</section>

			{/* GrepTool Example */}
			<section>
				<h2 className="text-2xl font-semibold mb-4">GrepTool</h2>
				<GrepTool
					id="grep-1"
					uuid="uuid-grep-1"
					timestamp={timestamp}
					status={{ normalized: "completed" }}
					input={{
						pattern: "TODO",
						searchPath: "./src",
						caseSensitive: true,
					}}
					results={[
						{
							filePath: "src/components/Header.tsx",
							totalMatches: 2,
							matches: [
								{ line: 15, content: "  // TODO: Add user menu", matchStart: 5, matchEnd: 9 },
								{ line: 28, content: "    // TODO: Implement search", matchStart: 7, matchEnd: 11 },
							],
						},
						{
							filePath: "src/utils/api.ts",
							totalMatches: 1,
							matches: [{ line: 42, content: "// TODO: Add error handling", matchStart: 3, matchEnd: 7 }],
						},
					]}
					ui={{
						totalMatches: 3,
						filesWithMatches: 2,
						searchTime: 125,
					}}
				/>
			</section>

			{/* GlobTool Example */}
			<section>
				<h2 className="text-2xl font-semibold mb-4">GlobTool</h2>
				<GlobTool
					id="glob-1"
					uuid="uuid-glob-1"
					timestamp={timestamp}
					status={{ normalized: "completed" }}
					input={{
						pattern: "**/*.test.ts",
						searchPath: "./src",
					}}
					results={[
						"src/utils/helpers.test.ts",
						"src/utils/validation.test.ts",
						"src/components/Button.test.ts",
						"src/components/Modal.test.ts",
						"src/services/auth.test.ts",
					]}
					ui={{
						totalMatches: 5,
						filesWithMatches: 5,
						searchTime: 45,
					}}
				/>
			</section>

			{/* LsTool Example */}
			<section>
				<h2 className="text-2xl font-semibold mb-4">LsTool</h2>
				<LsTool
					id="ls-1"
					uuid="uuid-ls-1"
					timestamp={timestamp}
					status={{ normalized: "completed" }}
					input={{
						path: "/Users/test/project",
						showHidden: false,
					}}
					results={{
						entries: [
							{
								name: "src",
								type: "directory",
								size: 4096,
								permissions: "drwxr-xr-x",
								lastModified: new Date().toISOString(),
							},
							{
								name: "package.json",
								type: "file",
								size: 1234,
								permissions: "-rw-r--r--",
								lastModified: new Date().toISOString(),
							},
							{
								name: "tsconfig.json",
								type: "file",
								size: 567,
								permissions: "-rw-r--r--",
								lastModified: new Date().toISOString(),
							},
							{
								name: "node_modules",
								type: "symlink",
								size: 32,
								permissions: "lrwxr-xr-x",
								lastModified: new Date().toISOString(),
							},
							{
								name: "README.md",
								type: "file",
								size: 2345,
								permissions: "-rw-r--r--",
								lastModified: new Date().toISOString(),
							},
						],
						entryCount: 5,
					}}
					ui={{
						totalFiles: 3,
						totalDirectories: 1,
						totalSize: 8173,
					}}
				/>
			</section>
		</div>
	)
}

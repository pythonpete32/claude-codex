"use client"

import { ReadTool, type ReadToolProps } from "@/components/tools/read"

export default function TestReadToolPage() {
	// Mock data that matches parser output
	const mockReadToolProps: ReadToolProps = {
		// BaseToolProps
		id: "tool_use_123",
		uuid: "uuid-123",
		timestamp: new Date().toISOString(),
		duration: 45,
		status: {
			normalized: "completed",
			original: "success",
		},

		// FileToolProps
		filePath: "/Users/test/example.tsx",
		content: `import React from 'react';

export function ExampleComponent() {
  return (
    <div className="p-4">
      <h1>Hello World</h1>
      <p>This is an example component</p>
    </div>
  );
}`,
		fileSize: 245,
		totalLines: 10,
		fileType: "tsx",
		encoding: "utf-8",
		showLineNumbers: true,

		// ReadToolProps
		truncated: false,
		language: "typescript",

		// UI-specific
		description: "Reading TypeScript component file",
	}

	const errorExample: ReadToolProps = {
		id: "tool_use_456",
		uuid: "uuid-456",
		timestamp: new Date().toISOString(),
		status: {
			normalized: "failed",
			original: "error",
		},
		filePath: "/Users/test/missing.txt",
		content: "",
		errorMessage: "File not found: /Users/test/missing.txt",
	}

	const truncatedExample: ReadToolProps = {
		id: "tool_use_789",
		uuid: "uuid-789",
		timestamp: new Date().toISOString(),
		duration: 120,
		status: {
			normalized: "completed",
		},
		filePath: "/Users/test/large-file.log",
		content: `[2024-01-01 10:00:00] Starting application...
[2024-01-01 10:00:01] Loading configuration...
[2024-01-01 10:00:02] Connecting to database...
[2024-01-01 10:00:03] Database connected successfully
[2024-01-01 10:00:04] Starting HTTP server on port 3000
[2024-01-01 10:00:05] Server started successfully`,
		fileSize: 1048576, // 1MB
		totalLines: 10000,
		truncated: true,
		showLineNumbers: true,
	}

	return (
		<div className="p-8 space-y-8 max-w-6xl mx-auto">
			<h1 className="text-2xl font-bold mb-4">ReadTool Component Test</h1>

			<div className="space-y-6">
				<div>
					<h2 className="text-xl font-semibold mb-2">1. Successful Read</h2>
					<ReadTool {...mockReadToolProps} />
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">2. Error Case</h2>
					<ReadTool {...errorExample} />
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">3. Truncated File</h2>
					<ReadTool {...truncatedExample} />
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">4. Large File (Collapsed by Default)</h2>
					<ReadTool
						{...mockReadToolProps}
						content={`${mockReadToolProps.content}\n`.repeat(100)}
						totalLines={1000}
						description="Large file auto-collapsed"
					/>
				</div>
			</div>
		</div>
	)
}

"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WriteTool } from "@/components/tools/write"

export default function WriteToolPage() {
	const timestamp = new Date().toISOString()

	return (
		<div className="min-h-screen bg-gray-950 p-8">
			<div className="max-w-6xl mx-auto">
				<Link
					href="/tools"
					className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Tools
				</Link>

				<h1 className="text-3xl font-bold text-white mb-8">Write Tool Examples</h1>

				<div className="space-y-8">
					{/* Example 1: Create new file */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">1. Create New File</h2>
						<WriteTool
							id="write-1"
							uuid="uuid-write-1"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							filePath="/src/components/NewComponent.tsx"
							content={`import React from 'react';

export const NewComponent: React.FC = () => {
  return (
    <div className="p-4 rounded-lg bg-gray-800">
      <h2 className="text-xl font-bold">New Component</h2>
      <p className="text-gray-400">This component was just created!</p>
    </div>
  );
};`}
							created={true}
							fileSize={245}
							totalLines={10}
							fileType="tsx"
							duration={34}
							description="Creating new React component"
						/>
					</section>

					{/* Example 2: Overwrite existing file */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">2. Overwrite Existing File</h2>
						<WriteTool
							id="write-2"
							uuid="uuid-write-2"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							filePath="/config/settings.json"
							content={`{
  "appName": "Claude Codex",
  "version": "2.0.0",
  "features": {
    "darkMode": true,
    "animations": true,
    "telemetry": false
  },
  "api": {
    "endpoint": "https://api.claudecodex.com",
    "timeout": 30000,
    "retries": 3
  }
}`}
							overwritten={true}
							fileSize={234}
							totalLines={14}
							fileType="json"
							duration={28}
							description="Updating configuration file"
						/>
					</section>

					{/* Example 3: Write error */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">3. Write Permission Error</h2>
						<WriteTool
							id="write-3"
							uuid="uuid-write-3"
							timestamp={timestamp}
							status={{ normalized: "failed", original: "error" }}
							filePath="/etc/system.conf"
							content="system.protected=true"
							errorMessage="Permission denied: cannot write to /etc/system.conf"
						/>
					</section>

					{/* Example 4: Create markdown file */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">4. Create Documentation</h2>
						<WriteTool
							id="write-4"
							uuid="uuid-write-4"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							filePath="/docs/API.md"
							content={`# API Documentation

## Overview
This document describes the Claude Codex API endpoints.

## Authentication
All API requests require a valid API key in the header:
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

### GET /api/tools
Returns a list of available tools.

**Response:**
\`\`\`json
{
  "tools": [
    {
      "id": "bash",
      "name": "Bash Tool",
      "description": "Execute bash commands"
    }
  ]
}
\`\`\`

### POST /api/execute
Execute a tool with given parameters.

**Request Body:**
\`\`\`json
{
  "tool": "bash",
  "input": {
    "command": "echo 'Hello World'"
  }
}
\`\`\``}
							created={true}
							fileSize={678}
							totalLines={40}
							fileType="md"
							duration={45}
							description="Creating API documentation"
						/>
					</section>

					{/* Example 5: Create empty file */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">5. Create Empty File</h2>
						<WriteTool
							id="write-5"
							uuid="uuid-write-5"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							filePath="/src/utils/constants.ts"
							content=""
							created={true}
							fileSize={0}
							totalLines={0}
							fileType="ts"
							duration={12}
							description="Creating empty constants file"
						/>
					</section>

					{/* Example 6: Running state */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">6. Writing in Progress</h2>
						<WriteTool
							id="write-6"
							uuid="uuid-write-6"
							timestamp={timestamp}
							status={{ normalized: "running" }}
							filePath="/output/large-data.json"
							content=""
							description="Writing large data file..."
						/>
					</section>
				</div>
			</div>
		</div>
	)
}

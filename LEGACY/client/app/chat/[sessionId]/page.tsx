"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShellWrapper } from "@/components/app-shell-wrapper";
import { AssistantMessage } from "@/components/chat-items/assistant-message";
// Import UI components from local chat-items
import { BashTool } from "@/components/chat-items/bash-tool";
import { EditTool } from "@/components/chat-items/edit-tool";
import { FallbackTool } from "@/components/chat-items/fallback-tool";
import { GlobTool } from "@/components/chat-items/glob-tool";
import { GrepTool } from "@/components/chat-items/grep-tool";
import { LsTool } from "@/components/chat-items/ls-tool";
import { MCPSequentialThinkingTool } from "@/components/chat-items/mcp-sequential-thinking-tool";
import { MultiEditTool } from "@/components/chat-items/multi-edit-tool";
import { NativeThinkingBlock } from "@/components/chat-items/native-thinking-block";
import { ReadTool } from "@/components/chat-items/read-tool";
import { ThinkingBlock } from "@/components/chat-items/thinking-block";
import { UserMessage } from "@/components/chat-items/user-message";

// Import fixtures from local files
import bashFixtures from "@/fixtures/bash-tool-fixtures.json";
import editFixtures from "@/fixtures/edit-tool-fixtures.json";
import globFixtures from "@/fixtures/glob-tool-fixtures.json";
import grepFixtures from "@/fixtures/grep-tool-fixtures.json";
import lsFixtures from "@/fixtures/ls-tool-fixtures.json";
import mcpContext7Fixtures from "@/fixtures/mcp-context7-fixtures.json";
import mcpPuppeteerFixtures from "@/fixtures/mcp-puppeteer-fixtures.json";
import mcpSequentialFixtures from "@/fixtures/mcp-sequential-thinking-fixtures.json";
import multiEditFixtures from "@/fixtures/multiedit-tool-fixtures.json";
import readFixtures from "@/fixtures/read-tool-fixtures.json";
import todoReadFixtures from "@/fixtures/todoread-tool-fixtures.json";
import todoWriteFixtures from "@/fixtures/todowrite-tool-fixtures.json";
import writeFixtures from "@/fixtures/write-tool-fixtures.json";

interface SessionConfig {
	projectType: "github" | "new";
	githubRepo?: string;
	githubBranch?: string;
	projectName?: string;
	model: string;
	mcpTools: string[];
	prd?: string;
	description: string;
}

export default function ChatPage() {
	const params = useParams();
	const sessionId = params.sessionId as string;
	const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);

	useEffect(() => {
		// Load session config from storage (in a real app, this would be from an API)
		if (typeof window !== "undefined") {
			const stored = sessionStorage.getItem(`session-${sessionId}`);
			if (stored) {
				setSessionConfig(JSON.parse(stored));
			}
		}
	}, [sessionId]);

	return (
		<AppShellWrapper variant="full">
			<div className="flex-1 space-y-4">
				{/* User Message Example */}
				<UserMessage content="Show me all available tool types with examples" />

				{/* Assistant Message Example */}
				<AssistantMessage content="I'll show you all available tool types with real examples from the fixtures:" />

				{/* Thinking Block Examples */}
				<div className="space-y-4">
					<h2 className="text-lg font-semibold">Thinking Examples</h2>

					{/* Standalone Thinking Block */}
					<ThinkingBlock
						thought="Let me gather all the tool examples to display them properly..."
						thoughtNumber={1}
						totalThoughts={1}
						nextThoughtNeeded={false}
					/>

					{/* Native Thinking Block with Message */}
					<NativeThinkingBlock
						thinking="I need to analyze the codebase structure first to understand how the components are organized. This will help me provide better examples."
						associatedWith="message"
						associatedContent={
							<AssistantMessage content="Based on my analysis, here are all the available tool types:" />
						}
					/>

					{/* Native Thinking Block with Tool Call */}
					<NativeThinkingBlock
						thinking="I should check the file system to see what tools are available."
						associatedWith="tool_call"
						associatedContent={null}
					/>
				</div>

				{/* File Operations */}
				<div className="space-y-4">
					<h2 className="text-lg font-semibold">File Operations</h2>

					{/* Read Tool */}
					{readFixtures.basic?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">
								Read Tool (TEMPORARILY DISABLED - MIGRATION IN PROGRESS)
							</h3>
							<div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded text-yellow-300">
								ReadTool migration in progress. Use test pages to view migrated components.
							</div>
						</div>
					)}

					{/* Write Tool - Using Fallback */}
					{false && writeFixtures.basic?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Write Tool</h3>
							<FallbackTool
								toolUse={writeFixtures.basic[0].toolUse as any}
								toolResult={writeFixtures.basic[0].toolUseResult}
								status="completed"
								timestamp={new Date().toISOString()}
							/>
						</div>
					)}

					{/* Edit Tool */}
					{false &&
						editFixtures.fixtures?.[0] &&
						editFixtures.fixtures[0].toolResult?.toolUseResult && (
							<div>
								<h3 className="text-sm font-medium mb-2">Edit Tool</h3>
								<EditTool
									filePath={editFixtures.fixtures[0].toolCall.tool.input.file_path}
									oldContent={
										(editFixtures.fixtures[0].toolResult.toolUseResult as any).oldContent || ""
									}
									newContent={
										(editFixtures.fixtures[0].toolResult.toolUseResult as any).newContent || ""
									}
								/>
							</div>
						)}

					{/* Multi-Edit Tool */}
					{false && (multiEditFixtures as any).fixtures?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Multi-Edit Tool</h3>
							<FallbackTool
								toolUse={{ type: "tool_use", id: "multi-edit-tool", name: "MultiEdit", input: {} }}
								toolResult={(multiEditFixtures as any).fixtures[0].toolResult?.toolUseResult || {}}
								status="completed"
								timestamp={new Date().toISOString()}
							/>
						</div>
					)}
				</div>

				{/* Search & Discovery */}
				<div className="space-y-4">
					<h2 className="text-lg font-semibold">Search & Discovery</h2>

					{/* LS Tool */}
					{lsFixtures.fixtures?.[0] &&
						lsFixtures.fixtures[0].toolResult?.toolUseResult?.entries && (
							<div>
								<h3 className="text-sm font-medium mb-2">LS Tool</h3>
								<LsTool
									path={lsFixtures.fixtures[0].toolCall.tool.input.path}
									files={lsFixtures.fixtures[0].toolResult.toolUseResult.entries}
									command={`ls ${lsFixtures.fixtures[0].toolCall.tool.input.path}`}
								/>
							</div>
						)}

					{/* Glob Tool */}
					{globFixtures.fixtures?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Glob Tool (MIGRATED - USE TEST PAGE)</h3>
							<div className="p-4 bg-green-900/20 border border-green-500/30 rounded text-green-300">
								✅ Glob Tool successfully migrated! Visit{" "}
								<code className="bg-green-800/30 px-1 rounded">/test-glob-only</code> to see the new
								contract-compliant version.
							</div>
						</div>
					)}

					{/* Grep Tool */}
					{grepFixtures.fixtures?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Grep Tool</h3>
							<FallbackTool
								toolUse={{ id: "grep-tool", name: "Grep" }}
								toolResult={grepFixtures.fixtures[0].toolResult?.toolUseResult || {}}
							/>
						</div>
					)}
				</div>

				{/* System Operations */}
				<div className="space-y-4">
					<h2 className="text-lg font-semibold">System Operations</h2>

					{/* Bash Tool */}
					{bashFixtures.fixtures?.[0] && bashFixtures.fixtures[0].toolResult?.toolUseResult && (
						<div>
							<h3 className="text-sm font-medium mb-2">Bash Tool</h3>
							<BashTool
								command={bashFixtures.fixtures[0].toolCall.tool.input.command}
								output={bashFixtures.fixtures[0].toolResult.toolUseResult.stdout || ""}
								status="completed"
							/>
						</div>
					)}
				</div>

				{/* Task Management */}
				<div className="space-y-4">
					<h2 className="text-lg font-semibold">Task Management</h2>

					{/* Todo Read Tool - Using Fallback */}
					{todoReadFixtures.fixtures?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Todo Read Tool</h3>
							<FallbackTool
								toolUse={{ id: "todo-read-tool", name: "TodoRead" }}
								toolResult={todoReadFixtures.fixtures[0].toolResult?.toolUseResult || {}}
							/>
						</div>
					)}

					{/* Todo Write Tool - Using Fallback */}
					{todoWriteFixtures.fixtures?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Todo Write Tool</h3>
							<FallbackTool
								toolUse={{ id: "todo-write-tool", name: "TodoWrite" }}
								toolResult={todoWriteFixtures.fixtures[0].toolResult?.toolUseResult || {}}
							/>
						</div>
					)}
				</div>

				{/* MCP Integrations */}
				<div className="space-y-4">
					<h2 className="text-lg font-semibold">MCP Integrations</h2>

					{/* Sequential Thinking */}
					{mcpSequentialFixtures.fixtures?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Sequential Thinking</h3>
							<MCPSequentialThinkingTool
								toolUse={{
									id: mcpSequentialFixtures.fixtures[0].toolCall.tool.id,
									name: "mcp__sequential_thinking",
									input: {
										thought: "Breaking down the problem into steps...",
										thoughtNumber: 1,
										totalThoughts: 3,
										nextThoughtNeeded: true,
									},
								}}
								toolResult={mcpSequentialFixtures.fixtures[0].toolResult?.toolUseResult || {}}
								status="completed"
							/>
						</div>
					)}

					{/* Context7 - Using Fallback */}
					{mcpContext7Fixtures.fixtures?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Context7</h3>
							<FallbackTool
								toolUse={{ id: "mcp-context7", name: "MCP Context7" }}
								toolResult={mcpContext7Fixtures.fixtures[0].toolResult?.toolUseResult || {}}
							/>
						</div>
					)}

					{/* Puppeteer - Using Fallback */}
					{mcpPuppeteerFixtures.fixtures?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Puppeteer</h3>
							<FallbackTool
								toolUse={{ id: "mcp-puppeteer", name: "MCP Puppeteer" }}
								toolResult={mcpPuppeteerFixtures.fixtures[0].toolResult?.toolUseResult || {}}
							/>
						</div>
					)}
				</div>

				{/* Complete Conversation Flow Example */}
				<div className="space-y-4">
					<h2 className="text-lg font-semibold">Complete Conversation Flow</h2>

					<UserMessage content="Can you help me find all TypeScript files in my project and show me the main index file?" />

					<NativeThinkingBlock
						thinking="The user wants to find TypeScript files. I'll use the glob tool to search for *.ts files first."
						associatedWith="tool_call"
						associatedContent={
							globFixtures.fixtures?.[0] &&
							globFixtures.fixtures[0].toolResult?.toolUseResult?.matches && (
								<GlobTool
									pattern="**/*.ts"
									matches={globFixtures.fixtures[0].toolResult.toolUseResult.matches.map(
										(m: string) => ({ filePath: m }),
									)}
									command={`glob "**/*.ts"`}
								/>
							)
						}
					/>

					<ThinkingBlock
						thought="Now I need to read the main index.ts file to show its contents to the user."
						thoughtNumber={2}
						totalThoughts={2}
						nextThoughtNeeded={false}
					/>

					{readFixtures.basic?.[0] && (
						<ReadTool
							filePath="/Users/example/project/src/index.ts"
							content={readFixtures.basic[0].toolResult.output.content}
							totalLines={readFixtures.basic[0].toolResult.output.totalLines}
						/>
					)}

					<AssistantMessage content="I found 5 TypeScript files in your project. Here's the content of the main index.ts file shown above. The file sets up a simple HTTP server using Node.js." />
				</div>
			</div>
		</AppShellWrapper>
	);
}

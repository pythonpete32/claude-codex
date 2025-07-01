"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { AppShellWrapper } from "@/components/app-shell-wrapper"
import { AssistantMessage } from "@/components/chat-items/assistant-message"
// Import UI components from local chat-items
import { BashTool } from "@/components/chat-items/bash-tool"
import { EditTool } from "@/components/chat-items/edit-tool"
import { FallbackTool } from "@/components/chat-items/fallback-tool"
import { GlobTool } from "@/components/chat-items/glob-tool"
import { GrepTool } from "@/components/chat-items/grep-tool"
import { LsTool } from "@/components/chat-items/ls-tool"
import { MCPSequentialThinkingTool } from "@/components/chat-items/mcp-sequential-thinking-tool"
import { MultiEditTool } from "@/components/chat-items/multi-edit-tool"
import { NativeThinkingBlock } from "@/components/chat-items/native-thinking-block"
import { ReadTool } from "@/components/chat-items/read-tool"
import { ThinkingBlock } from "@/components/chat-items/thinking-block"
import { UserMessage } from "@/components/chat-items/user-message"

// Import fixtures from local files
import bashFixtures from "@/fixtures/bash-tool-fixtures.json"
import editFixtures from "@/fixtures/edit-tool-fixtures.json"
import globFixtures from "@/fixtures/glob-tool-fixtures.json"
import grepFixtures from "@/fixtures/grep-tool-fixtures.json"
import lsFixtures from "@/fixtures/ls-tool-fixtures.json"
import mcpContext7Fixtures from "@/fixtures/mcp-context7-fixtures.json"
import mcpPuppeteerFixtures from "@/fixtures/mcp-puppeteer-fixtures.json"
import mcpSequentialFixtures from "@/fixtures/mcp-sequential-thinking-fixtures.json"
import multiEditFixtures from "@/fixtures/multiedit-tool-fixtures.json"
import readFixtures from "@/fixtures/read-tool-fixtures.json"
import todoReadFixtures from "@/fixtures/todoread-tool-fixtures.json"
import todoWriteFixtures from "@/fixtures/todowrite-tool-fixtures.json"
import writeFixtures from "@/fixtures/write-tool-fixtures.json"

interface SessionConfig {
	projectType: "github" | "new"
	githubRepo?: string
	githubBranch?: string
	projectName?: string
	model: string
	mcpTools: string[]
	prd?: string
	description: string
}

export default function ChatPage() {
	const params = useParams()
	const sessionId = params.sessionId as string
	const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null)

	useEffect(() => {
		// Load session config from storage (in a real app, this would be from an API)
		if (typeof window !== "undefined") {
			const stored = sessionStorage.getItem(`session-${sessionId}`)
			if (stored) {
				setSessionConfig(JSON.parse(stored))
			}
		}
	}, [sessionId])

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
							<h3 className="text-sm font-medium mb-2">Read Tool</h3>
							<ReadTool
								filePath={readFixtures.basic[0].toolUse.input.file_path}
								content={
									typeof readFixtures.basic[0].toolResult.output === "object"
										? readFixtures.basic[0].toolResult.output.content
										: readFixtures.basic[0].toolResult.output
								}
								status="completed"
								timestamp={new Date().toISOString()}
								totalLines={
									typeof readFixtures.basic[0].toolResult.output === "object"
										? readFixtures.basic[0].toolResult.output.totalLines
										: undefined
								}
								showLineNumbers={true}
							/>
						</div>
					)}

					{/* Write Tool - Using Fallback */}
					{writeFixtures.basic?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Write Tool</h3>
							<FallbackTool
								toolUse={{
									...writeFixtures.basic[0].toolUse,
									type: "tool_use" as const,
								}}
								status="completed"
								timestamp={new Date().toISOString()}
								toolResult={writeFixtures.basic[0].toolResult || {}}
							/>
						</div>
					)}

					{/* Edit Tool */}
					{editFixtures.fixtures?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Edit Tool</h3>
							<EditTool
								toolUse={{
									...editFixtures.fixtures[0].toolCall.tool,
									type: "tool_use" as const,
								}}
								status="completed"
								timestamp={new Date().toISOString()}
								toolResult={editFixtures.fixtures[0].expectedComponentData.props.toolResult}
							/>
						</div>
					)}

					{/* Multi-Edit Tool */}
					{multiEditFixtures.basic?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Multi-Edit Tool</h3>
							<MultiEditTool
								fileEdits={[
									{
										filePath: multiEditFixtures.basic[0].toolUse.input.file_path,
										oldContent: "// Original content",
										newContent: "// Updated content with edits applied",
										summary: `Applied ${multiEditFixtures.basic[0].toolUse.input.edits.length} edits`,
									},
								]}
								status="completed"
								timestamp={new Date().toISOString()}
								editsApplied={multiEditFixtures.basic[0].toolUse.input.edits.length}
								totalEdits={multiEditFixtures.basic[0].toolUse.input.edits.length}
							/>
						</div>
					)}
				</div>

				{/* Search & Discovery */}
				<div className="space-y-4">
					<h2 className="text-lg font-semibold">Search & Discovery</h2>

					{/* LS Tool */}
					{lsFixtures.fixtures?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">LS Tool</h3>
							<LsTool
								toolUse={{
									...lsFixtures.fixtures[0].toolCall.tool,
									type: "tool_use" as const,
									name: "LS" as const,
								}}
								status="completed"
								timestamp={new Date().toISOString()}
								toolResult={{
									...lsFixtures.fixtures[0].expectedComponentData.props.toolResult,
									entries: lsFixtures.fixtures[0].expectedComponentData.props.toolResult.entries.map((entry: any) => ({
										...entry,
										type: entry.type as "file" | "directory",
									})),
								}}
							/>
						</div>
					)}

					{/* Glob Tool */}
					{globFixtures.fixtures?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Glob Tool</h3>
							<GlobTool
								toolUse={{
									...globFixtures.fixtures[0].toolCall.tool,
									type: "tool_use" as const,
									name: "Glob" as const,
								}}
								status="completed"
								timestamp={new Date().toISOString()}
								toolResult={globFixtures.fixtures[0].expectedComponentData.props.toolResult}
							/>
						</div>
					)}

					{/* Grep Tool */}
					{grepFixtures.fixtures?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Grep Tool</h3>
							<GrepTool
								pattern={grepFixtures.fixtures[0].toolCall.tool.input.pattern}
								searchPath={grepFixtures.fixtures[0].toolCall.tool.input.path}
								fileMatches={[
									{
										filePath: "./src/example.ts",
										totalMatches: 2,
										matches: [
											{
												line: 1,
												content: `example pattern match`,
												matchStart: 8,
												matchEnd: 15,
											},
										],
									},
								]}
								status="completed"
								timestamp={grepFixtures.fixtures[0].toolCall.timestamp}
							/>
						</div>
					)}
				</div>

				{/* System Operations */}
				<div className="space-y-4">
					<h2 className="text-lg font-semibold">System Operations</h2>

					{/* Bash Tool */}
					{bashFixtures.fixtures?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Bash Tool</h3>
							<BashTool
								command={bashFixtures.fixtures[0].toolCall.tool.input.command}
								description={bashFixtures.fixtures[0].toolCall.tool.input.description}
								output={
									typeof bashFixtures.fixtures[0].toolResult?.toolUseResult === "object"
										? bashFixtures.fixtures[0].toolResult.toolUseResult?.stdout || ""
										: ""
								}
								status="completed"
								timestamp={bashFixtures.fixtures[0].toolCall.timestamp}
							/>
						</div>
					)}
				</div>

				{/* Task Management */}
				<div className="space-y-4">
					<h2 className="text-lg font-semibold">Task Management</h2>

					{/* Todo Read Tool - Using Fallback */}
					{todoReadFixtures.basic?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Todo Read Tool</h3>
							<FallbackTool
								toolUse={{
									...todoReadFixtures.basic[0].toolUse,
									type: "tool_use" as const,
								}}
								status="completed"
								timestamp={new Date().toISOString()}
								toolResult={todoReadFixtures.basic[0].toolUseResult || {}}
							/>
						</div>
					)}

					{/* Todo Write Tool - Using Fallback */}
					{todoWriteFixtures.basic?.[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Todo Write Tool</h3>
							<FallbackTool
								toolUse={{
									...todoWriteFixtures.basic[0].toolUse,
									type: "tool_use" as const,
								}}
								status="completed"
								timestamp={new Date().toISOString()}
								toolResult={todoWriteFixtures.basic[0].toolUseResult || {}}
							/>
						</div>
					)}
				</div>

				{/* MCP Integrations */}
				<div className="space-y-4">
					<h2 className="text-lg font-semibold">MCP Integrations</h2>

					{/* Sequential Thinking */}
					{mcpSequentialFixtures[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Sequential Thinking</h3>
							<MCPSequentialThinkingTool
								toolUse={{
									...mcpSequentialFixtures[0].data.toolUse,
									type: "tool_use" as const,
									input: {
										workflow: {
											...mcpSequentialFixtures[0].data.toolUse.input.workflow,
											status: mcpSequentialFixtures[0].data.toolUse.input.workflow.status as
												| "active"
												| "completed"
												| "paused"
												| "failed",
											priority: mcpSequentialFixtures[0].data.toolUse.input.workflow.priority as
												| "low"
												| "medium"
												| "high"
												| "critical",
											steps: mcpSequentialFixtures[0].data.toolUse.input.workflow.steps.map((step: any) => ({
												...step,
												status: step.status as "pending" | "in_progress" | "completed" | "blocked" | "failed",
												priority: step.priority as "low" | "medium" | "high" | "critical",
											})),
										},
										mode: mcpSequentialFixtures[0].data.toolUse.input.mode as "create" | "update" | "complete",
										stepId: mcpSequentialFixtures[0].data.toolUse.input.stepId,
									},
								}}
								status="completed"
								timestamp={new Date().toISOString()}
								toolResult={
									mcpSequentialFixtures[0].data.toolUseResult
										? {
												output: {
													...mcpSequentialFixtures[0].data.toolUseResult.output,
													workflow: {
														...mcpSequentialFixtures[0].data.toolUseResult.output.workflow,
														status: mcpSequentialFixtures[0].data.toolUseResult.output.workflow.status as
															| "active"
															| "completed"
															| "paused"
															| "failed",
														priority: mcpSequentialFixtures[0].data.toolUseResult.output.workflow.priority as
															| "low"
															| "medium"
															| "high"
															| "critical",
														steps: mcpSequentialFixtures[0].data.toolUseResult.output.workflow.steps.map(
															(step: any) => ({
																...step,
																status: step.status as "pending" | "in_progress" | "completed" | "blocked" | "failed",
																priority: step.priority as "low" | "medium" | "high" | "critical",
															}),
														),
													},
												},
											}
										: undefined
								}
							/>
						</div>
					)}

					{/* Context7 - Using Fallback */}
					{mcpContext7Fixtures[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Context7</h3>
							<FallbackTool
								toolUse={{
									...mcpContext7Fixtures[0].data.toolUse,
									type: "tool_use" as const,
								}}
								status="completed"
								timestamp={new Date().toISOString()}
								toolResult={mcpContext7Fixtures[0].data.toolUseResult || {}}
							/>
						</div>
					)}

					{/* Puppeteer - Using Fallback */}
					{mcpPuppeteerFixtures[0] && (
						<div>
							<h3 className="text-sm font-medium mb-2">Puppeteer</h3>
							<FallbackTool
								toolUse={{
									...mcpPuppeteerFixtures[0].data.toolUse,
									type: "tool_use" as const,
								}}
								status="completed"
								timestamp={new Date().toISOString()}
								toolResult={mcpPuppeteerFixtures[0].data.toolUseResult || {}}
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
							globFixtures.fixtures?.[0] && (
								<GlobTool
									toolUse={{
										...globFixtures.fixtures[0].toolCall.tool,
										type: "tool_use" as const,
										name: "Glob" as const,
										input: { pattern: "**/*.ts" },
									}}
									status="completed"
									timestamp={new Date().toISOString()}
									toolResult={globFixtures.fixtures[0].expectedComponentData.props.toolResult}
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
							content={
								typeof readFixtures.basic[0].toolResult.output === "object"
									? readFixtures.basic[0].toolResult.output.content
									: readFixtures.basic[0].toolResult.output
							}
							status="completed"
							timestamp={new Date().toISOString()}
							totalLines={
								typeof readFixtures.basic[0].toolResult.output === "object"
									? readFixtures.basic[0].toolResult.output.totalLines
									: undefined
							}
							showLineNumbers={true}
						/>
					)}

					<AssistantMessage content="I found 5 TypeScript files in your project. Here's the content of the main index.ts file shown above. The file sets up a simple HTTP server using Node.js." />
				</div>
			</div>
		</AppShellWrapper>
	)
}

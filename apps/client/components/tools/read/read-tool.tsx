"use client"

import React from "react"
import type { ReadToolProps } from "@claude-codex/types"
import { Clock } from "lucide-react"
import { TerminalText } from "@/shared/terminal-styles"
import { createToolComponent } from "../base/base-tool"

interface ReadToolUIProps extends ReadToolProps {
	description?: string
	startLine?: number
	endLine?: number
	onFileClick?: (filePath: string) => void
}

export const ReadTool = createToolComponent<ReadToolUIProps>((props) => {
	const {
		filePath,
		content = "",
		fileSize,
		totalLines,
		truncated,
		language,
		errorMessage,
		showLineNumbers = true,
		wordWrap,
		maxHeight = "500px",
		startLine,
		endLine,
		onFileClick,
	} = props

	const commandName = "cat"
	const fileName = filePath.split("/").pop() || filePath
	const fileExtension = filePath.match(/\.(\w+)$/)?.[1] || ""

	// Helper to format file size
	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	}

	// Prepare content with line numbers
	const renderContent = () => {
		if (!content) {
			return (
				<div className="text-center py-4">
					<TerminalText variant="stdout" className="text-gray-400 italic">
						Empty file
					</TerminalText>
				</div>
			)
		}

		const lines = content.split("\n")
		const actualStartLine = startLine || 1
		const actualEndLine = endLine || lines.length

		return (
			<div
				className={`font-mono text-sm overflow-x-auto ${wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"}`}
			>
				{lines.slice(actualStartLine - 1, actualEndLine).map((lineContent, index) => {
					const currentLineNumber = actualStartLine + index
					return (
						<div key={currentLineNumber} className="group">
							{showLineNumbers && (
								<>
									<span
										className="inline-block w-12 text-right select-none text-gray-500 mr-4 cursor-pointer hover:text-gray-300"
										onClick={() => onFileClick?.(filePath)}
									>
										{currentLineNumber}
									</span>
									<span className="text-gray-600 select-none">│</span>
								</>
							)}
							<span className="ml-2">{lineContent || " "}</span>
						</div>
					)
				})}
			</div>
		)
	}

	return {
		renderCommand: () => `${commandName} ${filePath}`,
		renderCommandName: () => commandName,
		renderOutput: renderContent,
		renderFooter: () => (
			<div className="flex items-center justify-between gap-4 text-xs text-gray-500">
				<div className="flex items-center gap-2">
					<span className="text-blue-400 hover:underline cursor-pointer" onClick={() => onFileClick?.(filePath)}>
						{fileName}
					</span>
					{fileExtension && <span className="text-gray-500">({fileExtension})</span>}
				</div>
				<div className="flex items-center gap-2">
					{(fileSize !== undefined || totalLines !== undefined) && (
						<span>
							{fileSize !== undefined && formatFileSize(fileSize)}
							{fileSize !== undefined && totalLines !== undefined && " • "}
							{totalLines !== undefined && `${totalLines} lines`}
							{truncated && " • truncated"}
						</span>
					)}
					<Clock className="h-3 w-3" />
					<span>{new Date(props.timestamp).toLocaleTimeString()}</span>
				</div>
			</div>
		),
		renderPendingMessage: () => "Opening file...",
		renderRunningMessage: () => "Reading file contents...",
		renderFailedMessage: () => errorMessage || "Failed to read file",
		shouldFold: () => (totalLines || content.split("\n").length) > 50,
		defaultFolded: () => (totalLines || content.split("\n").length) > 200,
		maxHeight,
		showCopyButton: true,
		errorMessage,
	}
})

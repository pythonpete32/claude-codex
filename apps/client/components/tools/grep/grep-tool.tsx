"use client"

import React from "react"
import type { GrepToolProps, SearchResult } from "@claude-codex/types"
import { Clock, FileText, Search } from "lucide-react"
import { TerminalText } from "@/shared/terminal-styles"
import { createToolComponent } from "../base/base-tool"

interface GrepToolUIProps extends GrepToolProps {
	description?: string
	onMatchClick?: (filePath: string, lineNumber?: number) => void
}

export const GrepTool = createToolComponent<GrepToolUIProps>((props) => {
	const { input, results, ui, onMatchClick } = props

	const commandName = "grep"
	const pattern = input.pattern
	const searchPath = input.searchPath || "."
	const { totalMatches, filesWithMatches } = ui

	// Build grep command with options
	const buildCommand = () => {
		const parts = [commandName]
		if (input.useRegex) parts.push("-E")
		if (!input.caseSensitive) parts.push("-i")
		if (input.filePatterns?.length) {
			parts.push("--include=" + input.filePatterns.join(","))
		}
		parts.push(`"${pattern}"`)
		parts.push(searchPath)
		return parts.join(" ")
	}

	// Render search results
	const renderResults = () => {
		if (!results || results.length === 0) {
			return (
				<div className="text-center py-8">
					<Search className="h-12 w-12 text-gray-600 mx-auto mb-3" />
					<TerminalText variant="stdout" className="text-gray-400">
						No matches found for &quot;{pattern}&quot;
					</TerminalText>
				</div>
			)
		}

		return (
			<div className="space-y-4">
				{results.map((result: SearchResult, fileIndex: number) => (
					<div key={fileIndex} className="border-l-2 border-gray-700 pl-4">
						<div className="flex items-center gap-2 mb-2">
							<FileText className="h-4 w-4 text-blue-400" />
							<span
								className="text-blue-400 hover:underline cursor-pointer font-medium"
								onClick={() => onMatchClick?.(result.filePath)}
							>
								{result.filePath}
							</span>
							<span className="text-gray-500 text-sm">
								({result.matchCount} {result.matchCount === 1 ? "match" : "matches"})
							</span>
						</div>
						<div className="space-y-1 ml-6">
							{result.matches.map((match, matchIndex) => (
								<div
									key={matchIndex}
									className="flex gap-2 hover:bg-gray-800/50 px-2 py-1 rounded cursor-pointer group"
									onClick={() => onMatchClick?.(result.filePath, match.lineNumber)}
								>
									<span className="text-gray-500 select-none w-12 text-right flex-shrink-0">{match.lineNumber}</span>
									<span className="text-gray-600 select-none">│</span>
									<span className="flex-1 font-mono text-sm whitespace-pre-wrap break-all">
										{match.lineContent.substring(0, match.matchStart)}
										<span className="bg-yellow-500/30 text-yellow-200">
											{match.lineContent.substring(match.matchStart, match.matchEnd)}
										</span>
										{match.lineContent.substring(match.matchEnd)}
									</span>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		)
	}

	return {
		renderCommand: buildCommand,
		renderCommandName: () => commandName,
		renderOutput: renderResults,
		renderFooter: () => (
			<div className="flex items-center justify-between gap-4 text-xs text-gray-500">
				<div>
					Found <span className="text-yellow-400 font-medium">{totalMatches}</span>{" "}
					{totalMatches === 1 ? "match" : "matches"} in{" "}
					<span className="text-blue-400 font-medium">{filesWithMatches}</span>{" "}
					{filesWithMatches === 1 ? "file" : "files"}
				</div>
				<div className="flex items-center gap-2">
					{ui.searchTime !== undefined && <span>Search completed in {ui.searchTime}ms</span>}
					<Clock className="h-3 w-3" />
					<span>{new Date(props.timestamp).toLocaleTimeString()}</span>
				</div>
			</div>
		),
		renderPendingMessage: () => "Preparing search...",
		renderRunningMessage: () => `Searching for "${pattern}"...`,
		shouldFold: () => totalMatches > 20,
		defaultFolded: () => totalMatches > 100,
		maxHeight: "600px",
		showCopyButton: true,
	}
})

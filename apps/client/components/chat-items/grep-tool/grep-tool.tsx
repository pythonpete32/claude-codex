import type React from "react"
import { TerminalWindow } from "@/components/ui/terminal"
import { CopyButton } from "@/shared/copy-utils"
import { StatusBadge } from "@/shared/status-utils"
import { TerminalText } from "@/shared/terminal-styles"
import { TimeDisplay } from "@/shared/time-utils"

export interface GrepToolProps {
	pattern: string
	searchPath?: string
	fileMatches?: Array<{
		filePath: string
		totalMatches: number
		matches: Array<{
			line: number
			content: string
			matchStart: number
			matchEnd: number
		}>
	}>
	description?: string
	status?: "pending" | "completed" | "error" | "running"
	timestamp?: string
	onMatchClick?: (filePath: string) => void
	className?: string
}

export const GrepTool: React.FC<GrepToolProps> = ({
	pattern,
	searchPath,
	fileMatches,
	description,
	status = "completed",
	timestamp,
	onMatchClick,
	className,
}) => {
	// Render appropriate output based on status and fileMatches
	const renderOutput = () => {
		// Handle states without fileMatches
		if (!fileMatches || fileMatches.length === 0) {
			if (status === "pending") {
				return (
					<TerminalText variant="stdout">
						<div className="text-gray-400 italic">
							Searching for pattern &quot;{pattern}&quot;{searchPath && ` in ${searchPath}`}...
						</div>
					</TerminalText>
				)
			}
			if (status === "running") {
				return (
					<TerminalText variant="stdout">
						<div className="text-blue-400 italic">
							Searching for pattern &quot;{pattern}&quot;{searchPath && ` in ${searchPath}`}...
						</div>
					</TerminalText>
				)
			}
			if (status === "error") {
				return (
					<TerminalText variant="stderr">
						<div className="text-red-400 italic">Search operation failed</div>
					</TerminalText>
				)
			}
			// For completed without fileMatches, show no matches found
			return (
				<TerminalText variant="stdout">
					<div className="text-gray-500 italic">grep: no matches found</div>
				</TerminalText>
			)
		}

		// Show search results
		return renderSearchResults()
	}

	// Render search results from fileMatches
	const renderSearchResults = () => {
		if (!fileMatches || fileMatches.length === 0) {
			return (
				<TerminalText variant="stdout">
					<div className="text-gray-500 italic">grep: no matches found</div>
				</TerminalText>
			)
		}

		const results: React.ReactNode[] = []

		fileMatches.forEach((fileMatch, fileIndex) => {
			// Add file header
			results.push(
				<div
					key={`file-${fileIndex}`}
					className="font-mono text-sm mb-1 cursor-pointer text-purple-400 hover:text-purple-300"
					onClick={() => onMatchClick?.(fileMatch.filePath)}
				>
					{fileMatch.filePath} ({fileMatch.totalMatches} match{fileMatch.totalMatches !== 1 ? "es" : ""})
				</div>,
			)

			// Add individual matches
			fileMatch.matches.forEach((match, matchIndex) => {
				const beforeMatch = match.content.substring(0, match.matchStart)
				const matchText = match.content.substring(match.matchStart, match.matchEnd)
				const afterMatch = match.content.substring(match.matchEnd)

				results.push(
					<div
						key={`match-${fileIndex}-${matchIndex}`}
						className="font-mono text-sm pl-4 mb-1 hover:bg-gray-800/30 px-1"
					>
						<span className="text-gray-500 mr-2">{match.line}:</span>
						<span className="text-gray-300">{beforeMatch}</span>
						<span className="bg-yellow-600 text-black px-1 rounded">{matchText}</span>
						<span className="text-gray-300">{afterMatch}</span>
					</div>,
				)
			})
		})

		return <div className="space-y-0">{results}</div>
	}

	const output = <div className="max-h-80 overflow-y-auto">{renderOutput()}</div>

	// Build command and description
	let command = `grep -r "${pattern}"`
	if (searchPath) command += ` "${searchPath}"`

	const finalDescription =
		description ||
		(fileMatches && fileMatches.length > 0
			? `Found ${fileMatches.reduce((sum, file) => sum + file.totalMatches, 0)} matches in ${fileMatches.length} files`
			: `Searching for "${pattern}"`)

	// Calculate folding based on number of matches
	const totalMatches = fileMatches?.reduce((sum, file) => sum + file.totalMatches, 0) || 0
	const shouldFold = totalMatches > 10
	const defaultFolded = totalMatches > 20

	// Determine copy text
	const copyText =
		fileMatches
			?.map((file) => file.matches.map((match) => `${file.filePath}:${match.line}:${match.content}`).join("\n"))
			.join("\n") || ""

	return (
		<div className={className}>
			<div className="flex items-center gap-2 mb-2">
				<StatusBadge status={status as any} />
				{timestamp && <TimeDisplay timestamp={timestamp} />}
				{copyText && <CopyButton text={copyText} label="Copy matches" />}
			</div>
			<TerminalWindow
				command={command}
				description={finalDescription}
				output={output}
				status={status as any}
				timestamp={timestamp}
				foldable={shouldFold}
				defaultFolded={defaultFolded}
				maxHeight="400px"
			/>
		</div>
	)
}

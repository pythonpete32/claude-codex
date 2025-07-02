import type React from "react"
import { useMemo } from "react"
import { FileEdit, Clock } from "lucide-react"
import { TerminalWindow } from "@/components/ui/terminal"
import { TerminalText } from "@/shared/terminal-styles"
import type { EditToolProps as EditToolParserProps } from "@claude-codex/types"

// Component extends parser props with UI-specific options
export interface EditToolProps extends EditToolParserProps {
	description?: string
}

export const EditTool: React.FC<EditToolProps> = ({
	// From BaseToolProps
	id,
	uuid,
	parentUuid,
	timestamp,
	duration,
	status,
	className,
	metadata,

	// From FileToolProps
	filePath,
	content,
	fileSize,
	totalLines,
	fileType,
	encoding,
	errorMessage,
	showLineNumbers = true,
	wordWrap,
	maxHeight = "500px",
	onFileClick,

	// From EditToolProps
	oldContent,
	newContent,
	diff,

	// UI-specific
	description,
}) => {
	const fileName = filePath.split("/").pop() || filePath
	const command = `sed -i '' 's/${oldContent.substring(0, 30)}${oldContent.length > 30 ? "..." : ""}/${newContent.substring(0, 30)}${newContent.length > 30 ? "..." : ""}/g' "${filePath}"`
	const commandName = "sed"

	// Use normalized status from parser
	const normalizedStatus = status.normalized

	// Calculate diff stats
	const diffStats = useMemo(() => {
		if (!diff || diff.length === 0) return null

		let added = 0
		let removed = 0
		let unchanged = 0

		diff.forEach((line) => {
			if (line.type === "added") added++
			else if (line.type === "removed") removed++
			else unchanged++
		})

		return { added, removed, unchanged }
	}, [diff])

	// Error case
	if (normalizedStatus === "failed" || errorMessage) {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stderr" className="mb-2">
					{errorMessage || `Failed to edit ${fileName}`}
				</TerminalText>
			</div>
		)

		return (
			<TerminalWindow
				command={command}
				commandName={commandName}
				description={description}
				output={output}
				status={normalizedStatus}
				timestamp={timestamp}
				foldable={false}
				className={className}
			/>
		)
	}

	// Pending case
	if (normalizedStatus === "pending" || normalizedStatus === "running") {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stdout" className="text-gray-400 italic">
					Editing file...
				</TerminalText>
			</div>
		)

		return (
			<TerminalWindow
				command={command}
				commandName={commandName}
				description={description}
				output={output}
				status={normalizedStatus}
				timestamp={timestamp}
				foldable={false}
				className={className}
			/>
		)
	}

	// Format diff output
	const formatDiffOutput = () => {
		if (!diff || diff.length === 0) {
			return (
				<TerminalText variant="comment" className="italic">
					No changes detected
				</TerminalText>
			)
		}

		return (
			<div className="space-y-0">
				{diff.map((line, index) => {
					const prefix = line.type === "removed" ? "-" : line.type === "added" ? "+" : " "
					const color =
						line.type === "removed" ? "text-red-400" : line.type === "added" ? "text-green-400" : "text-gray-400"
					const bgColor = line.type === "removed" ? "bg-red-900/20" : line.type === "added" ? "bg-green-900/20" : ""

					if (showLineNumbers && line.lineNumber !== undefined) {
						return (
							<div key={index} className={`flex font-mono text-sm ${bgColor}`}>
								<span
									className="text-gray-500 mr-2 select-none min-w-[4rem] text-right cursor-pointer hover:text-gray-400"
									onClick={() => onFileClick?.(filePath)}
								>
									{line.lineNumber}
								</span>
								<span className={`${color} mr-2`}>{prefix}</span>
								<span className={`text-gray-300 ${wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"}`}>
									{line.content || " "}
								</span>
							</div>
						)
					}

					return (
						<div key={index} className={`font-mono text-sm px-1 ${bgColor}`}>
							<span className={`${color} mr-2`}>{prefix}</span>
							<span className={`text-gray-300 ${wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"}`}>
								{line.content || " "}
							</span>
						</div>
					)
				})}
			</div>
		)
	}

	const output = (
		<div>
			{/* Success message */}
			<div className="flex items-center gap-2 mb-4">
				<FileEdit className="h-4 w-4 text-blue-400" />
				<TerminalText variant="stdout" className="text-blue-400">
					File edited successfully
					{diffStats && (
						<span className="ml-2 text-gray-400">
							(+{diffStats.added} -{diffStats.removed})
						</span>
					)}
				</TerminalText>
			</div>

			{/* Diff output */}
			<div className="border border-gray-700 rounded-md p-2 bg-gray-900/50">
				<div className="max-h-96 overflow-y-auto" style={{ maxHeight }}>
					{formatDiffOutput()}
				</div>
			</div>
		</div>
	)

	// Determine if content should be foldable
	const shouldFold = diff && diff.length > 20
	const defaultFolded = diff && diff.length > 50

	// Build metadata info
	const metadataInfo: string[] = []
	if (diffStats) {
		metadataInfo.push(`+${diffStats.added} -${diffStats.removed}`)
	}
	if (fileType) metadataInfo.push(fileType.toUpperCase())
	const metadataString = metadataInfo.length > 0 ? ` (${metadataInfo.join(", ")})` : ""

	// Create footer with metadata
	const footer = (
		<div className="flex items-center justify-between text-xs text-gray-500">
			<span>
				{fileName}
				{metadataString}
			</span>
			{timestamp && (
				<span className="flex items-center">
					<Clock className="h-3 w-3 mr-1" />
					{new Date(timestamp).toLocaleString()}
				</span>
			)}
		</div>
	)

	return (
		<TerminalWindow
			command={command}
			commandName={commandName}
			description={description}
			output={output}
			footer={footer}
			status={normalizedStatus}
			timestamp={timestamp}
			foldable={shouldFold}
			defaultFolded={defaultFolded}
			maxHeight={maxHeight}
			showCopyButton={true}
			className={className}
		/>
	)
}

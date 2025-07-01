import type React from "react"
import { TerminalWindow } from "@/components/ui/terminal"
import { CopyButton } from "@/shared/copy-utils"
// Import shared utilities
import { StatusBadge, type ToolStatus } from "@/shared/status-utils"
import { TerminalText } from "@/shared/terminal-styles"
import { TimeDisplay } from "@/shared/time-utils"

// Updated interface to match story structure exactly
export interface ReadToolProps {
	filePath: string
	content: string
	description?: string
	status?: "pending" | "completed" | "failed" | "error"
	timestamp?: string
	fileSize?: number
	totalLines?: number
	startLine?: number
	endLine?: number
	showLineNumbers?: boolean
	className?: string
}

// Helper functions for formatting
function formatFileSize(bytes?: number): string {
	if (!bytes) return ""
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileExtension(filePath: string): string {
	return filePath.split(".").pop()?.toLowerCase() || ""
}

function isBinaryContent(content: string): boolean {
	// Detect null bytes or high percentage of non-printable chars
	return (
		content.includes("\0") ||
		(content.length > 0 && (content.match(/[\x00-\x08\x0E-\x1F\x7F-\xFF]/g) || []).length / content.length > 0.3)
	)
}

export const ReadTool: React.FC<ReadToolProps> = ({
	filePath,
	content,
	description,
	status = "completed",
	timestamp,
	fileSize,
	totalLines,
	startLine,
	endLine,
	showLineNumbers = true,
	className,
}) => {
	const fileName = filePath.split("/").pop() || filePath
	const fileExtension = getFileExtension(filePath)
	const isBinary = isBinaryContent(content)
	const command = `cat "${filePath}"`

	// Build description if not provided
	const finalDescription = description || `Reading file: ${fileName}`

	// Error case
	if (status === "error") {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stderr" className="mb-2">
					cat: {fileName}: No such file or directory
				</TerminalText>
			</div>
		)

		return (
			<div className={className}>
				<TerminalWindow
					command={command}
					description={finalDescription}
					output={output}
					status={status as any}
					timestamp={timestamp}
					foldable={false}
				/>
			</div>
		)
	}

	// Pending case
	if (status === "pending") {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stdout" className="text-gray-400 italic">
					Reading file...
				</TerminalText>
			</div>
		)

		return (
			<div className={className}>
				<TerminalWindow
					command={command}
					description={finalDescription}
					output={output}
					status={status as any}
					timestamp={timestamp}
					foldable={false}
				/>
			</div>
		)
	}

	// Binary file case
	if (isBinary) {
		const output = (
			<div className="text-center py-8">
				<TerminalText variant="stderr" className="mb-2">
					Binary file detected
				</TerminalText>
				<TerminalText variant="comment" className="text-xs">
					File appears to be binary and cannot be displayed as text
				</TerminalText>
				{fileSize && (
					<TerminalText variant="comment" className="text-xs mt-1">
						File size: {formatFileSize(fileSize)}
					</TerminalText>
				)}
			</div>
		)

		return (
			<div className={className}>
				<TerminalWindow
					command={command}
					description={finalDescription}
					output={output}
					status={status as any}
					timestamp={timestamp}
					foldable={false}
				/>
			</div>
		)
	}

	// Format content with line numbers if requested
	const formatContent = (text: string): React.ReactNode => {
		if (!text) {
			return (
				<TerminalText variant="comment" className="italic">
					File is empty
				</TerminalText>
			)
		}

		const lines = text.split("\n")
		const actualStartLine = startLine || 1

		if (showLineNumbers) {
			return (
				<div className="font-mono text-sm">
					{lines.map((line, index) => {
						const lineNumber = actualStartLine + index
						return (
							<div key={index} className="flex">
								<span className="text-gray-500 mr-4 select-none min-w-[3rem] text-right">{lineNumber}</span>
								<span className="text-gray-300 whitespace-pre-wrap break-all">{line || " "}</span>
							</div>
						)
					})}
				</div>
			)
		}

		return (
			<TerminalText variant="stdout" className="whitespace-pre-wrap break-all font-mono text-sm">
				{text}
			</TerminalText>
		)
	}

	// Build metadata info
	const metadataInfo: string[] = []
	if (totalLines) metadataInfo.push(`${totalLines} lines`)
	if (fileSize) metadataInfo.push(formatFileSize(fileSize))
	if (fileExtension) metadataInfo.push(fileExtension.toUpperCase())

	const metadata = metadataInfo.length > 0 ? ` (${metadataInfo.join(", ")})` : ""

	const output = (
		<div className="max-h-96 overflow-y-auto">
			{/* File metadata header */}
			{metadata && (
				<div className="border-b border-gray-700 pb-2 mb-3">
					<TerminalText variant="comment" className="text-xs">
						{fileName}
						{metadata}
						{startLine && endLine && startLine !== 1 && (
							<span className="ml-2">
								showing lines {startLine}-{endLine}
							</span>
						)}
					</TerminalText>
				</div>
			)}

			{/* File content */}
			{formatContent(content)}
		</div>
	)

	// Determine if content should be foldable
	const shouldFold = content.split("\n").length > 50 || content.length > 5000
	const defaultFolded = content.split("\n").length > 100

	return (
		<div className={className}>
			<div className="flex items-center gap-2 mb-2">
				<StatusBadge status={status as any} />
				{timestamp && <TimeDisplay timestamp={timestamp} />}
				<CopyButton text={content} label="Copy content" />
			</div>
			<TerminalWindow
				command={command}
				description={finalDescription}
				output={output}
				status={status as any}
				timestamp={timestamp}
				foldable={shouldFold}
				defaultFolded={defaultFolded}
				maxHeight="500px"
			/>
		</div>
	)
}

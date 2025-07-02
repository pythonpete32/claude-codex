import type React from "react"
import { useMemo } from "react"
import { TerminalWindow } from "@/components/ui/terminal"
import { createSimpleDiff } from "@/lib/diff"
import { CopyButton } from "@/shared/copy-utils"
import { StatusBadge } from "@/shared/status-utils"
import { TerminalText } from "@/shared/terminal-styles"
import { TimeDisplay } from "@/shared/time-utils"

export interface MultiEditToolProps {
	fileEdits: Array<{
		filePath: string
		oldContent: string
		newContent: string
		summary?: string
	}>
	description?: string
	status?: "pending" | "completed" | "error" | "running"
	timestamp?: string
	editsApplied?: number
	totalEdits?: number
	className?: string
}

export const MultiEditTool: React.FC<MultiEditToolProps> = ({
	fileEdits,
	description,
	status = "completed",
	timestamp,
	editsApplied,
	totalEdits,
	className,
}) => {
	// Calculate diffs for all file edits
	const allDiffs = useMemo(() => {
		return fileEdits.map((fileEdit, index) => ({
			fileIndex: index,
			filePath: fileEdit.filePath,
			fileName: fileEdit.filePath.split("/").pop() || fileEdit.filePath,
			diff: createSimpleDiff(fileEdit.oldContent, fileEdit.newContent),
			summary: fileEdit.summary,
		}))
	}, [fileEdits])

	// Build command
	const command = `multi-edit ${fileEdits.length > 1 ? `${fileEdits.length} files` : fileEdits[0]?.filePath || ""}`

	// Build description
	const finalDescription = description || `Editing ${fileEdits.length} file${fileEdits.length !== 1 ? "s" : ""}`

	// Render appropriate output based on status
	const renderOutput = () => {
		// Handle states without fileEdits
		if (!fileEdits || fileEdits.length === 0) {
			if (status === "pending") {
				return (
					<TerminalText variant="stdout">
						<div className="text-gray-400 italic">Preparing file edits...</div>
					</TerminalText>
				)
			}
			if (status === "running") {
				return (
					<TerminalText variant="stdout">
						<div className="text-blue-400 italic">Applying edits...</div>
					</TerminalText>
				)
			}
			if (status === "error") {
				return (
					<TerminalText variant="stderr">
						<div className="text-red-400 italic">Edit operation failed</div>
					</TerminalText>
				)
			}
			// For completed without fileEdits
			return (
				<TerminalText variant="stdout">
					<div className="text-gray-400 italic">No edits to apply</div>
				</TerminalText>
			)
		}

		// Show file edit results
		return renderFileEdits()
	}

	// Render file edit diffs
	const renderFileEdits = () => {
		const results: React.ReactNode[] = []

		// Summary header
		if (fileEdits.length > 1) {
			const appliedCount = editsApplied ?? fileEdits.length
			const totalCount = totalEdits ?? fileEdits.length

			results.push(
				<div key="summary" className="mb-4 p-3 bg-gray-800/50 rounded border border-gray-600">
					<TerminalText variant="stdout" className="text-green-400 font-medium">
						Multi-Edit Summary
					</TerminalText>
					<div className="mt-1 text-sm">
						<TerminalText variant="comment">
							Applied {appliedCount} of {totalCount} edits across {fileEdits.length} files
						</TerminalText>
					</div>
				</div>,
			)
		}

		// Individual file edits
		allDiffs.forEach((fileDiff) => {
			results.push(
				<div key={fileDiff.fileIndex} className="mb-6">
					{/* File header */}
					<div className="mb-2 p-2 bg-gray-800/30 rounded border border-gray-700">
						<div className="flex items-center justify-between">
							<TerminalText variant="comment" className="text-purple-400 font-medium">
								{fileDiff.fileName}
							</TerminalText>
							<TerminalText variant="comment" className="text-xs">
								{fileDiff.filePath}
							</TerminalText>
						</div>
						{fileDiff.summary && (
							<TerminalText variant="comment" className="text-xs mt-1">
								{fileDiff.summary}
							</TerminalText>
						)}
					</div>

					{/* Diff content */}
					<div className="font-mono text-sm max-h-64 overflow-y-auto border border-gray-700 rounded bg-gray-900/50">
						{Array.isArray(fileDiff.diff) ? (
							fileDiff.diff.map((line: any, lineIndex: number) => (
								<div
									key={lineIndex}
									className={`px-2 py-0.5 whitespace-pre-wrap break-all ${
										line.type === "added"
											? "bg-green-900/30 text-green-300"
											: line.type === "removed"
												? "bg-red-900/30 text-red-300"
												: "text-gray-400"
									}`}
								>
									<span className="select-none mr-2">
										{line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
									</span>
									{line.content}
								</div>
							))
						) : (
							<div className="px-2 py-0.5 text-gray-400">Unable to generate diff</div>
						)}
					</div>
				</div>,
			)
		})

		return <div className="space-y-0">{results}</div>
	}

	const output = <div className="max-h-96 overflow-y-auto">{renderOutput()}</div>

	// Determine copy text - concatenate all file paths and changes
	const copyText = fileEdits.map((edit) => `${edit.filePath}:\n${edit.summary || "File updated"}\n\n`).join("")

	// Determine if content should be foldable
	const shouldFold = fileEdits.length > 3 || allDiffs.some((d) => Array.isArray(d.diff) && d.diff.length > 20)
	const defaultFolded = fileEdits.length > 5

	return (
		<div className={className}>
			<div className="flex items-center gap-2 mb-2">
				<StatusBadge status={status as any} />
				{timestamp && <TimeDisplay timestamp={timestamp} />}
				{copyText && <CopyButton text={copyText} label="Copy edit summary" />}
			</div>
			<TerminalWindow
				command={command}
				description={finalDescription}
				output={output}
				status={status as any}
				timestamp={timestamp}
				foldable={shouldFold}
				defaultFolded={defaultFolded}
				maxHeight="600px"
			/>
		</div>
	)
}

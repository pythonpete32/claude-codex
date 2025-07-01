import type React from "react"
import { FolderOpen, Clock, File, Folder, Link } from "lucide-react"
import { TerminalWindow } from "@/components/ui/terminal"
import { TerminalText } from "@/shared/terminal-styles"
import type { LsToolProps as LsToolParserProps } from "@claude-codex/types"

// Component extends parser props with UI-specific options
export interface LsToolProps extends LsToolParserProps {
	description?: string
}

// Helper function to format file size
function formatFileSize(bytes?: number): string {
	if (!bytes) return "-"
	if (bytes < 1024) return `${bytes}B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}G`
}

// Helper function to format permissions
function formatPermissions(permissions?: string): string {
	return permissions || "rwxr-xr-x"
}

// Helper function to format date
function formatDate(dateStr?: string): string {
	if (!dateStr) return "-"
	const date = new Date(dateStr)
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

	if (diffDays < 1) {
		return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
	} else if (diffDays < 180) {
		return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
	} else {
		return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
	}
}

export const LsTool: React.FC<LsToolProps> = ({
	// From BaseToolProps
	id,
	uuid,
	parentUuid,
	timestamp,
	duration,
	status,
	className,
	metadata,

	// From LsToolProps
	input,
	results,
	ui,
	onEntryClick,

	// UI-specific
	description,
}) => {
	const command = `ls -la${input.showHidden ? " -a" : ""}${input.recursive ? " -R" : ""} "${input.path}"`
	const commandName = "ls"

	// Use normalized status from parser
	const normalizedStatus = status.normalized

	// Error case
	if (normalizedStatus === "failed" || results?.errorMessage) {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stderr" className="mb-2">
					{results?.errorMessage || `ls: cannot access '${input.path}': No such file or directory`}
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
					Listing directory contents...
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

	// Get icon for entry type
	const getEntryIcon = (entry: (typeof results.entries)[0]) => {
		switch (entry.type) {
			case "directory":
				return <Folder className="h-4 w-4 text-blue-400" />
			case "symlink":
				return <Link className="h-4 w-4 text-purple-400" />
			default:
				return <File className="h-4 w-4 text-gray-400" />
		}
	}

	// Format directory entries
	const formatEntries = () => {
		if (!results || !results.entries || results.entries.length === 0) {
			return (
				<TerminalText variant="comment" className="italic">
					Directory is empty
				</TerminalText>
			)
		}

		// Sort entries: directories first, then files
		const sortedEntries = [...results.entries].sort((a, b) => {
			if (a.type === "directory" && b.type !== "directory") return -1
			if (a.type !== "directory" && b.type === "directory") return 1
			return a.name.localeCompare(b.name)
		})

		return (
			<div className="font-mono text-sm">
				{/* Header */}
				<div className="flex items-center gap-4 text-gray-500 text-xs mb-2 px-2">
					<span className="w-24">Permissions</span>
					<span className="w-16 text-right">Size</span>
					<span className="w-20">Modified</span>
					<span className="flex-1">Name</span>
				</div>

				{/* Entries */}
				{sortedEntries.map((entry, index) => (
					<div
						key={index}
						className="flex items-center gap-4 hover:bg-gray-800/30 px-2 py-1 rounded cursor-pointer"
						onClick={() => onEntryClick?.(entry)}
					>
						<span className="w-24 text-gray-500 text-xs">{formatPermissions(entry.permissions)}</span>
						<span className="w-16 text-right text-gray-400 text-xs">{formatFileSize(entry.size)}</span>
						<span className="w-20 text-gray-400 text-xs">{formatDate(entry.lastModified)}</span>
						<div className="flex-1 flex items-center gap-2">
							{getEntryIcon(entry)}
							<span
								className={`
								${entry.type === "directory" ? "text-blue-400" : ""}
								${entry.type === "symlink" ? "text-purple-400" : ""}
								${entry.type === "file" ? "text-gray-300" : ""}
								${entry.isHidden ? "opacity-60" : ""}
							`}
							>
								{entry.name}
							</span>
						</div>
					</div>
				))}
			</div>
		)
	}

	const output = (
		<div>
			{/* Summary header */}
			<div className="flex items-center gap-2 mb-4">
				<FolderOpen className="h-4 w-4 text-green-400" />
				<TerminalText variant="stdout" className="text-green-400">
					{input.path}
				</TerminalText>
				<span className="text-xs text-gray-500">
					({ui.totalFiles} files, {ui.totalDirectories} directories
					{ui.totalSize ? `, ${formatFileSize(ui.totalSize)} total` : ""})
				</span>
			</div>

			{/* Directory listing */}
			<div className="border border-gray-700 rounded-md p-2 bg-gray-900/50">
				<div className="max-h-96 overflow-y-auto">{formatEntries()}</div>
			</div>
		</div>
	)

	// Determine if content should be foldable
	const shouldFold = results && results.entries && results.entries.length > 20
	const defaultFolded = results && results.entries && results.entries.length > 50

	// Build metadata info
	const metadataInfo: string[] = []
	if (input.showHidden) metadataInfo.push("show hidden")
	if (input.recursive) metadataInfo.push("recursive")
	if (input.ignore && input.ignore.length > 0) {
		metadataInfo.push(`ignoring: ${input.ignore.join(", ")}`)
	}
	const metadataString = metadataInfo.length > 0 ? ` (${metadataInfo.join(", ")})` : ""

	// Create footer with metadata
	const footer = (
		<div className="flex items-center justify-between text-xs text-gray-500">
			<span>
				{input.path}
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
			description={description || `Listing contents of ${input.path}`}
			output={output}
			footer={footer}
			status={normalizedStatus}
			timestamp={timestamp}
			foldable={shouldFold}
			defaultFolded={defaultFolded}
			maxHeight="600px"
			showCopyButton={true}
			className={className}
		/>
	)
}

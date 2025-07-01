import type React from "react";
import { TerminalWindow } from "@/components/ui/terminal";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/shared/copy-utils";
// Import shared utilities
import { StatusBadge, type ToolStatus } from "@/shared/status-utils";
import { TerminalText } from "@/shared/terminal-styles";
import { TimeDisplay } from "@/shared/time-utils";

// Contract-compliant interface to match fixture structure
export interface LsToolProps {
	toolUse: {
		type: "tool_use";
		id: string;
		name: "LS";
		input: {
			path: string;
			ignore?: string[];
		};
	};
	status: "pending" | "completed" | "failed" | "in_progress" | "interrupted";
	timestamp: string;
	toolResult: {
		entries: {
			name: string;
			type: "file" | "directory";
			size?: number;
			hidden: boolean;
			permissions: string;
			lastModified: string;
		}[];
		entryCount: number;
		path: string;
		isError: boolean;
		errorMessage?: string;
	};
	className?: string;
}

// Helper functions to extract data from contract
function getPath(toolUse: LsToolProps["toolUse"]): string {
	return toolUse.input.path;
}

function getIgnorePatterns(toolUse: LsToolProps["toolUse"]): string[] | undefined {
	return toolUse.input.ignore;
}

function getEntries(toolResult: LsToolProps["toolResult"]) {
	return toolResult.entries || [];
}

function getErrorMessage(toolResult: LsToolProps["toolResult"]): string | null {
	return toolResult.isError && toolResult.errorMessage ? toolResult.errorMessage : null;
}

// Type for internal file representation (from contract entries)
type FileEntry = LsToolProps["toolResult"]["entries"][0];

const getFileColor = (file: FileEntry) => {
	if (file.type === "directory") {
		return "text-blue-400";
	}

	// Extract extension from filename
	const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : undefined;
	switch (ext) {
		case ".js":
		case ".ts":
		case ".jsx":
		case ".tsx":
		case ".py":
		case ".java":
		case ".cpp":
		case ".c":
		case ".go":
		case ".rs":
			return "text-green-400";
		case ".txt":
		case ".md":
		case ".json":
		case ".yaml":
		case ".yml":
			return "text-gray-400";
		case ".jpg":
		case ".jpeg":
		case ".png":
		case ".gif":
		case ".svg":
			return "text-purple-400";
		case ".mp4":
		case ".mov":
		case ".avi":
			return "text-red-400";
		case ".mp3":
		case ".wav":
		case ".flac":
			return "text-orange-400";
		case ".zip":
		case ".tar":
		case ".gz":
			return "text-amber-400";
		default:
			return "text-gray-500";
	}
};

export const LsTool: React.FC<LsToolProps> = ({
	toolUse,
	toolResult,
	status,
	timestamp,
	className,
}) => {
	// Validate toolUse.type
	if (toolUse.type !== "tool_use") {
		console.warn("LsTool: Expected toolUse.type to be 'tool_use', got:", toolUse.type);
	}

	// Map our 5 contract statuses to TerminalWindow's 4 statuses
	const mapStatusToTerminal = (contractStatus: LsToolProps["status"]) => {
		switch (contractStatus) {
			case "pending":
				return "pending";
			case "in_progress":
				return "running";
			case "completed":
				return "completed";
			case "failed":
			case "interrupted":
				return "error";
			default:
				return "completed";
		}
	};

	const terminalStatus = mapStatusToTerminal(status);

	// Extract data from contract
	const path = getPath(toolUse);
	const ignorePatterns = getIgnorePatterns(toolUse);
	const entries = getEntries(toolResult);
	const errorMessage = getErrorMessage(toolResult);
	const entryCount = toolResult.entryCount || entries.length;

	// Build command string like terminal ls command
	const buildCommand = () => {
		let cmd = `ls -la "${path}"`;
		if (ignorePatterns && ignorePatterns.length > 0) {
			cmd += ` --ignore="${ignorePatterns.join(",")}"`;
		}
		return cmd;
	};

	const command = buildCommand();

	// Error case
	if (toolResult.isError && errorMessage) {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stderr" className="mb-2">
					ls: {errorMessage}
				</TerminalText>
			</div>
		);

		return (
			<div className={className}>
				<TerminalWindow
					command={command}
					output={output}
					status={terminalStatus as any}
					timestamp={timestamp}
					foldable={false}
				/>
			</div>
		);
	}

	// Sort files: directories first, then files, alphabetically
	const directories = entries
		.filter((f) => f.type === "directory")
		.sort((a, b) => a.name.localeCompare(b.name));
	const regularFiles = entries
		.filter((f) => f.type === "file")
		.sort((a, b) => a.name.localeCompare(b.name));
	const sortedFiles = [...directories, ...regularFiles];

	// Format file listing like terminal ls -la output
	const formatLsOutput = () => {
		if (sortedFiles.length === 0) {
			return <div className="text-gray-500 italic text-center py-4">ls: directory is empty</div>;
		}

		return sortedFiles.map((file) => {
			const permissions =
				file.permissions || (file.type === "directory" ? "drwxr-xr-x" : "-rw-r--r--");
			const size = file.size ? file.size.toString().padStart(8) : "     -";
			const modified = file.lastModified
				? new Date(file.lastModified).toLocaleDateString("en-US", {
						month: "short",
						day: "2-digit",
						hour: "2-digit",
						minute: "2-digit",
					})
				: "Jan  1 12:00";
			const name = file.name;
			const color = getFileColor(file);

			return (
				<div
					key={file.name}
					className={cn("hover:bg-gray-800/50 px-1 font-mono text-sm", file.hidden && "opacity-60")}
				>
					<span className="text-gray-400">{permissions}</span>
					<span className="text-gray-500 ml-3">{size}</span>
					<span className="text-gray-500 ml-3">{modified}</span>
					<span className={cn("ml-3", color)}>{name}</span>
					{file.type === "directory" && <span className={color}>/</span>}
				</div>
			);
		});
	};

	const output = <div className="space-y-0 max-h-80 overflow-y-auto">{formatLsOutput()}</div>;

	const enhancedDescription = `Listed ${entryCount} entries in ${path}${ignorePatterns ? ` (ignoring: ${ignorePatterns.join(", ")})` : ""}`;

	return (
		<div className={className}>
			<TerminalWindow
				command={command}
				description={enhancedDescription}
				output={output}
				status={terminalStatus as any}
				timestamp={timestamp}
				foldable={sortedFiles.length > 10}
				defaultFolded={sortedFiles.length > 20}
				maxHeight="400px"
			/>
		</div>
	);
};

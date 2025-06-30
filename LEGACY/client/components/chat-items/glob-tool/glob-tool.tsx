import type React from "react";
import { TerminalWindow } from "@/components/ui/terminal";
import { CopyButton } from "@/shared/copy-utils";
// Import shared utilities
import { StatusBadge, type ToolStatus } from "@/shared/status-utils";
import { TerminalText } from "@/shared/terminal-styles";
import { TimeDisplay } from "@/shared/time-utils";

// Updated interface to match fixture contract exactly
export interface GlobToolProps {
	toolUse: {
		type: "tool_use";
		id: string;
		name: "Glob";
		input: {
			pattern: string;
			path?: string;
		};
	};
	status: "pending" | "completed" | "failed" | "in_progress" | "interrupted";
	timestamp: string;
	toolResult: {
		matches: string[];
		matchCount: number;
		isError: boolean;
		errorMessage?: string;
	};
	className?: string;
}

// Helper functions to extract data from contract
function getPattern(toolUse: GlobToolProps["toolUse"]): string {
	return toolUse.input.pattern;
}

function getPath(toolUse: GlobToolProps["toolUse"]): string | undefined {
	return toolUse.input.path;
}

function getMatches(toolResult: GlobToolProps["toolResult"]): string[] {
	return toolResult.matches || [];
}

function getErrorMessage(toolResult: GlobToolProps["toolResult"]): string | null {
	return toolResult.isError && toolResult.errorMessage ? toolResult.errorMessage : null;
}

export const GlobTool: React.FC<GlobToolProps> = ({
	toolUse,
	toolResult,
	status,
	timestamp,
	className,
}) => {
	// Validate toolUse.type
	if (toolUse.type !== "tool_use") {
		console.warn("GlobTool: Expected toolUse.type to be 'tool_use', got:", toolUse.type);
	}

	// Map our 5 contract statuses to TerminalWindow's 4 statuses
	const mapStatusToTerminal = (contractStatus: GlobToolProps["status"]) => {
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
	const pattern = getPattern(toolUse);
	const path = getPath(toolUse);
	const matches = getMatches(toolResult);
	const errorMessage = getErrorMessage(toolResult);
	const matchCount = toolResult.matchCount || matches.length;

	// Build command string like terminal glob command
	const buildCommand = () => {
		if (path) {
			return `glob "${pattern}" --path="${path}"`;
		}
		return `glob "${pattern}"`;
	};

	const command = buildCommand();

	// Error case
	if (toolResult.isError && errorMessage) {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stderr" className="mb-2">
					glob: {errorMessage}
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

	// Format glob output like terminal find/ls
	const formatGlobOutput = () => {
		const results: React.ReactNode[] = [];

		matches.forEach((match, index) => {
			// Determine if it's likely a directory (ends with /)
			const isDirectory = match.endsWith("/");
			const color = isDirectory ? "text-blue-400" : "text-gray-300";

			results.push(
				<div key={index} className="font-mono text-sm hover:bg-gray-800/30 px-1">
					<span className={color}>{match}</span>
				</div>,
			);
		});

		if (results.length === 0) {
			results.push(
				<div key="no-results" className="text-gray-500 italic">
					glob: no matches found for pattern "{pattern}"
				</div>,
			);
		}

		return results;
	};

	const output = <div className="space-y-0 max-h-80 overflow-y-auto">{formatGlobOutput()}</div>;

	const enhancedDescription = `Found ${matchCount} matches for pattern "${pattern}"${path ? ` in ${path}` : ""}`;

	return (
		<div className={className}>
			<TerminalWindow
				command={command}
				description={enhancedDescription}
				output={output}
				status={terminalStatus as any}
				timestamp={timestamp}
				foldable={matches.length > 15}
				defaultFolded={matches.length > 30}
				maxHeight="400px"
			/>
		</div>
	);
};

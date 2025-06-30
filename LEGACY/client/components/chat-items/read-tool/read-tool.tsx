import type React from "react";
import { TerminalWindow } from "@/components/ui/terminal";
import { CopyButton } from "@/shared/copy-utils";
// Import shared utilities
import { StatusBadge, type ToolStatus } from "@/shared/status-utils";
import { TerminalText } from "@/shared/terminal-styles";
import { TimeDisplay } from "@/shared/time-utils";

// Updated interface to match fixture contract exactly
export interface ReadToolProps {
	toolUse: {
		type: "tool_use";
		id: string;
		name: "Read";
		input: {
			file_path: string;
			offset?: number;
			limit?: number;
		};
	};
	status: "pending" | "completed" | "failed";
	timestamp: string;
	toolResult:
		| {
				content: string;
				totalLines: number;
				linesRead: number;
				truncated: boolean;
		  }
		| string; // Error case
	className?: string;
}

// Helper functions to extract data from contract
function getFilePath(toolUse: ReadToolProps["toolUse"]): string {
	return toolUse.input.file_path;
}

function getContent(toolResult: ReadToolProps["toolResult"]): string {
	return typeof toolResult === "string" ? "" : toolResult.content;
}

function getErrorMessage(toolResult: ReadToolProps["toolResult"]): string | null {
	return typeof toolResult === "string" ? toolResult : null;
}

function isBinaryContent(content: string): boolean {
	// Detect null bytes or high percentage of non-printable chars
	return (
		content.includes("\0") ||
		(content.length > 0 &&
			(content.match(/[\x00-\x08\x0E-\x1F\x7F-\xFF]/g) || []).length / content.length > 0.3)
	);
}

function calculateLineNumbers(offset?: number, linesRead?: number): { start: number; end: number } {
	const start = (offset || 0) + 1;
	const end = start + (linesRead || 0) - 1;
	return { start, end };
}

export const ReadTool: React.FC<ReadToolProps> = ({
	toolUse,
	toolResult,
	status,
	timestamp,
	className,
}) => {
	// Validate toolUse.type
	if (toolUse.type !== "tool_use") {
		console.warn("ReadTool: Expected toolUse.type to be 'tool_use', got:", toolUse.type);
	}

	// Extract data from contract
	const filePath = getFilePath(toolUse);
	const content = getContent(toolResult);
	const errorMessage = getErrorMessage(toolResult);
	const isBinary = isBinaryContent(content);
	const command = `cat "${filePath}"`;

	// Handle metadata from toolResult
	const metadata = typeof toolResult !== "string" ? toolResult : null;
	const { start: startLine, end: endLine } = calculateLineNumbers(
		toolUse.input.offset,
		metadata?.linesRead,
	);

	// Error case
	if (errorMessage) {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stderr" className="mb-2">
					cat: {filePath.split("/").pop()}: {errorMessage}
				</TerminalText>
			</div>
		);

		return (
			<div className={className}>
				<TerminalWindow
					command={command}
					output={output}
					status={status as any}
					timestamp={timestamp}
					foldable={false}
				/>
			</div>
		);
	}

	// Binary file case
	if (isBinary) {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stderr" className="mb-2">
					cat: {filePath.split("/").pop()}: binary file matches
				</TerminalText>
				<TerminalText variant="comment">Binary file - cannot display content</TerminalText>
				{metadata && (
					<TerminalText variant="comment" className="text-sm mt-1">
						Lines: {metadata.totalLines} | Read: {metadata.linesRead}
					</TerminalText>
				)}
			</div>
		);

		return (
			<div className={className}>
				<TerminalWindow
					command={command}
					output={output}
					status={status as any}
					timestamp={timestamp}
					foldable={false}
				/>
			</div>
		);
	}

	// Format content with line numbers like cat -n
	const formatCatOutput = () => {
		const lines = content.split("\n");
		const effectiveStartLine = startLine || 1;

		return lines.map((line, index) => {
			const lineNumber = effectiveStartLine + index;
			const paddedLineNumber = lineNumber.toString().padStart(6, " ");

			return (
				<div key={index} className="font-mono text-sm hover:bg-gray-800/30 px-1">
					<span className="text-gray-500 select-none mr-2">{paddedLineNumber}</span>
					<span className="text-gray-300 whitespace-pre-wrap">{line}</span>
				</div>
			);
		});
	};

	const output = (
		<div className="space-y-0 max-h-80 overflow-y-auto">
			{formatCatOutput()}
			{metadata?.truncated && (
				<div className="text-yellow-400 text-sm mt-2 px-1 flex items-center gap-2">
					⚠ Content truncated - showing {metadata.linesRead} of {metadata.totalLines} lines
				</div>
			)}
			{metadata && !metadata.truncated && metadata.totalLines > metadata.linesRead && (
				<TerminalText variant="comment" className="text-sm mt-2 px-1">
					... ({metadata.totalLines - metadata.linesRead} more lines)
				</TerminalText>
			)}
		</div>
	);

	return (
		<div className={className}>
			<TerminalWindow
				command={command}
				output={output}
				status={status as any}
				timestamp={timestamp}
				foldable={content.split("\n").length > 20}
				defaultFolded={content.split("\n").length > 50}
				maxHeight="400px"
			/>
		</div>
	);
};

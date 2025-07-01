import type React from "react";
import { useMemo } from "react";
import { TerminalWindow } from "@/components/ui/terminal";
import { createSimpleDiff } from "@/lib/diff";
import { CopyButton } from "@/shared/copy-utils";
import { StatusBadge } from "@/shared/status-utils";
import { TerminalText } from "@/shared/terminal-styles";
import { TimeDisplay } from "@/shared/time-utils";

export interface EditToolProps {
	toolUse: {
		type: "tool_use";
		id: string;
		name: string;
		input: {
			file_path: string;
			old_string: string;
			new_string: string;
			replace_all?: boolean;
		};
	};
	status: "pending" | "completed" | "failed" | "in_progress" | "interrupted";
	timestamp: string;
	toolResult?: {
		stdout: string;
		stderr: string;
		interrupted: boolean;
		isImage: boolean;
		isError: boolean;
		diffPreview?: string;
	};
	className?: string;
}

export const EditTool: React.FC<EditToolProps> = ({
	toolUse,
	status,
	timestamp,
	toolResult,
	className,
}) => {
	const { file_path, old_string, new_string, replace_all } = toolUse.input;

	// Calculate diff using our simple diff algorithm or use provided diffPreview
	const diffResult = useMemo(() => {
		if (toolResult?.diffPreview) {
			// Use provided diff preview if available
			return null; // We'll render the diffPreview directly
		}
		if (!old_string || !new_string) return null;
		return createSimpleDiff(old_string, new_string);
	}, [old_string, new_string, toolResult?.diffPreview]);

	// Format diff output like terminal diff command
	const formatDiffOutput = () => {
		// If we have a diff preview from the tool result, use it
		if (toolResult?.diffPreview) {
			return (
				<TerminalText variant="stdout">
					<pre className="whitespace-pre-wrap">{toolResult.diffPreview}</pre>
				</TerminalText>
			);
		}

		if (!diffResult) {
			return (
				<TerminalText variant="stderr">No diff available - missing old or new content</TerminalText>
			);
		}

		const results: React.ReactNode[] = [];

		diffResult.lines.forEach((line, index) => {
			const prefix = line.type === "removed" ? "-" : "+";
			const color = line.type === "removed" ? "text-red-400" : "text-green-400";
			const bgColor = line.type === "removed" ? "bg-red-900/20" : "bg-green-900/20";

			results.push(
				<div key={index} className={`font-mono text-sm px-1 ${bgColor}`}>
					<span className={`${color} mr-2`}>{prefix}</span>
					<span className="text-gray-300">{line.content}</span>
				</div>,
			);
		});

		return <div className="space-y-0">{results}</div>;
	};

	// Render appropriate output based on status and toolResult
	const renderOutput = () => {
		// Handle states without toolResult
		if (!toolResult) {
			if (status === "pending") {
				return (
					<TerminalText variant="stdout">
						<div className="text-gray-400 italic">Waiting for tool to execute...</div>
					</TerminalText>
				);
			}
			if (status === "in_progress") {
				return (
					<TerminalText variant="stdout">
						<div className="text-blue-400 italic">Executing edit operation...</div>
					</TerminalText>
				);
			}
			if (status === "interrupted") {
				return (
					<TerminalText variant="stderr">
						<div className="text-yellow-400 italic">Operation was interrupted</div>
					</TerminalText>
				);
			}
			// For completed/failed without toolResult, show diff
			return formatDiffOutput();
		}

		// Handle states with toolResult
		if (toolResult.isError && toolResult.stderr) {
			return (
				<TerminalText variant="stderr">
					<pre className="whitespace-pre-wrap">{toolResult.stderr}</pre>
				</TerminalText>
			);
		}

		if (toolResult.stdout) {
			return (
				<TerminalText variant="stdout">
					<pre className="whitespace-pre-wrap">{toolResult.stdout}</pre>
				</TerminalText>
			);
		}

		// Fallback to diff if no stdout/stderr
		return formatDiffOutput();
	};

	const output = <div className="max-h-80 overflow-y-auto">{renderOutput()}</div>;

	const stats = diffResult ? `+${diffResult.linesAdded} -${diffResult.linesRemoved}` : "";
	const replaceAllFlag = replace_all ? " (replace all)" : "";
	const command = `Edit "${file_path}"${replaceAllFlag}`;
	const description = `File edited${stats ? `: ${stats}` : ""}`;

	// Calculate if content should be folded
	const shouldFold = diffResult
		? diffResult.lines.length > 20
		: toolResult?.stdout
			? toolResult.stdout.split("\n").length > 20
			: false;
	const defaultFolded = diffResult
		? diffResult.lines.length > 50
		: toolResult?.stdout
			? toolResult.stdout.split("\n").length > 50
			: false;

	// Determine what to copy based on available data
	const copyText = toolResult?.stdout || new_string || old_string || "";

	return (
		<div className={className}>
			<div className="flex items-center gap-2 mb-2">
				<StatusBadge status={status} />
				<TimeDisplay timestamp={timestamp} />
				{copyText && <CopyButton text={copyText} label="Copy result" />}
			</div>
			<TerminalWindow
				command={command}
				description={description}
				output={output}
				status={status}
				timestamp={timestamp}
				foldable={shouldFold}
				defaultFolded={defaultFolded}
				maxHeight="400px"
			/>
		</div>
	);
};

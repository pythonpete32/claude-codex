import type React from "react";
import { useMemo } from "react";
import { TerminalWindow } from "@/components/ui/terminal";
import { createSimpleDiff } from "@/lib/diff";

export interface EditToolProps {
	filePath: string;
	oldContent?: string;
	newContent?: string;
	command?: string;
	description?: string;
	status?: "pending" | "completed" | "error";
	timestamp?: string;
	className?: string;
}

export const EditTool: React.FC<EditToolProps> = ({
	filePath,
	oldContent,
	newContent,
	command = `edit "${filePath}"`,
	description,
	status = "completed",
	timestamp,
	className,
}) => {
	// Calculate diff using our simple diff algorithm
	const diffResult = useMemo(() => {
		if (!oldContent || !newContent) return null;
		return createSimpleDiff(oldContent, newContent);
	}, [oldContent, newContent]);

	// Format diff output like terminal diff command
	const formatDiffOutput = () => {
		if (!diffResult) {
			return <div className="text-gray-500">No diff available - missing old or new content</div>;
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

		return results;
	};

	const output = <div className="space-y-0 max-h-80 overflow-y-auto">{formatDiffOutput()}</div>;

	const stats = diffResult ? `+${diffResult.linesAdded} -${diffResult.linesRemoved}` : "";
	const enhancedDescription = description || `File edited: ${stats}`;

	return (
		<div className={className}>
			<TerminalWindow
				command={command}
				description={enhancedDescription}
				output={output}
				status={status}
				timestamp={timestamp}
				foldable={diffResult ? diffResult.lines.length > 20 : false}
				defaultFolded={diffResult ? diffResult.lines.length > 50 : false}
				maxHeight="400px"
			/>
		</div>
	);
};

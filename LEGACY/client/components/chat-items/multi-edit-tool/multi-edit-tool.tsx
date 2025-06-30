import type React from "react";
import { useMemo } from "react";
import { TerminalWindow } from "@/components/ui/terminal";
import { createSimpleDiff } from "@/lib/diff";

interface FileEdit {
	filePath: string;
	oldContent: string;
	newContent: string;
}

export interface MultiEditToolProps {
	fileEdits: FileEdit[];
	command?: string;
	description?: string;
	status?: "pending" | "completed" | "error";
	timestamp?: string;
	className?: string;
}

export const MultiEditTool: React.FC<MultiEditToolProps> = ({
	fileEdits,
	command = `edit ${fileEdits.length} files`,
	description,
	status = "completed",
	timestamp,
	className,
}) => {
	// Calculate diff for all files
	const allDiffs = useMemo(() => {
		return fileEdits.map((edit) => ({
			filePath: edit.filePath,
			diff: createSimpleDiff(edit.oldContent, edit.newContent),
		}));
	}, [fileEdits]);

	// Format multi-file diff output like terminal
	const formatMultiEditOutput = () => {
		const results: React.ReactNode[] = [];

		allDiffs.forEach(({ filePath, diff }, fileIndex) => {
			// File header
			results.push(
				<div key={`header-${fileIndex}`} className="text-cyan-400 font-bold py-1">
					diff --git a/{filePath} b/{filePath}
				</div>,
			);

			results.push(
				<div key={`index-${fileIndex}`} className="text-gray-500 text-sm">
					index 1234567..abcdefg 100644
				</div>,
			);

			results.push(
				<div key={`file-${fileIndex}`} className="text-gray-400">
					--- a/{filePath}
				</div>,
			);

			results.push(
				<div key={`file2-${fileIndex}`} className="text-gray-400">
					+++ b/{filePath}
				</div>,
			);

			// File diff content
			diff.lines.forEach((line, index) => {
				const prefix = line.type === "removed" ? "-" : "+";
				const color = line.type === "removed" ? "text-red-400" : "text-green-400";
				const bgColor = line.type === "removed" ? "bg-red-900/20" : "bg-green-900/20";

				results.push(
					<div key={`${fileIndex}-${index}`} className={`font-mono text-sm px-1 ${bgColor}`}>
						<span className={`${color} mr-2`}>{prefix}</span>
						<span className="text-gray-300">{line.content}</span>
					</div>,
				);
			});

			// Add spacing between files
			if (fileIndex < allDiffs.length - 1) {
				results.push(<div key={`spacer-${fileIndex}`} className="py-1"></div>);
			}
		});

		return results;
	};

	const output = (
		<div className="space-y-0 max-h-80 overflow-y-auto">{formatMultiEditOutput()}</div>
	);

	const totalAdded = allDiffs.reduce((sum, { diff }) => sum + diff.linesAdded, 0);
	const totalRemoved = allDiffs.reduce((sum, { diff }) => sum + diff.linesRemoved, 0);
	const stats = `${fileEdits.length} files, +${totalAdded} -${totalRemoved}`;
	const enhancedDescription = description || `Multi-file edit: ${stats}`;

	return (
		<div className={className}>
			<TerminalWindow
				command={command}
				description={enhancedDescription}
				output={output}
				status={status}
				timestamp={timestamp}
				foldable={fileEdits.length > 3}
				defaultFolded={fileEdits.length > 5}
				maxHeight="500px"
			/>
		</div>
	);
};

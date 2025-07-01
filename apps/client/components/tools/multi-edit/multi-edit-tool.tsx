import type React from "react";
import { useMemo } from "react";
import { Files, Clock, CheckCircle, XCircle } from "lucide-react";
import { TerminalWindow } from "@/components/ui/terminal";
import { TerminalText } from "@/shared/terminal-styles";
import type { MultiEditToolProps as MultiEditToolParserProps } from "@claude-codex/types";

// Component extends parser props with UI-specific options
export interface MultiEditToolProps extends MultiEditToolParserProps {
	description?: string;
}

export const MultiEditTool: React.FC<MultiEditToolProps> = ({
	// From BaseToolProps
	id,
	uuid,
	parentUuid,
	timestamp,
	duration,
	status,
	className,
	metadata,
	
	// From MultiEditToolProps
	input,
	results,
	ui,
	onFileReview,
	onRevert,
	
	// UI-specific
	description,
}) => {
	const fileName = input.filePath.split("/").pop() || input.filePath;
	const command = `multi-edit "${input.filePath}" (${input.edits.length} operations)`;
	const commandName = "multi-edit";
	
	// Use normalized status from parser
	const normalizedStatus = status.normalized;

	// Error case
	if (normalizedStatus === "failed" || results?.errorMessage) {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stderr" className="mb-2">
					{results?.errorMessage || `Failed to apply edits to ${fileName}`}
				</TerminalText>
				{results && (
					<TerminalText variant="comment" className="text-xs">
						Applied {results.editsApplied} of {results.totalEdits} edits
					</TerminalText>
				)}
			</div>
		);

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
		);
	}

	// Pending case
	if (normalizedStatus === "pending" || normalizedStatus === "running") {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stdout" className="text-gray-400 italic">
					{normalizedStatus === "pending" ? "Preparing edits..." : "Applying edits..."}
				</TerminalText>
			</div>
		);

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
		);
	}

	// Format edit results
	const formatEditResults = () => {
		if (!results || !results.editDetails || results.editDetails.length === 0) {
			return (
				<TerminalText variant="comment" className="italic">
					No edits applied
				</TerminalText>
			);
		}

		return (
			<div className="space-y-4">
				{/* Summary header */}
				<div className="p-3 bg-gray-800/50 rounded border border-gray-600">
					<div className="flex items-center gap-2 mb-2">
						<Files className="h-4 w-4 text-blue-400" />
						<TerminalText variant="stdout" className="text-blue-400 font-medium">
							Multi-Edit Summary
						</TerminalText>
					</div>
					<div className="space-y-1">
						<TerminalText variant="comment" className="text-sm">
							Applied {results.editsApplied} of {results.totalEdits} edits to {fileName}
						</TerminalText>
						{ui.changeSummary && (
							<TerminalText variant="comment" className="text-xs">
								{ui.changeSummary}
							</TerminalText>
						)}
					</div>
				</div>

				{/* Individual edit results */}
				{results.editDetails.map((detail, index) => {
					const editIcon = detail.success ? 
						<CheckCircle className="h-3 w-3 text-green-400" /> : 
						<XCircle className="h-3 w-3 text-red-400" />;
					
					return (
						<div key={index} className="border border-gray-700 rounded-md p-3 bg-gray-900/50">
							<div className="flex items-center gap-2 mb-2">
								{editIcon}
								<span className="text-xs text-gray-400">
									Edit {index + 1} of {results.totalEdits}
									{detail.replacements_made !== undefined && ` (${detail.replacements_made} replacements)`}
								</span>
							</div>
							
							{/* Show the edit operation */}
							<div className="space-y-1">
								<div className="font-mono text-sm">
									<span className="text-red-400">- {detail.operation.old_string}</span>
								</div>
								<div className="font-mono text-sm">
									<span className="text-green-400">+ {detail.operation.new_string}</span>
								</div>
								
								{detail.operation.replace_all && (
									<TerminalText variant="comment" className="text-xs">
										Replace all occurrences
									</TerminalText>
								)}
								
								{detail.error && (
									<TerminalText variant="stderr" className="text-xs mt-2">
										Error: {detail.error}
									</TerminalText>
								)}
							</div>
						</div>
					);
				})}
			</div>
		);
	};

	const output = (
		<div>
			{/* Success message */}
			{results?.allSuccessful && (
				<div className="flex items-center gap-2 mb-4">
					<CheckCircle className="h-4 w-4 text-green-400" />
					<TerminalText variant="stdout" className="text-green-400">
						All edits applied successfully
					</TerminalText>
				</div>
			)}
			
			{/* Edit results */}
			<div className="max-h-96 overflow-y-auto">
				{formatEditResults()}
			</div>
		</div>
	);

	// Determine if content should be foldable
	const shouldFold = input.edits.length > 3;
	const defaultFolded = input.edits.length > 5;

	// Build metadata info
	const metadataInfo: string[] = [];
	if (ui.successfulEdits > 0) metadataInfo.push(`✓ ${ui.successfulEdits}`);
	if (ui.failedEdits > 0) metadataInfo.push(`✗ ${ui.failedEdits}`);
	const metadataString = metadataInfo.length > 0 ? ` (${metadataInfo.join(', ')})` : '';

	// Create footer with metadata
	const footer = (
		<div className="flex items-center justify-between text-xs text-gray-500">
			<span>
				{fileName}{metadataString}
			</span>
			<div className="flex items-center gap-4">
				{onFileReview && (
					<button
						onClick={() => onFileReview(input.filePath)}
						className="text-blue-400 hover:text-blue-300 transition-colors"
					>
						Review File
					</button>
				)}
				{onRevert && !results?.allSuccessful && (
					<button
						onClick={() => onRevert(input.filePath)}
						className="text-orange-400 hover:text-orange-300 transition-colors"
					>
						Revert Changes
					</button>
				)}
				{timestamp && (
					<span className="flex items-center">
						<Clock className="h-3 w-3 mr-1" />
						{new Date(timestamp).toLocaleString()}
					</span>
				)}
			</div>
		</div>
	);

	return (
		<TerminalWindow
			command={command}
			commandName={commandName}
			description={description || `Applying ${input.edits.length} edits to ${fileName}`}
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
	);
};
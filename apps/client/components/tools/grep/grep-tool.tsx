import type React from "react";
import { Search, Clock, FileText } from "lucide-react";
import { TerminalWindow } from "@/components/ui/terminal";
import { TerminalText } from "@/shared/terminal-styles";
import type { GrepToolProps as GrepToolParserProps } from "@claude-codex/types";

// Component extends parser props with UI-specific options
export interface GrepToolProps extends GrepToolParserProps {
	description?: string;
	onMatchClick?: (filePath: string, lineNumber?: number) => void;
}

export const GrepTool: React.FC<GrepToolProps> = ({
	// From BaseToolProps
	id,
	uuid,
	parentUuid,
	timestamp,
	duration,
	status,
	className,
	metadata,
	
	// From SearchToolProps
	// (none - SearchToolProps has no additional props)
	
	// From GrepToolProps
	input,
	results,
	ui,
	
	// UI-specific
	description,
	onMatchClick,
}) => {
	const command = `grep -r "${input.pattern}"${input.searchPath ? ` "${input.searchPath}"` : ''}${input.filePatterns ? ` --include="${input.filePatterns.join(',')}"` : ''}`;
	const commandName = "grep";
	
	// Use normalized status from parser
	const normalizedStatus = status.normalized;

	// Error case
	if (normalizedStatus === "failed") {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stderr" className="mb-2">
					grep: search failed
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

	// Pending case
	if (normalizedStatus === "pending" || normalizedStatus === "running") {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stdout" className="text-gray-400 italic">
					Searching for pattern "{input.pattern}"{input.searchPath && ` in ${input.searchPath}`}...
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

	// Format search results
	const formatSearchResults = () => {
		if (!results || results.length === 0) {
			return (
				<TerminalText variant="stdout" className="text-gray-500 italic">
					grep: no matches found
				</TerminalText>
			);
		}

		return (
			<div className="space-y-3">
				{results.map((result, index) => (
					<div key={index} className="border border-gray-700 rounded-md p-3 bg-gray-900/50">
						{/* File header */}
						<div 
							className="flex items-center gap-2 mb-2 cursor-pointer hover:text-purple-300"
							onClick={() => onMatchClick?.(result.filePath)}
						>
							<FileText className="h-4 w-4 text-purple-400" />
							<span className="font-mono text-sm text-purple-400">
								{result.filePath}
							</span>
							<span className="text-xs text-gray-500">
								({result.totalMatches} match{result.totalMatches !== 1 ? 'es' : ''})
							</span>
						</div>
						
						{/* Matches */}
						<div className="space-y-1">
							{result.matches.map((match, matchIndex) => {
								const beforeMatch = match.content.substring(0, match.matchStart);
								const matchText = match.content.substring(match.matchStart, match.matchEnd);
								const afterMatch = match.content.substring(match.matchEnd);

								return (
									<div
										key={matchIndex}
										className="font-mono text-sm hover:bg-gray-800/30 px-2 py-1 rounded cursor-pointer"
										onClick={() => onMatchClick?.(result.filePath, match.line)}
									>
										<span className="text-gray-500 mr-3 select-none min-w-[3rem] inline-block text-right">
											{match.line}:
										</span>
										<span className="text-gray-300">{beforeMatch}</span>
										<span className="bg-yellow-600 text-black px-1 rounded">
											{matchText}
										</span>
										<span className="text-gray-300">{afterMatch}</span>
									</div>
								);
							})}
						</div>
					</div>
				))}
			</div>
		);
	};

	const output = (
		<div>
			{/* Success message */}
			<div className="flex items-center gap-2 mb-4">
				<Search className="h-4 w-4 text-green-400" />
				<TerminalText variant="stdout" className="text-green-400">
					{ui.totalMatches > 0
						? `Found ${ui.totalMatches} matches in ${ui.filesWithMatches} files`
						: 'Search completed - no matches found'}
				</TerminalText>
				{ui.searchTime > 0 && (
					<span className="text-xs text-gray-500">
						({ui.searchTime}ms)
					</span>
				)}
			</div>
			
			{/* Search results */}
			<div className="max-h-96 overflow-y-auto">
				{formatSearchResults()}
			</div>
		</div>
	);

	// Determine if content should be foldable
	const shouldFold = ui.totalMatches > 10;
	const defaultFolded = ui.totalMatches > 20;

	// Build metadata info
	const metadataInfo: string[] = [];
	if (input.caseSensitive) metadataInfo.push('case-sensitive');
	if (input.useRegex) metadataInfo.push('regex');
	if (input.filePatterns && input.filePatterns.length > 0) {
		metadataInfo.push(`include: ${input.filePatterns.join(', ')}`);
	}
	const metadataString = metadataInfo.length > 0 ? ` (${metadataInfo.join(', ')})` : '';

	// Create footer with metadata
	const footer = (
		<div className="flex items-center justify-between text-xs text-gray-500">
			<span>
				Pattern: "{input.pattern}"{metadataString}
			</span>
			{timestamp && (
				<span className="flex items-center">
					<Clock className="h-3 w-3 mr-1" />
					{new Date(timestamp).toLocaleString()}
				</span>
			)}
		</div>
	);

	return (
		<TerminalWindow
			command={command}
			commandName={commandName}
			description={description || `Searching for "${input.pattern}"`}
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
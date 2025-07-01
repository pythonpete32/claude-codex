import type React from "react";
import { FolderSearch, Clock, File, Folder } from "lucide-react";
import { TerminalWindow } from "@/components/ui/terminal";
import { TerminalText } from "@/shared/terminal-styles";
import type { GlobToolProps as GlobToolParserProps } from "@claude-codex/types";

// Component extends parser props with UI-specific options
export interface GlobToolProps extends GlobToolParserProps {
	description?: string;
	onFileClick?: (filePath: string) => void;
}

export const GlobTool: React.FC<GlobToolProps> = ({
	// From BaseToolProps
	id,
	uuid,
	parentUuid,
	timestamp,
	duration,
	status,
	className,
	metadata,
	
	// From GlobToolProps
	input,
	results,
	ui,
	
	// UI-specific
	description,
	onFileClick,
}) => {
	const command = `glob "${input.pattern}"${input.searchPath ? ` --path "${input.searchPath}"` : ''}`;
	const commandName = "glob";
	
	// Use normalized status from parser
	const normalizedStatus = status.normalized;

	// Error case
	if (normalizedStatus === "failed") {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stderr" className="mb-2">
					glob: pattern matching failed
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
					Searching for files matching "{input.pattern}"...
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

	// Helper to get file icon and color based on extension
	const getFileIcon = (filePath: string) => {
		const isDirectory = filePath.endsWith('/');
		const extension = filePath.split('.').pop()?.toLowerCase();
		
		if (isDirectory) {
			return <Folder className="h-4 w-4 text-blue-400" />;
		}
		
		// Different colors for different file types
		const colorMap: Record<string, string> = {
			'js': 'text-yellow-400',
			'jsx': 'text-yellow-400',
			'ts': 'text-blue-400',
			'tsx': 'text-blue-400',
			'json': 'text-green-400',
			'md': 'text-gray-400',
			'css': 'text-pink-400',
			'scss': 'text-pink-400',
			'html': 'text-orange-400',
			'yml': 'text-red-400',
			'yaml': 'text-red-400',
		};
		
		const color = colorMap[extension || ''] || 'text-gray-400';
		return <File className={`h-4 w-4 ${color}`} />;
	};

	// Format file results
	const formatFileResults = () => {
		if (!results || results.length === 0) {
			return (
				<TerminalText variant="stdout" className="text-gray-500 italic">
					No files matching pattern "{input.pattern}"
				</TerminalText>
			);
		}

		// Group files by directory
		const filesByDir = results.reduce((acc, filePath) => {
			const dir = filePath.substring(0, filePath.lastIndexOf('/')) || '.';
			if (!acc[dir]) acc[dir] = [];
			acc[dir].push(filePath);
			return acc;
		}, {} as Record<string, string[]>);

		return (
			<div className="space-y-3">
				{Object.entries(filesByDir).map(([dir, files]) => (
					<div key={dir} className="border border-gray-700 rounded-md p-3 bg-gray-900/50">
						<div className="flex items-center gap-2 mb-2">
							<Folder className="h-4 w-4 text-blue-400" />
							<span className="font-mono text-sm text-blue-400">
								{dir === '.' ? 'Current directory' : dir}
							</span>
							<span className="text-xs text-gray-500">
								({files.length} file{files.length !== 1 ? 's' : ''})
							</span>
						</div>
						
						<div className="space-y-1 pl-6">
							{files.map((filePath, index) => {
								const fileName = filePath.split('/').pop() || filePath;
								return (
									<div
										key={index}
										className="flex items-center gap-2 font-mono text-sm hover:bg-gray-800/30 px-2 py-1 rounded cursor-pointer"
										onClick={() => onFileClick?.(filePath)}
									>
										{getFileIcon(filePath)}
										<span className="text-gray-300 hover:text-white">
											{fileName}
										</span>
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
				<FolderSearch className="h-4 w-4 text-green-400" />
				<TerminalText variant="stdout" className="text-green-400">
					Found {ui.totalMatches} file{ui.totalMatches !== 1 ? 's' : ''} matching "{input.pattern}"
				</TerminalText>
				{ui.searchTime && ui.searchTime > 0 && (
					<span className="text-xs text-gray-500">
						({ui.searchTime}ms)
					</span>
				)}
			</div>
			
			{/* File results */}
			<div className="max-h-96 overflow-y-auto">
				{formatFileResults()}
			</div>
		</div>
	);

	// Determine if content should be foldable
	const shouldFold = ui.totalMatches > 20;
	const defaultFolded = ui.totalMatches > 50;

	// Create footer with metadata
	const footer = (
		<div className="flex items-center justify-between text-xs text-gray-500">
			<span>
				Pattern: "{input.pattern}"
				{input.searchPath && ` in ${input.searchPath}`}
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
			description={description || `Finding files matching "${input.pattern}"`}
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
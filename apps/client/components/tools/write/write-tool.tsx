import type React from "react";
import { FileText, FilePlus, FileEdit, Clock } from "lucide-react";
import { TerminalWindow } from "@/components/ui/terminal";
import { TerminalText } from "@/shared/terminal-styles";
import type { WriteToolProps as WriteToolParserProps } from "@claude-codex/types";

// Component extends parser props with UI-specific options
export interface WriteToolProps extends WriteToolParserProps {
	description?: string;
}

// Helper functions for formatting
function formatFileSize(bytes?: number): string {
	if (!bytes) return "";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(filePath: string): string {
	return filePath.split('.').pop()?.toLowerCase() || '';
}

export const WriteTool: React.FC<WriteToolProps> = ({
	// From BaseToolProps
	id,
	uuid,
	parentUuid,
	timestamp,
	duration,
	status,
	className,
	metadata,
	
	// From FileToolProps
	filePath,
	content = "",
	fileSize,
	totalLines,
	fileType,
	encoding,
	errorMessage,
	showLineNumbers = true,
	wordWrap,
	maxHeight = "500px",
	onFileClick,
	
	// From WriteToolProps
	created,
	overwritten,
	
	// UI-specific
	description,
}) => {
	const fileName = filePath.split("/").pop() || filePath;
	const fileExtension = fileType || getFileExtension(filePath);
	const command = created ? `echo "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}" > "${filePath}"` : `cat > "${filePath}"`;
	const commandName = created ? "echo" : "cat";
	
	// Use normalized status from parser
	const normalizedStatus = status.normalized;

	// Error case
	if (normalizedStatus === "failed" || errorMessage) {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stderr" className="mb-2">
					{errorMessage || `Failed to write to ${fileName}`}
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
					Writing to file...
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

	// Format content with line numbers if requested
	const formatContent = (text: string): React.ReactNode => {
		if (!text) {
			return (
				<TerminalText variant="comment" className="italic">
					Empty file written
				</TerminalText>
			);
		}

		const lines = text.split('\n');

		if (showLineNumbers) {
			return (
				<div className="font-mono text-sm">
					{lines.map((line, index) => {
						const lineNumber = index + 1;
						
						return (
							<div key={index} className="flex">
								<span 
									className="text-gray-500 mr-4 select-none min-w-[3rem] text-right cursor-pointer hover:text-gray-400"
									onClick={() => onFileClick?.(filePath)}
								>
									{lineNumber}
								</span>
								<span className={`text-gray-300 ${wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}>
									{line || ' '}
								</span>
							</div>
						);
					})}
				</div>
			);
		}

		return (
			<TerminalText 
				variant="stdout" 
				className={`font-mono text-sm ${wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}
			>
				{text}
			</TerminalText>
		);
	};

	// Build metadata info
	const metadataInfo: string[] = [];
	if (created) metadataInfo.push('CREATED');
	if (overwritten) metadataInfo.push('OVERWRITTEN');
	if (totalLines) metadataInfo.push(`${totalLines} lines`);
	if (fileSize) metadataInfo.push(formatFileSize(fileSize));
	if (fileExtension) metadataInfo.push(fileExtension.toUpperCase());
	if (encoding && encoding !== 'utf-8') metadataInfo.push(encoding);
	
	const metadataString = metadataInfo.length > 0 ? ` (${metadataInfo.join(', ')})` : '';

	// Success message with icon
	const successIcon = created ? <FilePlus className="h-4 w-4 text-green-400" /> : <FileEdit className="h-4 w-4 text-blue-400" />;
	
	const output = (
		<div>
			{/* Success message */}
			<div className="flex items-center gap-2 mb-4">
				{successIcon}
				<TerminalText variant="stdout" className="text-green-400">
					{created ? 'File created successfully' : 'File overwritten successfully'}
				</TerminalText>
			</div>
			
			{/* File content */}
			<div className="border border-gray-700 rounded-md p-2 bg-gray-900/50">
				<div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
					<FileText className="h-4 w-4 text-gray-400" />
					<span className="text-sm text-gray-400">{fileName}</span>
				</div>
				<div className="max-h-96 overflow-y-auto" style={{ maxHeight }}>
					{formatContent(content)}
				</div>
			</div>
		</div>
	);

	// Determine if content should be foldable
	const shouldFold = content.split('\n').length > 50 || content.length > 5000;
	const defaultFolded = content.split('\n').length > 100;

	// Create footer with metadata
	const footer = (
		<div className="flex items-center justify-between text-xs text-gray-500">
			<span>
				{fileName}{metadataString}
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
			description={description}
			output={output}
			footer={footer}
			status={normalizedStatus}
			timestamp={timestamp}
			foldable={shouldFold}
			defaultFolded={defaultFolded}
			maxHeight={maxHeight}
			showCopyButton={true}
			className={className}
		/>
	);
};
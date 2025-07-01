import type React from "react";
import { Clock } from "lucide-react";
import { TerminalWindow } from "@/components/ui/terminal";
import { TerminalText } from "@/shared/terminal-styles";
import type { ReadToolProps as ReadToolParserProps } from "@claude-codex/types";

// Component extends parser props with UI-specific options
export interface ReadToolProps extends ReadToolParserProps {
	description?: string;
	startLine?: number;
	endLine?: number;
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

function isBinaryContent(content: string): boolean {
	// Detect null bytes or high percentage of non-printable chars
	return (
		content.includes("\0") ||
		(content.length > 0 &&
			(content.match(/[\x00-\x08\x0E-\x1F\x7F-\xFF]/g) || []).length / content.length > 0.3)
	);
}

export const ReadTool: React.FC<ReadToolProps> = ({
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
	
	// From ReadToolProps
	truncated,
	language,
	
	// UI-specific
	description,
	startLine,
	endLine,
}) => {
	const fileName = filePath.split("/").pop() || filePath;
	const fileExtension = language || fileType || getFileExtension(filePath);
	const isBinary = isBinaryContent(content);
	const command = `cat "${filePath}"`;
	const commandName = "cat"; // Extract the actual command name
	
	// Use normalized status from parser
	const normalizedStatus = status.normalized;

	// Error case
	if (normalizedStatus === "failed" || errorMessage) {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stderr" className="mb-2">
					{errorMessage || `cat: ${fileName}: No such file or directory`}
				</TerminalText>
			</div>
		);

		return (
			<div className={className}>
				<TerminalWindow
					command={command}
					commandName={commandName}
					description={description}
					output={output}
					status={normalizedStatus}
					timestamp={timestamp}
					foldable={false}
				/>
			</div>
		);
	}

	// Pending case
	if (normalizedStatus === "pending" || normalizedStatus === "running") {
		const output = (
			<div className="text-center py-4">
				<TerminalText variant="stdout" className="text-gray-400 italic">
					Reading file...
				</TerminalText>
			</div>
		);

		return (
			<div className={className}>
				<TerminalWindow
					command={command}
					commandName={commandName}
					description={description}
					output={output}
					status={normalizedStatus}
					timestamp={timestamp}
					foldable={false}
				/>
			</div>
		);
	}

	// Binary file case
	if (isBinary) {
		const output = (
			<div className="text-center py-8">
				<TerminalText variant="stderr" className="mb-2">
					Binary file detected
				</TerminalText>
				<TerminalText variant="comment" className="text-xs">
					File appears to be binary and cannot be displayed as text
				</TerminalText>
				{fileSize && (
					<TerminalText variant="comment" className="text-xs mt-1">
						File size: {formatFileSize(fileSize)}
					</TerminalText>
				)}
			</div>
		);

		return (
			<div className={className}>
				<TerminalWindow
					command={command}
					commandName={commandName}
					description={description}
					output={output}
					status={normalizedStatus}
					timestamp={timestamp}
					foldable={false}
				/>
			</div>
		);
	}

	// Format content with line numbers if requested
	const formatContent = (text: string): React.ReactNode => {
		if (!text) {
			return (
				<TerminalText variant="comment" className="italic">
					File is empty
				</TerminalText>
			);
		}

		const lines = text.split('\n');
		const actualStartLine = startLine || 1;

		if (showLineNumbers) {
			return (
				<div className="font-mono text-sm">
					{lines.map((line, index) => {
						const lineNumber = actualStartLine + index;
						const isInRange = !endLine || lineNumber <= endLine;
						
						if (!isInRange) return null;
						
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
	if (totalLines) metadataInfo.push(`${totalLines} lines`);
	if (fileSize) metadataInfo.push(formatFileSize(fileSize));
	if (fileExtension) metadataInfo.push(fileExtension.toUpperCase());
	if (encoding && encoding !== 'utf-8') metadataInfo.push(encoding);
	if (truncated) metadataInfo.push('TRUNCATED');
	
	const metadataString = metadataInfo.length > 0 ? ` (${metadataInfo.join(', ')})` : '';

	const output = (
		<div>
			<div className="max-h-96 overflow-y-auto" style={{ maxHeight }}>
				{/* File content */}
				{formatContent(content)}
				
				{/* Truncation notice */}
				{truncated && (
					<div className="border-t border-gray-700 mt-3 pt-2">
						<TerminalText variant="comment" className="text-xs text-center">
							... content truncated ...
						</TerminalText>
					</div>
				)}
			</div>
		</div>
	);

	// Determine if content should be foldable
	const shouldFold = content.split('\n').length > 50 || content.length > 5000;
	const defaultFolded = content.split('\n').length > 100;

	// Create footer with metadata
	const footer = metadataString && (
		<div className="flex items-center justify-between text-xs text-gray-500">
			<span>
				{fileName}{metadataString}
				{startLine && endLine && startLine !== 1 && (
					<span className="ml-2">
						showing lines {startLine}-{endLine}
					</span>
				)}
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
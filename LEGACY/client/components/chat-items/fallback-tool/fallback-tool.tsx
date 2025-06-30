import { ChevronDown, ChevronRight, HelpCircle, Terminal } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/shared/copy-utils";
import { formatJSON, JsonDisplay } from "@/shared/json-utils";
// Import shared utilities
import { StatusBadge, type ToolStatus } from "@/shared/status-utils";
import { TerminalText } from "@/shared/terminal-styles";
import { TimeDisplay } from "@/shared/time-utils";

// Updated interface to match fixture contract exactly
export interface FallbackToolProps {
	toolUse: {
		type: "tool_use";
		id: string;
		name: string;
		input: Record<string, any>;
	};
	status: "pending" | "completed" | "failed" | "in_progress";
	timestamp: string;
	toolResult: Record<string, any> | string;
	className?: string;
}

export const FallbackTool: React.FC<FallbackToolProps> = ({
	toolUse,
	toolResult,
	status,
	timestamp,
	className,
}) => {
	const [isExpanded, setIsExpanded] = useState(true);

	// Validate toolUse.type
	if (toolUse.type !== "tool_use") {
		console.warn("FallbackTool: Expected toolUse.type to be 'tool_use', got:", toolUse.type);
	}

	const getToolName = () => {
		// Clean up tool name for display
		return toolUse.name
			.replace(/^mcp__/, "")
			.replace(/__/g, " ")
			.replace(/_/g, " ")
			.toLowerCase();
	};

	// Check if toolResult is error string
	const isErrorString = typeof toolResult === "string";
	const resultObject = isErrorString ? null : toolResult;
	const errorMessage = isErrorString ? toolResult : null;

	return (
		<div className={cn("rounded-lg border border-border bg-background overflow-hidden", className)}>
			{/* Terminal Header */}
			<div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
				<div className="flex items-center gap-2">
					<Terminal className="w-4 h-4 text-muted-foreground" />
					<HelpCircle className="w-4 h-4 text-orange-500" />
					<TerminalText variant="command" className="text-sm font-mono">
						{getToolName()}
					</TerminalText>
					<Badge
						variant="outline"
						className="text-xs font-mono text-orange-500 border-orange-500/50"
					>
						unknown
					</Badge>
					<TimeDisplay timestamp={timestamp} format="absolute" />
				</div>

				<div className="flex items-center gap-2">
					<StatusBadge status={status as ToolStatus} showLabel={false} />
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsExpanded(!isExpanded)}
						className="h-6 px-2"
					>
						{isExpanded ? (
							<ChevronDown className="w-4 h-4" />
						) : (
							<ChevronRight className="w-4 h-4" />
						)}
					</Button>
				</div>
			</div>

			{/* Terminal Content */}
			{isExpanded && (
				<div className="bg-gray-900 text-gray-300">
					{/* Tool Input Section */}
					<div className="p-3 border-b border-gray-700">
						<div className="flex items-center justify-between mb-2">
							<TerminalText variant="comment" className="text-xs font-medium text-orange-400">
								Tool Input
							</TerminalText>
							<CopyButton
								text={formatJSON(toolUse.input)}
								label="Copy Input"
								size="sm"
								variant="ghost"
								className="h-6 px-2 text-gray-300"
							/>
						</div>

						<div className="bg-gray-800 rounded border border-gray-600 p-3">
							<div className="space-y-2 mb-3">
								<TerminalText variant="comment" className="text-xs">
									Tool: {toolUse.name}
								</TerminalText>
								<TerminalText variant="comment" className="text-xs">
									ID: {toolUse.id}
								</TerminalText>
								<TerminalText variant="comment" className="text-xs">
									Type: {toolUse.type}
								</TerminalText>
							</div>

							{Object.keys(toolUse.input).length > 0 ? (
								<JsonDisplay
									data={toolUse.input}
									maxDepth={3}
									collapsible={true}
									className="bg-gray-900 border-gray-600"
								/>
							) : (
								<TerminalText variant="comment" className="text-xs italic">
									No input parameters
								</TerminalText>
							)}
						</div>
					</div>

					{/* Tool Output Section */}
					<div className="p-3">
						<div className="flex items-center justify-between mb-2">
							<TerminalText variant="comment" className="text-xs font-medium text-orange-400">
								Tool Output
							</TerminalText>
							{(resultObject || errorMessage) && (
								<CopyButton
									text={errorMessage || formatJSON(resultObject)}
									label="Copy Output"
									size="sm"
									variant="ghost"
									className="h-6 px-2 text-gray-300"
								/>
							)}
						</div>

						<div className="bg-gray-800 rounded border border-gray-600 p-3">
							{errorMessage ? (
								// Error string case
								<div>
									<TerminalText variant="stderr" className="text-xs mb-1">
										Error:
									</TerminalText>
									<TerminalText variant="stderr" className="text-sm font-mono whitespace-pre-wrap">
										{errorMessage}
									</TerminalText>
								</div>
							) : resultObject ? (
								// Object result case
								<JsonDisplay
									data={resultObject}
									maxDepth={4}
									collapsible={true}
									className="bg-gray-900 border-gray-600"
								/>
							) : status === "pending" ? (
								// Pending case
								<TerminalText variant="comment" className="text-xs italic flex items-center gap-2">
									<StatusBadge status="pending" showLabel={false} />
									Waiting for tool response...
								</TerminalText>
							) : (
								// No result case
								<TerminalText variant="comment" className="text-xs italic">
									No output generated
								</TerminalText>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

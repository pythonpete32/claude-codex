import { Brain, ChevronDown, ChevronUp, Lightbulb, Zap } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TerminalWindow } from "@/components/ui/terminal";

export interface ThinkingBlockProps {
	thought: string;
	thoughtNumber: number;
	totalThoughts: number;
	nextThoughtNeeded: boolean;
	toolUse?: {
		id: string;
		name: string;
	};
	toolResult?: {
		stdout?: Array<{ type: string; text: string }>;
		stderr?: string;
		interrupted?: boolean;
		isError?: boolean;
	};
	status?: "pending" | "completed" | "error";
	timestamp?: string;
	className?: string;
	variant?: "terminal" | "card" | "minimal";
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
	thought,
	thoughtNumber,
	totalThoughts,
	nextThoughtNeeded,
	toolUse: _toolUse,
	toolResult,
	status = "completed",
	timestamp,
	className,
	variant = "terminal",
}) => {
	const [isExpanded, setIsExpanded] = useState(true);

	const progress = (thoughtNumber / totalThoughts) * 100;
	const isComplete = !nextThoughtNeeded;

	const formatTimestamp = (ts?: string) => {
		if (!ts) return "";
		return new Date(ts).toLocaleTimeString();
	};

	const getStatusIcon = () => {
		switch (status) {
			case "pending":
				return <Zap className="w-4 h-4 animate-pulse text-yellow-500" />;
			case "error":
				return <Zap className="w-4 h-4 text-red-500" />;
			default:
				return <Brain className="w-4 h-4 text-blue-500" />;
		}
	};

	const getStatusColor = () => {
		switch (status) {
			case "pending":
				return "text-yellow-400";
			case "error":
				return "text-red-400";
			default:
				return "text-blue-400";
		}
	};

	// Terminal Variant
	if (variant === "terminal") {
		const terminalOutput = (
			<div className="space-y-3">
				{/* Progress header */}
				<div className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-2">
						{getStatusIcon()}
						<span className={getStatusColor()}>
							Thinking {thoughtNumber}/{totalThoughts}
						</span>
						{timestamp && <span className="text-gray-500">{formatTimestamp(timestamp)}</span>}
					</div>
					<div className="flex items-center gap-2">
						<Progress value={progress} className="w-20 h-2" />
						<span className="text-xs text-gray-400">{Math.round(progress)}%</span>
					</div>
				</div>

				{/* Thought content */}
				<div className="border-l-2 border-blue-500 pl-4">
					<p className="text-gray-300 leading-relaxed">{thought}</p>
				</div>

				{/* Status indicator */}
				<div className="flex items-center gap-2 text-xs">
					<Badge variant={isComplete ? "default" : "secondary"}>
						{isComplete ? "Complete" : "Continuing..."}
					</Badge>
					{nextThoughtNeeded && (
						<div className="flex items-center gap-1 text-green-400">
							<Lightbulb className="w-3 h-3" />
							<span>Next thought needed</span>
						</div>
					)}
				</div>

				{/* Tool result if available */}
				{toolResult?.stdout && (
					<div className="mt-2 p-2 bg-gray-800 rounded text-xs">
						<div className="text-gray-400 mb-1">Tool Result:</div>
						{toolResult.stdout.map((output, index) => (
							<pre key={index} className="text-green-400 whitespace-pre-wrap">
								{output.text}
							</pre>
						))}
					</div>
				)}
			</div>
		);

		return (
			<div className={className}>
				<TerminalWindow
					command={`thinking --step=${thoughtNumber}/${totalThoughts}`}
					description={`Sequential reasoning: ${isComplete ? "complete" : "in progress"}`}
					output={terminalOutput}
					status={status}
					timestamp={timestamp}
					foldable={thought.length > 200}
					defaultFolded={false}
					maxHeight="500px"
				/>
			</div>
		);
	}

	// Card Variant
	if (variant === "card") {
		return (
			<Card className={`${className} border-l-4 border-blue-500`}>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							{getStatusIcon()}
							<h3 className="font-medium text-sm">
								Thought {thoughtNumber} of {totalThoughts}
							</h3>
						</div>
						<Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
							{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
						</Button>
					</div>
					<Progress value={progress} className="h-2" />
				</CardHeader>
				{isExpanded && (
					<CardContent className="pt-0">
						<p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{thought}</p>
						<div className="flex items-center justify-between text-xs text-gray-500">
							<Badge variant={isComplete ? "default" : "secondary"}>
								{isComplete ? "Complete" : "Continuing..."}
							</Badge>
							{timestamp && <span>{formatTimestamp(timestamp)}</span>}
						</div>
					</CardContent>
				)}
			</Card>
		);
	}

	// Minimal Variant
	if (variant === "minimal") {
		return (
			<div className={`${className} p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20`}>
				<div className="flex items-start gap-3">
					<div className="flex-shrink-0 mt-1">{getStatusIcon()}</div>
					<div className="flex-1 space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium text-blue-700 dark:text-blue-300">
								Thinking {thoughtNumber}/{totalThoughts}
							</span>
							<Progress value={progress} className="w-16 h-1" />
						</div>
						<p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{thought}</p>
						{nextThoughtNeeded && (
							<div className="text-xs text-green-600 dark:text-green-400">
								→ Next thought needed
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	// Default fallback to terminal
	return (
		<div className={className}>
			<div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
				<p>{thought}</p>
			</div>
		</div>
	);
};

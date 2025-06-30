import {
	Brain,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Clock,
	Copy,
	Terminal,
	XCircle,
	Zap,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MCPSequentialThinkingToolProps {
	toolUse: {
		id: string;
		name: string;
		input: {
			thought: string;
			thoughtNumber: number;
			totalThoughts: number;
			nextThoughtNeeded: boolean;
		};
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
}

export const MCPSequentialThinkingTool: React.FC<MCPSequentialThinkingToolProps> = ({
	toolUse,
	toolResult,
	status = "completed",
	timestamp,
	className,
}) => {
	const [isFolded, setIsFolded] = useState(false);
	const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

	const formatTimestamp = (ts?: string) => {
		if (!ts) return "";
		return new Date(ts).toLocaleTimeString();
	};

	const getStatusIcon = () => {
		switch (status) {
			case "pending":
				return <Clock className="w-4 h-4 animate-spin text-yellow-500" />;
			case "error":
				return <XCircle className="w-4 h-4 text-red-500" />;
			default:
				return <CheckCircle className="w-4 h-4 text-green-500" />;
		}
	};

	const copyToClipboard = (text: string, key: string) => {
		navigator.clipboard.writeText(text);
		setCopiedStates((prev) => ({ ...prev, [key]: true }));
		setTimeout(() => {
			setCopiedStates((prev) => ({ ...prev, [key]: false }));
		}, 2000);
	};

	const { thought, thoughtNumber, totalThoughts, nextThoughtNeeded } = toolUse.input;
	const progress = (thoughtNumber / totalThoughts) * 100;

	// Enhanced syntax highlighting component
	const SyntaxHighlight: React.FC<{ code: string; language?: string }> = ({
		code,
		language = "json",
	}) => {
		if (language === "json") {
			try {
				const parsed = JSON.parse(code);
				return (
					<pre className="text-sm font-mono whitespace-pre-wrap text-gray-300">
						<code className="language-json">{JSON.stringify(parsed, null, 2)}</code>
					</pre>
				);
			} catch {
				// Fallback to plain text if JSON is invalid
				return (
					<pre className="text-sm font-mono whitespace-pre-wrap text-gray-300">
						<code>{code}</code>
					</pre>
				);
			}
		}

		return (
			<pre className="text-sm font-mono whitespace-pre-wrap text-gray-300">
				<code className={`language-${language}`}>{code}</code>
			</pre>
		);
	};

	return (
		<div
			className={cn(
				"rounded-lg border-2 transition-all duration-300",
				// MCP Tool glowy border effect
				"border-blue-400/50 bg-blue-500/5 shadow-lg shadow-blue-500/20",
				"hover:border-blue-400/70 hover:shadow-blue-500/30",
				className,
			)}
		>
			{/* Header */}
			<div className="flex items-center justify-between p-3 border-b border-border/50">
				<div className="flex items-center gap-2">
					<Terminal className="w-4 h-4 text-blue-400" />
					<Badge variant="outline" className="text-xs font-mono border-blue-400/50 text-blue-400">
						MCP
					</Badge>
					<span className="text-sm font-mono text-blue-400">
						{toolUse.name.replace("mcp__", "").replace("__", " ")}
					</span>
					<Badge variant="secondary" className="text-xs">
						Step {thoughtNumber}/{totalThoughts}
					</Badge>
				</div>

				<div className="flex items-center gap-2">
					{timestamp && (
						<span className="text-xs text-muted-foreground">{formatTimestamp(timestamp)}</span>
					)}
					{getStatusIcon()}
					<Button variant="ghost" size="sm" onClick={() => setIsFolded(!isFolded)}>
						{isFolded ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
					</Button>
				</div>
			</div>

			{!isFolded && (
				<>
					{/* Progress bar */}
					<div className="px-3 py-2 border-b border-border/50 bg-muted/30">
						<div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
							<span>Sequential Thinking Progress</span>
							<span>{Math.round(progress)}% Complete</span>
						</div>
						<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
							<div
								className="bg-blue-500 h-2 rounded-full transition-all duration-300"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>

					{/* Tool Input - Single Thinking Step */}
					<div className="p-3 border-b border-border/50">
						<div className="flex items-center justify-between mb-3">
							<span className="text-xs font-medium text-muted-foreground">Thinking Input</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => copyToClipboard(thought, "input")}
								className="h-6 px-2"
							>
								<Copy className="w-3 h-3" />
								{copiedStates["input"] && <span className="ml-1 text-xs">Copied!</span>}
							</Button>
						</div>

						<div className="bg-gray-900 rounded-md border border-gray-700">
							{/* Step header */}
							<div className="flex items-center justify-between p-2 border-b border-gray-700 bg-gray-800">
								<div className="flex items-center gap-2">
									<Brain className="w-4 h-4 text-blue-400" />
									<span className="text-xs font-medium text-blue-400">
										Step {thoughtNumber} of {totalThoughts}
									</span>
									{timestamp && (
										<span className="text-xs text-gray-500">{formatTimestamp(timestamp)}</span>
									)}
								</div>
							</div>

							{/* Step content */}
							<div className="p-3">
								<div className="text-gray-300 leading-relaxed text-sm">
									{thought.includes("`")
										? // Handle code snippets in thinking
											thought
												.split(/(`[^`]+`)/)
												.map((part, i) =>
													part.startsWith("`") && part.endsWith("`") ? (
														<code
															key={i}
															className="bg-gray-700 text-blue-300 px-1 rounded text-xs"
														>
															{part.slice(1, -1)}
														</code>
													) : (
														<span key={i}>{part}</span>
													),
												)
										: thought}
								</div>

								{nextThoughtNeeded && (
									<div className="mt-2 flex items-center gap-1 text-yellow-400 text-xs">
										<Zap className="w-3 h-3" />
										<span>Next thought needed</span>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Tool Output */}
					{toolResult?.stdout && (
						<div className="p-3">
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs font-medium text-muted-foreground">Final Output</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => copyToClipboard(toolResult.stdout?.[0]?.text || "", "output")}
									className="h-6 px-2"
								>
									<Copy className="w-3 h-3" />
									{copiedStates["output"] && <span className="ml-1 text-xs">Copied!</span>}
								</Button>
							</div>

							<div className="bg-gray-900 rounded-md p-3 border border-gray-700">
								{toolResult.stdout.map((output, index) => {
									try {
										const parsed = JSON.parse(output.text);
										return (
											<div key={index} className="space-y-3">
												<div className="flex items-center gap-2 text-green-400 text-sm">
													<CheckCircle className="w-4 h-4" />
													<span>Sequential thinking completed</span>
												</div>

												{/* Syntax highlighted JSON */}
												<div className="bg-gray-800 rounded border border-gray-600 p-3">
													<div className="text-xs text-gray-400 mb-2">JSON Response:</div>
													<div className="text-sm font-mono">
														<div className="text-gray-300">
															<span className="text-blue-400">"thoughtNumber"</span>:{" "}
															<span className="text-yellow-400">{parsed.thoughtNumber}</span>,
														</div>
														<div className="text-gray-300">
															<span className="text-blue-400">"totalThoughts"</span>:{" "}
															<span className="text-yellow-400">
																{parsed.totalThoughts || totalThoughts}
															</span>
															,
														</div>
														<div className="text-gray-300">
															<span className="text-blue-400">"nextThoughtNeeded"</span>:{" "}
															<span className="text-orange-400">
																{parsed.nextThoughtNeeded ? "true" : "false"}
															</span>
															,
														</div>
														<div className="text-gray-300">
															<span className="text-blue-400">"branches"</span>:{" "}
															<span className="text-gray-400">
																[{parsed.branches?.length || 0}]
															</span>
															,
														</div>
														<div className="text-gray-300">
															<span className="text-blue-400">"thoughtHistoryLength"</span>:{" "}
															<span className="text-yellow-400">{parsed.thoughtHistoryLength}</span>
														</div>
													</div>
												</div>

												{/* Summary */}
												<div className="text-xs text-gray-400 space-y-1">
													<div>
														✓ Completed step {parsed.thoughtNumber} of{" "}
														{parsed.totalThoughts || totalThoughts}
													</div>
													<div>✓ History contains {parsed.thoughtHistoryLength} thoughts</div>
													<div>
														{parsed.nextThoughtNeeded
															? "→ More thinking needed"
															: "✅ Thinking sequence complete"}
													</div>
												</div>
											</div>
										);
									} catch {
										return (
											<div key={index} className="bg-gray-800 rounded border border-gray-600 p-3">
												<div className="text-xs text-gray-400 mb-2">Raw Output:</div>
												<SyntaxHighlight code={output.text} language="text" />
											</div>
										);
									}
								})}
							</div>
						</div>
					)}

					{toolResult?.stderr && (
						<div className="p-3 border-t border-red-200">
							<span className="text-xs font-medium text-red-600 mb-1 block">Error</span>
							<pre className="text-red-600 text-sm whitespace-pre-wrap bg-red-50 p-2 rounded">
								{toolResult.stderr}
							</pre>
						</div>
					)}
				</>
			)}
		</div>
	);
};

import { type MotionProps, motion } from "framer-motion";
import { CheckCircle, Clock, Copy, Play, Square, Terminal, XCircle } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BashToolProps as BashToolParserProps } from "@claude-codex/types";

interface TypingAnimationProps extends MotionProps {
	children: string;
	className?: string;
	duration?: number;
	delay?: number;
	as?: React.ElementType;
}

interface AnimatedSpanProps extends MotionProps {
	children: React.ReactNode;
	delay?: number;
	className?: string;
}

const AnimatedSpan: React.FC<AnimatedSpanProps> = ({
	children,
	delay = 0,
	className,
	...props
}) => (
	<motion.div
		initial={{ opacity: 0, y: -5 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.3, delay: delay / 1000 }}
		className={cn("text-sm font-normal tracking-tight", className)}
		{...props}
	>
		{children}
	</motion.div>
);

const TypingAnimation: React.FC<TypingAnimationProps> = ({
	children,
	className,
	duration = 60,
	delay = 0,
	as: Component = "span",
	...props
}) => {
	const [displayedText, setDisplayedText] = useState("");
	const [isComplete, setIsComplete] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (!children) return;

			let currentIndex = 0;
			const interval = setInterval(() => {
				setDisplayedText(children.slice(0, currentIndex + 1));
				currentIndex++;

				if (currentIndex >= children.length) {
					clearInterval(interval);
					setIsComplete(true);
				}
			}, duration);

			return () => clearInterval(interval);
		}, delay);

		return () => clearTimeout(timer);
	}, [children, duration, delay]);

	return (
		<Component className={cn("font-mono", className)} {...props}>
			{displayedText}
			{!isComplete && <span className="animate-pulse">|</span>}
		</Component>
	);
};

// Component props extend parser props with UI-specific options
export interface BashToolProps extends BashToolParserProps {
	animated?: boolean;
	description?: string;
}

export const BashTool: React.FC<BashToolProps> = ({
	// From BaseToolProps
	id,
	uuid,
	parentUuid,
	timestamp,
	duration,
	status,
	className,
	metadata,
	
	// From CommandToolProps
	command,
	output,
	errorOutput,
	exitCode,
	workingDirectory,
	environment,
	interrupted,
	showCopyButton = true,
	onCopy,
	onRerun,
	
	// From BashToolProps
	elevated,
	showPrompt = true,
	promptText = "user@atomic-codex:~$",
	
	// UI-specific
	animated = true,
	description,
}) => {
	// Use normalized status from the parser
	const normalizedStatus = status.normalized;
	
	const getStatusIcon = () => {
		switch (normalizedStatus) {
			case "pending":
				return <Clock className="h-3 w-3 text-yellow-400" />;
			case "running":
				return <Play className="h-3 w-3 text-blue-400 animate-pulse" />;
			case "completed":
				return <CheckCircle className="h-3 w-3 text-green-400" />;
			case "failed":
				return <XCircle className="h-3 w-3 text-red-400" />;
			case "interrupted":
				return <Square className="h-3 w-3 text-yellow-400" />;
			default:
				return <Terminal className="h-3 w-3 text-gray-400" />;
		}
	};

	const getStatusColor = () => {
		switch (normalizedStatus) {
			case "pending":
				return "bg-yellow-900/20 text-yellow-300 border-yellow-500/30";
			case "running":
				return "bg-blue-900/20 text-blue-300 border-blue-500/30";
			case "completed":
				return "bg-green-900/20 text-green-300 border-green-500/30";
			case "failed":
				return "bg-red-900/20 text-red-300 border-red-500/30";
			case "interrupted":
				return "bg-yellow-900/20 text-yellow-300 border-yellow-500/30";
			default:
				return "bg-gray-900/20 text-gray-300 border-gray-500/30";
		}
	};

	const handleCopy = () => {
		const textToCopy = output || command;
		navigator.clipboard.writeText(textToCopy);
		onCopy?.();
	};

	// Combine output and error output if both exist
	const displayOutput = errorOutput ? `${output || ''}${output ? '\n' : ''}${errorOutput}` : output;
	
	// Determine if we should show output in red
	const hasError = normalizedStatus === "failed" || exitCode !== 0 || !!errorOutput;

	return (
		<div
			className={cn(
				"z-0 h-full w-full max-w-4xl rounded-xl border border-border bg-black/95 backdrop-blur-sm shadow-2xl",
				className,
			)}
		>
			{/* Terminal Header */}
			<div className="flex items-center justify-between border-b border-gray-700 p-4">
				<div className="flex items-center gap-x-3">
					<div className="flex flex-row gap-x-2">
						<div className="h-3 w-3 rounded-full bg-red-500"></div>
						<div className="h-3 w-3 rounded-full bg-yellow-500"></div>
						<div className="h-3 w-3 rounded-full bg-green-500"></div>
					</div>
					<div className="flex items-center gap-2 text-gray-300">
						<Terminal className="h-4 w-4" />
						<span className="text-sm font-medium">
							{elevated ? "sudo bash" : "bash"}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Badge variant="outline" className={getStatusColor()}>
						{getStatusIcon()}
						<span className="ml-1 capitalize text-xs">
							{status.original || normalizedStatus.replace("_", " ")}
						</span>
					</Badge>
					{duration && (
						<Badge variant="secondary" className="bg-gray-800 text-gray-300 border-gray-600">
							<Clock className="h-3 w-3 mr-1" />
							{duration}ms
						</Badge>
					)}
					{exitCode !== undefined && exitCode !== 0 && (
						<Badge variant="destructive" className="bg-red-900/20 text-red-300 border-red-500/30">
							Exit {exitCode}
						</Badge>
					)}
				</div>
			</div>

			{/* Description */}
			{description && (
				<div className="px-4 py-2 border-b border-gray-700">
					<AnimatedSpan delay={100} className="text-gray-400 text-sm">
						{description}
					</AnimatedSpan>
				</div>
			)}

			{/* Working Directory (if different from default) */}
			{workingDirectory && workingDirectory !== "~" && (
				<div className="px-4 py-2 border-b border-gray-700">
					<AnimatedSpan delay={150} className="text-gray-500 text-xs font-mono">
						Working directory: {workingDirectory}
					</AnimatedSpan>
				</div>
			)}

			{/* Terminal Content */}
			<div className="p-4 font-mono text-sm">
				{/* Command Line */}
				<div className="flex items-start gap-2 mb-4">
					{showPrompt && (
						<AnimatedSpan delay={200} className="text-green-400 select-none">
							{promptText}
						</AnimatedSpan>
					)}
					<div className="flex-1 flex items-center justify-between">
						{animated && normalizedStatus === "running" ? (
							<TypingAnimation duration={50} delay={500} className="text-white">
								{command}
							</TypingAnimation>
						) : (
							<AnimatedSpan delay={300} className="text-white">
								{command}
							</AnimatedSpan>
						)}

						<div className="flex items-center gap-1 ml-4">
							{showCopyButton && (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleCopy}
									className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
								>
									<Copy className="h-3 w-3" />
								</Button>
							)}
							{onRerun && (
								<Button
									variant="ghost"
									size="sm"
									onClick={onRerun}
									className="h-6 w-6 p-0 text-gray-400 hover:text-green-400 hover:bg-gray-700"
								>
									{normalizedStatus === "running" ? (
										<Square className="h-3 w-3" />
									) : (
										<Play className="h-3 w-3" />
									)}
								</Button>
							)}
						</div>
					</div>
				</div>

				{/* Output */}
				{displayOutput && (
					<AnimatedSpan delay={800} className="block">
						<div
							className={cn(
								"whitespace-pre-wrap break-words",
								hasError ? "text-red-300" : "text-gray-300",
							)}
						>
							{animated && (normalizedStatus === "running" || normalizedStatus === "completed") ? (
								<TypingAnimation
									duration={20}
									delay={1000}
									className={hasError ? "text-red-300" : "text-gray-300"}
								>
									{displayOutput}
								</TypingAnimation>
							) : (
								displayOutput
							)}
						</div>
					</AnimatedSpan>
				)}

				{/* Status indicators for different states */}
				{normalizedStatus === "running" && !displayOutput && (
					<AnimatedSpan delay={1000} className="text-blue-400">
						<TypingAnimation duration={200}>Executing...</TypingAnimation>
					</AnimatedSpan>
				)}

				{normalizedStatus === "pending" && (
					<AnimatedSpan delay={800} className="text-yellow-400">
						<TypingAnimation duration={200}>Waiting to execute...</TypingAnimation>
					</AnimatedSpan>
				)}

				{(normalizedStatus === "interrupted" || interrupted) && !displayOutput && (
					<AnimatedSpan delay={800} className="text-yellow-400">
						<TypingAnimation duration={200}>Command interrupted</TypingAnimation>
					</AnimatedSpan>
				)}

				{normalizedStatus === "failed" && !displayOutput && (
					<AnimatedSpan delay={800} className="text-red-400">
						<TypingAnimation duration={200}>Command failed</TypingAnimation>
					</AnimatedSpan>
				)}

				{normalizedStatus === "completed" && !displayOutput && (
					<AnimatedSpan delay={800} className="text-green-400">
						<TypingAnimation duration={200}>Command completed successfully</TypingAnimation>
					</AnimatedSpan>
				)}

				{/* New prompt line after completion */}
				{(normalizedStatus === "completed" || normalizedStatus === "failed") && (
					<AnimatedSpan
						delay={displayOutput ? 2000 : 1200}
						className="flex items-center gap-2 mt-4 text-green-400"
					>
						<span>{promptText}</span>
						<span className="animate-pulse">|</span>
					</AnimatedSpan>
				)}
			</div>

			{/* Footer with timestamp and metadata */}
			{(timestamp || metadata) && (
				<div className="border-t border-gray-700 px-4 py-2">
					<div className="flex items-center justify-between text-xs text-gray-500">
						{timestamp && (
							<div className="flex items-center">
								<Clock className="h-3 w-3 mr-1" />
								{new Date(timestamp).toLocaleString()}
							</div>
						)}
						{metadata?.executionId && (
							<div className="text-gray-600">
								ID: {metadata.executionId}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
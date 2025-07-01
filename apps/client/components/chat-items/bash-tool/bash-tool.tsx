import { type MotionProps, motion } from "framer-motion";
import { CheckCircle, Clock, Copy, Play, Square, Terminal, XCircle } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/shared/copy-utils";
import { StatusBadge } from "@/shared/status-utils";
import { TerminalText } from "@/shared/terminal-styles";
import { TimeDisplay } from "@/shared/time-utils";

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

export interface BashToolProps {
	command: string;
	description?: string;
	output?: string;
	status: "pending" | "completed" | "failed" | "running" | "error" | "in_progress" | "interrupted";
	timestamp?: string;
	duration?: number;
	showCopyButton?: boolean;
	animated?: boolean;
	onCopy?: () => void;
	onRun?: () => void;
	className?: string;
}

export const BashTool: React.FC<BashToolProps> = ({
	command,
	description,
	output,
	status = "completed",
	timestamp,
	duration,
	showCopyButton = true,
	animated = true,
	onCopy,
	onRun,
	className,
}) => {
	// Command and description are now direct props
	const getStatusIcon = () => {
		switch (status) {
			case "pending":
				return <Clock className="h-3 w-3 text-yellow-400" />;
			case "running":
			case "in_progress":
				return <Play className="h-3 w-3 text-blue-400 animate-pulse" />;
			case "completed":
				return <CheckCircle className="h-3 w-3 text-green-400" />;
			case "failed":
			case "error":
				return <XCircle className="h-3 w-3 text-red-400" />;
			case "interrupted":
				return <Square className="h-3 w-3 text-yellow-400" />;
			default:
				return <Terminal className="h-3 w-3 text-gray-400" />;
		}
	};

	const getStatusColor = () => {
		switch (status) {
			case "pending":
				return "bg-yellow-900/20 text-yellow-300 border-yellow-500/30";
			case "running":
			case "in_progress":
				return "bg-blue-900/20 text-blue-300 border-blue-500/30";
			case "completed":
				return "bg-green-900/20 text-green-300 border-green-500/30";
			case "failed":
			case "error":
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

	// Get the output to display
	const getDisplayOutput = () => {
		return output || null;
	};

	const displayOutput = getDisplayOutput();

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
						<span className="text-sm font-medium">bash</span>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Badge variant="outline" className={getStatusColor()}>
						{getStatusIcon()}
						<span className="ml-1 capitalize text-xs">{status.replace("_", " ")}</span>
					</Badge>
					{duration && (
						<Badge variant="secondary" className="bg-gray-800 text-gray-300 border-gray-600">
							<Clock className="h-3 w-3 mr-1" />
							{duration}ms
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

			{/* Terminal Content */}
			<div className="p-4 font-mono text-sm">
				{/* Command Line */}
				<div className="flex items-start gap-2 mb-4">
					<AnimatedSpan delay={200} className="text-green-400 select-none">
						user@atomic-codex:~$
					</AnimatedSpan>
					<div className="flex-1 flex items-center justify-between">
						{animated && (status === "in_progress" || status === "running") ? (
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
							{onRun && (
								<Button
									variant="ghost"
									size="sm"
									onClick={onRun}
									className="h-6 w-6 p-0 text-gray-400 hover:text-green-400 hover:bg-gray-700"
								>
									{(status === "in_progress" || status === "running") ? (
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
								status === "error" || status === "failed" ? "text-red-300" : "text-gray-300",
							)}
						>
							{animated && (status === "in_progress" || status === "running" || status === "completed") ? (
								<TypingAnimation
									duration={20}
									delay={1000}
									className="text-gray-300"
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
				{(status === "in_progress" || status === "running") && !displayOutput && (
					<AnimatedSpan delay={1000} className="text-blue-400">
						<TypingAnimation duration={200}>Executing...</TypingAnimation>
					</AnimatedSpan>
				)}

				{status === "pending" && (
					<AnimatedSpan delay={800} className="text-yellow-400">
						<TypingAnimation duration={200}>Waiting to execute...</TypingAnimation>
					</AnimatedSpan>
				)}

				{status === "interrupted" && !displayOutput && (
					<AnimatedSpan delay={800} className="text-yellow-400">
						<TypingAnimation duration={200}>Command interrupted</TypingAnimation>
					</AnimatedSpan>
				)}

				{status === "failed" && !displayOutput && (
					<AnimatedSpan delay={800} className="text-red-400">
						<TypingAnimation duration={200}>Command failed</TypingAnimation>
					</AnimatedSpan>
				)}

				{status === "completed" && !displayOutput && (
					<AnimatedSpan delay={800} className="text-green-400">
						<TypingAnimation duration={200}>Command completed successfully</TypingAnimation>
					</AnimatedSpan>
				)}

				{/* New prompt line after completion */}
				{(status === "completed" || status === "failed") && (
					<AnimatedSpan
						delay={displayOutput ? 2000 : 1200}
						className="flex items-center gap-2 mt-4 text-green-400"
					>
						<span>user@atomic-codex:~$</span>
						<span className="animate-pulse">|</span>
					</AnimatedSpan>
				)}
			</div>

			{/* Footer with timestamp */}
			{timestamp && (
				<div className="border-t border-gray-700 px-4 py-2">
					<div className="flex items-center text-xs text-gray-500">
						<Clock className="h-3 w-3 mr-1" />
						{timestamp}
					</div>
				</div>
			)}
		</div>
	);
};

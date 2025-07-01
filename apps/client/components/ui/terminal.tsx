import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, ChevronDown, ChevronRight, Clock, Copy, Terminal, XCircle } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AnimatedSpanProps {
	children: React.ReactNode
	delay?: number
	className?: string
}

const AnimatedSpan: React.FC<AnimatedSpanProps> = ({ children, delay = 0, className }) => (
	<motion.div
		initial={{ opacity: 0, y: -5 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.3, delay: delay / 1000 }}
		className={cn("text-sm font-normal tracking-tight", className)}
	>
		{children}
	</motion.div>
)

export interface TerminalProps {
	command: string
	commandName?: string // The name to show in header (e.g., "cat", "ls", "grep")
	description?: string
	output?: React.ReactNode
	footer?: React.ReactNode // Optional footer content
	status?: "pending" | "running" | "completed" | "error" | "failed" | "interrupted" | "unknown"
	duration?: number
	timestamp?: string
	showCopyButton?: boolean
	foldable?: boolean
	defaultFolded?: boolean
	maxHeight?: string
	className?: string
}

export const TerminalWindow: React.FC<TerminalProps> = ({
	command,
	commandName = "bash",
	description,
	output,
	footer,
	status = "completed",
	duration,
	timestamp,
	showCopyButton = true,
	foldable = false,
	defaultFolded = false,
	maxHeight = "400px",
	className,
}) => {
	const [isFolded, setIsFolded] = useState(defaultFolded)

	const getStatusIcon = () => {
		switch (status) {
			case "pending":
				return <Clock className="h-3 w-3 text-yellow-400" />
			case "running":
				return <Terminal className="h-3 w-3 text-blue-400 animate-pulse" />
			case "completed":
				return <CheckCircle className="h-3 w-3 text-green-400" />
			case "error":
				return <XCircle className="h-3 w-3 text-red-400" />
			default:
				return <Terminal className="h-3 w-3 text-gray-400" />
		}
	}

	const getStatusColor = () => {
		switch (status) {
			case "pending":
				return "bg-yellow-900/20 text-yellow-300 border-yellow-500/30"
			case "running":
				return "bg-blue-900/20 text-blue-300 border-blue-500/30"
			case "completed":
				return "bg-green-900/20 text-green-300 border-green-500/30"
			case "error":
				return "bg-red-900/20 text-red-300 border-red-500/30"
			default:
				return "bg-gray-900/20 text-gray-300 border-gray-500/30"
		}
	}

	const handleCopy = () => {
		navigator.clipboard.writeText(command)
	}

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
						<span className="text-sm font-medium">{commandName}</span>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{foldable ? (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsFolded(!isFolded)}
							className={cn("h-7 px-2 py-1 flex items-center gap-1", getStatusColor())}
						>
							{getStatusIcon()}
							<span className="capitalize text-xs">{status}</span>
							<motion.div animate={{ rotate: isFolded ? -90 : 0 }} transition={{ duration: 0.2 }} className="ml-1">
								<ChevronDown className="h-3 w-3" />
							</motion.div>
						</Button>
					) : (
						<Badge variant="outline" className={getStatusColor()}>
							{getStatusIcon()}
							<span className="ml-1 capitalize text-xs">{status}</span>
						</Badge>
					)}
					{duration && (
						<Badge variant="secondary" className="bg-gray-800 text-gray-300 border-gray-600">
							<Clock className="h-3 w-3 mr-1" />
							{duration}ms
						</Badge>
					)}
				</div>
			</div>

			{/* Description */}
			<AnimatePresence>
				{description && !isFolded && (
					<motion.div
						className="border-b border-gray-700 overflow-hidden"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: "easeInOut" }}
					>
						<div className="px-4 py-2">
							<AnimatedSpan delay={100} className="text-gray-400 text-sm">
								{description}
							</AnimatedSpan>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Terminal Content */}
			<AnimatePresence>
				{!isFolded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
						className="overflow-hidden"
					>
						<div className="p-4 font-mono text-sm">
							{/* Command Line */}
							<div className="flex items-start gap-2 mb-4">
								<AnimatedSpan delay={200} className="text-green-400 select-none">
									user@atomic-codex:~$
								</AnimatedSpan>
								<div className="flex-1 flex items-center justify-between">
									<AnimatedSpan delay={300} className="text-white">
										{command}
									</AnimatedSpan>

									{showCopyButton && (
										<Button
											variant="ghost"
											size="sm"
											onClick={handleCopy}
											className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700 ml-4"
										>
											<Copy className="h-3 w-3" />
										</Button>
									)}
								</div>
							</div>

							{/* Output */}
							{output && (
								<AnimatedSpan delay={500} className="block">
									<div
										className="text-gray-300 whitespace-pre-wrap break-words overflow-auto"
										style={{ maxHeight: foldable ? maxHeight : "none" }}
									>
										{output}
									</div>
								</AnimatedSpan>
							)}

							{/* New prompt line after completion */}
							{(status === "completed" || status === "error") && (
								<AnimatedSpan delay={800} className="flex items-center gap-2 mt-4 text-green-400">
									<span>user@atomic-codex:~$</span>
									<span className="animate-pulse">|</span>
								</AnimatedSpan>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Collapsed summary - show when folded */}
			<AnimatePresence>
				{isFolded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: "easeInOut" }}
						className="overflow-hidden border-b border-gray-700"
					>
						<div className="px-4 py-3 text-gray-500 text-sm">
							<span className="italic">Content collapsed - click status badge to expand</span>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Footer */}
			<AnimatePresence>
				{!isFolded && (footer || timestamp) && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: "easeInOut" }}
						className="overflow-hidden border-t border-gray-700"
					>
						<div className="px-4 py-2">
							{footer ? (
								footer
							) : (
								<div className="flex items-center justify-end text-xs text-gray-500">
									<Clock className="h-3 w-3 mr-1" />
									{timestamp}
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

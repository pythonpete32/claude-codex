import { Brain, ChevronDown, ChevronRight, Copy, Terminal } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface NativeThinkingBlockProps {
	thinking: string
	associatedWith: "message" | "tool_call"
	associatedContent?: React.ReactNode
	timestamp?: string
	className?: string
	defaultExpanded?: boolean
}

export const NativeThinkingBlock: React.FC<NativeThinkingBlockProps> = ({
	thinking,
	associatedWith,
	associatedContent,
	timestamp,
	className,
	defaultExpanded = false,
}) => {
	const [isExpanded, setIsExpanded] = useState(defaultExpanded)
	const [copied, setCopied] = useState(false)

	const formatTimestamp = (ts?: string) => {
		if (!ts) return ""
		return new Date(ts).toLocaleTimeString()
	}

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<div className={cn("rounded-lg border border-border bg-background overflow-hidden", className)}>
			{/* Unified Terminal Header */}
			<div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
				<div className="flex items-center gap-2">
					<Terminal className="w-4 h-4 text-muted-foreground" />
					<Brain className="w-4 h-4 text-orange-500" />
					<span className="text-sm font-mono text-foreground">thinking</span>
					<Badge variant="outline" className="text-xs font-mono">
						{associatedWith === "message" ? "message" : "tool_call"}
					</Badge>
					{timestamp && <span className="text-xs text-muted-foreground font-mono">{formatTimestamp(timestamp)}</span>}
				</div>

				<div className="flex items-center gap-1">
					<Button variant="ghost" size="sm" onClick={() => copyToClipboard(thinking)} className="h-6 px-2">
						<Copy className="w-3 h-3" />
						{copied && <span className="ml-1 text-xs">Copied!</span>}
					</Button>
					<Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-6 px-2">
						{isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
					</Button>
				</div>
			</div>

			{/* Unified Content - Thinking + Associated Content */}
			{isExpanded && (
				<div>
					{/* Thinking Section */}
					<div className="p-3 bg-gray-900 text-gray-300 border-b border-gray-700">
						<div className="flex items-center gap-2 mb-2">
							<Brain className="w-3 h-3 text-orange-400" />
							<span className="text-xs text-orange-400 font-mono">thinking</span>
						</div>
						<div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
							{thinking.includes("`")
								? // Handle inline code in thinking
									thinking
										.split(/(`[^`]+`)/)
										.map((part, i) =>
											part.startsWith("`") && part.endsWith("`") ? (
												<code key={i} className="bg-gray-700 text-blue-300 px-1 rounded text-xs">
													{part.slice(1, -1)}
												</code>
											) : (
												<span key={i}>{part}</span>
											),
										)
								: thinking}
						</div>
					</div>

					{/* Associated Content Section */}
					{associatedContent && (
						<div className={associatedWith === "message" ? "bg-background" : "bg-gray-900"}>
							<div className="p-3">{associatedContent}</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}

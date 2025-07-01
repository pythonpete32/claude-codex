import { ChevronDown, ChevronRight, Copy, Terminal, User } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface UserMessageProps {
	content: string
	timestamp?: string
	className?: string
	defaultExpanded?: boolean
}

export const UserMessage: React.FC<UserMessageProps> = ({ content, timestamp, className, defaultExpanded = true }) => {
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
			{/* Terminal Header */}
			<div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
				<div className="flex items-center gap-2">
					<Terminal className="w-4 h-4 text-muted-foreground" />
					<User className="w-4 h-4 text-green-500" />
					<span className="text-sm font-mono text-foreground">user</span>
					<Badge variant="outline" className="text-xs font-mono">
						message
					</Badge>
					{timestamp && <span className="text-xs text-muted-foreground font-mono">{formatTimestamp(timestamp)}</span>}
				</div>

				<div className="flex items-center gap-1">
					<Button variant="ghost" size="sm" onClick={() => copyToClipboard(content)} className="h-6 px-2">
						<Copy className="w-3 h-3" />
						{copied && <span className="ml-1 text-xs">Copied!</span>}
					</Button>
					<Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-6 px-2">
						{isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
					</Button>
				</div>
			</div>

			{/* Message Content */}
			{isExpanded && (
				<div className="p-3 bg-background">
					<div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
						{content.includes("`")
							? // Handle inline code in content
								content
									.split(/(`[^`]+`)/)
									.map((part, i) =>
										part.startsWith("`") && part.endsWith("`") ? (
											<code key={i} className="bg-muted text-blue-600 px-1 rounded text-xs font-mono">
												{part.slice(1, -1)}
											</code>
										) : (
											<span key={i}>{part}</span>
										),
									)
							: content}
					</div>
				</div>
			)}
		</div>
	)
}

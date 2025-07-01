"use client"

import { usePathname, useRouter } from "next/navigation"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell/app-shell"
import { cn } from "@/lib/utils"

interface AppShellWrapperProps {
	children?: React.ReactNode
	className?: string
	variant?: "full" | "minimal"
}

export function AppShellWrapper({ children, className, variant = "full" }: AppShellWrapperProps) {
	const router = useRouter()
	const pathname = usePathname()

	const handleSelectSession = (sessionId: string) => {
		// Navigate to the chat page for this session
		router.push(`/chat/${sessionId}`)
	}

	const handleNavigateQuickStart = () => {
		router.push("/quick-start")
	}

	if (variant === "minimal") {
		// For quick-start page - keep sidebar but hide chat UI and tools panel
		return (
			<div className={cn("min-h-screen overflow-hidden", className)}>
				<AppShell
					onSelectSession={handleSelectSession}
					onNavigateQuickStart={handleNavigateQuickStart}
					hideChat={true}
					hideSessionHeader={true}
					hideTools={true}
					hideSidebar={false}
					currentPath={pathname}
				>
					{children}
				</AppShell>
			</div>
		)
	}

	// Full variant for chat pages
	return (
		<div className={cn("min-h-screen overflow-hidden flex flex-col", className)}>
			<AppShell
				onSelectSession={handleSelectSession}
				onNavigateQuickStart={handleNavigateQuickStart}
				currentPath={pathname}
			>
				{children}
			</AppShell>
		</div>
	)
}

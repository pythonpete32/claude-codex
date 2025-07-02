"use client"

import { useRouter } from "next/navigation"
import { AppShellWrapper } from "@/components/app-shell-wrapper"
import type { SessionConfig } from "@/components/screens/quick-start"
import { QuickStart } from "@/components/screens/quick-start"

export default function QuickStartPage() {
	const router = useRouter()

	const handleStartSession = (config: SessionConfig) => {
		// Generate a session ID (in a real app, this would be from an API)
		const sessionId = `session-${Date.now()}`

		// Store session config (in a real app, this would be sent to an API)
		if (typeof window !== "undefined") {
			sessionStorage.setItem(`session-${sessionId}`, JSON.stringify(config))
		}

		// Navigate to the chat page
		router.push(`/chat/${sessionId}`)
	}

	return (
		<AppShellWrapper variant="minimal">
			<div className="flex items-center justify-center min-h-screen px-4">
				<div className="w-full max-w-4xl">
					<QuickStart onStartSession={handleStartSession} />
				</div>
			</div>
		</AppShellWrapper>
	)
}

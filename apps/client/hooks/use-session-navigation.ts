import { useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { SessionInfo } from "@/types/api";

/**
 * Hook for handling session navigation
 * Provides utilities for navigating between sessions and tracking navigation state
 */
export function useSessionNavigation() {
	const router = useRouter();
	const pathname = usePathname();

	// Extract current session ID from pathname
	const currentSessionId = useMemo(() => {
		const match = pathname.match(/\/chat\/([^/]+)/);
		return match ? match[1] : null;
	}, [pathname]);

	// Check if we're on a session page
	const isOnSessionPage = useMemo(() => {
		return pathname.startsWith("/chat/") && currentSessionId !== null;
	}, [pathname, currentSessionId]);

	// Navigate to a session
	const navigateToSession = useCallback(
		(sessionId: string) => {
			router.push(`/chat/${sessionId}`);
		},
		[router],
	);

	// Navigate to home
	const navigateToHome = useCallback(() => {
		router.push("/");
	}, [router]);

	// Navigate to a new session (with project context)
	const navigateToNewSession = useCallback(
		(projectPath?: string) => {
			if (projectPath) {
				// Navigate to new session page with project context
				router.push(`/chat/new?project=${encodeURIComponent(projectPath)}`);
			} else {
				router.push("/chat/new");
			}
		},
		[router],
	);

	// Navigate to session list/dashboard
	const navigateToSessionList = useCallback(() => {
		router.push("/sessions");
	}, [router]);

	// Navigate to project sessions
	const navigateToProjectSessions = useCallback(
		(projectPath: string) => {
			const encodedPath = projectPath.replace(/\//g, "-").replace(/\./g, "--");
			router.push(`/projects/${encodedPath}/sessions`);
		},
		[router],
	);

	// Get navigation URL for a session (without navigating)
	const getSessionUrl = useCallback((sessionId: string) => {
		return `/chat/${sessionId}`;
	}, []);

	// Get navigation URL for project sessions
	const getProjectSessionsUrl = useCallback((projectPath: string) => {
		const encodedPath = projectPath.replace(/\//g, "-").replace(/\./g, "--");
		return `/projects/${encodedPath}/sessions`;
	}, []);

	// Navigate with history replacement (no back button)
	const replaceWithSession = useCallback(
		(sessionId: string) => {
			router.replace(`/chat/${sessionId}`);
		},
		[router],
	);

	// Navigate back
	const navigateBack = useCallback(() => {
		router.back();
	}, [router]);

	// Navigate forward
	const navigateForward = useCallback(() => {
		router.forward();
	}, [router]);

	// Refresh current page
	const refresh = useCallback(() => {
		router.refresh();
	}, [router]);

	// Prefetch a session page for faster navigation
	const prefetchSession = useCallback(
		(sessionId: string) => {
			router.prefetch(`/chat/${sessionId}`);
		},
		[router],
	);

	// Batch prefetch multiple sessions
	const prefetchSessions = useCallback(
		(sessionIds: string[]) => {
			sessionIds.forEach((id) => {
				router.prefetch(`/chat/${id}`);
			});
		},
		[router],
	);

	// Check if a session is the current one
	const isCurrentSession = useCallback(
		(sessionId: string) => {
			return currentSessionId === sessionId;
		},
		[currentSessionId],
	);

	// Get breadcrumb data for current location
	const breadcrumbs = useMemo(() => {
		const crumbs = [{ label: "Home", href: "/" }];

		if (pathname.startsWith("/sessions")) {
			crumbs.push({ label: "Sessions", href: "/sessions" });
		} else if (pathname.startsWith("/projects/")) {
			const projectMatch = pathname.match(/\/projects\/([^/]+)/);
			if (projectMatch) {
				const encodedPath = projectMatch[1];
				const projectPath = encodedPath.replace(/--/g, ".").replace(/-/g, "/");
				const projectName = projectPath.split("/").pop() || projectPath;
				crumbs.push({ label: `Project: ${projectName}`, href: `/projects/${encodedPath}` });

				if (pathname.includes("/sessions")) {
					crumbs.push({ label: "Sessions", href: `/projects/${encodedPath}/sessions` });
				}
			}
		} else if (isOnSessionPage && currentSessionId) {
			crumbs.push({
				label: `Session: ${currentSessionId.slice(0, 8)}...`,
				href: `/chat/${currentSessionId}`,
			});
		}

		return crumbs;
	}, [pathname, isOnSessionPage, currentSessionId]);

	return {
		// Current state
		currentSessionId,
		isOnSessionPage,
		pathname,
		breadcrumbs,

		// Navigation functions
		navigateToSession,
		navigateToHome,
		navigateToNewSession,
		navigateToSessionList,
		navigateToProjectSessions,
		replaceWithSession,
		navigateBack,
		navigateForward,
		refresh,

		// URL helpers
		getSessionUrl,
		getProjectSessionsUrl,

		// Prefetching
		prefetchSession,
		prefetchSessions,

		// Utilities
		isCurrentSession,
	};
}

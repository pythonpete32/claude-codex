import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/hooks/use-api-client";
import { useLocalStorage } from "@/hooks/use-local-storage";

/**
 * Hook for managing the currently active session
 * Handles session selection, persistence, and navigation
 */
export function useActiveSession() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  // Persist active session ID in localStorage
  const [activeSessionId, setActiveSessionId] = useLocalStorage<string | null>(
    "codex:activeSessionId",
    null
  );

  // Local state for optimistic updates
  const [isNavigating, setIsNavigating] = useState(false);

  // Fetch active session details
  const { data: activeSession, isLoading } = useQuery({
    queryKey: ["session", activeSessionId],
    queryFn: async () => {
      if (!activeSessionId || !apiClient) return null;

      try {
        const session = await apiClient.getSession(activeSessionId);
        return session;
      } catch (error) {
        console.error("Failed to fetch active session:", error);
        // Clear invalid session ID
        setActiveSessionId(null);
        return null;
      }
    },
    enabled: !!activeSessionId && !!apiClient,
    staleTime: 30000, // 30 seconds
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (projectPath: string) => {
      if (!apiClient) throw new Error("API client not initialized");

      return apiClient.createSession({
        projectPath,
        metadata: {
          createdFrom: "navbar",
          timestamp: new Date().toISOString(),
        },
      });
    },
    onSuccess: (data) => {
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      // Set as active session
      if (data.session) {
        selectSession(data.session.id);
      }
    },
  });

  // Select a session as active
  const selectSession = useCallback(
    (sessionId: string | null) => {
      setActiveSessionId(sessionId);

      if (sessionId) {
        setIsNavigating(true);
        // Navigate to the session page
        router.push(`/chat/${sessionId}`);

        // Clear navigating state after a delay
        setTimeout(() => setIsNavigating(false), 1000);
      }
    },
    [router, setActiveSessionId]
  );

  // Clear active session
  const clearActiveSession = useCallback(() => {
    setActiveSessionId(null);
    router.push("/");
  }, [router, setActiveSessionId]);

  // Create and activate a new session
  const createAndActivateSession = useCallback(
    async (projectPath: string) => {
      try {
        const result = await createSessionMutation.mutateAsync(projectPath);
        return result.session;
      } catch (error) {
        console.error("Failed to create session:", error);
        throw error;
      }
    },
    [createSessionMutation]
  );

  // Check if a session is the active one
  const isSessionActive = useCallback(
    (sessionId: string) => {
      return sessionId === activeSessionId;
    },
    [activeSessionId]
  );

  // Navigate to session without changing active state
  const navigateToSession = useCallback(
    (sessionId: string) => {
      setIsNavigating(true);
      router.push(`/chat/${sessionId}`);
      setTimeout(() => setIsNavigating(false), 1000);
    },
    [router]
  );

  // Effect to handle session changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "codex:activeSessionId" && e.newValue !== activeSessionId) {
        // Another tab changed the active session
        const newSessionId = e.newValue ? JSON.parse(e.newValue) : null;
        if (newSessionId !== activeSessionId) {
          // Update local state without triggering navigation
          setActiveSessionId(newSessionId);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [activeSessionId, setActiveSessionId]);

  return {
    // State
    activeSessionId,
    activeSession,
    isLoading,
    isNavigating,
    isCreating: createSessionMutation.isPending,

    // Actions
    selectSession,
    clearActiveSession,
    createAndActivateSession,
    isSessionActive,
    navigateToSession,

    // Errors
    createError: createSessionMutation.error,
  };
}

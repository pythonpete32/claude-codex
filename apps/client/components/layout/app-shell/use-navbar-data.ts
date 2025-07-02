import { useMemo } from "react";
// import type { ProjectInfo, SessionInfo } from "@/types/api";
// import { useProjectsWithConfig } from "@/hooks/use-projects";
// import { useSessionsWithConfig } from "@/hooks/use-sessions";
// import {
// 	formatRelativeTime,
// 	getProjectName,
// 	getProjectType,
// 	sortProjectsByActivity,
// } from "@/lib/utils/api-helpers";
// import { ApiClient } from "@/services/api-client";

/**
 * Custom hook to transform API data for the navbar
 * Handles loading states, error states, and data transformation
 */
export function useNavbarData() {
  // Fetch projects and sessions from API with real-time updates
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useProjectsWithConfig(
    { limit: 50 },
    {
      // Refetch every 30 seconds for real-time updates
      refetchInterval: 30000,
      // Refetch on window focus
      refetchOnWindowFocus: true,
      staleTime: 30000,
    }
  );

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions,
  } = useSessionsWithConfig(
    { limit: 100 },
    {
      // Refetch every 30 seconds for real-time updates
      refetchInterval: 30000,
      // Refetch on window focus
      refetchOnWindowFocus: true,
      staleTime: 30000,
    }
  );

  // Transform projects data for UI
  const projects = useMemo(() => {
    if (!projectsData?.projects) return [];

    return sortProjectsByActivity(projectsData.projects).map(
      (project: ProjectInfo) => ({
        id: project.encodedPath,
        name: getProjectName(project.path),
        type: getProjectType(project.path),
        githubRepo: project.path.includes("github")
          ? project.path.split("/").slice(-2).join("/")
          : undefined,
        sessionCount: project.sessionCount,
        lastActive: formatRelativeTime(project.lastActivity),
        hasActiveSessions: project.hasActiveSessions,
        path: project.path,
        expanded: false, // Default to collapsed, managed by component state
      })
    );
  }, [projectsData]);

  // Transform sessions data for UI
  const sessions = useMemo(() => {
    if (!sessionsData?.sessions) return [];

    return sessionsData.sessions.map((session: SessionInfo) => ({
      id: session.id,
      name: session.id.slice(0, 8), // Use first 8 chars of ID as name (removed "Session" prefix)
      projectId: ApiClient.encodeProjectPath(session.projectPath),
      projectPath: session.projectPath,
      status: session.isActive ? ("active" as const) : ("completed" as const),
      starred: false, // Starring not implemented in API yet
      lastActivity: formatRelativeTime(session.lastActivity),
      messageCount: session.messageCount,
      hasToolUsage: session.hasToolUsage,
    }));
  }, [sessionsData]);

  // Group sessions by project
  const sessionsByProject = useMemo(() => {
    const grouped = new Map<string, (typeof sessions)[0][]>();

    sessions.forEach((session) => {
      const existing = grouped.get(session.projectId) || [];
      grouped.set(session.projectId, [...existing, session]);
    });

    return grouped;
  }, [sessions]);

  // Filter sessions by search query
  const filterSessions = (query: string) => {
    if (!query.trim()) return sessions;

    const lowerQuery = query.toLowerCase();
    return sessions.filter(
      (session) =>
        session.name.toLowerCase().includes(lowerQuery) ||
        session.projectPath.toLowerCase().includes(lowerQuery) ||
        session.id.toLowerCase().includes(lowerQuery)
    );
  };

  // Get active sessions
  const activeSessions = useMemo(() => {
    return sessions
      .filter((s) => s.status === "active")
      .slice(0, 5) // Show max 5 active sessions
      .map((s) => ({
        id: s.id,
        name: s.name,
        timestamp: s.lastActivity,
        active: true,
      }));
  }, [sessions]);

  return {
    // Data
    projects,
    sessions,
    sessionsByProject,
    activeSessions,

    // Loading states
    isLoading: projectsLoading || sessionsLoading,
    projectsLoading,
    sessionsLoading,

    // Error states
    error: projectsError || sessionsError,
    projectsError,
    sessionsError,

    // Functions
    filterSessions,
    refetch: () => {
      refetchProjects();
      refetchSessions();
    },

    // Counts
    totalProjects: projects.length,
    totalSessions: sessions.length,
    activeSessionsCount: activeSessions.length,
  };
}

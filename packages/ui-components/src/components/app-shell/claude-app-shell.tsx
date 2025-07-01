import * as React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ClaudeSidebar } from "./claude-sidebar"
import { AppHeader } from "@/components/app-shell/app-header"
import { MainContent } from "@/components/app-shell/main-content"
import { StatusBar } from "@/components/app-shell/status-bar"

export interface ClaudeAppShellProps {
  children?: React.ReactNode
  defaultSidebarOpen?: boolean
  connectionStatus?: "connected" | "disconnected" | "reconnecting"
  activeSessions?: number
  totalSessions?: number
  serverHealth?: "healthy" | "unhealthy" | "unknown"
  notifications?: number
}

export function ClaudeAppShell({ 
  children, 
  defaultSidebarOpen = true,
  connectionStatus = "connected",
  activeSessions = 2,
  totalSessions = 15,
  serverHealth = "healthy",
  notifications = 0
}: ClaudeAppShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <div className="flex h-screen w-full">
        <ClaudeSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader 
            projectName="Claude Log Monitor"
            userName="Claude User"
            notifications={notifications}
          />
          <MainContent>
            {children}
          </MainContent>
          <StatusBar 
            connectionStatus={connectionStatus}
            activeSessions={activeSessions}
            totalSessions={totalSessions}
            serverHealth={serverHealth}
            lastUpdate="Just now"
          />
        </div>
      </div>
    </SidebarProvider>
  )
}
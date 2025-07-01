import * as React from "react"
import { AppHeader } from "@/components/app-shell/app-header"
import { MainContent } from "@/components/app-shell/main-content"
import { StatusBar } from "@/components/app-shell/status-bar"
import { FloatingSidebar } from "@/components/app-shell/floating-sidebar"

export interface FloatingAppShellProps {
  children?: React.ReactNode
  connectionStatus?: "connected" | "disconnected" | "reconnecting"
  activeSessions?: number
  totalSessions?: number
  serverHealth?: "healthy" | "unhealthy" | "unknown"
  notifications?: number
  sidebarSide?: "left" | "right"
  sidebarSize?: "sm" | "md" | "lg" | "xl"
  showSidebarTrigger?: boolean
}

export function FloatingAppShell({ 
  children,
  connectionStatus = "connected",
  activeSessions = 2,
  totalSessions = 15,
  serverHealth = "healthy",
  notifications = 0,
  sidebarSide = "left",
  sidebarSize = "md",
  showSidebarTrigger = true
}: FloatingAppShellProps) {
  return (
    <div className="flex h-screen w-full flex-col">
      {/* Floating Sidebar Trigger */}
      {showSidebarTrigger && (
        <FloatingSidebar 
          side={sidebarSide}
          size={sidebarSize}
        />
      )}
      
      {/* Header */}
      <AppHeader 
        projectName="Claude Log Monitor"
        userName="Claude User"
        notifications={notifications}
      />
      
      {/* Main Content */}
      <MainContent>
        {children}
      </MainContent>
      
      {/* Status Bar */}
      <StatusBar 
        connectionStatus={connectionStatus}
        activeSessions={activeSessions}
        totalSessions={totalSessions}
        serverHealth={serverHealth}
        lastUpdate="Just now"
      />
    </div>
  )
}
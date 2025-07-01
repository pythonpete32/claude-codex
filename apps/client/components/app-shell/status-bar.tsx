import * as React from "react"
import { IconCircle, IconWifi, IconDatabase, IconClock } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export interface StatusBarProps {
  connectionStatus?: "connected" | "disconnected" | "reconnecting"
  activeSessions?: number
  totalSessions?: number
  lastUpdate?: string
  serverHealth?: "healthy" | "unhealthy" | "unknown"
}

export function StatusBar({
  connectionStatus = "connected",
  activeSessions = 0,
  totalSessions = 0,
  lastUpdate = "Just now",
  serverHealth = "healthy"
}: StatusBarProps) {
  const getConnectionColor = () => {
    switch (connectionStatus) {
      case "connected": return "text-green-500"
      case "disconnected": return "text-red-500" 
      case "reconnecting": return "text-yellow-500"
      default: return "text-gray-500"
    }
  }

  const getHealthColor = () => {
    switch (serverHealth) {
      case "healthy": return "text-green-500"
      case "unhealthy": return "text-red-500"
      default: return "text-gray-500"
    }
  }

  return (
    <footer className="flex h-8 items-center justify-between border-t bg-background px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        {/* Connection Status */}
        <div className="flex items-center gap-1">
          <IconWifi className={cn("h-3 w-3", getConnectionColor())} />
          <span className="capitalize">{connectionStatus}</span>
        </div>
        
        <Separator orientation="vertical" className="h-3" />
        
        {/* Server Health */}
        <div className="flex items-center gap-1">
          <IconCircle className={cn("h-3 w-3", getHealthColor())} />
          <span>Server {serverHealth}</span>
        </div>
        
        <Separator orientation="vertical" className="h-3" />
        
        {/* Active Sessions */}
        <div className="flex items-center gap-1">
          <IconDatabase className="h-3 w-3" />
          <span>{activeSessions} active / {totalSessions} total sessions</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Last Update */}
        <div className="flex items-center gap-1">
          <IconClock className="h-3 w-3" />
          <span>Updated {lastUpdate}</span>
        </div>
      </div>
    </footer>
  )
}
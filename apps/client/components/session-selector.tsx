"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessions, useApiHealth } from '@/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, RefreshCw, Server, Clock, FileText, Activity } from 'lucide-react'

interface SessionSelectorProps {
  onSessionSelect?: (sessionId: string) => void
  selectedSessionId?: string
}

export function SessionSelector({ onSessionSelect, selectedSessionId }: SessionSelectorProps) {
  const router = useRouter()
  const { sessions, loading, error, refresh } = useSessions({ autoRefresh: true })
  const { health, error: healthError } = useApiHealth()
  const [refreshing, setRefreshing] = useState(false)

  const handleSessionSelect = (sessionId: string) => {
    if (onSessionSelect) {
      onSessionSelect(sessionId)
    } else {
      router.push(`/chat/${sessionId}`)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refresh()
    } finally {
      setRefreshing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)}KB`
    return `${(kb / 1024).toFixed(1)}MB`
  }

  return (
    <div className="space-y-4">
      {/* API Health Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="h-4 w-4" />
              <CardTitle className="text-sm">API Status</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {health ? (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-600">
                {health.status}
              </Badge>
              <span className="text-sm text-muted-foreground">v{health.version}</span>
            </div>
          ) : healthError ? (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Offline</span>
            </div>
          ) : (
            <Skeleton className="h-6 w-24" />
          )}
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Claude Code Sessions</CardTitle>
              <CardDescription>
                {sessions ? `${sessions.length} sessions found` : 'Loading sessions...'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          ) : !sessions || sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No sessions found</p>
              <p className="text-sm">Create some Claude Code logs first</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedSessionId === session.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleSessionSelect(session.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm truncate flex-1">
                          {session.projectPath.split('/').pop() || 'Unknown Project'}
                        </div>
                        <div className="flex items-center space-x-1">
                          {session.isActive && (
                            <Badge variant="default" className="text-xs">
                              <Activity className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                          {session.hasToolUsage && (
                            <Badge variant="outline" className="text-xs">
                              Tools
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground truncate">
                        {session.projectPath}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>{session.messageCount} messages</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(session.lastActivity)}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(session.fileSize)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
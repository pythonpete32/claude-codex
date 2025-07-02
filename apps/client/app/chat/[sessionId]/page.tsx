"use client"

import { useParams, useRouter } from "next/navigation"
import { useEnhancedHistory, useToolEntries } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, RefreshCw, MessageSquare, Wrench, User, Bot, AlertCircle } from "lucide-react"
import { ParsedProps, HistoryEntry } from "@/lib/api-client"
import { ApiToolRouter } from "@/components/tools/api-tool-router"

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString()
}

function ToolDisplay({ parsedProps, timestamp }: { parsedProps: ParsedProps; timestamp: string }) {
  return (
    <div className="ml-8">
      <ApiToolRouter parsedProps={parsedProps} timestamp={timestamp} />
    </div>
  )
}

function MessageDisplay({ entry }: { entry: HistoryEntry }) {
  const isUser = entry.type === 'user'
  const isToolCall = entry.type === 'assistant' && entry.content?.type === 'tool_use'
  const isTextMessage = entry.type === 'assistant' && typeof entry.content === 'string'

  // If this is a tool call, render it as a tool (with or without parsed props)
  if (isToolCall) {
    if (entry.parsedProps) {
      // Tool call with result - render the full tool component
      return (
        <div className="space-y-2">
          <ToolDisplay parsedProps={entry.parsedProps} timestamp={entry.timestamp} />
        </div>
      )
    } else {
      // Tool call without result yet - render pending state
      // Create a basic parsed props structure for pending tools
      const pendingProps = {
        toolType: entry.content.name || 'Unknown',
        props: {
          id: entry.content.id,
          uuid: entry.uuid,
          timestamp: entry.timestamp,
          duration: 0,
          status: {
            normalized: 'pending' as const,
            original: 'pending'
          },
          // Add tool-specific input props
          ...(entry.content.input || {})
        },
        correlationId: entry.content.id || entry.uuid
      }
      
      return (
        <div className="space-y-2">
          <ToolDisplay parsedProps={pendingProps} timestamp={entry.timestamp} />
        </div>
      )
    }
  }

  // Regular message display for non-tool content
  return (
    <div className="space-y-2">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {isUser ? (
                <User className="h-6 w-6 text-blue-500" />
              ) : (
                <Bot className="h-6 w-6 text-green-500" />
              )}
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={isUser ? "default" : "secondary"}>
                  {isUser ? "User" : "Assistant"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>

              {/* Message Content */}
              {isTextMessage && (
                <div className="prose prose-sm max-w-none">
                  {entry.content}
                </div>
              )}

              {isUser && typeof entry.content === 'string' && (
                <div className="prose prose-sm max-w-none">
                  {entry.content}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to filter out tool result user messages since they're already correlated
function filterToolResults(history: HistoryEntry[]): HistoryEntry[] {
  if (!history) return []
  
  return history.filter(entry => {
    // Filter out tool result user messages - they're already correlated with tool calls
    const isToolResult = entry.type === 'user' && entry.content?.type === 'tool_result'
    return !isToolResult
  })
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  
  const { history: rawHistory, loading, error, pagination, loadMore, refresh } = useEnhancedHistory(
    sessionId, 
    { limit: 50, autoRefresh: false }
  )
  
  // Filter out tool result user messages since they're already correlated
  const history = filterToolResults(rawHistory || [])

  const handleRefresh = async () => {
    try {
      await refresh()
    } catch (err) {
      console.error('Failed to refresh:', err)
    }
  }

  if (loading && !history) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={() => router.push('/sessions')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sessions
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Session</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const toolEntries = history?.filter(entry => entry.parsedProps) || []

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={() => router.push('/sessions')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sessions
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {pagination.total} messages
            </Badge>
            <Badge variant="outline">
              {toolEntries.length} tools
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Session Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">Session:</span>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {sessionId}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Chat History */}
        <div className="space-y-4">
          {history?.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No messages in this session</p>
              </CardContent>
            </Card>
          ) : (
            history?.map((entry) => (
              <MessageDisplay key={entry.uuid} entry={entry} />
            ))
          )}
        </div>

        {/* Load More */}
        {pagination.hasMore && (
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More Messages'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
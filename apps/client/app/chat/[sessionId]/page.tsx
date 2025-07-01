"use client"

import { useParams, useRouter } from "next/navigation"
import { useEnhancedHistory, useToolEntries } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, RefreshCw, MessageSquare, Wrench, User, Bot, AlertCircle } from "lucide-react"
import { ParsedProps, HistoryEntry } from "@/lib/api-client"

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString()
}

function ToolDisplay({ parsedProps }: { parsedProps: ParsedProps }) {
  const { toolType, props, correlationId } = parsedProps

  return (
    <Card className="ml-8">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Tool Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wrench className="h-4 w-4" />
              <Badge variant="outline">{toolType}</Badge>
              <span className="text-sm text-muted-foreground">
                {props.status?.normalized || 'unknown'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {correlationId.substring(0, 8)}...
            </span>
          </div>

          {/* Tool Input/Command */}
          {props.command && (
            <div className="bg-muted p-3 rounded font-mono text-sm">
              <div className="text-muted-foreground mb-1">Command:</div>
              <div>{props.command}</div>
            </div>
          )}

          {props.filePath && (
            <div className="bg-muted p-3 rounded font-mono text-sm">
              <div className="text-muted-foreground mb-1">File:</div>
              <div>{props.filePath}</div>
            </div>
          )}

          {props.pattern && (
            <div className="bg-muted p-3 rounded font-mono text-sm">
              <div className="text-muted-foreground mb-1">Pattern:</div>
              <div>{props.pattern}</div>
            </div>
          )}

          {/* Tool Output */}
          {props.output && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Output:</div>
              <div className="bg-black text-green-400 p-3 rounded font-mono text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                {props.output}
              </div>
            </div>
          )}

          {props.content && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Content:</div>
              <div className="bg-muted p-3 rounded font-mono text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                {props.content}
              </div>
            </div>
          )}

          {/* Results for complex tools */}
          {props.results && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Results:</div>
              <div className="bg-muted p-3 rounded">
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(props.results, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Tool Metadata */}
          <div className="text-xs text-muted-foreground border-t pt-2 grid grid-cols-2 gap-2">
            <div>Duration: {props.duration || 0}ms</div>
            <div>Status: {props.status?.original || 'unknown'}</div>
            {props.exitCode !== undefined && <div>Exit Code: {props.exitCode}</div>}
            {props.totalLines && <div>Lines: {props.totalLines}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MessageDisplay({ entry }: { entry: HistoryEntry }) {
  const isUser = entry.type === 'user'
  const isToolCall = entry.type === 'assistant' && entry.content?.type === 'tool_use'
  const isTextMessage = entry.type === 'assistant' && typeof entry.content === 'string'

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

              {isToolCall && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Tool Call:</div>
                  <div className="bg-muted p-3 rounded">
                    <div className="text-sm">
                      <div><strong>Tool:</strong> {entry.content.name}</div>
                      <div><strong>ID:</strong> {entry.content.id}</div>
                    </div>
                    {entry.content.input && (
                      <details className="mt-2">
                        <summary className="text-sm font-medium cursor-pointer">Input Parameters</summary>
                        <pre className="text-xs mt-1 overflow-x-auto">
                          {JSON.stringify(entry.content.input, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Show parsed props if available */}
      {entry.parsedProps && (
        <ToolDisplay parsedProps={entry.parsedProps} />
      )}
    </div>
  )
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  
  const { history, loading, error, pagination, loadMore, refresh } = useEnhancedHistory(
    sessionId, 
    { limit: 50, autoRefresh: false }
  )

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
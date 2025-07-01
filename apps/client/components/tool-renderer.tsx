"use client"

import { ParsedProps } from '@/lib/api-client'
import { BashTool } from '@/components/chat-items/bash-tool'
import { EditTool } from '@/components/chat-items/edit-tool'
import { FallbackTool } from '@/components/chat-items/fallback-tool'
import { GlobTool } from '@/components/chat-items/glob-tool'
import { GrepTool } from '@/components/chat-items/grep-tool'
import { LsTool } from '@/components/chat-items/ls-tool'
import { MCPSequentialThinkingTool } from '@/components/chat-items/mcp-sequential-thinking-tool'
import { MultiEditTool } from '@/components/chat-items/multi-edit-tool'
import { ReadTool } from '@/components/chat-items/read-tool'
import { Badge } from '@/components/ui/badge'

interface ToolRendererProps {
  parsedProps: ParsedProps
  timestamp: string
}

export function ToolRenderer({ parsedProps, timestamp }: ToolRendererProps) {
  const { toolType, props } = parsedProps

  // Extract common props
  const status = props.status?.normalized || 'unknown'
  const toolId = props.id || props.uuid || 'unknown'

  switch (toolType) {
    case 'Bash':
      return (
        <BashTool
          command={props.command || ''}
          description={props.description || ''}
          output={props.output || ''}
          status={status}
          timestamp={timestamp}
          exitCode={props.exitCode}
          executionTime={props.executionTime || props.duration}
        />
      )

    case 'Read':
      return (
        <ReadTool
          filePath={props.filePath || ''}
          content={props.content || ''}
          status={status}
          timestamp={timestamp}
          totalLines={props.totalLines}
          showLineNumbers={props.showLineNumbers !== false}
          fileType={props.fileType}
          fileSize={props.fileSize}
        />
      )

    case 'Write':
      // Write tool doesn't have a dedicated component, use FallbackTool
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">Write</Badge>
            <span className="text-sm font-medium">{props.filePath}</span>
            {props.created && (
              <Badge variant="default" className="text-xs">Created</Badge>
            )}
            {props.overwritten && (
              <Badge variant="destructive" className="text-xs">Overwritten</Badge>
            )}
          </div>
          <FallbackTool
            toolUse={{
              type: 'tool_use',
              id: toolId,
              name: 'Write',
              input: {
                file_path: props.filePath,
                content: props.content
              }
            }}
            status={status}
            timestamp={timestamp}
            toolResult={{
              file_path: props.filePath,
              created: props.created,
              file_type: props.fileType
            }}
          />
        </div>
      )

    case 'Edit':
      return (
        <EditTool
          toolUse={{
            type: 'tool_use',
            id: toolId,
            name: 'Edit',
            input: {
              file_path: props.filePath,
              old_string: props.oldString,
              new_string: props.newString,
              replace_all: props.replaceAll
            }
          }}
          status={status}
          timestamp={timestamp}
          toolResult={{
            success: status === 'completed',
            changes_made: props.changesMade,
            file_path: props.filePath
          }}
        />
      )

    case 'MultiEdit':
      return (
        <MultiEditTool
          fileEdits={props.fileEdits || []}
          status={status}
          timestamp={timestamp}
          editsApplied={props.editsApplied || 0}
          totalEdits={props.totalEdits || 0}
        />
      )

    case 'LS':
      return (
        <LsTool
          toolUse={{
            type: 'tool_use',
            id: toolId,
            name: 'LS',
            input: {
              path: props.path || '',
              ignore: props.ignore
            }
          }}
          status={status}
          timestamp={timestamp}
          toolResult={{
            entries: props.results?.entries || [],
            total_entries: props.results?.totalEntries || 0,
            path: props.path
          }}
        />
      )

    case 'Glob':
      return (
        <GlobTool
          toolUse={{
            type: 'tool_use',
            id: toolId,
            name: 'Glob',
            input: {
              pattern: props.pattern || '',
              path: props.searchPath
            }
          }}
          status={status}
          timestamp={timestamp}
          toolResult={{
            files: props.results?.files || [],
            total_matches: props.results?.totalMatches || 0,
            pattern: props.pattern
          }}
        />
      )

    case 'Grep':
      return (
        <GrepTool
          pattern={props.pattern || ''}
          searchPath={props.searchPath || ''}
          fileMatches={props.results?.fileMatches || []}
          status={status}
          timestamp={timestamp}
        />
      )

    case 'mcp__sequential-thinking__sequentialthinking':
      // Try to use the specialized component if input structure matches
      if (props.input?.parameters?.workflow) {
        return (
          <MCPSequentialThinkingTool
            toolUse={{
              type: 'tool_use',
              id: toolId,
              name: toolType,
              input: props.input.parameters
            }}
            status={status}
            timestamp={timestamp}
            toolResult={props.results?.output ? { output: props.results.output } : undefined}
          />
        )
      }
      // Fall through to fallback tool

    default:
      // Handle MCP tools and unknown tools with FallbackTool
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{toolType}</Badge>
            {props.ui?.serverName && (
              <Badge variant="secondary" className="text-xs">
                {props.ui.serverName}
              </Badge>
            )}
          </div>
          <FallbackTool
            toolUse={{
              type: 'tool_use',
              id: toolId,
              name: toolType,
              input: props.input?.parameters || {}
            }}
            status={status}
            timestamp={timestamp}
            toolResult={props.results || {}}
          />
        </div>
      )
  }
}

/**
 * Renders status information for debugging
 */
export function ToolDebugInfo({ parsedProps }: { parsedProps: ParsedProps }) {
  const { toolType, props, correlationId } = parsedProps
  
  return (
    <div className="text-xs text-muted-foreground space-y-1 border-t pt-2 mt-2">
      <div>Tool: {toolType}</div>
      <div>Status: {props.status?.normalized} ({props.status?.original})</div>
      <div>Correlation: {correlationId}</div>
      {props.duration && <div>Duration: {props.duration}ms</div>}
    </div>
  )
}
"use client"

import { ParsedProps } from '@/lib/api-client'
import { ApiReadTool } from './api-read-tool'
import { ApiBashTool } from './api-bash-tool'
import { ApiWriteTool } from './api-write-tool'
import { ApiMcpTool } from './api-mcp-tool'
import { createApiToolComponent } from './api-base-tool'
import { TerminalText } from "@/shared/terminal-styles"
import { Badge } from '@/components/ui/badge'

interface ToolRouterProps {
  parsedProps: ParsedProps
  timestamp: string
}

// Generic fallback tool for unsupported tool types
const ApiFallbackTool = createApiToolComponent((props) => {
  const { toolType, props: toolProps } = props.parsedProps

  return {
    renderCommand: () => toolType,
    renderCommandName: () => toolType.split('_')[0] || toolType,
    renderOutput: () => (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Badge variant="outline">{toolType}</Badge>
          <span className="text-sm text-muted-foreground">Generic Tool Display</span>
        </div>

        {/* Show any available input */}
        {toolProps.input && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Input:</div>
            <div className="bg-muted p-3 rounded">
              <pre className="text-xs overflow-x-auto">
                <TerminalText variant="stdout">
                  {JSON.stringify(toolProps.input, null, 2)}
                </TerminalText>
              </pre>
            </div>
          </div>
        )}

        {/* Show any available output/results */}
        {toolProps.output && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Output:</div>
            <div className="bg-muted p-3 rounded font-mono text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
              <TerminalText variant="stdout">
                {typeof toolProps.output === 'string' ? toolProps.output : JSON.stringify(toolProps.output, null, 2)}
              </TerminalText>
            </div>
          </div>
        )}

        {toolProps.results && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Results:</div>
            <div className="bg-muted p-3 rounded">
              <pre className="text-xs overflow-x-auto max-h-60">
                <TerminalText variant="stdout">
                  {JSON.stringify(toolProps.results, null, 2)}
                </TerminalText>
              </pre>
            </div>
          </div>
        )}

        {/* Show any other significant props */}
        {Object.keys(toolProps).filter(key => 
          !['id', 'uuid', 'timestamp', 'duration', 'status', 'input', 'output', 'results', 'ui'].includes(key)
        ).map(key => (
          <div key={key} className="text-xs text-muted-foreground">
            <span className="font-medium">{key}:</span> {String(toolProps[key])}
          </div>
        ))}
      </div>
    ),
    renderFooter: () => (
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>Tool: {toolType}</span>
          <span>Duration: {toolProps.duration || 0}ms</span>
        </div>
        <span className="font-mono">{props.parsedProps.correlationId.substring(0, 8)}...</span>
      </div>
    ),
    shouldFold: () => {
      const dataSize = JSON.stringify(toolProps).length
      return dataSize > 1000
    },
    maxHeight: "500px",
    showCopyButton: true,
  }
})

export function ApiToolRouter({ parsedProps, timestamp }: ToolRouterProps) {
  const { toolType } = parsedProps

  // Route to specific tool components based on tool type
  switch (toolType) {
    case 'Read':
      return <ApiReadTool parsedProps={parsedProps} timestamp={timestamp} />
    
    case 'Bash':
      return <ApiBashTool parsedProps={parsedProps} timestamp={timestamp} />
    
    case 'Write':
      return <ApiWriteTool parsedProps={parsedProps} timestamp={timestamp} />
    
    default:
      // Handle MCP tools and unknown tools
      if (toolType.startsWith('mcp__')) {
        return <ApiMcpTool parsedProps={parsedProps} timestamp={timestamp} />
      }
      
      // Fallback for any other tool type
      return <ApiFallbackTool parsedProps={parsedProps} timestamp={timestamp} />
  }
}
"use client"

import { createApiToolComponent } from "./api-base-tool"
import { TerminalText } from "@/shared/terminal-styles"
import { Badge } from "@/components/ui/badge"

export const ApiMcpTool = createApiToolComponent((props) => {
  const { toolType, props: toolProps } = props.parsedProps

  // Extract server and method names
  const parts = toolType.split('__')
  const serverName = parts[1] || 'unknown'
  const methodName = parts[2] || 'unknown'

  return {
    renderCommand: () => `${serverName}.${methodName}`,
    renderCommandName: () => serverName,
    renderOutput: () => (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">{toolType}</Badge>
          {toolProps.ui?.serverName && (
            <Badge variant="secondary" className="text-xs">{toolProps.ui.serverName}</Badge>
          )}
        </div>

        {toolProps.input?.parameters && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Input Parameters:</div>
            <div className="bg-muted p-3 rounded">
              <pre className="text-xs overflow-x-auto">
                <TerminalText variant="stdout">
                  {JSON.stringify(toolProps.input.parameters, null, 2)}
                </TerminalText>
              </pre>
            </div>
          </div>
        )}

        {toolProps.results?.output && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Results:</div>
            <div className="bg-muted p-3 rounded">
              <pre className="text-xs overflow-x-auto max-h-60">
                <TerminalText variant="stdout">
                  {JSON.stringify(toolProps.results.output, null, 2)}
                </TerminalText>
              </pre>
            </div>
          </div>
        )}

        {toolProps.ui && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            <div className="grid grid-cols-2 gap-2">
              <span>Display: {toolProps.ui.displayMode || 'unknown'}</span>
              <span>Structured: {toolProps.ui.isStructured ? 'Yes' : 'No'}</span>
              {toolProps.ui.keyCount !== undefined && <span>Keys: {toolProps.ui.keyCount}</span>}
              {toolProps.ui.isComplex && <span className="text-orange-600">Complex</span>}
            </div>
          </div>
        )}
      </div>
    ),
    renderFooter: () => (
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>MCP: {serverName}.{methodName}</span>
          <span>Duration: {toolProps.duration || 0}ms</span>
        </div>
        <span className="font-mono">{props.parsedProps.correlationId.substring(0, 8)}...</span>
      </div>
    ),
    shouldFold: () => {
      const inputSize = JSON.stringify(toolProps.input?.parameters || {}).length
      const outputSize = JSON.stringify(toolProps.results?.output || {}).length
      return inputSize + outputSize > 500
    },
    maxHeight: "500px",
    showCopyButton: true,
  }
})
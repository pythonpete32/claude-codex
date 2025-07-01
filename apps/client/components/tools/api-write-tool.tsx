"use client"

import { createApiToolComponent } from "./api-base-tool"
import { TerminalText } from "@/shared/terminal-styles"
import { Badge } from "@/components/ui/badge"

export const ApiWriteTool = createApiToolComponent((props) => {
  const toolProps = props.parsedProps.props

  return {
    renderCommand: () => `write ${toolProps.filePath || ''}`,
    renderCommandName: () => "write",
    renderOutput: () => (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">File:</span>
          <code className="text-sm bg-muted px-2 py-1 rounded">{toolProps.filePath}</code>
          {toolProps.created && (
            <Badge variant="default" className="text-xs">Created</Badge>
          )}
          {toolProps.overwritten && (
            <Badge variant="destructive" className="text-xs">Overwritten</Badge>
          )}
        </div>

        {toolProps.content && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Content Preview:</div>
            <div className="bg-muted p-3 rounded font-mono text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
              <TerminalText variant="stdout">
                {toolProps.content.length > 500 
                  ? `${toolProps.content.substring(0, 500)}...` 
                  : toolProps.content}
              </TerminalText>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {toolProps.fileType && `Type: ${toolProps.fileType} • `}
          {toolProps.content && `${toolProps.content.length} characters`}
        </div>
      </div>
    ),
    renderFooter: () => (
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>File: {toolProps.filePath}</span>
          <span>Duration: {toolProps.duration || 0}ms</span>
          {toolProps.created && <span className="text-green-600">Created</span>}
        </div>
        <span className="font-mono">{props.parsedProps.correlationId.substring(0, 8)}...</span>
      </div>
    ),
    shouldFold: () => (toolProps?.content || '').length > 1000,
    maxHeight: "400px",
    showCopyButton: true,
  }
})
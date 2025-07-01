"use client"

import { createApiToolComponent } from "./api-base-tool"
import { TerminalText } from "@/shared/terminal-styles"

export const ApiReadTool = createApiToolComponent((props) => {
  const { toolProps } = props.parsedProps.props

  return {
    renderCommand: () => `cat ${toolProps.filePath || ''}`,
    renderCommandName: () => "cat",
    renderOutput: () => (
      <div className="space-y-2">
        {toolProps.content && (
          <div className="bg-muted p-3 rounded font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
            <TerminalText variant="stdout">
              {toolProps.content}
            </TerminalText>
          </div>
        )}
        
        {toolProps.totalLines && (
          <div className="text-xs text-muted-foreground">
            {toolProps.totalLines} lines • {toolProps.fileSize ? `${Math.round(toolProps.fileSize / 1024)}KB` : 'Unknown size'}
            {toolProps.fileType && ` • ${toolProps.fileType}`}
          </div>
        )}
      </div>
    ),
    renderFooter: () => (
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>File: {toolProps.filePath}</span>
          <span>Duration: {toolProps.duration || 0}ms</span>
        </div>
        <span className="font-mono">{props.parsedProps.correlationId.substring(0, 8)}...</span>
      </div>
    ),
    shouldFold: () => (toolProps.totalLines || 0) > 50,
    maxHeight: "500px",
    showCopyButton: true,
  }
})
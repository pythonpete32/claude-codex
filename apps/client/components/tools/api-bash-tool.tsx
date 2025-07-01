"use client"

import { createApiToolComponent } from "./api-base-tool"
import { TerminalText } from "@/shared/terminal-styles"

export const ApiBashTool = createApiToolComponent((props) => {
  const toolProps = props.parsedProps.props

  return {
    renderCommand: () => toolProps?.command || '',
    renderCommandName: () => "bash",
    renderOutput: () => (
      <div className="space-y-2">
        {toolProps?.output && (
          <div className="bg-black text-green-400 p-3 rounded font-mono text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
            <TerminalText variant="stdout">
              {toolProps.output}
            </TerminalText>
          </div>
        )}
        
        {toolProps?.errorOutput && (
          <div className="bg-red-900/20 text-red-400 p-3 rounded font-mono text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
            <TerminalText variant="stderr">
              {toolProps.errorOutput}
            </TerminalText>
          </div>
        )}
        
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          {toolProps?.exitCode !== undefined && (
            <span className={toolProps.exitCode === 0 ? "text-green-600" : "text-red-600"}>
              Exit Code: {toolProps.exitCode}
            </span>
          )}
          {toolProps?.interrupted && (
            <span className="text-yellow-600">Interrupted</span>
          )}
        </div>
      </div>
    ),
    renderFooter: () => (
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>Duration: {toolProps?.duration || 0}ms</span>
          <span>Status: {toolProps?.status?.original || 'unknown'}</span>
          {toolProps?.exitCode !== undefined && <span>Exit: {toolProps.exitCode}</span>}
        </div>
        <span className="font-mono">{props.parsedProps.correlationId.substring(0, 8)}...</span>
      </div>
    ),
    shouldFold: () => {
      const outputLength = (toolProps?.output || '').length + (toolProps?.errorOutput || '').length
      return outputLength > 1000
    },
    maxHeight: "400px",
    showCopyButton: true,
    renderFailedMessage: () => toolProps?.errorOutput || "Command failed",
  }
})
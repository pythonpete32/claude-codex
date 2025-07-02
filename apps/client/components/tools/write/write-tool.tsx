"use client"

import React from "react"
import type { WriteToolProps } from "@claude-codex/types"
import { Clock, FileText, FilePlus } from "lucide-react"
import { TerminalText } from "@/shared/terminal-styles"
import { createToolComponent } from "../base/base-tool"

interface WriteToolUIProps extends WriteToolProps {
  description?: string
  onFileClick?: (filePath: string) => void
}

export const WriteTool = createToolComponent<WriteToolUIProps>((props) => {
  const {
    filePath,
    content,
    fileSize,
    created,
    overwritten,
    errorMessage,
    showLineNumbers = true,
    wordWrap,
    maxHeight = "400px",
    onFileClick,
  } = props
  
  const commandName = "write"
  const fileName = filePath.split("/").pop() || filePath
  const fileExtension = filePath.match(/\.(\w+)$/)?.[1] || ""
  const icon = created ? FilePlus : FileText
  const Icon = icon
  
  // Helper to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  
  // Render content
  const renderContent = () => {
    if (!content) {
      return (
        <div className="text-center py-4">
          <TerminalText variant="stdout" className="text-gray-400 italic">
            Empty file written
          </TerminalText>
        </div>
      )
    }
    
    const lines = content.split("\n")
    
    return (
      <div>
        <div className="mb-3 flex items-center gap-2 text-green-400">
          <Icon className="h-4 w-4" />
          <span className="text-sm">
            {created ? "Created new file" : overwritten ? "Overwrote existing file" : "Wrote to file"}
          </span>
        </div>
        
        <div
          className={`font-mono text-sm overflow-x-auto ${
            wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"
          }`}
        >
          {showLineNumbers ? (
            lines.map((lineContent, index) => (
              <div key={index + 1} className="group">
                <span className="inline-block w-12 text-right select-none text-gray-500 mr-4">
                  {index + 1}
                </span>
                <span className="text-gray-600 select-none">│</span>
                <span className="ml-2">{lineContent || " "}</span>
              </div>
            ))
          ) : (
            <TerminalText variant="stdout" className="text-gray-300">
              {content}
            </TerminalText>
          )}
        </div>
      </div>
    )
  }
  
  return {
    renderCommand: () => `${commandName} ${filePath}`,
    renderCommandName: () => commandName,
    renderOutput: renderContent,
    renderFooter: () => (
      <div className="flex items-center justify-between gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span
            className="text-blue-400 hover:underline cursor-pointer"
            onClick={() => onFileClick?.(filePath)}
          >
            {fileName}
          </span>
          {fileExtension && (
            <span className="text-gray-500">({fileExtension})</span>
          )}
          {created && <span className="text-green-400">• new</span>}
          {overwritten && <span className="text-yellow-400">• overwritten</span>}
        </div>
        <div className="flex items-center gap-2">
          {fileSize !== undefined && (
            <span>{formatFileSize(fileSize)}</span>
          )}
          <Clock className="h-3 w-3" />
          <span>{new Date(props.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    ),
    renderPendingMessage: () => "Preparing to write file...",
    renderRunningMessage: () => "Writing file contents...",
    renderFailedMessage: () => errorMessage || "Failed to write file",
    shouldFold: () => content.split("\n").length > 30,
    defaultFolded: () => content.split("\n").length > 100,
    maxHeight,
    showCopyButton: true,
    errorMessage,
  }
})
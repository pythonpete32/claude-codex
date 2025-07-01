"use client"

import React from "react"
import type { EditToolProps, DiffLine } from "@claude-codex/types"
import { Clock, FileEdit } from "lucide-react"
import { TerminalText } from "@/shared/terminal-styles"
import { createToolComponent } from "../base/base-tool"

interface EditToolUIProps extends EditToolProps {
  description?: string
  onFileClick?: (filePath: string) => void
  onLineClick?: (lineNumber: number) => void
}

export const EditTool = createToolComponent<EditToolUIProps>((props) => {
  const {
    filePath,
    oldContent,
    newContent,
    diff,
    errorMessage,
    wordWrap,
    maxHeight = "500px",
    onFileClick,
    onLineClick,
  } = props
  
  const commandName = "edit"
  const fileName = filePath.split("/").pop() || filePath
  const fileExtension = filePath.match(/\.(\w+)$/)?.[1] || ""
  
  // Generate simple diff if not provided
  const generateSimpleDiff = (): DiffLine[] => {
    const oldLines = oldContent.split("\n")
    const newLines = newContent.split("\n")
    const result: DiffLine[] = []
    
    // Simple line-by-line comparison
    const maxLines = Math.max(oldLines.length, newLines.length)
    
    for (let i = 0; i < maxLines; i++) {
      if (i >= oldLines.length) {
        // New lines added
        result.push({
          type: "added",
          content: newLines[i],
          newLineNumber: i + 1,
        })
      } else if (i >= newLines.length) {
        // Lines removed
        result.push({
          type: "removed",
          content: oldLines[i],
          oldLineNumber: i + 1,
        })
      } else if (oldLines[i] !== newLines[i]) {
        // Lines changed
        result.push({
          type: "removed",
          content: oldLines[i],
          oldLineNumber: i + 1,
        })
        result.push({
          type: "added",
          content: newLines[i],
          newLineNumber: i + 1,
        })
      } else {
        // Lines unchanged
        result.push({
          type: "unchanged",
          content: oldLines[i],
          oldLineNumber: i + 1,
          newLineNumber: i + 1,
        })
      }
    }
    
    return result
  }
  
  const actualDiff = diff || generateSimpleDiff()
  
  // Calculate stats
  const stats = {
    additions: actualDiff.filter(line => line.type === "added").length,
    deletions: actualDiff.filter(line => line.type === "removed").length,
    unchanged: actualDiff.filter(line => line.type === "unchanged").length,
  }
  
  // Render diff
  const renderDiff = () => {
    if (actualDiff.length === 0) {
      return (
        <div className="text-center py-4">
          <TerminalText variant="stdout" className="text-gray-400 italic">
            No changes detected
          </TerminalText>
        </div>
      )
    }
    
    return (
      <div
        className={`font-mono text-sm overflow-x-auto ${
          wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"
        }`}
      >
        {actualDiff.map((line, index) => {
          const lineNumber = line.oldLineNumber || line.newLineNumber || index + 1
          
          return (
            <div
              key={index}
              className={`group ${
                line.type === "added"
                  ? "bg-green-900/20 hover:bg-green-900/30"
                  : line.type === "removed"
                  ? "bg-red-900/20 hover:bg-red-900/30"
                  : "hover:bg-gray-800/50"
              }`}
            >
              <span
                className={`inline-block w-12 text-right select-none mr-2 cursor-pointer ${
                  line.type === "added"
                    ? "text-green-500"
                    : line.type === "removed"
                    ? "text-red-500"
                    : "text-gray-500"
                } hover:text-gray-300`}
                onClick={() => onLineClick?.(lineNumber)}
              >
                {lineNumber}
              </span>
              <span
                className={`select-none mr-2 ${
                  line.type === "added"
                    ? "text-green-500"
                    : line.type === "removed"
                    ? "text-red-500"
                    : "text-gray-600"
                }`}
              >
                {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
              </span>
              <span
                className={
                  line.type === "added"
                    ? "text-green-300"
                    : line.type === "removed"
                    ? "text-red-300"
                    : "text-gray-300"
                }
              >
                {line.content || " "}
              </span>
            </div>
          )
        })}
      </div>
    )
  }
  
  return {
    renderCommand: () => `${commandName} ${filePath}`,
    renderCommandName: () => commandName,
    renderOutput: renderDiff,
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
          <span className="text-green-400">+{stats.additions}</span>
          <span className="text-red-400">-{stats.deletions}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>{new Date(props.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    ),
    renderPendingMessage: () => "Preparing to edit file...",
    renderRunningMessage: () => "Applying changes...",
    renderFailedMessage: () => errorMessage || "Failed to edit file",
    shouldFold: () => actualDiff.length > 50,
    defaultFolded: () => actualDiff.length > 100,
    maxHeight,
    showCopyButton: true,
    errorMessage,
  }
})
"use client"

import React from "react"
import type { GlobToolProps } from "@claude-codex/types"
import { Clock, FolderSearch, FileText, Folder } from "lucide-react"
import { TerminalText } from "@/shared/terminal-styles"
import { createToolComponent } from "../base/base-tool"

interface GlobToolUIProps extends GlobToolProps {
  description?: string
  onFileClick?: (filePath: string) => void
}

export const GlobTool = createToolComponent<GlobToolUIProps>((props) => {
  const { input, results, ui, onFileClick } = props
  
  const commandName = "glob"
  const pattern = input.pattern
  const searchPath = input.searchPath || "."
  const { totalMatches } = ui
  
  // Helper to get file icon based on extension
  const getFileIcon = (path: string) => {
    return path.endsWith("/") ? Folder : FileText
  }
  
  // Render results
  const renderResults = () => {
    if (!results || results.length === 0) {
      return (
        <div className="text-center py-8">
          <FolderSearch className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <TerminalText variant="stdout" className="text-gray-400">
            No files found matching &quot;{pattern}&quot;
          </TerminalText>
        </div>
      )
    }
    
    // Group files by directory
    const filesByDir = results.reduce((acc, filePath) => {
      const dir = filePath.substring(0, filePath.lastIndexOf("/")) || "/"
      if (!acc[dir]) acc[dir] = []
      acc[dir].push(filePath)
      return acc
    }, {} as Record<string, string[]>)
    
    return (
      <div className="space-y-4">
        {Object.entries(filesByDir).map(([dir, files]) => (
          <div key={dir} className="border-l-2 border-gray-700 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="h-4 w-4 text-blue-400" />
              <span className="text-gray-400 text-sm">{dir || "."}</span>
            </div>
            <div className="space-y-1 ml-6">
              {files.map((filePath, index) => {
                const fileName = filePath.split("/").pop() || filePath
                const FileIcon = getFileIcon(filePath)
                
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 hover:bg-gray-800/50 px-2 py-1 rounded cursor-pointer group"
                    onClick={() => onFileClick?.(filePath)}
                  >
                    <FileIcon className="h-3 w-3 text-gray-500 group-hover:text-gray-300" />
                    <span className="text-gray-300 text-sm font-mono group-hover:text-white">
                      {fileName}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  return {
    renderCommand: () => `${commandName} "${pattern}" ${searchPath}`,
    renderCommandName: () => commandName,
    renderOutput: renderResults,
    renderFooter: () => (
      <div className="flex items-center justify-between gap-4 text-xs text-gray-500">
        <div>
          Found <span className="text-blue-400 font-medium">{totalMatches}</span>{" "}
          {totalMatches === 1 ? "file" : "files"} matching{" "}
          <span className="text-yellow-400 font-mono">&quot;{pattern}&quot;</span>
        </div>
        <div className="flex items-center gap-2">
          {ui.searchTime !== undefined && (
            <span>Search completed in {ui.searchTime}ms</span>
          )}
          <Clock className="h-3 w-3" />
          <span>{new Date(props.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    ),
    renderPendingMessage: () => "Searching for files...",
    renderRunningMessage: () => `Finding files matching "${pattern}"...`,
    shouldFold: () => totalMatches > 30,
    defaultFolded: () => totalMatches > 100,
    maxHeight: "500px",
    showCopyButton: true,
  }
})
"use client"

import React from "react"
import type { LsToolProps, FileEntry } from "@claude-codex/types"
import { Clock, Folder, FileText, FolderOpen, Link } from "lucide-react"
import { TerminalText } from "@/shared/terminal-styles"
import { createToolComponent } from "../base/base-tool"

interface LsToolUIProps extends LsToolProps {
  description?: string
  onEntryClick?: (entry: FileEntry) => void
}

export const LsTool = createToolComponent<LsToolUIProps>((props) => {
  const { input, results, ui, onEntryClick } = props
  
  const commandName = "ls"
  const path = input.path
  const { totalFiles, totalDirectories } = ui
  
  // Build command with options
  const buildCommand = () => {
    const parts = [commandName]
    if (input.showHidden) parts.push("-a")
    if (input.recursive) parts.push("-R")
    parts.push(path)
    return parts.join(" ")
  }
  
  // Helper to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  
  // Helper to get file icon
  const getFileIcon = (entry: FileEntry) => {
    if (entry.type === "directory") return Folder
    if (entry.type === "symlink") return Link
    return FileText
  }
  
  // Render entries
  const renderEntries = () => {
    if (!results?.entries || results.entries.length === 0) {
      return (
        <div className="text-center py-8">
          <FolderOpen className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <TerminalText variant="stdout" className="text-gray-400">
            {results?.errorMessage || "Empty directory"}
          </TerminalText>
        </div>
      )
    }
    
    // Sort entries: directories first, then files
    const sortedEntries = [...results.entries].sort((a, b) => {
      if (a.type === "directory" && b.type !== "directory") return -1
      if (a.type !== "directory" && b.type === "directory") return 1
      return a.name.localeCompare(b.name)
    })
    
    return (
      <div className="space-y-1">
        {sortedEntries.map((entry, index) => {
          const Icon = getFileIcon(entry)
          const isDirectory = entry.type === "directory"
          const isSymlink = entry.type === "symlink"
          const isHidden = entry.isHidden || entry.name.startsWith(".")
          
          return (
            <div
              key={index}
              className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-800/50 rounded cursor-pointer group"
              onClick={() => onEntryClick?.(entry)}
            >
              <Icon
                className={`h-4 w-4 flex-shrink-0 ${
                  isDirectory
                    ? "text-blue-400"
                    : isSymlink
                    ? "text-purple-400"
                    : "text-gray-400"
                } group-hover:text-white`}
              />
              
              <span
                className={`flex-1 font-mono text-sm ${
                  isDirectory
                    ? "text-blue-300"
                    : isSymlink
                    ? "text-purple-300"
                    : isHidden
                    ? "text-gray-500"
                    : "text-gray-300"
                } group-hover:text-white`}
              >
                {entry.name}
                {isDirectory && "/"}
                {isSymlink && " →"}
              </span>
              
              {entry.permissions && (
                <span className="text-xs text-gray-600 font-mono">
                  {entry.permissions}
                </span>
              )}
              
              {entry.size !== undefined && !isDirectory && (
                <span className="text-xs text-gray-500 w-20 text-right">
                  {formatFileSize(entry.size)}
                </span>
              )}
              
              {entry.lastModified && (
                <span className="text-xs text-gray-600">
                  {new Date(entry.lastModified).toLocaleDateString()}
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
  }
  
  return {
    renderCommand: buildCommand,
    renderCommandName: () => commandName,
    renderOutput: renderEntries,
    renderFooter: () => (
      <div className="flex items-center justify-between gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span>{path}</span>
          <span className="text-blue-400">{totalDirectories} directories</span>
          <span className="text-gray-400">{totalFiles} files</span>
          {ui.totalSize !== undefined && (
            <span className="text-gray-500">
              {formatFileSize(ui.totalSize)} total
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>{new Date(props.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    ),
    renderPendingMessage: () => "Reading directory...",
    renderRunningMessage: () => "Listing directory contents...",
    renderFailedMessage: () => results?.errorMessage || "Failed to list directory",
    shouldFold: () => (results?.entries?.length || 0) > 20,
    defaultFolded: () => (results?.entries?.length || 0) > 50,
    maxHeight: "600px",
    showCopyButton: true,
    errorMessage: results?.errorMessage,
  }
})
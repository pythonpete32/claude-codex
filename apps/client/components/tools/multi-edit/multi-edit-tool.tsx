"use client"

import React from "react"
import type { MultiEditToolProps, EditDetail } from "@claude-codex/types"
import { Clock, Files, Check, X } from "lucide-react"
import { TerminalText } from "@/shared/terminal-styles"
import { createToolComponent } from "../base/base-tool"

interface MultiEditToolUIProps extends MultiEditToolProps {
  description?: string
  onFileReview?: (filePath: string) => void
  onRevert?: (filePath: string) => void
}

export const MultiEditTool = createToolComponent<MultiEditToolUIProps>((props) => {
  const { input, results, ui, onFileReview, onRevert } = props
  
  const commandName = "multi-edit"
  const fileName = input.filePath.split("/").pop() || input.filePath
  const fileExtension = input.filePath.match(/\.(\w+)$/)?.[1] || ""
  
  // Render edit results
  const renderResults = () => {
    if (!results) {
      return (
        <div className="text-center py-4">
          <TerminalText variant="stdout" className="text-gray-400 italic">
            Preparing edits...
          </TerminalText>
        </div>
      )
    }
    
    const { editDetails, errorMessage } = results
    
    if (errorMessage && !editDetails?.length) {
      return (
        <div className="text-center py-4">
          <TerminalText variant="stderr">
            {errorMessage}
          </TerminalText>
        </div>
      )
    }
    
    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex items-center gap-3 text-sm">
          <Files className="h-4 w-4 text-blue-400" />
          <span className="text-gray-300">
            Applied {ui.successfulEdits} of {ui.totalEdits} edits
            {ui.failedEdits > 0 && (
              <span className="text-red-400 ml-2">
                ({ui.failedEdits} failed)
              </span>
            )}
          </span>
        </div>
        
        {/* Edit details */}
        {editDetails && editDetails.length > 0 && (
          <div className="space-y-2">
            {editDetails.map((detail: EditDetail, index: number) => {
              const { operation, success, replacements_made, error } = detail
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    success
                      ? "bg-green-900/10 border-green-800/30"
                      : "bg-red-900/10 border-red-800/30"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {success ? (
                      <Check className="h-4 w-4 text-green-400 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 text-red-400 mt-0.5" />
                    )}
                    
                    <div className="flex-1 space-y-1">
                      <div className="text-sm font-mono">
                        <span className="text-gray-500">Edit {index + 1}:</span>
                        {operation.lineNumber && (
                          <span className="text-gray-500 ml-2">
                            Line {operation.lineNumber}
                          </span>
                        )}
                        {operation.replace_all && (
                          <span className="text-blue-400 ml-2">(global)</span>
                        )}
                      </div>
                      
                      <div className="text-xs space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="text-red-400">-</span>
                          <span className="text-red-300 font-mono break-all">
                            {operation.old_string}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-400">+</span>
                          <span className="text-green-300 font-mono break-all">
                            {operation.new_string}
                          </span>
                        </div>
                      </div>
                      
                      {success && replacements_made !== undefined && (
                        <div className="text-xs text-gray-400">
                          {replacements_made} {replacements_made === 1 ? "replacement" : "replacements"} made
                        </div>
                      )}
                      
                      {error && (
                        <div className="text-xs text-red-400 mt-1">
                          {error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {/* Action buttons */}
        {(onFileReview || onRevert) && (
          <div className="flex gap-2 pt-2">
            {onFileReview && (
              <button
                onClick={() => onFileReview(input.filePath)}
                className="px-3 py-1 text-xs bg-blue-900/20 border border-blue-800/30 rounded text-blue-400 hover:bg-blue-900/30"
              >
                Review Changes
              </button>
            )}
            {onRevert && ui.successfulEdits > 0 && (
              <button
                onClick={() => onRevert(input.filePath)}
                className="px-3 py-1 text-xs bg-red-900/20 border border-red-800/30 rounded text-red-400 hover:bg-red-900/30"
              >
                Revert All
              </button>
            )}
          </div>
        )}
      </div>
    )
  }
  
  return {
    renderCommand: () => `${commandName} ${input.filePath}`,
    renderCommandName: () => commandName,
    renderOutput: renderResults,
    renderFooter: () => (
      <div className="flex items-center justify-between gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span
            className="text-blue-400 hover:underline cursor-pointer"
            onClick={() => onFileReview?.(input.filePath)}
          >
            {fileName}
          </span>
          {fileExtension && (
            <span className="text-gray-500">({fileExtension})</span>
          )}
          <span className="text-green-400">✓ {ui.successfulEdits}</span>
          {ui.failedEdits > 0 && (
            <span className="text-red-400">✗ {ui.failedEdits}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>{new Date(props.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    ),
    renderPendingMessage: () => "Preparing multiple edits...",
    renderRunningMessage: () => `Applying ${ui.totalEdits} edits...`,
    renderFailedMessage: () => results?.errorMessage || "Failed to apply edits",
    shouldFold: () => ui.totalEdits > 5,
    defaultFolded: () => ui.totalEdits > 10,
    maxHeight: "600px",
    showCopyButton: true,
    errorMessage: results?.errorMessage,
  }
})
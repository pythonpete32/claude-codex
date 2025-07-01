"use client"

import React from "react"
import type { MCPSequentialThinkingToolProps, WorkflowStep } from "@claude-codex/types"
import { 
  Clock, 
  Brain, 
  CheckCircle, 
  Circle, 
  AlertCircle, 
  Play,
  Loader 
} from "lucide-react"
import { BaseTool, type BaseToolRenderProps } from "../base/base-tool"

interface MCPSequentialThinkingToolUIProps extends MCPSequentialThinkingToolProps {
  description?: string
  onStepClick?: (stepId: string) => void
}

export class MCPSequentialThinkingTool extends BaseTool<MCPSequentialThinkingToolUIProps> {
  protected getRenderProps(): BaseToolRenderProps {
    return {
      renderCommand: () => `mcp-sequential-thinking "${this.props.input.workflow}"`,
      renderCommandName: () => "sequential-thinking",
      renderOutput: () => null, // Not used with customRender
      renderFooter: () => null, // Not used with customRender
      customRender: () => this.renderCustomUI(),
    }
  }
  
  private renderCustomUI() {
    const { workflow, ui, timestamp, className, onStepClick } = this.props
    
    // Get step icon based on status
    const getStepIcon = (step: WorkflowStep) => {
      switch (step.status.normalized) {
        case "completed":
          return <CheckCircle className="h-5 w-5 text-green-400" />
        case "running":
          return <Loader className="h-5 w-5 text-blue-400 animate-spin" />
        case "failed":
          return <AlertCircle className="h-5 w-5 text-red-400" />
        case "pending":
          return <Circle className="h-5 w-5 text-gray-400" />
        default:
          return <Circle className="h-5 w-5 text-gray-500" />
      }
    }
    
    // Get step color classes
    const getStepColor = (step: WorkflowStep) => {
      switch (step.status.normalized) {
        case "completed":
          return "border-green-500/30 bg-green-900/10"
        case "running":
          return "border-blue-500/30 bg-blue-900/10 animate-pulse"
        case "failed":
          return "border-red-500/30 bg-red-900/10"
        case "pending":
          return "border-gray-600 bg-gray-800/50"
        default:
          return "border-gray-700 bg-gray-900/50"
      }
    }
    
    return (
      <div className={`rounded-lg bg-gray-900 overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-medium text-white">{ui.title}</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {workflow?.overallProgress !== undefined && (
              <span>Progress: {Math.round(workflow.overallProgress)}%</span>
            )}
            {ui.estimatedTimeRemaining && (
              <span>ETA: {ui.estimatedTimeRemaining}s</span>
            )}
          </div>
        </div>
        
        {/* Description */}
        {(this.props.description || ui.description) && (
          <div className="px-4 py-2 border-b border-gray-700">
            <p className="text-sm text-gray-400">
              {this.props.description || ui.description}
            </p>
          </div>
        )}
        
        {/* Workflow Steps */}
        <div className="p-4">
          {this.isPending() && (
            <div className="text-center py-8 text-gray-400">
              <Play className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p>Workflow pending...</p>
            </div>
          )}
          
          {this.isRunning() && workflow?.steps && (
            <div className="space-y-3">
              {workflow.steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg border transition-all ${getStepColor(step)} ${
                    onStepClick ? "cursor-pointer hover:opacity-90" : ""
                  }`}
                  onClick={() => onStepClick?.(step.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getStepIcon(step)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-white truncate">
                          Step {index + 1}: {step.name}
                        </h4>
                        {step.progress > 0 && step.progress < 100 && (
                          <span className="text-xs text-gray-400">
                            {step.progress}%
                          </span>
                        )}
                      </div>
                      
                      {step.error && (
                        <p className="text-sm text-red-400 mt-1">{step.error}</p>
                      )}
                      
                      {step.dependencies && step.dependencies.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Depends on: {step.dependencies.join(", ")}
                        </p>
                      )}
                      
                      {step.status.normalized === "running" && (
                        <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${step.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {this.isCompleted() && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-green-400">Workflow completed successfully</p>
            </div>
          )}
          
          {this.isFailed() && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-400">Workflow failed</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        {timestamp && (
          <div className="border-t border-gray-700 px-4 py-2">
            <div className="flex items-center justify-end text-xs text-gray-500">
              {this.renderTimestamp()}
            </div>
          </div>
        )}
      </div>
    )
  }
}
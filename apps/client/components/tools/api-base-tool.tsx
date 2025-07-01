"use client"

import React from "react"
import { Clock } from "lucide-react"
import { TerminalWindow } from "@/components/ui/terminal"
import { TerminalText } from "@/shared/terminal-styles"
import { ParsedProps } from "@/lib/api-client"

export interface ApiBaseToolProps {
  parsedProps: ParsedProps
  timestamp: string
  description?: string
  className?: string
  foldable?: boolean
  defaultFolded?: boolean
}

export interface ApiToolRenderProps {
  // Content rendering
  renderCommand: () => string
  renderCommandName: () => string
  renderOutput: () => React.ReactNode
  renderFooter: () => React.ReactNode
  renderPendingMessage?: () => string
  renderRunningMessage?: () => string
  renderFailedMessage?: () => string

  // Configuration
  shouldFold?: () => boolean
  defaultFolded?: () => boolean
  maxHeight?: string
  showCopyButton?: boolean

  // Override the entire render for special cases
  customRender?: () => React.ReactNode
}

export abstract class ApiBaseTool extends React.Component<ApiBaseToolProps> {
  // Helper methods available to all tools
  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  protected getFileExtension(filePath: string): string {
    const match = filePath.match(/\.(\w+)$/)
    return match ? match[1] : ""
  }

  protected getFileName(filePath: string): string {
    return filePath.split("/").pop() || filePath
  }

  // Convenience getters for common props
  protected get toolType(): string {
    return this.props.parsedProps.toolType
  }

  protected get toolProps(): any {
    return this.props.parsedProps.props
  }

  protected get correlationId(): string {
    return this.props.parsedProps.correlationId
  }

  // Status helpers
  protected get normalizedStatus(): string {
    return this.toolProps.status?.normalized || "unknown"
  }

  protected isPending(): boolean {
    return this.normalizedStatus === "pending"
  }

  protected isRunning(): boolean {
    return this.normalizedStatus === "running"
  }

  protected isFailed(): boolean {
    return this.normalizedStatus === "failed"
  }

  protected isCompleted(): boolean {
    return this.normalizedStatus === "completed"
  }

  // Default implementations that can be overridden
  protected renderTimestamp(): React.ReactNode {
    if (!this.props.timestamp) return null
    return (
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span className="text-xs">{new Date(this.props.timestamp).toLocaleTimeString()}</span>
      </div>
    )
  }

  protected renderPendingState(): React.ReactNode {
    const message = this.getRenderProps().renderPendingMessage?.() || "Preparing..."
    return (
      <div className="text-center py-4">
        <TerminalText variant="stdout" className="text-gray-400 italic">
          {message}
        </TerminalText>
      </div>
    )
  }

  protected renderRunningState(): React.ReactNode {
    const message = this.getRenderProps().renderRunningMessage?.() || "Executing..."
    return (
      <div className="text-center py-4">
        <TerminalText variant="stdout" className="text-gray-400 italic">
          {message}
        </TerminalText>
      </div>
    )
  }

  protected renderFailedState(errorMessage?: string): React.ReactNode {
    const defaultMessage = this.getRenderProps().renderFailedMessage?.() || "Operation failed"
    return (
      <div className="text-center py-4">
        <TerminalText variant="stderr" className="mb-2">
          {errorMessage || defaultMessage}
        </TerminalText>
      </div>
    )
  }

  protected renderDefaultFooter(): React.ReactNode {
    return (
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>Duration: {this.toolProps.duration || 0}ms</span>
          <span>Status: {this.toolProps.status?.original || 'unknown'}</span>
          {this.toolProps.exitCode !== undefined && <span>Exit Code: {this.toolProps.exitCode}</span>}
        </div>
        <span className="font-mono">{this.correlationId.substring(0, 8)}...</span>
      </div>
    )
  }

  // Abstract method that each tool must implement
  protected abstract getRenderProps(): ApiToolRenderProps

  // Optional method for tools that need custom error handling
  protected getErrorMessage(): string | undefined {
    return this.toolProps.errorOutput || this.toolProps.errorMessage
  }

  render() {
    const renderProps = this.getRenderProps()

    // Allow complete custom rendering for special cases
    if (renderProps.customRender) {
      return renderProps.customRender()
    }

    // Determine foldable state
    const isFoldable = this.props.foldable !== undefined ? this.props.foldable : (renderProps.shouldFold?.() ?? false)
    const isDefaultFolded = this.props.defaultFolded !== undefined ? this.props.defaultFolded : (renderProps.defaultFolded?.() ?? false)

    // Handle error state
    const errorMessage = this.getErrorMessage()
    if (this.isFailed() || errorMessage) {
      return (
        <TerminalWindow
          command={renderProps.renderCommand()}
          commandName={renderProps.renderCommandName()}
          description={this.props.description}
          output={this.renderFailedState(errorMessage)}
          footer={renderProps.renderFooter()}
          status={this.normalizedStatus as any}
          timestamp={this.props.timestamp}
          foldable={isFoldable}
          defaultFolded={isDefaultFolded}
          maxHeight={renderProps.maxHeight}
          showCopyButton={renderProps.showCopyButton ?? true}
          className={this.props.className}
        />
      )
    }

    // Handle pending/running states
    if (this.isPending()) {
      return (
        <TerminalWindow
          command={renderProps.renderCommand()}
          commandName={renderProps.renderCommandName()}
          description={this.props.description}
          output={this.renderPendingState()}
          footer={renderProps.renderFooter()}
          status={this.normalizedStatus as any}
          timestamp={this.props.timestamp}
          foldable={isFoldable}
          defaultFolded={isDefaultFolded}
          maxHeight={renderProps.maxHeight}
          showCopyButton={renderProps.showCopyButton ?? true}
          className={this.props.className}
        />
      )
    }

    if (this.isRunning()) {
      return (
        <TerminalWindow
          command={renderProps.renderCommand()}
          commandName={renderProps.renderCommandName()}
          description={this.props.description}
          output={this.renderRunningState()}
          footer={renderProps.renderFooter()}
          status={this.normalizedStatus as any}
          timestamp={this.props.timestamp}
          foldable={isFoldable}
          defaultFolded={isDefaultFolded}
          maxHeight={renderProps.maxHeight}
          showCopyButton={renderProps.showCopyButton ?? true}
          className={this.props.className}
        />
      )
    }

    // Normal completed/other state
    return (
      <TerminalWindow
        command={renderProps.renderCommand()}
        commandName={renderProps.renderCommandName()}
        description={this.props.description}
        output={renderProps.renderOutput()}
        footer={renderProps.renderFooter()}
        status={this.normalizedStatus as any}
        timestamp={this.props.timestamp}
        foldable={isFoldable}
        defaultFolded={isDefaultFolded}
        maxHeight={renderProps.maxHeight}
        showCopyButton={renderProps.showCopyButton ?? true}
        className={this.props.className}
      />
    )
  }
}

// Functional component wrapper for easier use with hooks
export function createApiToolComponent(
  useRenderProps: (props: ApiBaseToolProps) => ApiToolRenderProps & { errorMessage?: string },
): React.FC<ApiBaseToolProps> {
  return function ToolComponent(props: ApiBaseToolProps) {
    const { errorMessage, ...renderProps } = useRenderProps(props)

    class ToolClass extends ApiBaseTool {
      protected getRenderProps() {
        return renderProps
      }

      protected getErrorMessage() {
        return errorMessage || super.getErrorMessage()
      }
    }

    return <ToolClass {...props} />
  }
}
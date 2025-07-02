"use client"

import React from "react"
import { AnimatedSpan, TerminalPrompt } from "./bash-animations"
import { BaseTool, type BaseToolRenderProps } from "../base/base-tool"
import type { BashToolProps } from "@claude-codex/types"

interface BashToolUIProps extends BashToolProps {
	description?: string
	onCopy?: () => void
	onRerun?: () => void
}

export class BashTool extends BaseTool<BashToolUIProps> {
	protected getRenderProps(): BaseToolRenderProps {
		return {
			renderCommand: () => this.props.command,
			renderCommandName: () => "bash",
			renderOutput: () => null, // Not used with customRender
			renderFooter: () => null, // Not used with customRender
			customRender: () => this.renderCustomUI(),
		}
	}

	private renderCustomUI() {
		const {
			command,
			output = "",
			exitCode,
			workingDirectory,
			elevated = false,
			showPrompt = true,
			promptText,
			className,
		} = this.props

		return (
			<div className={`rounded-lg bg-gray-900 overflow-hidden ${className}`}>
				<div className="p-4 space-y-2">
					{/* Show working directory if provided */}
					{workingDirectory && (
						<div className="text-gray-500 text-sm font-mono">
							<AnimatedSpan text={`[${workingDirectory}]`} />
						</div>
					)}

					{/* Command prompt */}
					<div className="flex items-start gap-2 group">
						{showPrompt && <TerminalPrompt elevated={elevated} text={promptText} />}
						<div className="flex-1 font-mono text-sm text-gray-100 whitespace-pre-wrap break-all">
							<AnimatedSpan text={command} className="text-blue-400" />
						</div>
					</div>

					{/* Status-specific rendering */}
					{this.isPending() && (
						<div className="pl-6 font-mono text-sm text-gray-400 italic">
							<AnimatedSpan text="Preparing command..." />
						</div>
					)}

					{this.isRunning() && (
						<div className="pl-6 font-mono text-sm text-gray-400 italic">
							<AnimatedSpan text="Executing..." />
						</div>
					)}

					{/* Output */}
					{!this.isPending() && !this.isRunning() && output && (
						<div className="pl-6 font-mono text-sm whitespace-pre-wrap break-all">
							<AnimatedSpan text={output} className={this.isFailed() ? "text-red-400" : "text-gray-300"} />
						</div>
					)}

					{/* Exit code for failed commands */}
					{this.isFailed() && exitCode !== undefined && exitCode !== 0 && (
						<div className="pl-6 font-mono text-sm text-red-400">
							<AnimatedSpan text={`Exit code: ${exitCode}`} />
						</div>
					)}
				</div>

				{/* Footer with timestamp and actions */}
				{(this.props.timestamp || this.props.onCopy || this.props.onRerun) && (
					<div className="border-t border-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
						<div className="flex items-center gap-2">{this.renderTimestamp()}</div>
						<div className="flex items-center gap-2">
							{this.props.onCopy && (
								<button onClick={this.props.onCopy} className="hover:text-gray-300 transition-colors">
									Copy
								</button>
							)}
							{this.props.onRerun && (
								<button onClick={this.props.onRerun} className="hover:text-gray-300 transition-colors">
									Rerun
								</button>
							)}
						</div>
					</div>
				)}
			</div>
		)
	}
}

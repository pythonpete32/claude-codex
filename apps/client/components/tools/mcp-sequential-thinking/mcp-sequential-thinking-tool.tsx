import type React from "react"
import { Brain, CheckCircle, Clock, Play, AlertTriangle, XCircle, ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { MCPSequentialThinkingToolProps as MCPSequentialThinkingParserProps } from "@claude-codex/types"

// Component extends parser props with UI-specific options
export interface MCPSequentialThinkingToolProps extends MCPSequentialThinkingParserProps {
	description?: string
	onStepClick?: (stepId: string) => void
}

export const MCPSequentialThinkingTool: React.FC<MCPSequentialThinkingToolProps> = ({
	// From BaseToolProps
	id,
	uuid,
	parentUuid,
	timestamp,
	duration,
	status,
	className,
	metadata,

	// From MCPSequentialThinkingToolProps
	input,
	workflow,
	ui,

	// UI-specific
	description,
	onStepClick,
}) => {
	const [isFolded, setIsFolded] = useState(false)
	const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

	// Use normalized status from parser
	const normalizedStatus = status.normalized

	// Toggle step expansion
	const toggleStep = (stepId: string) => {
		setExpandedSteps((prev) => {
			const next = new Set(prev)
			if (next.has(stepId)) {
				next.delete(stepId)
			} else {
				next.add(stepId)
			}
			return next
		})
	}

	// Get step status icon
	const getStepStatusIcon = (stepStatus: string) => {
		switch (stepStatus) {
			case "completed":
				return <CheckCircle className="h-4 w-4 text-green-400" />
			case "running":
				return <Play className="h-4 w-4 text-blue-400 animate-pulse" />
			case "pending":
				return <Clock className="h-4 w-4 text-gray-400" />
			case "failed":
				return <XCircle className="h-4 w-4 text-red-400" />
			case "interrupted":
				return <AlertTriangle className="h-4 w-4 text-yellow-400" />
			default:
				return <Clock className="h-4 w-4 text-gray-400" />
		}
	}

	// Get status color
	const getStatusColor = (stepStatus: string) => {
		switch (stepStatus) {
			case "completed":
				return "text-green-400 bg-green-900/20 border-green-500/30"
			case "running":
				return "text-blue-400 bg-blue-900/20 border-blue-500/30"
			case "pending":
				return "text-gray-400 bg-gray-900/20 border-gray-500/30"
			case "failed":
				return "text-red-400 bg-red-900/20 border-red-500/30"
			case "interrupted":
				return "text-yellow-400 bg-yellow-900/20 border-yellow-500/30"
			default:
				return "text-gray-400 bg-gray-900/20 border-gray-500/30"
		}
	}

	// Render workflow visualization
	const renderWorkflow = () => {
		if (!workflow || !workflow.steps || workflow.steps.length === 0) {
			return <div className="text-center py-8 text-gray-400">No workflow steps available</div>
		}

		const completedSteps = workflow.steps.filter((step) => step.status === "completed").length
		const progressPercentage = workflow.overallProgress || (completedSteps / workflow.steps.length) * 100

		return (
			<div className="space-y-4">
				{/* Progress Bar */}
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<h3 className="text-white font-medium">Progress</h3>
						<span className="text-sm text-gray-400">
							Step {workflow.currentStep} of {workflow.steps.length} ({Math.round(progressPercentage)}%)
						</span>
					</div>
					<div className="w-full bg-gray-700 rounded-full h-2">
						<div
							className="bg-blue-500 h-2 rounded-full transition-all duration-300"
							style={{ width: `${progressPercentage}%` }}
						/>
					</div>
					{ui.estimatedTimeRemaining && (
						<p className="text-xs text-gray-500">Estimated time remaining: {ui.estimatedTimeRemaining} minutes</p>
					)}
				</div>

				{/* Workflow Steps */}
				<div className="space-y-3">
					{workflow.steps.map((step, index) => {
						const isExpanded = expandedSteps.has(step.id)
						const isCurrentStep = index + 1 === workflow.currentStep

						return (
							<div
								key={step.id}
								className={cn(
									"border rounded-lg transition-all",
									isCurrentStep && "border-blue-400 bg-blue-500/10",
									!isCurrentStep && "border-gray-700",
								)}
							>
								<div className="p-4 cursor-pointer" onClick={() => toggleStep(step.id)}>
									<div className="flex items-start justify-between">
										<div className="flex items-start gap-3 flex-1">
											{getStepStatusIcon(step.status.normalized)}
											<div className="flex-1">
												<div className="flex items-center gap-2">
													<h4 className="font-medium text-white">{step.name}</h4>
													<Badge variant="outline" className={cn("text-xs", getStatusColor(step.status.normalized))}>
														{step.status.normalized}
													</Badge>
													{step.progress > 0 && step.progress < 100 && (
														<span className="text-xs text-gray-500">{step.progress}%</span>
													)}
												</div>
												{step.dependencies && step.dependencies.length > 0 && (
													<p className="text-xs text-gray-500 mt-1">Depends on: {step.dependencies.join(", ")}</p>
												)}
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											className="h-6 w-6 p-0"
											onClick={(e) => {
												e.stopPropagation()
												toggleStep(step.id)
											}}
										>
											{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
										</Button>
									</div>
								</div>

								{isExpanded && (
									<div className="px-4 pb-4 space-y-2 border-t border-gray-700 pt-3">
										{step.output && (
											<div className="bg-gray-800 rounded p-3">
												<p className="text-sm text-gray-300 whitespace-pre-wrap">
													{typeof step.output === "string" ? step.output : JSON.stringify(step.output, null, 2)}
												</p>
											</div>
										)}
										{step.error && (
											<div className="bg-red-900/20 border border-red-500/30 rounded p-3">
												<p className="text-sm text-red-300">{step.error}</p>
											</div>
										)}
										{onStepClick && (
											<Button variant="outline" size="sm" onClick={() => onStepClick(step.id)} className="text-xs">
												View Details
											</Button>
										)}
									</div>
								)}
							</div>
						)
					})}
				</div>

				{/* Dependencies Graph (if complex) */}
				{workflow.dependencies && workflow.dependencies.length > 0 && (
					<div className="mt-4 p-4 bg-gray-800 rounded-lg">
						<h4 className="text-sm font-medium text-gray-300 mb-2">Step Dependencies</h4>
						<div className="space-y-1">
							{workflow.dependencies.map((dep, index) => (
								<div key={index} className="text-xs text-gray-400">
									{dep.stepId} → {dep.dependsOn.join(", ")} ({dep.type})
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		)
	}

	// Render based on status
	const renderContent = () => {
		if (normalizedStatus === "pending" || normalizedStatus === "running") {
			return (
				<div className="text-center py-8">
					<Brain className="h-12 w-12 text-blue-400 animate-pulse mx-auto mb-4" />
					<p className="text-gray-400">
						{normalizedStatus === "pending" ? "Preparing workflow..." : "Processing workflow..."}
					</p>
				</div>
			)
		}

		if (normalizedStatus === "failed") {
			return (
				<div className="text-center py-8">
					<XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
					<p className="text-red-400">Workflow execution failed</p>
				</div>
			)
		}

		return renderWorkflow()
	}

	return (
		<div
			className={cn(
				"rounded-lg border transition-all duration-300 bg-gray-950",
				"border-blue-400/50 shadow-lg shadow-blue-500/10",
				className,
			)}
		>
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-700">
				<div className="flex items-center gap-3">
					<Brain className="w-5 h-5 text-blue-400" />
					<div>
						<h3 className="font-medium text-white">{ui.title}</h3>
						<p className="text-sm text-gray-400">{description || ui.description}</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Badge variant="outline" className={getStatusColor(normalizedStatus)}>
						{normalizedStatus}
					</Badge>
					<Button variant="ghost" size="sm" onClick={() => setIsFolded(!isFolded)} className="h-8 w-8 p-0">
						{isFolded ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
					</Button>
				</div>
			</div>

			{/* Content */}
			{!isFolded && (
				<div className="p-4">
					{/* Workflow Context */}
					{input.workflow && (
						<div className="mb-4 p-3 bg-gray-800 rounded-lg">
							<h4 className="text-sm font-medium text-gray-300 mb-2">Workflow Definition</h4>
							<pre className="text-xs text-gray-400 whitespace-pre-wrap">{input.workflow}</pre>
						</div>
					)}

					{renderContent()}

					{/* Metadata */}
					{timestamp && (
						<div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
							<span>Started: {new Date(timestamp).toLocaleString()}</span>
							{duration && <span>Duration: {duration}ms</span>}
						</div>
					)}
				</div>
			)}
		</div>
	)
}

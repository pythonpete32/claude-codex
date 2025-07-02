import {
	AlertTriangle,
	Brain,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Clock,
	Copy,
	Pause,
	Play,
	Terminal,
	XCircle,
	Zap,
} from "lucide-react"
import type React from "react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CopyButton } from "@/shared/copy-utils"
import { StatusBadge } from "@/shared/status-utils"
import { TerminalText } from "@/shared/terminal-styles"
import { TimeDisplay } from "@/shared/time-utils"

interface WorkflowStep {
	id: string
	sequence: number
	title: string
	description: string
	status: "pending" | "in_progress" | "completed" | "blocked" | "failed"
	priority: "low" | "medium" | "high" | "critical"
	dependencies?: string[]
	estimatedMinutes?: number
	actualMinutes?: number
	result?: string
	mcpResources?: string[]
}

interface Workflow {
	id: string
	name: string
	processType: string
	problemStatement: string
	targetOutcome: string
	status: "active" | "completed" | "paused" | "failed"
	priority: "low" | "medium" | "high" | "critical"
	steps: WorkflowStep[]
	tags?: string[]
	metadata?: {
		createdAt: string
		updatedAt: string
		estimatedTotalMinutes: number
		actualTotalMinutes: number
		completionPercentage: number
	}
}

export interface MCPSequentialThinkingToolProps {
	toolUse: {
		type: "tool_use"
		id: string
		name: string
		input: {
			workflow: Workflow
			mode: "create" | "update" | "complete"
			stepId?: string
		}
	}
	status: "pending" | "completed" | "failed" | "in_progress" | "interrupted"
	timestamp: string
	toolResult?: {
		output: {
			workflow: Workflow
			message: string
		}
	}
	className?: string
}

export const MCPSequentialThinkingTool: React.FC<MCPSequentialThinkingToolProps> = ({
	toolUse,
	status,
	timestamp,
	toolResult,
	className,
}) => {
	const [isFolded, setIsFolded] = useState(false)
	const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})

	const { workflow, mode, stepId } = toolUse.input
	const resultWorkflow = toolResult?.output.workflow || workflow

	// Get priority color
	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "critical":
				return "bg-red-900/20 text-red-300 border-red-500/30"
			case "high":
				return "bg-orange-900/20 text-orange-300 border-orange-500/30"
			case "medium":
				return "bg-yellow-900/20 text-yellow-300 border-yellow-500/30"
			case "low":
				return "bg-gray-900/20 text-gray-300 border-gray-500/30"
			default:
				return "bg-gray-900/20 text-gray-300 border-gray-500/30"
		}
	}

	// Get step status icon
	const getStepStatusIcon = (stepStatus: string) => {
		switch (stepStatus) {
			case "completed":
				return <CheckCircle className="h-4 w-4 text-green-400" />
			case "in_progress":
				return <Play className="h-4 w-4 text-blue-400 animate-pulse" />
			case "blocked":
				return <AlertTriangle className="h-4 w-4 text-yellow-400" />
			case "failed":
				return <XCircle className="h-4 w-4 text-red-400" />
			case "pending":
				return <Clock className="h-4 w-4 text-gray-400" />
			default:
				return <Clock className="h-4 w-4 text-gray-400" />
		}
	}

	// Calculate progress
	const completedSteps = resultWorkflow.steps.filter((step) => step.status === "completed").length
	const totalSteps = resultWorkflow.steps.length
	const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

	const formatTimestamp = (ts?: string) => {
		if (!ts) return ""
		return new Date(ts).toLocaleTimeString()
	}

	const copyToClipboard = (text: string, key: string) => {
		navigator.clipboard.writeText(text)
		setCopiedStates((prev) => ({ ...prev, [key]: true }))
		setTimeout(() => {
			setCopiedStates((prev) => ({ ...prev, [key]: false }))
		}, 2000)
	}

	// Render workflow step
	const renderStep = (step: WorkflowStep) => {
		const isCurrentStep = stepId === step.id
		return (
			<div
				key={step.id}
				className={cn(
					"border border-gray-700 rounded-lg p-4 transition-all",
					isCurrentStep && "border-blue-400 bg-blue-500/10",
				)}
			>
				<div className="flex items-start justify-between">
					<div className="flex items-start gap-3 flex-1">
						{getStepStatusIcon(step.status)}
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-1">
								<span className="font-medium text-white">{step.title}</span>
								<Badge variant="outline" className={getPriorityColor(step.priority)}>
									{step.priority}
								</Badge>
								{step.estimatedMinutes && (
									<Badge variant="secondary" className="bg-gray-800 text-gray-300">
										{step.actualMinutes || step.estimatedMinutes}m
									</Badge>
								)}
							</div>
							<p className="text-gray-300 text-sm mb-2">{step.description}</p>
							{step.result && (
								<div className="bg-gray-800 rounded p-2 mt-2">
									<p className="text-green-300 text-sm">{step.result}</p>
								</div>
							)}
							{step.mcpResources && step.mcpResources.length > 0 && (
								<div className="flex flex-wrap gap-1 mt-2">
									{step.mcpResources.map((resource, idx) => (
										<Badge
											key={idx}
											variant="outline"
											className="text-xs bg-purple-900/20 text-purple-300 border-purple-500/30"
										>
											{resource}
										</Badge>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		)
	}

	const getStatusIcon = () => {
		switch (status) {
			case "pending":
				return <Clock className="w-4 h-4 animate-spin text-yellow-500" />
			case "failed":
				return <XCircle className="w-4 h-4 text-red-500" />
			case "in_progress":
				return <Play className="w-4 h-4 text-blue-500 animate-pulse" />
			case "interrupted":
				return <Pause className="w-4 h-4 text-yellow-500" />
			default:
				return <CheckCircle className="w-4 h-4 text-green-500" />
		}
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
					<div className="flex items-center gap-2">
						<StatusBadge status={status} />
						<TimeDisplay timestamp={timestamp} />
					</div>
					<div className="flex items-center gap-2">
						<Brain className="w-5 h-5 text-blue-400" />
						<Badge variant="outline" className="border-blue-400/50 text-blue-400">
							{resultWorkflow.processType.replace("_", " ").toUpperCase()}
						</Badge>
						<span className="text-blue-400 font-medium">{resultWorkflow.name}</span>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Badge variant="outline" className={getPriorityColor(resultWorkflow.priority)}>
						{resultWorkflow.priority}
					</Badge>
					<Button variant="ghost" size="sm" onClick={() => setIsFolded(!isFolded)}>
						{isFolded ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
					</Button>
				</div>
			</div>

			{!isFolded && (
				<div className="p-4 space-y-4">
					{/* Problem Statement */}
					<div className="space-y-2">
						<h3 className="text-white font-medium flex items-center gap-2">
							<Terminal className="w-4 h-4" />
							Problem Statement
						</h3>
						<p className="text-gray-300 text-sm bg-gray-800 rounded p-3">{resultWorkflow.problemStatement}</p>
					</div>

					{/* Target Outcome */}
					<div className="space-y-2">
						<h3 className="text-white font-medium flex items-center gap-2">
							<Zap className="w-4 h-4 text-green-400" />
							Target Outcome
						</h3>
						<p className="text-gray-300 text-sm bg-gray-800 rounded p-3">{resultWorkflow.targetOutcome}</p>
					</div>

					{/* Progress Bar */}
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<h3 className="text-white font-medium">Progress</h3>
							<span className="text-sm text-gray-400">
								{completedSteps}/{totalSteps} steps completed ({Math.round(progressPercentage)}%)
							</span>
						</div>
						<div className="w-full bg-gray-700 rounded-full h-2">
							<div
								className="bg-blue-500 h-2 rounded-full transition-all duration-300"
								style={{ width: `${progressPercentage}%` }}
							/>
						</div>
					</div>

					{/* Mode and Step Info */}
					{toolResult?.output.message && (
						<div className="bg-blue-900/20 border border-blue-400/30 rounded p-3">
							<p className="text-blue-300 text-sm">{toolResult.output.message}</p>
						</div>
					)}

					{/* Steps */}
					<div className="space-y-3">
						<h3 className="text-white font-medium">Workflow Steps</h3>
						{resultWorkflow.steps.map(renderStep)}
					</div>

					{/* Tags */}
					{resultWorkflow.tags && resultWorkflow.tags.length > 0 && (
						<div className="space-y-2">
							<h3 className="text-white font-medium">Tags</h3>
							<div className="flex flex-wrap gap-1">
								{resultWorkflow.tags.map((tag, idx) => (
									<Badge key={idx} variant="secondary" className="text-xs">
										{tag}
									</Badge>
								))}
							</div>
						</div>
					)}

					{/* Metadata */}
					{resultWorkflow.metadata && (
						<div className="space-y-2">
							<h3 className="text-white font-medium">Workflow Metadata</h3>
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span className="text-gray-400">Created:</span>
									<span className="text-gray-300 ml-2">
										{new Date(resultWorkflow.metadata.createdAt).toLocaleString()}
									</span>
								</div>
								<div>
									<span className="text-gray-400">Updated:</span>
									<span className="text-gray-300 ml-2">
										{new Date(resultWorkflow.metadata.updatedAt).toLocaleString()}
									</span>
								</div>
								<div>
									<span className="text-gray-400">Est. Time:</span>
									<span className="text-gray-300 ml-2">{resultWorkflow.metadata.estimatedTotalMinutes}m</span>
								</div>
								<div>
									<span className="text-gray-400">Actual Time:</span>
									<span className="text-gray-300 ml-2">{resultWorkflow.metadata.actualTotalMinutes}m</span>
								</div>
							</div>
						</div>
					)}

					{/* Copy Workflow Data */}
					<div className="flex justify-end">
						<CopyButton text={JSON.stringify(resultWorkflow, null, 2)} label="Copy workflow data" />
					</div>
				</div>
			)}
		</div>
	)
}

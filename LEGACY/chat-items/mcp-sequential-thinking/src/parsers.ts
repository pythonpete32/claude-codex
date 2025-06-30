/**
 * @fileoverview Data transformation functions for sequential thinking tool
 * @module @dao/chat-items-todowrite-mcp-sequential-thinking/parsers
 */

import type {
	SequentialThinkingToolResultData,
	SequentialThinkingToolUseInput,
	StepPriority,
	StepStatus,
	ThinkingStep,
	ThinkingWorkflow,
} from "./types";

/**
 * Parses and creates a new thinking workflow
 */
export function parseThinkingWorkflow(input: SequentialThinkingToolUseInput): ThinkingWorkflow {
	const workflow = input.workflow;

	// Ensure steps are properly sequenced
	const sortedSteps = [...workflow.steps].sort((a, b) => a.sequence - b.sequence);

	// Update sequence numbers to be consecutive
	const processedSteps = sortedSteps.map((step, index) => ({
		...step,
		sequence: index + 1,
	}));

	return {
		...workflow,
		steps: processedSteps,
		metadata: {
			...workflow.metadata,
			updatedAt: new Date().toISOString(),
			createdAt: workflow.metadata?.createdAt || new Date().toISOString(),
		},
	};
}

/**
 * Calculates workflow progress statistics
 */
export function calculateWorkflowProgress(workflow: ThinkingWorkflow) {
	const totalSteps = workflow.steps.length;
	const completedSteps = workflow.steps.filter((step) => step.status === "completed").length;
	const pendingSteps = workflow.steps.filter((step) => step.status === "pending").length;
	const inProgressSteps = workflow.steps.filter((step) => step.status === "in_progress").length;
	const blockedSteps = workflow.steps.filter((step) => step.status === "blocked").length;
	const skippedSteps = workflow.steps.filter((step) => step.status === "skipped").length;

	const completionPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

	// Calculate estimated remaining time
	const remainingSteps = workflow.steps.filter(
		(step) => step.status === "pending" || step.status === "in_progress",
	);
	const estimatedRemainingMinutes = remainingSteps.reduce(
		(total, step) => total + (step.estimatedMinutes || 0),
		0,
	);

	return {
		totalSteps,
		completedSteps,
		pendingSteps: pendingSteps + inProgressSteps,
		blockedSteps,
		completionPercentage,
		estimatedRemainingMinutes:
			estimatedRemainingMinutes > 0 ? estimatedRemainingMinutes : undefined,
		inProgressSteps,
		skippedSteps,
	};
}

/**
 * Generates recommendations for next actions
 */
export function generateRecommendations(workflow: ThinkingWorkflow) {
	const { steps } = workflow;

	// Find blocked steps
	const blockedSteps = steps.filter((step) => step.status === "blocked").map((step) => step.id);

	// Find next actionable step (pending with no unmet dependencies)
	const nextStep = steps
		.filter((step) => step.status === "pending")
		.find((step) => {
			if (!step.dependencies || step.dependencies.length === 0) {
				return true;
			}
			// Check if all dependencies are completed
			return step.dependencies.every((depId) => {
				const depStep = steps.find((s) => s.id === depId);
				return depStep?.status === "completed";
			});
		});

	// Suggest MCP tools based on upcoming steps
	const upcomingSteps = steps.filter(
		(step) => step.status === "pending" || step.status === "in_progress",
	);
	const suggestedMcpTools = Array.from(
		new Set(upcomingSteps.flatMap((step) => step.mcpResources || [])),
	);

	return {
		nextStepId: nextStep?.id,
		nextStepTitle: nextStep?.title,
		blockedSteps: blockedSteps.length > 0 ? blockedSteps : undefined,
		suggestedMcpTools: suggestedMcpTools.length > 0 ? suggestedMcpTools : undefined,
	};
}

/**
 * Creates a summary of changes made to the workflow
 */
export function createChangesSummary(
	originalWorkflow: ThinkingWorkflow | null,
	updatedWorkflow: ThinkingWorkflow,
	mode: string,
) {
	if (!originalWorkflow || mode === "create") {
		return {
			stepsAdded: updatedWorkflow.steps.length,
			stepsUpdated: 0,
			stepsCompleted: updatedWorkflow.steps.filter((s) => s.status === "completed").length,
			stepsBlocked: updatedWorkflow.steps.filter((s) => s.status === "blocked").length,
		};
	}

	const originalStepIds = new Set(originalWorkflow.steps.map((s) => s.id));
	const _updatedStepIds = new Set(updatedWorkflow.steps.map((s) => s.id));

	const stepsAdded = updatedWorkflow.steps.filter((s) => !originalStepIds.has(s.id)).length;

	let stepsUpdated = 0;
	let stepsCompleted = 0;
	let stepsBlocked = 0;

	updatedWorkflow.steps.forEach((updatedStep) => {
		const originalStep = originalWorkflow.steps.find((s) => s.id === updatedStep.id);
		if (originalStep) {
			// Check if step was modified
			if (
				originalStep.status !== updatedStep.status ||
				originalStep.title !== updatedStep.title ||
				originalStep.description !== updatedStep.description ||
				originalStep.priority !== updatedStep.priority
			) {
				stepsUpdated++;
			}

			// Check if step was just completed
			if (originalStep.status !== "completed" && updatedStep.status === "completed") {
				stepsCompleted++;
			}

			// Check if step became blocked
			if (originalStep.status !== "blocked" && updatedStep.status === "blocked") {
				stepsBlocked++;
			}
		}
	});

	return {
		stepsAdded,
		stepsUpdated,
		stepsCompleted,
		stepsBlocked,
	};
}

/**
 * Validates step dependencies and resolves dependency chain
 */
export function validateAndResolveDependencies(workflow: ThinkingWorkflow): ThinkingWorkflow {
	const stepMap = new Map(workflow.steps.map((step) => [step.id, step]));

	// Validate all dependencies exist
	const validatedSteps = workflow.steps.map((step) => {
		if (!step.dependencies) return step;

		const validDependencies = step.dependencies.filter((depId) => stepMap.has(depId));

		return {
			...step,
			dependencies: validDependencies.length > 0 ? validDependencies : undefined,
		};
	});

	return {
		...workflow,
		steps: validatedSteps,
	};
}

/**
 * Creates result data from processed workflow
 */
export function createSequentialThinkingResult(
	workflow: ThinkingWorkflow,
	originalWorkflow: ThinkingWorkflow | null,
	mode: string,
): SequentialThinkingToolResultData {
	const changesSummary = createChangesSummary(originalWorkflow, workflow, mode);
	const progress = calculateWorkflowProgress(workflow);
	const recommendations = generateRecommendations(workflow);

	let message: string;
	switch (mode) {
		case "create":
			message = `Created workflow "${workflow.name}" with ${workflow.steps.length} steps`;
			break;
		case "update":
			message = `Updated workflow "${workflow.name}" - ${changesSummary.stepsUpdated} steps modified`;
			break;
		case "analyze":
			message = `Analyzed workflow "${workflow.name}" - ${progress.completionPercentage}% complete`;
			break;
		case "execute_next":
			if (recommendations.nextStepId) {
				message = `Next step ready: "${recommendations.nextStepTitle}"`;
			} else {
				message = `No actionable steps found - check for blocked dependencies`;
			}
			break;
		default:
			message = `Processed workflow "${workflow.name}"`;
	}

	return {
		workflow,
		changesSummary,
		progress,
		recommendations,
		message,
	};
}

/**
 * Utility functions for step operations
 */
export const stepOperations = {
	/**
	 * Creates a new thinking step with default values
	 */
	createStep(
		id: string,
		title: string,
		description: string,
		sequence: number,
		priority: StepPriority = "medium",
	): ThinkingStep {
		return {
			id,
			sequence,
			title,
			description,
			status: "pending",
			priority,
			dependencies: [],
			tags: [],
		};
	},

	/**
	 * Updates step status and handles completion logic
	 */
	updateStepStatus(step: ThinkingStep, newStatus: StepStatus): ThinkingStep {
		const updatedStep = { ...step, status: newStatus };

		if (newStatus === "completed") {
			updatedStep.actualMinutes = updatedStep.actualMinutes || updatedStep.estimatedMinutes;
		}

		return updatedStep;
	},

	/**
	 * Checks if a step can be started (dependencies met)
	 */
	canStartStep(step: ThinkingStep, allSteps: ThinkingStep[]): boolean {
		if (!step.dependencies || step.dependencies.length === 0) {
			return true;
		}

		return step.dependencies.every((depId) => {
			const depStep = allSteps.find((s) => s.id === depId);
			return depStep?.status === "completed";
		});
	},

	/**
	 * Gets all steps that depend on a given step
	 */
	getDependentSteps(stepId: string, allSteps: ThinkingStep[]): ThinkingStep[] {
		return allSteps.filter((step) => step.dependencies?.includes(stepId));
	},
};

/**
 * Workflow analysis functions
 */
export const workflowAnalysis = {
	/**
	 * Identifies critical path through the workflow
	 */
	findCriticalPath(workflow: ThinkingWorkflow): ThinkingStep[] {
		const stepMap = new Map(workflow.steps.map((step) => [step.id, step]));
		const visited = new Set<string>();
		const criticalPath: ThinkingStep[] = [];

		function findLongestPath(stepId: string): number {
			if (visited.has(stepId)) return 0;
			visited.add(stepId);

			const step = stepMap.get(stepId);
			if (!step) return 0;

			const dependentSteps = stepOperations.getDependentSteps(stepId, workflow.steps);
			const maxDepth =
				dependentSteps.length > 0
					? Math.max(...dependentSteps.map((dep) => findLongestPath(dep.id)))
					: 0;

			return (step.estimatedMinutes || 0) + maxDepth;
		}

		// Find the step with the longest path to completion
		let maxDuration = 0;
		let criticalStepId = "";

		workflow.steps.forEach((step) => {
			visited.clear();
			const duration = findLongestPath(step.id);
			if (duration > maxDuration) {
				maxDuration = duration;
				criticalStepId = step.id;
			}
		});

		// Build the critical path
		function buildPath(stepId: string): void {
			const step = stepMap.get(stepId);
			if (!step) return;

			criticalPath.push(step);
			const dependentSteps = stepOperations.getDependentSteps(stepId, workflow.steps);

			if (dependentSteps.length > 0) {
				// Find the dependent step with the longest path
				let nextStepId = "";
				let nextMaxDuration = 0;

				dependentSteps.forEach((depStep) => {
					visited.clear();
					const duration = findLongestPath(depStep.id);
					if (duration > nextMaxDuration) {
						nextMaxDuration = duration;
						nextStepId = depStep.id;
					}
				});

				if (nextStepId) {
					buildPath(nextStepId);
				}
			}
		}

		if (criticalStepId) {
			buildPath(criticalStepId);
		}

		return criticalPath;
	},

	/**
	 * Detects circular dependencies in the workflow
	 */
	detectCircularDependencies(workflow: ThinkingWorkflow): string[] {
		const stepMap = new Map(workflow.steps.map((step) => [step.id, step]));
		const visiting = new Set<string>();
		const visited = new Set<string>();
		const circularDeps: string[] = [];

		function visit(stepId: string, path: string[]): void {
			if (visiting.has(stepId)) {
				// Found a cycle
				const cycleStart = path.indexOf(stepId);
				circularDeps.push(`${path.slice(cycleStart).join(" -> ")} -> ${stepId}`);
				return;
			}

			if (visited.has(stepId)) return;

			visiting.add(stepId);
			const step = stepMap.get(stepId);

			if (step?.dependencies) {
				step.dependencies.forEach((depId) => {
					visit(depId, [...path, stepId]);
				});
			}

			visiting.delete(stepId);
			visited.add(stepId);
		}

		workflow.steps.forEach((step) => {
			if (!visited.has(step.id)) {
				visit(step.id, []);
			}
		});

		return circularDeps;
	},

	/**
	 * Calculates workflow health metrics
	 */
	calculateHealthMetrics(workflow: ThinkingWorkflow) {
		const progress = calculateWorkflowProgress(workflow);
		const circularDeps = this.detectCircularDependencies(workflow);
		const criticalPath = this.findCriticalPath(workflow);

		// Calculate risk factors
		const riskFactors = {
			blockedStepsRatio: progress.totalSteps > 0 ? progress.blockedSteps / progress.totalSteps : 0,
			hasCircularDependencies: circularDeps.length > 0,
			criticalPathLength: criticalPath.length,
			overdueTasks: workflow.steps.filter((step) => {
				if (!step.estimatedMinutes || step.status === "completed") return false;
				// This would need actual time tracking to determine if overdue
				return false;
			}).length,
		};

		// Calculate overall health score (0-100)
		let healthScore = 100;
		healthScore -= riskFactors.blockedStepsRatio * 30; // Blocked steps reduce health
		healthScore -= riskFactors.hasCircularDependencies ? 25 : 0; // Circular deps are serious
		healthScore -= Math.min(riskFactors.overdueTasks * 5, 20); // Overdue tasks reduce health

		return {
			healthScore: Math.max(0, Math.round(healthScore)),
			riskFactors,
			circularDependencies: circularDeps,
			criticalPathSteps: criticalPath.length,
			recommendations: [
				...(riskFactors.blockedStepsRatio > 0.2
					? ["Address blocked steps to improve workflow flow"]
					: []),
				...(riskFactors.hasCircularDependencies ? ["Resolve circular dependencies"] : []),
				...(riskFactors.overdueTasks > 0 ? ["Review overdue tasks and adjust timelines"] : []),
			],
		};
	},
};

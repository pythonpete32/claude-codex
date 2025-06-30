/**
 * @fileoverview Fixture management and exports for sequential thinking tool
 * @module @dao/chat-items-todowrite-mcp-sequential-thinking/fixtures
 */

import fixturesData from "./fixtures.json";
import type { SequentialThinkingToolFixture, ThinkingStep } from "./types";

/**
 * All available fixtures for Sequential Thinking tool
 */
export const fixtures = fixturesData as SequentialThinkingToolFixture[];

/**
 * Get fixtures by category
 */
export function getFixturesByCategory(category: string): SequentialThinkingToolFixture[] {
	return fixtures.filter((fixture) => fixture.category === category);
}

/**
 * Get fixture by name
 */
export function getFixtureByName(name: string): SequentialThinkingToolFixture | undefined {
	return fixtures.find((fixture) => fixture.name === name);
}

/**
 * Categorized fixture exports
 */

/**
 * Basic sequential thinking workflow fixtures
 */
export const basicFixtures = getFixturesByCategory("basic");

/**
 * Analysis-focused workflow fixtures
 */
export const analysisFixtures = getFixturesByCategory("analysis");

/**
 * Troubleshooting workflow fixtures
 */
export const troubleshootingFixtures = getFixturesByCategory("troubleshooting");

/**
 * Decision-making workflow fixtures
 */
export const decisionFixtures = getFixturesByCategory("decision");

/**
 * Error and edge case fixtures
 */
export const errorFixtures = getFixturesByCategory("errors");

/**
 * Iterative refinement workflow fixtures
 */
export const iterationFixtures = getFixturesByCategory("iteration");

/**
 * Named fixture exports for easy access
 */
export const namedFixtures = {
	basicProblemDecomposition: getFixtureByName("basic_problem_decomposition"),
	stepByStepAnalysis: getFixtureByName("step_by_step_analysis"),
	rootCauseAnalysis: getFixtureByName("root_cause_analysis"),
	decisionTreeWorkflow: getFixtureByName("decision_tree_workflow"),
	blockedDependencies: getFixtureByName("blocked_dependencies"),
	iterativeRefinement: getFixtureByName("iterative_refinement"),
} as const;

/**
 * Fixture statistics and analysis
 */
export const fixtureStats = {
	total: fixtures.length,
	byCategory: {
		basic: basicFixtures.length,
		analysis: analysisFixtures.length,
		troubleshooting: troubleshootingFixtures.length,
		decision: decisionFixtures.length,
		errors: errorFixtures.length,
		iteration: iterationFixtures.length,
	},
	processTypes: Array.from(new Set(fixtures.map((f) => f.data.toolUse.input.workflow.processType))),
	totalSteps: fixtures.reduce((total, f) => total + f.data.toolUse.input.workflow.steps.length, 0),
} as const;

/**
 * Helper functions for working with fixtures
 */
export const fixtureHelpers = {
	/**
	 * Get fixtures containing workflows with specific process types
	 */
	getByProcessType(processType: string): SequentialThinkingToolFixture[] {
		return fixtures.filter((f) => f.data.toolUse.input.workflow.processType === processType);
	},

	/**
	 * Get fixtures with workflows in specific status
	 */
	getByWorkflowStatus(status: string): SequentialThinkingToolFixture[] {
		return fixtures.filter((f) => f.data.toolUse.input.workflow.status === status);
	},

	/**
	 * Get fixtures with workflows containing specific priority levels
	 */
	getByPriority(priority: string): SequentialThinkingToolFixture[] {
		return fixtures.filter((f) => f.data.toolUse.input.workflow.priority === priority);
	},

	/**
	 * Get fixtures with workflows containing blocked steps
	 */
	getWithBlockedSteps(): SequentialThinkingToolFixture[] {
		return fixtures.filter((f) =>
			f.data.toolUse.input.workflow.steps.some((step: ThinkingStep) => step.status === "blocked"),
		);
	},

	/**
	 * Get fixtures with workflows containing completed steps
	 */
	getWithCompletedSteps(): SequentialThinkingToolFixture[] {
		return fixtures.filter((f) =>
			f.data.toolUse.input.workflow.steps.some((step: ThinkingStep) => step.status === "completed"),
		);
	},

	/**
	 * Get fixtures with workflows containing specific MCP resources
	 */
	getWithMcpResources(resourceName: string): SequentialThinkingToolFixture[] {
		return fixtures.filter((f) =>
			f.data.toolUse.input.workflow.steps.some((step: ThinkingStep) =>
				step.mcpResources?.includes(resourceName),
			),
		);
	},

	/**
	 * Get fixtures by operation mode
	 */
	getByMode(mode: string): SequentialThinkingToolFixture[] {
		return fixtures.filter((f) => f.data.toolUse.input.mode === mode);
	},

	/**
	 * Get fixtures with specific step counts
	 */
	getByStepCount(count: number): SequentialThinkingToolFixture[] {
		return fixtures.filter((f) => f.data.toolUse.input.workflow.steps.length === count);
	},

	/**
	 * Get fixtures with workflows having dependencies
	 */
	getWithDependencies(): SequentialThinkingToolFixture[] {
		return fixtures.filter((f) =>
			f.data.toolUse.input.workflow.steps.some(
				(step: ThinkingStep) => step.dependencies && step.dependencies.length > 0,
			),
		);
	},

	/**
	 * Get fixtures with specific tags
	 */
	getByTag(tag: string): SequentialThinkingToolFixture[] {
		return fixtures.filter(
			(f) =>
				f.data.toolUse.input.workflow.tags?.includes(tag) ||
				f.data.toolUse.input.workflow.steps.some((step: ThinkingStep) => step.tags?.includes(tag)),
		);
	},
};

/**
 * Validation helpers for fixtures
 */
export const fixtureValidation = {
	/**
	 * Check if all fixtures have required fields
	 */
	validateStructure(): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		fixtures.forEach((fixture, index) => {
			if (!fixture.name) {
				errors.push(`Fixture ${index}: Missing name`);
			}
			if (!fixture.category) {
				errors.push(`Fixture ${index}: Missing category`);
			}
			if (!fixture.data) {
				errors.push(`Fixture ${index}: Missing data`);
			}
			if (!fixture.data?.toolUse?.input?.workflow) {
				errors.push(`Fixture ${index}: Missing workflow in input`);
			}
		});

		return {
			valid: errors.length === 0,
			errors,
		};
	},

	/**
	 * Check if all workflow IDs are unique
	 */
	validateUniqueIds(): { valid: boolean; duplicates: string[] } {
		const workflowIds = fixtures.map((f) => f.data.toolUse.input.workflow.id);
		const duplicates = workflowIds.filter((id, index) => workflowIds.indexOf(id) !== index);

		return {
			valid: duplicates.length === 0,
			duplicates: Array.from(new Set(duplicates)),
		};
	},

	/**
	 * Check if step dependencies exist within their workflows
	 */
	validateDependencies(): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		fixtures.forEach((fixture) => {
			const workflow = fixture.data.toolUse.input.workflow;
			const stepIds = new Set(workflow.steps.map((s: ThinkingStep) => s.id));

			workflow.steps.forEach((step: ThinkingStep) => {
				step.dependencies?.forEach((depId: string) => {
					if (!stepIds.has(depId)) {
						errors.push(`Workflow ${workflow.id}, Step ${step.id}: Invalid dependency ${depId}`);
					}
				});
			});
		});

		return {
			valid: errors.length === 0,
			errors,
		};
	},

	/**
	 * Run all validation checks
	 */
	validateAll(): { valid: boolean; report: Record<string, unknown> } {
		const structure = this.validateStructure();
		const uniqueIds = this.validateUniqueIds();
		const dependencies = this.validateDependencies();

		return {
			valid: structure.valid && uniqueIds.valid && dependencies.valid,
			report: {
				structure,
				uniqueIds,
				dependencies,
				summary: {
					totalFixtures: fixtures.length,
					validStructure: structure.valid,
					uniqueIds: uniqueIds.valid,
					validDependencies: dependencies.valid,
				},
			},
		};
	},
};

/**
 * Export fixture metadata
 */
export const FIXTURE_METADATA = {
	version: "1.0.0",
	totalFixtures: fixtures.length,
	categories: Object.keys(fixtureStats.byCategory),
	processTypes: fixtureStats.processTypes,
	lastUpdated: "2024-01-20T18:00:00Z",
} as const;

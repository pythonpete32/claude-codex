/**
 * @fileoverview Comprehensive tests for sequential thinking tool
 */

import { beforeEach, describe, expect, it } from "bun:test";
import {
	analysisFixtures,
	basicFixtures,
	calculateWorkflowProgress,
	createChangesSummary,
	createSequentialThinkingResult,
	DEFAULTS,
	decisionFixtures,
	ERROR_MESSAGES,
	errorFixtures,
	fixtureHelpers,
	fixtureStats,
	// Fixtures
	fixtures,
	fixtureValidation,
	generateRecommendations,
	getFixtureByName,
	getFixturesByCategory,
	// Type guards
	isSequentialThinkingToolUseInput,
	isThinkingStep,
	isThinkingWorkflow,
	iterationFixtures,
	namedFixtures,
	OPERATION_MODES,
	// Constants
	PACKAGE_INFO,
	// Parsers
	parseThinkingWorkflow,
	type SequentialThinkingToolUseInput,
	STEP_PRIORITIES,
	STEP_STATUSES,
	SUCCESS_MESSAGES,
	safeValidateSequentialThinkingToolUseInput,
	safeValidateThinkingStep,
	stepOperations,
	THINKING_PROCESS_TYPES,
	// Types
	type ThinkingStep,
	type ThinkingWorkflow,
	TOOL_CONSTANTS,
	troubleshootingFixtures,
	VALIDATION_RULES,
	validateAndResolveDependencies,
	// Validators
	validateSequentialThinkingToolUseInput,
	validateThinkingStep,
	validateThinkingWorkflow,
	WORKFLOW_STATUSES,
	workflowAnalysis,
} from "../src/index";

// Test data setup
let sampleWorkflow: ThinkingWorkflow;
let sampleStep: ThinkingStep;
let sampleInput: SequentialThinkingToolUseInput;

beforeEach(() => {
	sampleStep = {
		id: "step_001",
		sequence: 1,
		title: "Initial Analysis",
		description: "Perform initial analysis of the problem",
		status: "pending",
		priority: "high",
		estimatedMinutes: 30,
		tags: ["analysis"],
	};

	sampleWorkflow = {
		id: "wf_001",
		name: "Test Workflow",
		processType: "problem_decomposition",
		problemStatement: "Sample problem for testing",
		targetOutcome: "Successful test completion",
		steps: [sampleStep],
		status: "draft",
		priority: "medium",
		tags: ["test"],
		metadata: {
			createdAt: "2024-01-20T10:00:00Z",
			updatedAt: "2024-01-20T10:00:00Z",
			estimatedTotalMinutes: 30,
			completionPercentage: 0,
		},
	};

	sampleInput = {
		workflow: sampleWorkflow,
		mode: "create",
	};
});

describe("Package Metadata", () => {
	it("should have correct package info", () => {
		expect(PACKAGE_INFO.name).toBe("@dao/chat-items-todowrite-mcp-sequential-thinking");
		expect(PACKAGE_INFO.version).toBe("1.0.0");
		expect(PACKAGE_INFO.license).toBe("MIT");
		expect(PACKAGE_INFO.author).toBe("DAO");
		expect(PACKAGE_INFO.keywords).toContain("sequential-thinking");
		expect(PACKAGE_INFO.keywords).toContain("mcp");
	});

	it("should have correct tool constants", () => {
		expect(TOOL_CONSTANTS.name).toBe("SequentialThinking");
		expect(TOOL_CONSTANTS.type).toBe("tool_use");
		expect(TOOL_CONSTANTS.category).toBe("sequential-thinking");
		expect(TOOL_CONSTANTS.displayName).toBe("Sequential Thinking");
	});
});

describe("Type Guards", () => {
	it("should correctly identify SequentialThinkingToolUseInput", () => {
		expect(isSequentialThinkingToolUseInput(sampleInput)).toBe(true);
		expect(isSequentialThinkingToolUseInput({})).toBe(false);
		expect(isSequentialThinkingToolUseInput(null)).toBe(false);
		expect(isSequentialThinkingToolUseInput("string")).toBe(false);
	});

	it("should correctly identify ThinkingStep", () => {
		expect(isThinkingStep(sampleStep)).toBe(true);
		expect(isThinkingStep({})).toBe(false);
		expect(isThinkingStep({ id: "test" })).toBe(false); // incomplete
	});

	it("should correctly identify ThinkingWorkflow", () => {
		expect(isThinkingWorkflow(sampleWorkflow)).toBe(true);
		expect(isThinkingWorkflow({})).toBe(false);
		expect(isThinkingWorkflow({ id: "test" })).toBe(false); // incomplete
	});
});

describe("Validators", () => {
	describe("Throwing validators", () => {
		it("should validate valid SequentialThinkingToolUseInput", () => {
			expect(() => validateSequentialThinkingToolUseInput(sampleInput)).not.toThrow();
			const result = validateSequentialThinkingToolUseInput(sampleInput);
			expect(result.workflow.id).toBe("wf_001");
		});

		it("should validate valid ThinkingStep", () => {
			expect(() => validateThinkingStep(sampleStep)).not.toThrow();
			const result = validateThinkingStep(sampleStep);
			expect(result.id).toBe("step_001");
		});

		it("should validate valid ThinkingWorkflow", () => {
			expect(() => validateThinkingWorkflow(sampleWorkflow)).not.toThrow();
			const result = validateThinkingWorkflow(sampleWorkflow);
			expect(result.id).toBe("wf_001");
		});

		it("should throw on invalid input", () => {
			expect(() => validateSequentialThinkingToolUseInput({})).toThrow();
			expect(() => validateThinkingStep({})).toThrow();
			expect(() => validateThinkingWorkflow({})).toThrow();
		});
	});

	describe("Safe validators", () => {
		it("should return valid data for correct input", () => {
			const result = safeValidateSequentialThinkingToolUseInput(sampleInput);
			expect(result).not.toBeNull();
			expect(result?.workflow.id).toBe("wf_001");
		});

		it("should return null for invalid input", () => {
			expect(safeValidateSequentialThinkingToolUseInput({})).toBeNull();
			expect(safeValidateThinkingStep({})).toBeNull();
			expect(safeValidateSequentialThinkingToolUseInput(null)).toBeNull();
		});
	});
});

describe("Parsers", () => {
	describe("parseThinkingWorkflow", () => {
		it("should parse workflow and sort steps", () => {
			const workflow = {
				...sampleWorkflow,
				steps: [
					{ ...sampleStep, sequence: 3, id: "step_003" },
					{ ...sampleStep, sequence: 1, id: "step_001" },
					{ ...sampleStep, sequence: 2, id: "step_002" },
				],
			};
			const result = parseThinkingWorkflow({ workflow });
			expect(result.steps[0].sequence).toBe(1);
			expect(result.steps[1].sequence).toBe(2);
			expect(result.steps[2].sequence).toBe(3);
			expect(result.steps[0].id).toBe("step_001");
		});

		it("should update metadata timestamps", () => {
			const result = parseThinkingWorkflow(sampleInput);
			expect(result.metadata?.updatedAt).toBeDefined();
			expect(result.metadata?.createdAt).toBeDefined();
		});
	});

	describe("calculateWorkflowProgress", () => {
		it("should calculate progress correctly", () => {
			const workflow = {
				...sampleWorkflow,
				steps: [
					{ ...sampleStep, id: "step_001", status: "completed" as const },
					{ ...sampleStep, id: "step_002", status: "in_progress" as const },
					{ ...sampleStep, id: "step_003", status: "pending" as const },
					{ ...sampleStep, id: "step_004", status: "blocked" as const },
				],
			};
			const progress = calculateWorkflowProgress(workflow);
			expect(progress.totalSteps).toBe(4);
			expect(progress.completedSteps).toBe(1);
			expect(progress.pendingSteps).toBe(2); // pending + in_progress
			expect(progress.blockedSteps).toBe(1);
			expect(progress.completionPercentage).toBe(25);
		});

		it("should handle empty workflow", () => {
			const workflow = { ...sampleWorkflow, steps: [] };
			const progress = calculateWorkflowProgress(workflow);
			expect(progress.totalSteps).toBe(0);
			expect(progress.completionPercentage).toBe(0);
		});
	});

	describe("generateRecommendations", () => {
		it("should find next actionable step", () => {
			const workflow = {
				...sampleWorkflow,
				steps: [
					{ ...sampleStep, id: "step_001", status: "completed" as const },
					{ ...sampleStep, id: "step_002", status: "pending" as const, dependencies: ["step_001"] },
					{ ...sampleStep, id: "step_003", status: "pending" as const, dependencies: ["step_002"] },
				],
			};
			const recommendations = generateRecommendations(workflow);
			expect(recommendations.nextStepId).toBe("step_002");
			expect(recommendations.nextStepTitle).toBe("Initial Analysis");
		});

		it("should identify blocked steps", () => {
			const workflow = {
				...sampleWorkflow,
				steps: [
					{ ...sampleStep, id: "step_001", status: "blocked" as const },
					{ ...sampleStep, id: "step_002", status: "blocked" as const },
				],
			};
			const recommendations = generateRecommendations(workflow);
			expect(recommendations.blockedSteps).toEqual(["step_001", "step_002"]);
		});

		it("should suggest MCP tools", () => {
			const workflow = {
				...sampleWorkflow,
				steps: [
					{
						...sampleStep,
						id: "step_001",
						status: "pending" as const,
						mcpResources: ["tool1", "tool2"],
					},
					{
						...sampleStep,
						id: "step_002",
						status: "pending" as const,
						mcpResources: ["tool2", "tool3"],
					},
				],
			};
			const recommendations = generateRecommendations(workflow);
			expect(recommendations.suggestedMcpTools).toContain("tool1");
			expect(recommendations.suggestedMcpTools).toContain("tool2");
			expect(recommendations.suggestedMcpTools).toContain("tool3");
		});
	});

	describe("createChangesSummary", () => {
		it("should create summary for new workflow", () => {
			const summary = createChangesSummary(null, sampleWorkflow, "create");
			expect(summary.stepsAdded).toBe(1);
			expect(summary.stepsUpdated).toBe(0);
		});

		it("should detect updated steps", () => {
			const originalWorkflow = { ...sampleWorkflow };
			const updatedWorkflow = {
				...sampleWorkflow,
				steps: [{ ...sampleStep, title: "Updated Title" }],
			};
			const summary = createChangesSummary(originalWorkflow, updatedWorkflow, "update");
			expect(summary.stepsUpdated).toBe(1);
		});

		it("should detect completed steps", () => {
			const originalWorkflow = { ...sampleWorkflow };
			const updatedWorkflow = {
				...sampleWorkflow,
				steps: [{ ...sampleStep, status: "completed" as const }],
			};
			const summary = createChangesSummary(originalWorkflow, updatedWorkflow, "update");
			expect(summary.stepsCompleted).toBe(1);
		});
	});

	describe("validateAndResolveDependencies", () => {
		it("should remove invalid dependencies", () => {
			const workflow = {
				...sampleWorkflow,
				steps: [
					{ ...sampleStep, id: "step_001", dependencies: ["step_999", "step_002"] },
					{ ...sampleStep, id: "step_002" },
				],
			};
			const result = validateAndResolveDependencies(workflow);
			expect(result.steps[0].dependencies).toEqual(["step_002"]);
		});

		it("should remove dependencies array if empty", () => {
			const workflow = {
				...sampleWorkflow,
				steps: [{ ...sampleStep, id: "step_001", dependencies: ["step_999"] }],
			};
			const result = validateAndResolveDependencies(workflow);
			expect(result.steps[0].dependencies).toBeUndefined();
		});
	});

	describe("createSequentialThinkingResult", () => {
		it("should create complete result data", () => {
			const result = createSequentialThinkingResult(sampleWorkflow, null, "create");
			expect(result.workflow).toEqual(sampleWorkflow);
			expect(result.changesSummary).toBeDefined();
			expect(result.progress).toBeDefined();
			expect(result.recommendations).toBeDefined();
			expect(result.message).toContain("Created workflow");
		});

		it("should generate appropriate messages for different modes", () => {
			const createResult = createSequentialThinkingResult(sampleWorkflow, null, "create");
			expect(createResult.message).toContain("Created");

			const updateResult = createSequentialThinkingResult(sampleWorkflow, null, "update");
			expect(updateResult.message).toContain("Updated");

			const analyzeResult = createSequentialThinkingResult(sampleWorkflow, null, "analyze");
			expect(analyzeResult.message).toContain("Analyzed");
		});
	});
});

describe("Step Operations", () => {
	describe("createStep", () => {
		it("should create step with defaults", () => {
			const step = stepOperations.createStep("test_id", "Test Title", "Test Description", 1);
			expect(step.id).toBe("test_id");
			expect(step.title).toBe("Test Title");
			expect(step.status).toBe("pending");
			expect(step.priority).toBe("medium");
			expect(step.sequence).toBe(1);
		});

		it("should create step with custom priority", () => {
			const step = stepOperations.createStep(
				"test_id",
				"Test Title",
				"Test Description",
				1,
				"high",
			);
			expect(step.priority).toBe("high");
		});
	});

	describe("updateStepStatus", () => {
		it("should update step status", () => {
			const updatedStep = stepOperations.updateStepStatus(sampleStep, "completed");
			expect(updatedStep.status).toBe("completed");
		});

		it("should set actual time when completing", () => {
			const step = { ...sampleStep, estimatedMinutes: 30 };
			const updatedStep = stepOperations.updateStepStatus(step, "completed");
			expect(updatedStep.actualMinutes).toBe(30);
		});
	});

	describe("canStartStep", () => {
		it("should allow step with no dependencies", () => {
			const step = { ...sampleStep, dependencies: [] };
			expect(stepOperations.canStartStep(step, [step])).toBe(true);
		});

		it("should allow step with completed dependencies", () => {
			const dep = { ...sampleStep, id: "dep_001", status: "completed" as const };
			const step = { ...sampleStep, id: "step_001", dependencies: ["dep_001"] };
			expect(stepOperations.canStartStep(step, [dep, step])).toBe(true);
		});

		it("should block step with incomplete dependencies", () => {
			const dep = { ...sampleStep, id: "dep_001", status: "pending" as const };
			const step = { ...sampleStep, id: "step_001", dependencies: ["dep_001"] };
			expect(stepOperations.canStartStep(step, [dep, step])).toBe(false);
		});
	});

	describe("getDependentSteps", () => {
		it("should find steps that depend on given step", () => {
			const step1 = { ...sampleStep, id: "step_001" };
			const step2 = { ...sampleStep, id: "step_002", dependencies: ["step_001"] };
			const step3 = { ...sampleStep, id: "step_003", dependencies: ["step_001"] };
			const dependents = stepOperations.getDependentSteps("step_001", [step1, step2, step3]);
			expect(dependents).toHaveLength(2);
			expect(dependents.map((s) => s.id)).toContain("step_002");
			expect(dependents.map((s) => s.id)).toContain("step_003");
		});
	});
});

describe("Workflow Analysis", () => {
	describe("detectCircularDependencies", () => {
		it("should detect circular dependencies", () => {
			const workflow = {
				...sampleWorkflow,
				steps: [
					{ ...sampleStep, id: "step_001", dependencies: ["step_002"] },
					{ ...sampleStep, id: "step_002", dependencies: ["step_001"] },
				],
			};
			const circular = workflowAnalysis.detectCircularDependencies(workflow);
			expect(circular).toHaveLength(1);
			expect(circular[0]).toContain("step_001");
			expect(circular[0]).toContain("step_002");
		});

		it("should not detect circular dependencies in valid workflow", () => {
			const workflow = {
				...sampleWorkflow,
				steps: [
					{ ...sampleStep, id: "step_001" },
					{ ...sampleStep, id: "step_002", dependencies: ["step_001"] },
				],
			};
			const circular = workflowAnalysis.detectCircularDependencies(workflow);
			expect(circular).toHaveLength(0);
		});
	});

	describe("calculateHealthMetrics", () => {
		it("should calculate health score", () => {
			const workflow = {
				...sampleWorkflow,
				steps: [
					{ ...sampleStep, id: "step_001", status: "completed" as const },
					{ ...sampleStep, id: "step_002", status: "pending" as const },
				],
			};
			const health = workflowAnalysis.calculateHealthMetrics(workflow);
			expect(health.healthScore).toBeGreaterThan(0);
			expect(health.healthScore).toBeLessThanOrEqual(100);
			expect(health.riskFactors).toBeDefined();
		});

		it("should penalize blocked steps", () => {
			const healthyWorkflow = {
				...sampleWorkflow,
				steps: [
					{ ...sampleStep, id: "step_001", status: "completed" as const },
					{ ...sampleStep, id: "step_002", status: "pending" as const },
				],
			};
			const blockedWorkflow = {
				...sampleWorkflow,
				steps: [
					{ ...sampleStep, id: "step_001", status: "blocked" as const },
					{ ...sampleStep, id: "step_002", status: "blocked" as const },
				],
			};
			const healthyHealth = workflowAnalysis.calculateHealthMetrics(healthyWorkflow);
			const blockedHealth = workflowAnalysis.calculateHealthMetrics(blockedWorkflow);
			expect(healthyHealth.healthScore).toBeGreaterThan(blockedHealth.healthScore);
		});
	});
});

describe("Fixtures", () => {
	it("should load fixtures correctly", () => {
		expect(fixtures).toBeDefined();
		expect(fixtures.length).toBeGreaterThan(0);
		expect(Array.isArray(fixtures)).toBe(true);
	});

	it("should have fixture statistics", () => {
		expect(fixtureStats.total).toBeGreaterThan(0);
		expect(fixtureStats.byCategory).toBeDefined();
		expect(fixtureStats.processTypes.length).toBeGreaterThan(0);
		expect(fixtureStats.totalSteps).toBeGreaterThan(0);
	});

	describe("Fixture categories", () => {
		it("should have basic fixtures", () => {
			expect(basicFixtures.length).toBeGreaterThan(0);
			expect(getFixturesByCategory("basic")).toEqual(basicFixtures);
		});

		it("should have analysis fixtures", () => {
			expect(analysisFixtures.length).toBeGreaterThan(0);
			expect(getFixturesByCategory("analysis")).toEqual(analysisFixtures);
		});

		it("should have troubleshooting fixtures", () => {
			expect(troubleshootingFixtures.length).toBeGreaterThan(0);
			expect(getFixturesByCategory("troubleshooting")).toEqual(troubleshootingFixtures);
		});

		it("should have decision fixtures", () => {
			expect(decisionFixtures.length).toBeGreaterThan(0);
			expect(getFixturesByCategory("decision")).toEqual(decisionFixtures);
		});

		it("should have error fixtures", () => {
			expect(errorFixtures.length).toBeGreaterThan(0);
			expect(getFixturesByCategory("errors")).toEqual(errorFixtures);
		});

		it("should have iteration fixtures", () => {
			expect(iterationFixtures.length).toBeGreaterThan(0);
			expect(getFixturesByCategory("iteration")).toEqual(iterationFixtures);
		});
	});

	describe("Named fixtures", () => {
		it("should have named fixture exports", () => {
			expect(namedFixtures.basicProblemDecomposition).toBeDefined();
			expect(namedFixtures.stepByStepAnalysis).toBeDefined();
			expect(namedFixtures.rootCauseAnalysis).toBeDefined();
			expect(namedFixtures.decisionTreeWorkflow).toBeDefined();
			expect(namedFixtures.blockedDependencies).toBeDefined();
			expect(namedFixtures.iterativeRefinement).toBeDefined();
		});

		it("should find fixtures by name", () => {
			const fixture = getFixtureByName("basic_problem_decomposition");
			expect(fixture).toBeDefined();
			expect(fixture?.name).toBe("basic_problem_decomposition");
		});
	});

	describe("Fixture helpers", () => {
		it("should filter by process type", () => {
			const fixtures = fixtureHelpers.getByProcessType("problem_decomposition");
			expect(fixtures.length).toBeGreaterThan(0);
			fixtures.forEach((f) => {
				expect(f.data.toolUse.input.workflow.processType).toBe("problem_decomposition");
			});
		});

		it("should filter by workflow status", () => {
			const fixtures = fixtureHelpers.getByWorkflowStatus("active");
			expect(fixtures.length).toBeGreaterThan(0);
			fixtures.forEach((f) => {
				expect(f.data.toolUse.input.workflow.status).toBe("active");
			});
		});

		it("should filter by priority", () => {
			const fixtures = fixtureHelpers.getByPriority("high");
			expect(fixtures.length).toBeGreaterThan(0);
			fixtures.forEach((f) => {
				expect(f.data.toolUse.input.workflow.priority).toBe("high");
			});
		});

		it("should find fixtures with blocked steps", () => {
			const fixtures = fixtureHelpers.getWithBlockedSteps();
			expect(fixtures.length).toBeGreaterThan(0);
			fixtures.forEach((f) => {
				const hasBlocked = f.data.toolUse.input.workflow.steps.some((s) => s.status === "blocked");
				expect(hasBlocked).toBe(true);
			});
		});

		it("should find fixtures with completed steps", () => {
			const fixtures = fixtureHelpers.getWithCompletedSteps();
			expect(fixtures.length).toBeGreaterThan(0);
			fixtures.forEach((f) => {
				const hasCompleted = f.data.toolUse.input.workflow.steps.some(
					(s) => s.status === "completed",
				);
				expect(hasCompleted).toBe(true);
			});
		});

		it("should find fixtures with MCP resources", () => {
			const fixtures = fixtureHelpers.getWithMcpResources("monitoring-dashboard");
			expect(fixtures.length).toBeGreaterThan(0);
			fixtures.forEach((f) => {
				const hasResource = f.data.toolUse.input.workflow.steps.some((s) =>
					s.mcpResources?.includes("monitoring-dashboard"),
				);
				expect(hasResource).toBe(true);
			});
		});

		it("should filter by operation mode", () => {
			const createFixtures = fixtureHelpers.getByMode("create");
			const updateFixtures = fixtureHelpers.getByMode("update");
			const analyzeFixtures = fixtureHelpers.getByMode("analyze");

			expect(createFixtures.length).toBeGreaterThan(0);
			expect(updateFixtures.length).toBeGreaterThan(0);
			expect(analyzeFixtures.length).toBeGreaterThan(0);
		});

		it("should filter by step count", () => {
			const threeStepFixtures = fixtureHelpers.getByStepCount(3);
			expect(threeStepFixtures.length).toBeGreaterThan(0);
			threeStepFixtures.forEach((f) => {
				expect(f.data.toolUse.input.workflow.steps.length).toBe(3);
			});
		});

		it("should find fixtures with dependencies", () => {
			const fixtures = fixtureHelpers.getWithDependencies();
			expect(fixtures.length).toBeGreaterThan(0);
			fixtures.forEach((f) => {
				const hasDeps = f.data.toolUse.input.workflow.steps.some(
					(s) => s.dependencies && s.dependencies.length > 0,
				);
				expect(hasDeps).toBe(true);
			});
		});

		it("should filter by tag", () => {
			const fixtures = fixtureHelpers.getByTag("performance");
			expect(fixtures.length).toBeGreaterThan(0);
			fixtures.forEach((f) => {
				const hasTag =
					f.data.toolUse.input.workflow.tags?.includes("performance") ||
					f.data.toolUse.input.workflow.steps.some((s) => s.tags?.includes("performance"));
				expect(hasTag).toBe(true);
			});
		});
	});

	describe("Fixture validation", () => {
		it("should validate fixture structure", () => {
			const validation = fixtureValidation.validateStructure();
			expect(validation.valid).toBe(true);
			if (!validation.valid) {
				console.log("Structure validation errors:", validation.errors);
			}
		});

		it("should validate unique IDs", () => {
			const validation = fixtureValidation.validateUniqueIds();
			expect(validation.valid).toBe(true);
			if (!validation.valid) {
				console.log("Duplicate IDs:", validation.duplicates);
			}
		});

		it("should validate dependencies", () => {
			const validation = fixtureValidation.validateDependencies();
			expect(validation.valid).toBe(true);
			if (!validation.valid) {
				console.log("Dependency validation errors:", validation.errors);
			}
		});

		it("should run all validations", () => {
			const validation = fixtureValidation.validateAll();
			expect(validation.valid).toBe(true);
			expect(
				(validation.report.summary as { totalFixtures: number }).totalFixtures,
			).toBeGreaterThan(0);
		});
	});
});

describe("Constants", () => {
	it("should have thinking process types", () => {
		expect(Object.keys(THINKING_PROCESS_TYPES)).toContain("problem_decomposition");
		expect(Object.keys(THINKING_PROCESS_TYPES)).toContain("step_by_step_analysis");
		expect(Object.keys(THINKING_PROCESS_TYPES)).toContain("root_cause_analysis");
		expect(Object.keys(THINKING_PROCESS_TYPES)).toContain("decision_tree");
		expect(Object.keys(THINKING_PROCESS_TYPES)).toContain("systematic_approach");
		expect(Object.keys(THINKING_PROCESS_TYPES)).toContain("iterative_refinement");
	});

	it("should have step priorities", () => {
		expect(Object.keys(STEP_PRIORITIES)).toContain("critical");
		expect(Object.keys(STEP_PRIORITIES)).toContain("high");
		expect(Object.keys(STEP_PRIORITIES)).toContain("medium");
		expect(Object.keys(STEP_PRIORITIES)).toContain("low");
		expect(STEP_PRIORITIES.critical.urgencyLevel).toBe(4);
		expect(STEP_PRIORITIES.low.urgencyLevel).toBe(1);
	});

	it("should have step statuses", () => {
		expect(Object.keys(STEP_STATUSES)).toContain("pending");
		expect(Object.keys(STEP_STATUSES)).toContain("in_progress");
		expect(Object.keys(STEP_STATUSES)).toContain("completed");
		expect(Object.keys(STEP_STATUSES)).toContain("blocked");
		expect(Object.keys(STEP_STATUSES)).toContain("skipped");
		expect(STEP_STATUSES.completed.isCompleted).toBe(true);
		expect(STEP_STATUSES.in_progress.isActive).toBe(true);
	});

	it("should have workflow statuses", () => {
		expect(Object.keys(WORKFLOW_STATUSES)).toContain("draft");
		expect(Object.keys(WORKFLOW_STATUSES)).toContain("active");
		expect(Object.keys(WORKFLOW_STATUSES)).toContain("paused");
		expect(Object.keys(WORKFLOW_STATUSES)).toContain("completed");
		expect(Object.keys(WORKFLOW_STATUSES)).toContain("cancelled");
	});

	it("should have operation modes", () => {
		expect(Object.keys(OPERATION_MODES)).toContain("create");
		expect(Object.keys(OPERATION_MODES)).toContain("update");
		expect(Object.keys(OPERATION_MODES)).toContain("analyze");
		expect(Object.keys(OPERATION_MODES)).toContain("execute_next");
	});

	it("should have validation rules", () => {
		expect(VALIDATION_RULES.workflow.minNameLength).toBeGreaterThan(0);
		expect(VALIDATION_RULES.step.maxTitleLength).toBeGreaterThan(0);
		expect(VALIDATION_RULES.ids.pattern).toBeDefined();
	});

	it("should have error messages", () => {
		expect(ERROR_MESSAGES.validation.invalidWorkflow).toBeDefined();
		expect(ERROR_MESSAGES.processing.workflowNotFound).toBeDefined();
		expect(ERROR_MESSAGES.system.unknownError).toBeDefined();
	});

	it("should have success messages", () => {
		expect(SUCCESS_MESSAGES.workflowCreated).toBeDefined();
		expect(SUCCESS_MESSAGES.workflowUpdated).toBeDefined();
		expect(SUCCESS_MESSAGES.validationPassed).toBeDefined();
	});

	it("should have defaults", () => {
		expect(DEFAULTS.stepPriority).toBe("medium");
		expect(DEFAULTS.stepStatus).toBe("pending");
		expect(DEFAULTS.workflowStatus).toBe("draft");
		expect(DEFAULTS.estimatedMinutes).toBeGreaterThan(0);
	});
});

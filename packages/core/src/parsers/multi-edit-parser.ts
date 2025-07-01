import type {
	EditDetail,
	EditOperation,
	LogEntry,
	MessageContent,
	MultiEditToolProps,
	ParseConfig,
	ParsedToolOutput,
	RawLogEntry,
	RawToolResult,
} from "@claude-codex/types";
import { mapFromError } from "@claude-codex/types";
import { BaseToolParser } from "./base-parser";

/**
 * MultiEdit tool parser - outputs structured props for batch file edits
 * Complex tool with structured format from hybrid schema architecture
 */
export class MultiEditToolParser extends BaseToolParser<MultiEditToolProps> {
	readonly toolName = "MultiEdit";
	readonly toolType = "file";
	readonly version = "1.0.0";

	parse(
		toolCall: LogEntry,
		toolResult?: LogEntry,
		config?: ParseConfig,
	): MultiEditToolProps {
		// Extract base props for correlation
		const baseProps = this.extractBaseProps(toolCall, toolResult, config);

		// Extract tool input using optional chaining
		const toolUse = this.extractToolUse(toolCall);
		const filePath = toolUse.input?.file_path as string;
		const edits = toolUse.input?.edits as EditOperation[];

		// Initialize result data
		let message: string | undefined;
		let editsApplied = 0;
		const totalEdits = edits?.length || 0;
		let allSuccessful = false;
		let editDetails: EditDetail[] = [];
		let errorMessage: string | undefined;
		let interrupted = false;
		let status = mapFromError(false, !toolResult);

		if (toolResult) {
			const result = this.extractToolResult(toolResult, toolUse.id!);

			if (!result.is_error) {
				// Parse successful output
				const output = this.parseOutput(result, toolResult);
				message = output.message;
				editsApplied = output.editsApplied;
				allSuccessful = output.allSuccessful;
				editDetails = output.editDetails;
				interrupted = output.interrupted || false;
			} else {
				// Extract error message from toolUseResult
				const rawResult = this.extractRawToolResult(toolResult);
				errorMessage = this.extractErrorMessage(rawResult);
			}

			// Map status including interrupted state
			status = mapFromError(result.is_error, false, interrupted);
		}

		// Calculate UI stats
		const successfulEdits = editDetails.filter((d) => d.success).length;
		const failedEdits = editDetails.filter((d) => !d.success).length;

		// Return structured props for UI consumption
		return {
			// Base props
			...baseProps,
			status,

			// Input structure (matches fixtures)
			input: {
				filePath,
				edits: edits || [],
			},

			// Results - structured format per SOT
			results: {
				message: message || "No message",
				editsApplied,
				totalEdits,
				allSuccessful,
				editDetails,
				errorMessage,
			},

			// UI helpers
			ui: {
				totalEdits,
				successfulEdits: successfulEdits || editsApplied,
				failedEdits: failedEdits || totalEdits - editsApplied,
				changeSummary: message,
			},
		};
	}

	private parseOutput(
		result: MessageContent & { type: "tool_result" },
		toolResult?: LogEntry,
	): {
		message?: string;
		editsApplied: number;
		allSuccessful: boolean;
		editDetails: EditDetail[];
		interrupted?: boolean;
	} {
		// First try to get toolUseResult from the log entry
		const rawResult = this.extractRawToolResult(toolResult);

		if (rawResult && typeof rawResult === "object") {
			// Parse fixture-style output - handle nested content structure
			let output = rawResult.output || rawResult;

			// Handle complex fixture format: toolUseResult.content[0].output
			if (Array.isArray(rawResult.content)) {
				const toolResultContent = rawResult.content.find(
					(c) => c.type === "tool_result",
				);
				if (toolResultContent?.output) {
					output = toolResultContent.output;
				}
			}

			if (typeof output === "object" && output !== null) {
				const outputObj = output as Record<string, unknown>;
				if (outputObj.edits_applied !== undefined || outputObj.edit_details) {
					return {
						message:
							typeof outputObj.message === "string"
								? outputObj.message
								: undefined,
						editsApplied:
							typeof outputObj.edits_applied === "number"
								? outputObj.edits_applied
								: typeof outputObj.editsApplied === "number"
									? outputObj.editsApplied
									: 0,
						allSuccessful: Boolean(outputObj.all_successful),
						editDetails: this.parseEditDetails(
							Array.isArray(outputObj.edit_details)
								? outputObj.edit_details
								: [],
						),
						interrupted: false,
					};
				}
			}
		}

		// Handle string output (simple success message) - check content, text, and output fields
		const stringOutput =
			typeof result.output === "string"
				? result.output
				: result.content || result.text || null;

		if (stringOutput) {
			// Try to extract numbers from success message
			const appliedMatch = stringOutput.match(/applied\s+(\d+)\s*edits?/i);
			const editsApplied = appliedMatch
				? Number.parseInt(appliedMatch[1], 10)
				: 0;

			// Build edit details from toolUseResult if available
			let editDetails: EditDetail[] = [];
			if (
				rawResult &&
				typeof rawResult === "object" &&
				"edits" in rawResult &&
				Array.isArray(rawResult.edits)
			) {
				// Parse edit details from fixture format
				editDetails = rawResult.edits.map((edit, index) => ({
					operation: {
						old_string: edit.old_string || "",
						new_string: edit.new_string || "",
						replace_all: edit.replace_all || false,
						index: index + 1,
					},
					success: true,
					replacements_made: 1, // Default to 1 for successful edits
				}));
			}

			return {
				message: stringOutput,
				editsApplied,
				allSuccessful: editsApplied > 0,
				editDetails,
				interrupted: false,
			};
		}

		// Handle structured output
		if (result.output && typeof result.output === "object") {
			const output = result.output as ParsedToolOutput;

			// Check for interrupted flag
			if (output.interrupted === true) {
				return {
					message: "Operation interrupted",
					editsApplied:
						typeof output.editsApplied === "number" ? output.editsApplied : 0,
					allSuccessful: false,
					editDetails: [],
					interrupted: true,
				};
			}

			return {
				message:
					typeof output.message === "string" ? output.message : undefined,
				editsApplied:
					typeof output.editsApplied === "number"
						? output.editsApplied
						: typeof output.applied === "number"
							? output.applied
							: 0,
				allSuccessful: Boolean(output.allSuccessful),
				editDetails: this.parseEditDetails(
					Array.isArray(output.editDetails) ? output.editDetails : [],
				),
				interrupted: false,
			};
		}

		// Default to no edits applied
		return {
			message: "No edits applied",
			editsApplied: 0,
			allSuccessful: false,
			editDetails: [],
			interrupted: false,
		};
	}

	private parseEditDetails(details: Record<string, unknown>[]): EditDetail[] {
		if (!Array.isArray(details)) return [];

		return details.map((detail) => ({
			operation:
				typeof detail.operation === "object" && detail.operation !== null
					? (detail.operation as EditOperation)
					: { old_string: "", new_string: "" },
			success: Boolean(detail.success),
			replacements_made:
				typeof detail.replacements_made === "number"
					? detail.replacements_made
					: typeof detail.replacementsMade === "number"
						? detail.replacementsMade
						: 0,
			error: typeof detail.error === "string" ? detail.error : undefined,
		}));
	}

	private extractRawToolResult(toolResult?: LogEntry): RawToolResult | null {
		if (!toolResult) return null;

		// Look for toolUseResult in the log entry
		const entry = toolResult as unknown as RawLogEntry;

		// First check if there's a toolUseResult field
		if (entry.toolUseResult) {
			return entry.toolUseResult;
		}

		// Then check content array for tool_result
		const content = entry.content;
		if (Array.isArray(content)) {
			const toolResultContent = content.find((c) => c.type === "tool_result");
			if (toolResultContent) {
				return toolResultContent;
			}
		}

		return null;
	}

	// Remove unused method

	private extractErrorMessage(rawResult: RawToolResult | null): string {
		if (typeof rawResult === "string") {
			return rawResult;
		}

		if (rawResult && typeof rawResult === "object") {
			// Check if rawResult itself has the error message (for LogEntry.content format)
			if (typeof rawResult.output === "string") {
				return rawResult.output;
			}

			const output = rawResult.output || rawResult;
			if (typeof output === "object" && output !== null) {
				const outputObj = output as Record<string, unknown>;
				return typeof outputObj.error === "string"
					? outputObj.error
					: typeof outputObj.message === "string"
						? outputObj.message
						: "Failed to apply edits";
			}

			// Check for direct error fields
			if (typeof rawResult.error === "string") {
				return rawResult.error;
			}
			if (typeof rawResult.message === "string") {
				return rawResult.message;
			}
		}

		return "MultiEdit operation failed";
	}

	public getSupportedFeatures(): string[] {
		// Declare parser capabilities
		return [
			"basic-parsing",
			"status-mapping",
			"correlation",
			"structured-output",
			"batch-operations",
			"edit-tracking",
			"line-estimation",
			"interrupted-support",
		];
	}
}

import type {
	GlobToolProps,
	LogEntry,
	MessageContent,
	ParseConfig,
} from "@claude-codex/types";
import { mapFromError } from "@claude-codex/types";
import { BaseToolParser } from "./base-parser";

/**
 * Glob tool parser - outputs structured props for file pattern matching
 * Simpler than Grep but still uses structured data
 */
export class GlobToolParser extends BaseToolParser<GlobToolProps> {
	readonly toolName = "Glob";
	readonly toolType = "search";
	readonly version = "1.0.0";

	parse(
		toolCall: LogEntry,
		toolResult?: LogEntry,
		config?: ParseConfig,
	): GlobToolProps {
		// 1. Extract base props
		const baseProps = this.extractBaseProps(toolCall, toolResult, config);

		// 2. Extract tool_use data
		const toolUse = this.extractToolUse(toolCall);
		const input = {
			pattern: toolUse.input?.pattern as string,
			searchPath: toolUse.input?.path as string | undefined,
		};

		// 3. Parse results
		let results: string[] | undefined;
		let status = mapFromError(false, !toolResult);

		if (toolResult) {
			const result = this.extractToolResult(toolResult, toolUse.id!);

			if (!result.is_error) {
				results = this.parseMatches(result);
			}

			status = mapFromError(result.is_error);
		}

		// 4. Calculate UI data
		const ui = {
			totalMatches: results?.length || 0,
			filesWithMatches: results?.length || 0,
			searchTime: baseProps.duration,
		};

		// 5. Return structured props
		return {
			...baseProps,
			status,
			input,
			results,
			ui,
		};
	}

	private parseMatches(
		result: MessageContent & { type: "tool_result" },
	): string[] {
		if (typeof result.output === "string") {
			return result.output
				.split("\n")
				.filter((line: string) => line.trim())
				.map((line: string) => line.trim());
		}

		if (Array.isArray(result.output)) {
			return result.output;
		}

		return [];
	}

	public getSupportedFeatures(): string[] {
		return [
			"basic-parsing",
			"status-mapping",
			"correlation",
			"pattern-matching",
			"path-filtering",
		];
	}
}

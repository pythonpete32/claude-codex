import type {
	BashToolProps,
	LogEntry,
	MessageContent,
	ParseConfig,
} from "@claude-codex/types";
import { mapFromError } from "@claude-codex/types";
import { BaseToolParser } from "./base-parser";

/**
 * Bash tool parser - outputs flat props for simple command execution
 * Demonstrates simple tool parsing pattern from hybrid schema architecture
 */
export class BashToolParser extends BaseToolParser<BashToolProps> {
	readonly toolName = "Bash";
	readonly toolType = "command";
	readonly version = "1.0.0";

	parse(
		toolCall: LogEntry,
		toolResult?: LogEntry,
		config?: ParseConfig,
	): BashToolProps {
		// 1. Extract base props (correlation data, timestamps)
		const baseProps = this.extractBaseProps(toolCall, toolResult, config);

		// 2. Extract tool_use data
		const toolUse = this.extractToolUse(toolCall);
		const command = toolUse.input?.command as string;
		const description = toolUse.input?.description as string | undefined;
		// const timeout = toolUse.input?.timeout as number | undefined; // TODO: Add timeout support

		// 3. Parse result if available
		let output: string | undefined;
		let errorOutput: string | undefined;
		let exitCode: number | undefined;
		let workingDirectory: string | undefined;
		let interrupted: boolean | undefined;
		let status = mapFromError(false, !toolResult);

		if (toolResult) {
			const result = this.extractToolResult(toolResult, toolUse.id!);
			const parsed = this.parseOutput(result);

			output = parsed.stdout + (parsed.stderr ? `\n${parsed.stderr}` : "");
			errorOutput = parsed.stderr;
			exitCode = parsed.exitCode;
			interrupted = parsed.interrupted;
			workingDirectory = toolUse.input?.workingDirectory as string | undefined;

			// Map status using status mapping function
			status = mapFromError(
				result.is_error || exitCode !== 0,
				false,
				interrupted || false,
			);
		}

		// 4. Return flat props (no nested structures)
		return {
			// Base props
			...baseProps,
			status,

			// Command-specific props (flat)
			command,
			output,
			errorOutput,
			exitCode,
			workingDirectory,
			interrupted,

			// UI helpers
			showCopyButton: true,
			showPrompt: true,
			promptText: description,
		};
	}

	private parseOutput(result: MessageContent & { type: "tool_result" }): {
		stdout: string;
		stderr: string;
		exitCode: number;
		interrupted: boolean;
	} {
		// Handle string output (common in fixtures)
		if (typeof result.output === "string") {
			// If it's an error, put it in stderr; otherwise stdout
			return {
				stdout: result.is_error ? "" : result.output,
				stderr: result.is_error ? result.output : "",
				exitCode: result.is_error ? 1 : 0,
				interrupted: false,
			};
		}

		// Handle structured output
		if (result.output && typeof result.output === "object") {
			const output = result.output as {
				stdout?: string;
				stderr?: string;
				exit_code?: number;
				interrupted?: boolean;
			};

			return {
				stdout: output.stdout || "",
				stderr: output.stderr || "",
				exitCode: output.exit_code ?? (result.is_error ? 1 : 0),
				interrupted: output.interrupted || false,
			};
		}

		// Legacy: Check result.output (shouldn't happen but keep for compatibility)
		if (typeof result.output === "string") {
			return {
				stdout: "",
				stderr: result.output,
				exitCode: 1,
				interrupted: false,
			};
		}

		if (result.output && typeof result.output === "object") {
			const output = result.output as {
				stdout?: string;
				stderr?: string;
				exit_code?: number;
				interrupted?: boolean;
			};

			return {
				stdout: output.stdout || "",
				stderr: output.stderr || "",
				exitCode: output.exit_code ?? (result.is_error ? 1 : 0),
				interrupted: output.interrupted || false,
			};
		}

		// Unknown format
		return {
			stdout: "",
			stderr: "Unknown output format",
			exitCode: 1,
			interrupted: false,
		};
	}

	public getSupportedFeatures(): string[] {
		return [
			"basic-parsing",
			"status-mapping",
			"correlation",
			"timeout-support",
			"working-directory",
		];
	}
}

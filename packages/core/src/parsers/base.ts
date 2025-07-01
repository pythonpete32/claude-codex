import type { ChatItem, LogEntry, MessageContent } from "@claude-codex/types";

export abstract class BaseToolParser<T extends ChatItem> {
	abstract toolName: string;

	canParse(entry: LogEntry): boolean {
		return this.isToolUse(entry, this.toolName);
	}

	protected isToolUse(entry: LogEntry, toolName?: string): boolean {
		if (entry.type !== "assistant") return false;

		const content = this.normalizeContent(entry.content);
		if (!content) return false;

		const hasToolUse = content.some(
			(block) =>
				block.type === "tool_use" && (!toolName || block.name === toolName),
		);

		return hasToolUse;
	}

	protected isToolResult(entry: LogEntry): boolean {
		if (entry.type !== "assistant") return false;

		const content = this.normalizeContent(entry.content);
		return content.some((block) => block.type === "tool_result");
	}

	protected normalizeContent(
		content: string | MessageContent | MessageContent[],
	): MessageContent[] {
		if (typeof content === "string") {
			return [{ type: "text", text: content }];
		}
		if (Array.isArray(content)) {
			return content;
		}
		if (content && typeof content === "object") {
			return [content];
		}
		return [];
	}

	protected extractToolUse(
		entry: LogEntry,
	): MessageContent & { type: "tool_use" } {
		const content = this.normalizeContent(entry.content);
		const toolUse = content.find(
			(block) => block.type === "tool_use" && block.name === this.toolName,
		);

		if (!toolUse || toolUse.type !== "tool_use") {
			throw new Error(`No tool_use block found for ${this.toolName}`);
		}

		return toolUse as MessageContent & { type: "tool_use" };
	}

	protected extractToolResult(
		entry: LogEntry,
	): (MessageContent & { type: "tool_result" }) | null {
		const content = this.normalizeContent(entry.content);
		const toolResult = content.find((block) => block.type === "tool_result");

		if (!toolResult || toolResult.type !== "tool_result") {
			return null;
		}

		return toolResult as MessageContent & { type: "tool_result" };
	}

	protected extractSessionId(entry: LogEntry): string {
		// Extract from entry context - will be injected by log processor
		// TODO: Add sessionId to LogEntry type when log processor is implemented
		return (entry as LogEntry & { sessionId?: string }).sessionId || "unknown";
	}

	protected determineStatus(
		result?: (MessageContent & { type: "tool_result" }) | null,
	): "pending" | "completed" | "failed" {
		if (!result) return "pending";
		return result.is_error ? "failed" : "completed";
	}

	abstract parse(entry: LogEntry, result?: LogEntry): T;
}

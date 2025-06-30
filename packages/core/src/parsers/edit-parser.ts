import type {
  DiffLine,
  EditToolProps,
  LogEntry,
  ParseConfig,
} from "@claude-codex/types";
import { mapFromError } from "@claude-codex/types";
import { BaseToolParser } from "./base-parser";
import * as Diff from "diff";

/**
 * Edit tool parser - outputs flat props for file editing
 * Uses FileToolProps base with edit-specific extensions
 */
export class EditToolParser extends BaseToolParser<EditToolProps> {
  readonly toolName = "Edit";
  readonly toolType = "file";
  readonly version = "1.0.0";

  parse(
    toolCall: LogEntry,
    toolResult?: LogEntry,
    config?: ParseConfig
  ): EditToolProps {
    // 1. Extract base props
    const baseProps = this.extractBaseProps(toolCall, toolResult, config);

    // 2. Extract tool_use data
    const toolUse = this.extractToolUse(toolCall);
    const filePath = toolUse.input?.file_path as string;
    const oldContent = toolUse.input?.old_string as string;
    const newContent = toolUse.input?.new_string as string;
    // const replaceAll = (toolUse.input?.replace_all as boolean) || false; // TODO: Implement replace_all support

    // 3. Determine status
    let status = mapFromError(false, !toolResult);

    if (toolResult) {
      const result = this.extractToolResult(toolResult, toolUse.id!);
      status = mapFromError(result.is_error);
    }

    // 4. Generate diff (simplified for now)
    const diff = this.generateDiff(oldContent, newContent);

    // 5. Return flat props
    return {
      // Base props
      ...baseProps,
      status,

      // File props
      filePath,
      content: newContent, // The new content
      fileType: this.inferFileType(filePath),

      // Edit-specific props
      oldContent,
      newContent,
      diff,

      // UI helpers
      showLineNumbers: true,
      wordWrap: false,
      onFileClick: undefined, // Will be injected by UI
    };
  }

  private generateDiff(oldContent: string, newContent: string): DiffLine[] {
    // Use proper diff library for accurate line-by-line comparison
    const changes = Diff.diffLines(oldContent || "", newContent || "");
    const diffLines: DiffLine[] = [];
    
    let oldLineNumber = 1;
    let newLineNumber = 1;

    for (const change of changes) {
      const lines = change.value.split("\n");
      // Remove the last empty line that split() creates
      if (lines[lines.length - 1] === "") {
        lines.pop();
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (change.added) {
          diffLines.push({
            type: "added",
            content: line,
            newLineNumber: newLineNumber++,
          });
        } else if (change.removed) {
          diffLines.push({
            type: "removed",
            content: line,
            oldLineNumber: oldLineNumber++,
          });
        } else {
          // Unchanged line
          diffLines.push({
            type: "unchanged",
            content: line,
            oldLineNumber: oldLineNumber++,
            newLineNumber: newLineNumber++,
          });
        }
      }
    }

    return diffLines;
  }

  private inferFileType(filePath: string): string {
    if (!filePath) return "plaintext";
    const ext = filePath.split(".").pop()?.toLowerCase();

    const typeMap: Record<string, string> = {
      ts: "typescript",
      tsx: "typescriptreact",
      js: "javascript",
      jsx: "javascriptreact",
      py: "python",
      rs: "rust",
      go: "go",
      java: "java",
      cpp: "cpp",
      c: "c",
      cs: "csharp",
      rb: "ruby",
      php: "php",
      swift: "swift",
      kt: "kotlin",
      scala: "scala",
      r: "r",
      sql: "sql",
      sh: "bash",
      yaml: "yaml",
      yml: "yaml",
      json: "json",
      xml: "xml",
      html: "html",
      css: "css",
      scss: "scss",
      less: "less",
      md: "markdown",
      mdx: "mdx",
    };

    return typeMap[ext || ""] || "plaintext";
  }

  protected getSupportedFeatures(): string[] {
    return [
      "basic-parsing",
      "status-mapping",
      "correlation",
      "diff-generation",
      "file-type-inference",
      "replace-all",
    ];
  }
}

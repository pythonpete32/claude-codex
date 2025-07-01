export interface SimpleDiffLine {
	type: "added" | "removed" | "unchanged";
	content: string;
	lineNumber?: number;
}

export interface SimpleDiffResult {
	lines: SimpleDiffLine[];
	linesAdded: number;
	linesRemoved: number;
}

// Simple line-by-line diff for terminal display
export function createSimpleDiff(oldText: string, newText: string): SimpleDiffResult {
	const oldLines = oldText.split("\n");
	const newLines = newText.split("\n");

	const result: SimpleDiffLine[] = [];
	let linesAdded = 0;
	let linesRemoved = 0;

	// Simple approach: show all removed lines first, then all added lines
	oldLines.forEach((line, index) => {
		result.push({
			type: "removed",
			content: line,
			lineNumber: index + 1,
		});
		linesRemoved++;
	});

	newLines.forEach((line, index) => {
		result.push({
			type: "added",
			content: line,
			lineNumber: index + 1,
		});
		linesAdded++;
	});

	return {
		lines: result,
		linesAdded,
		linesRemoved,
	};
}

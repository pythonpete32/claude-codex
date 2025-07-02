import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

export class ProjectPathResolver {
	private corrections: Map<string, string> = new Map();
	private correctionsFile: string;

	constructor(
		correctionsFile: string = path.join(
			os.homedir(),
			".claude/path-corrections.json",
		),
	) {
		this.correctionsFile = correctionsFile;
	}

	async initialize(): Promise<void> {
		try {
			const data = await fs.readFile(this.correctionsFile, "utf-8");
			const corrections = JSON.parse(data) as Record<string, string>;
			this.corrections = new Map(Object.entries(corrections));
		} catch {
			// File doesn't exist or is invalid, start with empty corrections
			this.corrections = new Map();
		}
	}

	resolve(encoded: string): string {
		// Check user corrections first - O(1)
		if (this.corrections.has(encoded)) {
			return this.corrections.get(encoded)!;
		}

		// Simple decode - no file I/O
		return this.simpleDecode(encoded);
	}

	async setCorrection(encoded: string, correct: string): Promise<void> {
		this.corrections.set(encoded, correct);
		await this.saveCorrections();
	}

	async removeCorrection(encoded: string): Promise<void> {
		this.corrections.delete(encoded);
		await this.saveCorrections();
	}

	getCorrections(): ReadonlyMap<string, string> {
		return new Map(this.corrections);
	}

	hasCorrection(encoded: string): boolean {
		return this.corrections.has(encoded);
	}

	private simpleDecode(encoded: string): string {
		// Basic algorithm - O(1) string operations
		// Use placeholder that won't appear in paths
		const placeholder = "___DOUBLE_DASH___";
		return `/${encoded
			.slice(1) // Remove leading dash
			.replace(/--/g, placeholder) // Temporarily replace double dash
			.replace(/-/g, "/") // Single dash to slash
			.replace(new RegExp(placeholder, "g"), "-")}`; // Double dash back to single dash
	}

	private async saveCorrections(): Promise<void> {
		try {
			// Ensure directory exists
			const dir = path.dirname(this.correctionsFile);
			await fs.mkdir(dir, { recursive: true });

			// Convert Map to object and save
			const corrections = Object.fromEntries(this.corrections);
			await fs.writeFile(
				this.correctionsFile,
				JSON.stringify(corrections, null, 2),
				"utf-8",
			);
		} catch (error) {
			console.error("Failed to save path corrections:", error);
		}
	}

	// Static helper for encoding (useful for testing)
	static encode(decodedPath: string): string {
		return `-${decodedPath
			.slice(1) // Remove leading slash
			.replace(/-/g, "--") // Dash to double dash
			.replace(/\//g, "-")}`; // Slash to dash
	}
}

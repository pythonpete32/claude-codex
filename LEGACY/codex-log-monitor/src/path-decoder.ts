import { basename, dirname } from "node:path";

/**
 * Decodes a Claude project directory name to its original file system path.
 *
 * Claude encodes file paths in directory names using a specific convention:
 * - Single dashes (`-`) represent forward slashes (`/`)
 * - Double dashes (`--`) represent `/.` (dot directories like `.config`)
 *
 * @param dirName - The encoded directory name from Claude's projects folder
 * @returns The decoded file system path
 *
 * @example
 * ```typescript
 * decodeProjectPath('-Users-john-project-a')     // Returns: "/Users/john/project/a"
 * decodeProjectPath('-Users-john--config')       // Returns: "/Users/john/.config"
 * decodeProjectPath('-home-user--ssh-keys')      // Returns: "/home/user/.ssh/keys"
 * ```
 *
 * @public
 */
export function decodeProjectPath(dirName: string): string {
	return dirName.replace(/--/g, "/.").replace(/-/g, "/");
}

/**
 * Extracts the session ID from a JSONL file path.
 *
 * The session ID is the filename without the `.jsonl` extension.
 * Session IDs are typically UUIDs in the format: `abc123-def456-ghi789`
 *
 * @param filePath - Absolute or relative path to a JSONL file
 * @returns The session ID (UUID format)
 *
 * @example
 * ```typescript
 * extractSessionId('/path/to/abc123-def456-ghi789.jsonl')  // Returns: "abc123-def456-ghi789"
 * extractSessionId('session.jsonl')                        // Returns: "session"
 * ```
 *
 * @public
 */
export function extractSessionId(filePath: string): string {
	const filename = basename(filePath);
	return filename.replace(".jsonl", "");
}

/**
 * Extracts and decodes the project path from a JSONL file path.
 *
 * This function:
 * 1. Gets the parent directory name from the file path
 * 2. Decodes it using the Claude path encoding convention
 *
 * @param filePath - Absolute path to a JSONL file within a project directory
 * @returns The decoded project path
 *
 * @example
 * ```typescript
 * extractProject('/.claude/projects/-Users-john-project-a/session.jsonl')
 * // Returns: "/Users/john/project/a"
 *
 * extractProject('/.claude/projects/-home-user--config/abc123.jsonl')
 * // Returns: "/home/user/.config"
 * ```
 *
 * @public
 */
export function extractProject(filePath: string): string {
	const dir = basename(dirname(filePath));
	return decodeProjectPath(dir);
}

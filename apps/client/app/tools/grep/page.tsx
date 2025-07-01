"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { GrepTool } from "@/components/tools/grep"

export default function GrepToolPage() {
	const timestamp = new Date().toISOString()

	return (
		<div className="min-h-screen bg-gray-950 p-8">
			<div className="max-w-6xl mx-auto">
				<Link
					href="/tools"
					className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Tools
				</Link>

				<h1 className="text-3xl font-bold text-white mb-8">Grep Tool Examples</h1>

				<div className="space-y-8">
					{/* Example 1: TODO search */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">1. Search for TODOs</h2>
						<GrepTool
							id="grep-1"
							uuid="uuid-grep-1"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							input={{
								pattern: "TODO",
								searchPath: "./src",
								caseSensitive: false,
							}}
							results={[
								{
									filePath: "src/components/Header.tsx",
									totalMatches: 3,
									matches: [
										{ line: 15, content: "  // TODO: Add user authentication", matchStart: 5, matchEnd: 9 },
										{ line: 28, content: "    // TODO: Implement search functionality", matchStart: 7, matchEnd: 11 },
										{ line: 45, content: "  // TODO: Add dark mode toggle", matchStart: 5, matchEnd: 9 },
									],
								},
								{
									filePath: "src/utils/api.ts",
									totalMatches: 2,
									matches: [
										{ line: 42, content: "// TODO: Add error handling", matchStart: 3, matchEnd: 7 },
										{ line: 78, content: "  // TODO: Implement caching", matchStart: 5, matchEnd: 9 },
									],
								},
								{
									filePath: "src/pages/Dashboard.tsx",
									totalMatches: 1,
									matches: [
										{ line: 102, content: "      // TODO: Load real data from API", matchStart: 9, matchEnd: 13 },
									],
								},
							]}
							ui={{
								totalMatches: 6,
								filesWithMatches: 3,
								searchTime: 125,
							}}
							duration={125}
							description="Finding all TODO comments in source files"
						/>
					</section>

					{/* Example 2: Function search with regex */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">2. Search Functions with Regex</h2>
						<GrepTool
							id="grep-2"
							uuid="uuid-grep-2"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							input={{
								pattern: "export\\s+(const|function)\\s+\\w+",
								searchPath: "./src/utils",
								useRegex: true,
								filePatterns: ["*.ts", "*.tsx"],
							}}
							results={[
								{
									filePath: "src/utils/helpers.ts",
									totalMatches: 4,
									matches: [
										{ line: 5, content: "export const formatDate = (date: Date) => {", matchStart: 0, matchEnd: 23 },
										{ line: 12, content: "export function parseJSON(str: string) {", matchStart: 0, matchEnd: 25 },
										{
											line: 20,
											content: "export const debounce = (fn: Function, delay: number) => {",
											matchStart: 0,
											matchEnd: 21,
										},
										{
											line: 35,
											content: "export const throttle = (fn: Function, limit: number) => {",
											matchStart: 0,
											matchEnd: 21,
										},
									],
								},
								{
									filePath: "src/utils/validation.ts",
									totalMatches: 2,
									matches: [
										{
											line: 3,
											content: "export function isEmail(email: string): boolean {",
											matchStart: 0,
											matchEnd: 23,
										},
										{
											line: 15,
											content: "export const validatePassword = (password: string) => {",
											matchStart: 0,
											matchEnd: 29,
										},
									],
								},
							]}
							ui={{
								totalMatches: 6,
								filesWithMatches: 2,
								searchTime: 87,
							}}
							duration={87}
						/>
					</section>

					{/* Example 3: No matches found */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">3. No Matches Found</h2>
						<GrepTool
							id="grep-3"
							uuid="uuid-grep-3"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							input={{
								pattern: "DEPRECATED",
								searchPath: "./src",
								caseSensitive: true,
							}}
							results={[]}
							ui={{
								totalMatches: 0,
								filesWithMatches: 0,
								searchTime: 45,
							}}
							duration={45}
						/>
					</section>

					{/* Example 4: Running search */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">4. Search in Progress</h2>
						<GrepTool
							id="grep-4"
							uuid="uuid-grep-4"
							timestamp={timestamp}
							status={{ normalized: "running" }}
							input={{
								pattern: "console\\.log",
								searchPath: "./",
								useRegex: true,
							}}
							ui={{
								totalMatches: 0,
								filesWithMatches: 0,
								searchTime: 0,
							}}
							description="Searching for console.log statements..."
						/>
					</section>

					{/* Example 5: Case sensitive search */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">5. Case Sensitive Search</h2>
						<GrepTool
							id="grep-5"
							uuid="uuid-grep-5"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							input={{
								pattern: "API",
								searchPath: "./src",
								caseSensitive: true,
								filePatterns: ["*.ts", "*.tsx", "*.js"],
							}}
							results={[
								{
									filePath: "src/constants/config.ts",
									totalMatches: 2,
									matches: [
										{
											line: 8,
											content: "export const API_URL = process.env.NEXT_PUBLIC_API_URL;",
											matchStart: 13,
											matchEnd: 16,
										},
										{ line: 12, content: "export const API_KEY = process.env.API_KEY;", matchStart: 13, matchEnd: 16 },
									],
								},
								{
									filePath: "src/services/api.ts",
									totalMatches: 1,
									matches: [{ line: 1, content: "// API Service Layer", matchStart: 3, matchEnd: 6 }],
								},
							]}
							ui={{
								totalMatches: 3,
								filesWithMatches: 2,
								searchTime: 56,
							}}
							duration={56}
						/>
					</section>
				</div>
			</div>
		</div>
	)
}

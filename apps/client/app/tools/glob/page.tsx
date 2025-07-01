"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { GlobTool } from "@/components/tools/glob"

export default function GlobToolPage() {
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

				<h1 className="text-3xl font-bold text-white mb-8">Glob Tool Examples</h1>

				<div className="space-y-8">
					{/* Example 1: Find test files */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">1. Find Test Files</h2>
						<GlobTool
							id="glob-1"
							uuid="uuid-glob-1"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							input={{
								pattern: "**/*.test.{ts,tsx}",
								searchPath: "./src",
							}}
							results={[
								"src/components/Button.test.tsx",
								"src/components/Modal.test.tsx",
								"src/components/Header.test.tsx",
								"src/utils/helpers.test.ts",
								"src/utils/validation.test.ts",
								"src/services/api.test.ts",
								"src/hooks/useAuth.test.ts",
								"src/hooks/useTheme.test.ts",
							]}
							ui={{
								totalMatches: 8,
								filesWithMatches: 8,
								searchTime: 45,
							}}
							duration={45}
							description="Finding all test files in the project"
						/>
					</section>

					{/* Example 2: Find TypeScript files */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">2. Find TypeScript Files</h2>
						<GlobTool
							id="glob-2"
							uuid="uuid-glob-2"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							input={{
								pattern: "**/*.ts",
								searchPath: "./src/utils",
							}}
							results={[
								"src/utils/helpers.ts",
								"src/utils/validation.ts",
								"src/utils/constants.ts",
								"src/utils/logger.ts",
								"src/utils/formatters.ts",
								"src/utils/parsers.ts",
								"src/utils/types.ts",
								"src/utils/index.ts",
							]}
							ui={{
								totalMatches: 8,
								filesWithMatches: 8,
								searchTime: 23,
							}}
							duration={23}
						/>
					</section>

					{/* Example 3: Find config files */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">3. Find Configuration Files</h2>
						<GlobTool
							id="glob-3"
							uuid="uuid-glob-3"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							input={{
								pattern: "**/*.{json,yaml,yml,env*}",
								searchPath: "./",
							}}
							results={[
								"package.json",
								"tsconfig.json",
								"turbo.json",
								".eslintrc.json",
								"docker-compose.yml",
								"config/app.yaml",
								"config/database.yaml",
								".env",
								".env.example",
								".env.local",
								"apps/client/package.json",
								"apps/api/package.json",
							]}
							ui={{
								totalMatches: 12,
								filesWithMatches: 12,
								searchTime: 67,
							}}
							duration={67}
						/>
					</section>

					{/* Example 4: No matches */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">4. No Matches Found</h2>
						<GlobTool
							id="glob-4"
							uuid="uuid-glob-4"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							input={{
								pattern: "**/*.php",
								searchPath: "./src",
							}}
							results={[]}
							ui={{
								totalMatches: 0,
								filesWithMatches: 0,
								searchTime: 12,
							}}
							duration={12}
						/>
					</section>

					{/* Example 5: Running state */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">5. Search in Progress</h2>
						<GlobTool
							id="glob-5"
							uuid="uuid-glob-5"
							timestamp={timestamp}
							status={{ normalized: "running" }}
							input={{
								pattern: "**/*",
								searchPath: "./",
							}}
							ui={{
								totalMatches: 0,
								filesWithMatches: 0,
								searchTime: 0,
							}}
							description="Searching for all files..."
						/>
					</section>

					{/* Example 6: Large result set */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">6. Large Result Set (Auto-collapsed)</h2>
						<GlobTool
							id="glob-6"
							uuid="uuid-glob-6"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							input={{
								pattern: "**/*.{js,jsx,ts,tsx}",
								searchPath: "./src",
							}}
							results={Array.from(
								{ length: 75 },
								(_, i) =>
									`src/${["components", "utils", "hooks", "services", "pages"][i % 5]}/${
										["Button", "Modal", "Header", "Footer", "Card"][Math.floor(i / 5) % 5]
									}${i % 3 === 0 ? ".test" : ""}.${["ts", "tsx", "js", "jsx"][i % 4]}`,
							)}
							ui={{
								totalMatches: 75,
								filesWithMatches: 75,
								searchTime: 234,
							}}
							duration={234}
						/>
					</section>
				</div>
			</div>
		</div>
	)
}

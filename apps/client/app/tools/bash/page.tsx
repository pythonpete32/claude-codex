"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { BashTool } from "@/components/tools/bash"

export default function BashToolPage() {
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

				<h1 className="text-3xl font-bold text-white mb-8">Bash Tool Examples</h1>

				<div className="space-y-8">
					{/* Example 1: Simple command */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">1. Simple Command (Completed)</h2>
						<BashTool
							id="bash-1"
							uuid="uuid-bash-1"
							timestamp={timestamp}
							status={{ normalized: "completed", original: "success" }}
							command="echo 'Hello, Claude Codex!'"
							output="Hello, Claude Codex!"
							duration={45}
							exitCode={0}
							description="Basic echo command demonstration"
						/>
					</section>

					{/* Example 2: Running command */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">2. Running Command (Animated)</h2>
						<BashTool
							id="bash-2"
							uuid="uuid-bash-2"
							timestamp={timestamp}
							status={{ normalized: "running" }}
							command="npm install @claude-codex/types"
							animated={true}
						/>
					</section>

					{/* Example 3: Failed command */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">3. Failed Command</h2>
						<BashTool
							id="bash-3"
							uuid="uuid-bash-3"
							timestamp={timestamp}
							status={{ normalized: "failed", original: "error" }}
							command="cd /non/existent/directory"
							errorOutput="bash: cd: /non/existent/directory: No such file or directory"
							exitCode={1}
							duration={12}
						/>
					</section>

					{/* Example 4: Complex output */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">4. Complex Output</h2>
						<BashTool
							id="bash-4"
							uuid="uuid-bash-4"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							command="git status"
							output={`On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   src/components/Header.tsx
        modified:   src/utils/api.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        src/components/NewFeature.tsx

no changes added to commit (use "git add" and/or "git commit -a")`}
							duration={89}
							exitCode={0}
							workingDirectory="/Users/test/project"
							description="Git status with multiple file changes"
						/>
					</section>

					{/* Example 5: Elevated command */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">5. Elevated Command (sudo)</h2>
						<BashTool
							id="bash-5"
							uuid="uuid-bash-5"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							command="apt-get update"
							output={`Hit:1 http://archive.ubuntu.com/ubuntu focal InRelease
Get:2 http://archive.ubuntu.com/ubuntu focal-updates InRelease [114 kB]
Get:3 http://archive.ubuntu.com/ubuntu focal-security InRelease [114 kB]
Fetched 228 kB in 2s (114 kB/s)
Reading package lists... Done`}
							elevated={true}
							duration={2145}
							exitCode={0}
							description="System package update"
						/>
					</section>

					{/* Example 6: Interrupted command */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">6. Interrupted Command</h2>
						<BashTool
							id="bash-6"
							uuid="uuid-bash-6"
							timestamp={timestamp}
							status={{ normalized: "interrupted" }}
							command="sleep 1000"
							output="^C"
							interrupted={true}
							duration={3421}
							exitCode={130}
							description="Long-running command interrupted by user"
						/>
					</section>
				</div>
			</div>
		</div>
	)
}

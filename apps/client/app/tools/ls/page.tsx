"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LsTool } from "@/components/tools/ls";

export default function LsToolPage() {
	const timestamp = new Date().toISOString();
	const recentDate = new Date().toISOString();
	const oldDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(); // 6 months ago

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
				
				<h1 className="text-3xl font-bold text-white mb-8">LS Tool Examples</h1>
				
				<div className="space-y-8">
					{/* Example 1: Project root directory */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">1. Project Root Directory</h2>
						<LsTool
							id="ls-1"
							uuid="uuid-ls-1"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							input={{
								path: "/Users/project/claude-codex",
								showHidden: false
							}}
							results={{
								entries: [
									{ name: "src", type: "directory", size: 4096, permissions: "drwxr-xr-x", lastModified: recentDate },
									{ name: "public", type: "directory", size: 4096, permissions: "drwxr-xr-x", lastModified: recentDate },
									{ name: "node_modules", type: "symlink", size: 32, permissions: "lrwxr-xr-x", lastModified: recentDate },
									{ name: "package.json", type: "file", size: 1234, permissions: "-rw-r--r--", lastModified: recentDate },
									{ name: "tsconfig.json", type: "file", size: 567, permissions: "-rw-r--r--", lastModified: recentDate },
									{ name: "README.md", type: "file", size: 8912, permissions: "-rw-r--r--", lastModified: oldDate },
									{ name: "LICENSE", type: "file", size: 1067, permissions: "-rw-r--r--", lastModified: oldDate },
									{ name: ".gitignore", type: "file", size: 245, permissions: "-rw-r--r--", lastModified: recentDate, isHidden: true },
									{ name: ".env.example", type: "file", size: 189, permissions: "-rw-r--r--", lastModified: oldDate, isHidden: true }
								],
								entryCount: 9
							}}
							ui={{
								totalFiles: 6,
								totalDirectories: 2,
								totalSize: 16380
							}}
							duration={56}
						/>
					</section>

					{/* Example 2: Source directory with hidden files */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">2. Show Hidden Files</h2>
						<LsTool
							id="ls-2"
							uuid="uuid-ls-2"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							input={{
								path: "/Users/project/src",
								showHidden: true
							}}
							results={{
								entries: [
									{ name: "components", type: "directory", size: 4096, permissions: "drwxr-xr-x", lastModified: recentDate },
									{ name: "utils", type: "directory", size: 4096, permissions: "drwxr-xr-x", lastModified: recentDate },
									{ name: "hooks", type: "directory", size: 4096, permissions: "drwxr-xr-x", lastModified: recentDate },
									{ name: "services", type: "directory", size: 4096, permissions: "drwxr-xr-x", lastModified: recentDate },
									{ name: "app.tsx", type: "file", size: 2345, permissions: "-rw-r--r--", lastModified: recentDate },
									{ name: "index.ts", type: "file", size: 234, permissions: "-rw-r--r--", lastModified: recentDate },
									{ name: "globals.css", type: "file", size: 1876, permissions: "-rw-r--r--", lastModified: recentDate },
									{ name: ".DS_Store", type: "file", size: 6148, permissions: "-rw-r--r--", lastModified: recentDate, isHidden: true },
									{ name: ".eslintrc", type: "file", size: 567, permissions: "-rw-r--r--", lastModified: oldDate, isHidden: true }
								],
								entryCount: 9
							}}
							ui={{
								totalFiles: 5,
								totalDirectories: 4,
								totalSize: 27558
							}}
							duration={34}
						/>
					</section>

					{/* Example 3: Empty directory */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">3. Empty Directory</h2>
						<LsTool
							id="ls-3"
							uuid="uuid-ls-3"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							input={{
								path: "/Users/project/temp",
								showHidden: false
							}}
							results={{
								entries: [],
								entryCount: 0
							}}
							ui={{
								totalFiles: 0,
								totalDirectories: 0,
								totalSize: 0
							}}
							duration={12}
						/>
					</section>

					{/* Example 4: Directory not found */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">4. Directory Not Found</h2>
						<LsTool
							id="ls-4"
							uuid="uuid-ls-4"
							timestamp={timestamp}
							status={{ normalized: "failed", original: "error" }}
							input={{
								path: "/Users/project/nonexistent",
								showHidden: false
							}}
							results={{
								errorMessage: "ls: cannot access '/Users/project/nonexistent': No such file or directory"
							}}
							ui={{
								totalFiles: 0,
								totalDirectories: 0
							}}
						/>
					</section>

					{/* Example 5: Large directory (auto-collapsed) */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">5. Large Directory (Auto-collapsed)</h2>
						<LsTool
							id="ls-5"
							uuid="uuid-ls-5"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							input={{
								path: "/Users/project/node_modules/@types",
								showHidden: false
							}}
							results={{
								entries: Array.from({ length: 60 }, (_, i) => ({
									name: `@types-${['react', 'node', 'jest', 'webpack', 'babel'][i % 5]}-${i}`,
									type: "directory" as const,
									size: 4096,
									permissions: "drwxr-xr-x",
									lastModified: recentDate
								})),
								entryCount: 60
							}}
							ui={{
								totalFiles: 0,
								totalDirectories: 60,
								totalSize: 245760
							}}
							duration={145}
						/>
					</section>

					{/* Example 6: Running state */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">6. Listing in Progress</h2>
						<LsTool
							id="ls-6"
							uuid="uuid-ls-6"
							timestamp={timestamp}
							status={{ normalized: "running" }}
							input={{
								path: "/Users/project",
								showHidden: true,
								recursive: true
							}}
							ui={{
								totalFiles: 0,
								totalDirectories: 0
							}}
							description="Recursively listing all files..."
						/>
					</section>
				</div>
			</div>
		</div>
	);
}
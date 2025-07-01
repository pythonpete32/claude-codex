"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MultiEditTool } from "@/components/tools/multi-edit";

export default function MultiEditToolPage() {
	const timestamp = new Date().toISOString();

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
				
				<h1 className="text-3xl font-bold text-white mb-8">Multi-Edit Tool Examples</h1>
				
				<div className="space-y-8">
					{/* Example 1: All successful edits */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">1. All Edits Successful</h2>
						<MultiEditTool
							id="multi-1"
							uuid="uuid-multi-1"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							input={{
								filePath: "/src/config.json",
								edits: [
									{ old_string: '"version": "1.0.0"', new_string: '"version": "1.1.0"' },
									{ old_string: '"debug": false', new_string: '"debug": true' },
									{ old_string: '"port": 3000', new_string: '"port": 8080' },
									{ old_string: '"theme": "light"', new_string: '"theme": "dark"' }
								]
							}}
							results={{
								message: "All edits applied successfully",
								editsApplied: 4,
								totalEdits: 4,
								allSuccessful: true,
								editDetails: [
									{ 
										operation: { old_string: '"version": "1.0.0"', new_string: '"version": "1.1.0"' }, 
										success: true, 
										replacements_made: 1 
									},
									{ 
										operation: { old_string: '"debug": false', new_string: '"debug": true' }, 
										success: true, 
										replacements_made: 1 
									},
									{ 
										operation: { old_string: '"port": 3000', new_string: '"port": 8080' }, 
										success: true, 
										replacements_made: 1 
									},
									{ 
										operation: { old_string: '"theme": "light"', new_string: '"theme": "dark"' }, 
										success: true, 
										replacements_made: 1 
									}
								]
							}}
							ui={{
								totalEdits: 4,
								successfulEdits: 4,
								failedEdits: 0,
								changeSummary: "Updated version, enabled debug mode, changed port and theme"
							}}
							duration={67}
						/>
					</section>

					{/* Example 2: Partial success */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">2. Partial Success</h2>
						<MultiEditTool
							id="multi-2"
							uuid="uuid-multi-2"
							timestamp={timestamp}
							status={{ normalized: "failed" }}
							input={{
								filePath: "/src/components/App.tsx",
								edits: [
									{ old_string: "useState(false)", new_string: "useState(true)" },
									{ old_string: "className='old-style'", new_string: "className='new-style'" },
									{ old_string: "nonexistent", new_string: "replacement" }
								]
							}}
							results={{
								message: "Some edits failed",
								editsApplied: 2,
								totalEdits: 3,
								allSuccessful: false,
								editDetails: [
									{ 
										operation: { old_string: "useState(false)", new_string: "useState(true)" }, 
										success: true, 
										replacements_made: 2 
									},
									{ 
										operation: { old_string: "className='old-style'", new_string: "className='new-style'" }, 
										success: true, 
										replacements_made: 1 
									},
									{ 
										operation: { old_string: "nonexistent", new_string: "replacement" }, 
										success: false, 
										error: "String not found in file" 
									}
								],
								errorMessage: "1 edit failed to apply"
							}}
							ui={{
								totalEdits: 3,
								successfulEdits: 2,
								failedEdits: 1
							}}
							duration={89}
						/>
					</section>

					{/* Example 3: Replace all */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">3. Replace All Occurrences</h2>
						<MultiEditTool
							id="multi-3"
							uuid="uuid-multi-3"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							input={{
								filePath: "/src/utils/constants.ts",
								edits: [
									{ old_string: "TODO", new_string: "DONE", replace_all: true },
									{ old_string: "http://", new_string: "https://", replace_all: true }
								]
							}}
							results={{
								message: "All replacements completed",
								editsApplied: 2,
								totalEdits: 2,
								allSuccessful: true,
								editDetails: [
									{ 
										operation: { old_string: "TODO", new_string: "DONE", replace_all: true }, 
										success: true, 
										replacements_made: 5 
									},
									{ 
										operation: { old_string: "http://", new_string: "https://", replace_all: true }, 
										success: true, 
										replacements_made: 3 
									}
								]
							}}
							ui={{
								totalEdits: 2,
								successfulEdits: 2,
								failedEdits: 0,
								changeSummary: "Replaced 5 TODOs and upgraded 3 URLs to HTTPS"
							}}
							duration={45}
						/>
					</section>

					{/* Example 4: Running state */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">4. Edits in Progress</h2>
						<MultiEditTool
							id="multi-4"
							uuid="uuid-multi-4"
							timestamp={timestamp}
							status={{ normalized: "running" }}
							input={{
								filePath: "/src/large-file.ts",
								edits: [
									{ old_string: "import", new_string: "import type" },
									{ old_string: "var", new_string: "const" },
									{ old_string: "function", new_string: "const" }
								]
							}}
							ui={{
								totalEdits: 3,
								successfulEdits: 0,
								failedEdits: 0
							}}
							description="Applying TypeScript best practices..."
						/>
					</section>

					{/* Example 5: Failed state */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">5. All Edits Failed</h2>
						<MultiEditTool
							id="multi-5"
							uuid="uuid-multi-5"
							timestamp={timestamp}
							status={{ normalized: "failed" }}
							input={{
								filePath: "/protected/system.conf",
								edits: [
									{ old_string: "admin=false", new_string: "admin=true" },
									{ old_string: "readonly=true", new_string: "readonly=false" }
								]
							}}
							results={{
								message: "Failed to apply edits",
								editsApplied: 0,
								totalEdits: 2,
								allSuccessful: false,
								errorMessage: "Permission denied: cannot modify protected file"
							}}
							ui={{
								totalEdits: 2,
								successfulEdits: 0,
								failedEdits: 2
							}}
						/>
					</section>
				</div>
			</div>
		</div>
	);
}
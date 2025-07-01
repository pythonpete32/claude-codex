"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EditTool } from "@/components/tools/edit";

export default function EditToolPage() {
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
				
				<h1 className="text-3xl font-bold text-white mb-8">Edit Tool Examples</h1>
				
				<div className="space-y-8">
					{/* Example 1: Simple edit */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">1. Simple Code Edit</h2>
						<EditTool
							id="edit-1"
							uuid="uuid-edit-1"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							filePath="/src/components/Header.tsx"
							oldContent="export function Header() {"
							newContent="export const Header: React.FC = () => {"
							content=""
							diff={[
								{ type: "removed", content: "export function Header() {", lineNumber: 5 },
								{ type: "added", content: "export const Header: React.FC = () => {", lineNumber: 5 }
							]}
							duration={23}
							description="Converting function to arrow function with TypeScript"
						/>
					</section>

					{/* Example 2: Multi-line edit */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">2. Multi-line Edit</h2>
						<EditTool
							id="edit-2"
							uuid="uuid-edit-2"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							filePath="/src/utils/config.ts"
							oldContent={`const config = {
  apiUrl: 'http://localhost:3000',
  timeout: 5000
};`}
							newContent={`interface Config {
  apiUrl: string;
  timeout: number;
  retries?: number;
}

const config: Config = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  timeout: 5000,
  retries: 3
};`}
							content=""
							diff={[
								{ type: "removed", content: "const config = {", lineNumber: 1 },
								{ type: "removed", content: "  apiUrl: 'http://localhost:3000',", lineNumber: 2 },
								{ type: "removed", content: "  timeout: 5000", lineNumber: 3 },
								{ type: "removed", content: "};", lineNumber: 4 },
								{ type: "added", content: "interface Config {", lineNumber: 1 },
								{ type: "added", content: "  apiUrl: string;", lineNumber: 2 },
								{ type: "added", content: "  timeout: number;", lineNumber: 3 },
								{ type: "added", content: "  retries?: number;", lineNumber: 4 },
								{ type: "added", content: "}", lineNumber: 5 },
								{ type: "added", content: "", lineNumber: 6 },
								{ type: "added", content: "const config: Config = {", lineNumber: 7 },
								{ type: "added", content: "  apiUrl: process.env.API_URL || 'http://localhost:3000',", lineNumber: 8 },
								{ type: "added", content: "  timeout: 5000,", lineNumber: 9 },
								{ type: "added", content: "  retries: 3", lineNumber: 10 },
								{ type: "added", content: "};", lineNumber: 11 }
							]}
							duration={45}
							description="Adding TypeScript interface and environment variable support"
						/>
					</section>

					{/* Example 3: Failed edit */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">3. Failed Edit</h2>
						<EditTool
							id="edit-3"
							uuid="uuid-edit-3"
							timestamp={timestamp}
							status={{ normalized: "failed", original: "error" }}
							filePath="/src/protected.ts"
							oldContent="const SECRET_KEY = 'xyz';"
							newContent="const SECRET_KEY = 'abc';"
							content=""
							errorMessage="Permission denied: file is read-only"
						/>
					</section>

					{/* Example 4: CSS edit */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">4. CSS Style Edit</h2>
						<EditTool
							id="edit-4"
							uuid="uuid-edit-4"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							filePath="/src/styles/button.css"
							oldContent={`.btn {
  padding: 8px 16px;
  background: blue;
  color: white;
}`}
							newContent={`.btn {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}`}
							content=""
							diff={[
								{ type: "unchanged", content: ".btn {", lineNumber: 1 },
								{ type: "removed", content: "  padding: 8px 16px;", lineNumber: 2 },
								{ type: "added", content: "  padding: 12px 24px;", lineNumber: 2 },
								{ type: "removed", content: "  background: blue;", lineNumber: 3 },
								{ type: "added", content: "  background: #3b82f6;", lineNumber: 3 },
								{ type: "unchanged", content: "  color: white;", lineNumber: 4 },
								{ type: "added", content: "  border-radius: 8px;", lineNumber: 5 },
								{ type: "added", content: "  transition: all 0.2s;", lineNumber: 6 },
								{ type: "unchanged", content: "}", lineNumber: 7 },
								{ type: "added", content: "", lineNumber: 8 },
								{ type: "added", content: ".btn:hover {", lineNumber: 9 },
								{ type: "added", content: "  background: #2563eb;", lineNumber: 10 },
								{ type: "added", content: "  transform: translateY(-1px);", lineNumber: 11 },
								{ type: "added", content: "}", lineNumber: 12 }
							]}
							duration={34}
							description="Enhancing button styles with hover effects"
						/>
					</section>

					{/* Example 5: Running state */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">5. Edit in Progress</h2>
						<EditTool
							id="edit-5"
							uuid="uuid-edit-5"
							timestamp={timestamp}
							status={{ normalized: "running" }}
							filePath="/src/app.tsx"
							oldContent=""
							newContent=""
							content=""
							description="Applying edits to application entry point..."
						/>
					</section>
				</div>
			</div>
		</div>
	);
}
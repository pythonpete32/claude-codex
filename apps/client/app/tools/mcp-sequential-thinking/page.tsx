"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MCPSequentialThinkingTool } from "@/components/tools/mcp-sequential-thinking"

export default function MCPSequentialThinkingPage() {
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

				<h1 className="text-3xl font-bold text-white mb-8">MCP Sequential Thinking Examples</h1>

				<div className="space-y-8">
					{/* Example 1: Active workflow */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">1. Active Workflow</h2>
						<MCPSequentialThinkingTool
							id="mcp-1"
							uuid="uuid-mcp-1"
							timestamp={timestamp}
							status={{ normalized: "running" }}
							input={{
								workflow: "Implement user authentication system",
								context: {
									framework: "Next.js",
									authProvider: "Auth0",
								},
							}}
							workflow={{
								steps: [
									{
										id: "step-1",
										name: "Setup Auth0 Application",
										status: { normalized: "completed", original: "completed" },
										progress: 100,
										dependencies: [],
										output: "Auth0 application created with client ID and secret",
									},
									{
										id: "step-2",
										name: "Install Dependencies",
										status: { normalized: "completed", original: "completed" },
										progress: 100,
										dependencies: ["step-1"],
										output: "Installed @auth0/nextjs-auth0 and dependencies",
									},
									{
										id: "step-3",
										name: "Configure Environment Variables",
										status: { normalized: "running", original: "in_progress" },
										progress: 60,
										dependencies: ["step-1"],
									},
									{
										id: "step-4",
										name: "Create Auth Routes",
										status: { normalized: "pending", original: "pending" },
										progress: 0,
										dependencies: ["step-2", "step-3"],
									},
									{
										id: "step-5",
										name: "Add User Context Provider",
										status: { normalized: "pending", original: "pending" },
										progress: 0,
										dependencies: ["step-4"],
									},
								],
								currentStep: 3,
								overallProgress: 52,
								dependencies: [
									{ stepId: "step-2", dependsOn: ["step-1"], type: "sequential" },
									{ stepId: "step-3", dependsOn: ["step-1"], type: "sequential" },
									{ stepId: "step-4", dependsOn: ["step-2", "step-3"], type: "sequential" },
									{ stepId: "step-5", dependsOn: ["step-4"], type: "sequential" },
								],
							}}
							ui={{
								title: "Authentication Implementation",
								description: "Setting up Auth0 authentication for Next.js application",
								estimatedTimeRemaining: 15,
								category: "workflow",
							}}
							duration={234}
						/>
					</section>

					{/* Example 2: Completed workflow */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">2. Completed Workflow</h2>
						<MCPSequentialThinkingTool
							id="mcp-2"
							uuid="uuid-mcp-2"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							input={{
								workflow: "Deploy application to production",
							}}
							workflow={{
								steps: [
									{
										id: "step-1",
										name: "Run Tests",
										status: { normalized: "completed" },
										progress: 100,
										dependencies: [],
										output: "All 47 tests passed",
									},
									{
										id: "step-2",
										name: "Build Application",
										status: { normalized: "completed" },
										progress: 100,
										dependencies: ["step-1"],
										output: "Build completed: 2.3MB (gzipped: 684KB)",
									},
									{
										id: "step-3",
										name: "Deploy to Vercel",
										status: { normalized: "completed" },
										progress: 100,
										dependencies: ["step-2"],
										output: "Deployed to https://app-production.vercel.app",
									},
								],
								currentStep: 3,
								overallProgress: 100,
								dependencies: [
									{ stepId: "step-2", dependsOn: ["step-1"], type: "sequential" },
									{ stepId: "step-3", dependsOn: ["step-2"], type: "sequential" },
								],
							}}
							ui={{
								title: "Production Deployment",
								description: "Successfully deployed application to production",
								category: "workflow",
							}}
							duration={4567}
						/>
					</section>

					{/* Example 3: Failed workflow */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">3. Failed Workflow</h2>
						<MCPSequentialThinkingTool
							id="mcp-3"
							uuid="uuid-mcp-3"
							timestamp={timestamp}
							status={{ normalized: "failed" }}
							input={{
								workflow: "Database migration",
							}}
							workflow={{
								steps: [
									{
										id: "step-1",
										name: "Backup Database",
										status: { normalized: "completed" },
										progress: 100,
										dependencies: [],
										output: "Backup created: db_backup_2024_01_15.sql",
									},
									{
										id: "step-2",
										name: "Run Migrations",
										status: { normalized: "failed" },
										progress: 45,
										dependencies: ["step-1"],
										error: "Migration failed: Duplicate column 'user_id' in table 'orders'",
									},
									{
										id: "step-3",
										name: "Verify Data Integrity",
										status: { normalized: "pending" },
										progress: 0,
										dependencies: ["step-2"],
									},
								],
								currentStep: 2,
								overallProgress: 48,
								dependencies: [
									{ stepId: "step-2", dependsOn: ["step-1"], type: "sequential" },
									{ stepId: "step-3", dependsOn: ["step-2"], type: "sequential" },
								],
							}}
							ui={{
								title: "Database Migration Failed",
								description: "Migration process encountered an error",
								category: "workflow",
							}}
							duration={1234}
						/>
					</section>

					{/* Example 4: Pending workflow */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">4. Pending Workflow</h2>
						<MCPSequentialThinkingTool
							id="mcp-4"
							uuid="uuid-mcp-4"
							timestamp={timestamp}
							status={{ normalized: "pending" }}
							input={{
								workflow: "Analyze codebase for optimization opportunities",
							}}
							ui={{
								title: "Code Analysis",
								description: "Preparing to analyze codebase",
								category: "workflow",
							}}
						/>
					</section>

					{/* Example 5: Complex parallel workflow */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">5. Complex Parallel Workflow</h2>
						<MCPSequentialThinkingTool
							id="mcp-5"
							uuid="uuid-mcp-5"
							timestamp={timestamp}
							status={{ normalized: "running" }}
							input={{
								workflow: "Full application test suite",
							}}
							workflow={{
								steps: [
									{
										id: "step-1",
										name: "Unit Tests",
										status: { normalized: "completed" },
										progress: 100,
										dependencies: [],
										output: "156 unit tests passed",
									},
									{
										id: "step-2",
										name: "Integration Tests",
										status: { normalized: "running" },
										progress: 67,
										dependencies: [],
										output: "Running API integration tests...",
									},
									{
										id: "step-3",
										name: "E2E Tests",
										status: { normalized: "running" },
										progress: 45,
										dependencies: [],
										output: "Testing user flows in headless browser...",
									},
									{
										id: "step-4",
										name: "Performance Tests",
										status: { normalized: "pending" },
										progress: 0,
										dependencies: ["step-1", "step-2", "step-3"],
									},
									{
										id: "step-5",
										name: "Generate Report",
										status: { normalized: "pending" },
										progress: 0,
										dependencies: ["step-4"],
									},
								],
								currentStep: 2,
								overallProgress: 42,
								dependencies: [
									{ stepId: "step-4", dependsOn: ["step-1", "step-2", "step-3"], type: "parallel" },
									{ stepId: "step-5", dependsOn: ["step-4"], type: "sequential" },
								],
							}}
							ui={{
								title: "Comprehensive Test Suite",
								description: "Running all test types in parallel",
								estimatedTimeRemaining: 8,
								category: "workflow",
							}}
							duration={5678}
						/>
					</section>
				</div>
			</div>
		</div>
	)
}

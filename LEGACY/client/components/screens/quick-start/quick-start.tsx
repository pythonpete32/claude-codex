import { ArrowRight, Github, Plus, Sparkles } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Checkbox } from "../../ui/checkbox";
import { Input } from "../../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Textarea } from "../../ui/textarea";

export interface QuickStartProps {
	onStartSession?: (config: SessionConfig) => void;
}

export interface SessionConfig {
	projectType: "github" | "new";
	githubRepo?: string;
	githubBranch?: string;
	projectName?: string;
	model: string;
	mcpTools: string[];
	prd?: string;
	description: string;
}

export const QuickStart: React.FC<QuickStartProps> = ({ onStartSession }) => {
	const [projectType, setProjectType] = useState<"github" | "new">("github");
	const [githubRepo, setGithubRepo] = useState("");
	const [githubBranch, setGithubBranch] = useState("main");
	const [projectName, setProjectName] = useState("");
	const [selectedModel, setSelectedModel] = useState("sonnet-4");
	const [selectedMcpTools, setSelectedMcpTools] = useState<string[]>([]);
	const [selectedPrd, setSelectedPrd] = useState("none");
	const [description, setDescription] = useState("");

	const models = [
		{ value: "sonnet-4", label: "Sonnet 4", description: "Most capable model" },
		{ value: "sonnet-3.5", label: "Sonnet 3.5", description: "Balanced performance" },
		{ value: "haiku-3.5", label: "Haiku 3.5", description: "Fast and efficient" },
	];

	const mcpTools = [
		{ value: "context7", label: "Context7" },
		{ value: "excalidraw", label: "Excalidraw" },
		{ value: "puppeteer", label: "Puppeteer" },
		{ value: "snap-happy", label: "Snap Happy" },
		{ value: "ide", label: "IDE" },
	];

	const prdOptions = [
		{ value: "none", label: "None" },
		{ value: "new", label: "Create New PRD" },
		{ value: "ecommerce", label: "E-commerce Platform" },
		{ value: "dashboard", label: "Analytics Dashboard" },
		{ value: "api", label: "REST API Service" },
	];

	const handleStartSession = () => {
		const config: SessionConfig = {
			projectType,
			githubRepo: projectType === "github" ? githubRepo : undefined,
			githubBranch: projectType === "github" ? githubBranch : undefined,
			projectName: projectType === "new" ? projectName : undefined,
			model: selectedModel,
			mcpTools: selectedMcpTools,
			prd: selectedPrd !== "none" ? selectedPrd : undefined,
			description,
		};
		onStartSession?.(config);
	};

	return (
		<div className="w-full">
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="flex items-center justify-center gap-2 text-2xl">
						<Sparkles className="w-6 h-6 text-blue-500" />
						Quick Start
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Single Configuration Row */}
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{/* Project Type */}
						<Select
							value={projectType}
							onValueChange={(value: "github" | "new") => setProjectType(value)}
						>
							<SelectTrigger className="h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="github">
									<div className="flex items-center">
										<Github className="w-4 h-4 mr-2" />
										GitHub
									</div>
								</SelectItem>
								<SelectItem value="new">
									<div className="flex items-center">
										<Plus className="w-4 h-4 mr-2" />
										New Project
									</div>
								</SelectItem>
							</SelectContent>
						</Select>

						{/* Project Input */}
						<Input
							placeholder={projectType === "github" ? "owner/repo-name" : "Project Title"}
							value={projectType === "github" ? githubRepo : projectName}
							onChange={(e) =>
								projectType === "github"
									? setGithubRepo(e.target.value)
									: setProjectName(e.target.value)
							}
							className="col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2 h-9"
						/>

						{/* Model */}
						<Select value={selectedModel} onValueChange={setSelectedModel}>
							<SelectTrigger className="h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{models.map((model) => (
									<SelectItem key={model.value} value={model.value}>
										{model.label.replace("Claude ", "")}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* MCP Tools - Multi-select */}
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="justify-between w-full h-9 min-w-0 overflow-hidden"
								>
									<span className="truncate text-left flex-1">
										{selectedMcpTools.length === 0
											? "MCP Tools"
											: `${selectedMcpTools.length} selected`}
									</span>
									<ArrowRight className="w-4 h-4 ml-1 rotate-90 flex-shrink-0" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-80">
								<div className="space-y-2">
									<h4 className="font-medium text-sm">Select MCP Tools</h4>
									{mcpTools.map((tool) => (
										<div key={tool.value} className="flex items-center space-x-2">
											<Checkbox
												id={tool.value}
												checked={selectedMcpTools.includes(tool.value)}
												onCheckedChange={(checked) => {
													if (checked) {
														setSelectedMcpTools([...selectedMcpTools, tool.value]);
													} else {
														setSelectedMcpTools(selectedMcpTools.filter((t) => t !== tool.value));
													}
												}}
											/>
											<label
												htmlFor={tool.value}
												className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
											>
												{tool.label}
											</label>
										</div>
									))}
								</div>
							</PopoverContent>
						</Popover>

						{/* PRD */}
						<Select value={selectedPrd} onValueChange={setSelectedPrd}>
							<SelectTrigger className="h-9">
								<SelectValue placeholder="PRDs">
									<span className="truncate">
										{selectedPrd === "none"
											? "PRDs"
											: prdOptions
													.find((p) => p.value === selectedPrd)
													?.label.replace("Create New ", "")
													.replace(" PRD", "") || "PRDs"}
									</span>
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">None</SelectItem>
								<SelectItem value="new">New</SelectItem>
								{prdOptions
									.filter((prd) => prd.value !== "new" && prd.value !== "none")
									.map((prd) => (
										<SelectItem key={prd.value} value={prd.value}>
											{prd.label.replace("Create New ", "").replace(" PRD", "")}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					</div>

					{/* Description */}
					<Textarea
						placeholder="Describe what you want to work on today..."
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={3}
					/>

					<Button
						onClick={handleStartSession}
						className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
						size="lg"
					>
						<Sparkles className="w-4 h-4 mr-2" />
						Start Development Session
						<ArrowRight className="w-4 h-4 ml-2" />
					</Button>
				</CardContent>
			</Card>
		</div>
	);
};

import {
	ArrowDown,
	ArrowUp,
	BarChart3,
	Bot,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Clock,
	Code,
	FileText,
	Folder,
	FolderOpen,
	History,
	MessageSquare,
	Pause,
	Play,
	Plus,
	Search,
	Settings,
	Shield,
	Star,
	Terminal,
	Trash2,
	User,
	Workflow,
	Wrench,
	X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { cn } from "../../../lib/utils";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { ScrollArea } from "../../ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Separator } from "../../ui/separator";
import { Switch } from "../../ui/switch";
import { Textarea } from "../../ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";

export interface AppShellProps {
	children: React.ReactNode;
	className?: string;
	onSelectSession?: (sessionId: string) => void;
	onNavigateQuickStart?: () => void;
	currentPath?: string;
	hideTools?: boolean;
	hideSidebar?: boolean;
	hideChat?: boolean;
	hideSessionHeader?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
	children,
	className,
	onSelectSession,
	onNavigateQuickStart,
	currentPath,
	hideTools = false,
	hideSidebar = false,
	hideChat = false,
	hideSessionHeader = false,
}) => {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [rightDrawerOpen, setRightDrawerOpen] = useState(true);
	const [chatMessage, setChatMessage] = useState("");
	const [selectedMcpTool, setSelectedMcpTool] = useState("");
	const [selectedModel, setSelectedModel] = useState("sonnet-4");
	const [selectedEditor, setSelectedEditor] = useState("");
	const [selectedSession, setSelectedSession] = useState<string | null>("1");
	const [sessionSearch, setSessionSearch] = useState("");
	const [enabledMcpTools, setEnabledMcpTools] = useState([
		{
			id: "sequential-thinking",
			name: "Sequential Thinking",
			description: "Break down complex problems",
		},
		{ id: "context7", name: "Context7", description: "Library documentation lookup" },
		{ id: "file-system", name: "File System", description: "File operations" },
	]);

	const [projects, setProjects] = useState([
		{
			id: "1",
			name: "my-react-app",
			type: "github" as const,
			githubRepo: "owner/my-react-app",
			sessionCount: 8,
			lastActive: "2 min ago",
			expanded: true,
		},
		{
			id: "2",
			name: "api-service",
			type: "github" as const,
			githubRepo: "company/api-service",
			sessionCount: 5,
			lastActive: "1 hour ago",
			expanded: false,
		},
		{
			id: "3",
			name: "E-commerce Platform",
			type: "new" as const,
			sessionCount: 12,
			lastActive: "3 hours ago",
			expanded: false,
		},
	]);

	const mockSessions = [
		{
			id: "1",
			name: "React Components Refactor",
			projectId: "1",
			status: "active" as const,
			starred: true,
		},
		{
			id: "2",
			name: "Bug Fixes & Performance",
			projectId: "1",
			status: "completed" as const,
		},
		{
			id: "3",
			name: "Unit Tests",
			projectId: "1",
			status: "active" as const,
		},
		{
			id: "4",
			name: "API Integration",
			projectId: "2",
			status: "active" as const,
		},
		{
			id: "5",
			name: "Database Migration",
			projectId: "2",
			status: "completed" as const,
		},
	];

	const sidebarItems = [
		{ icon: MessageSquare, label: "Quick Start", badge: null, active: true },
		{ icon: Bot, label: "Agents", badge: null, active: false },
		{ icon: Workflow, label: "Workflows", badge: null, active: false },
		{ icon: BarChart3, label: "Analytics", badge: null, active: false },
	];

	const activeSessions = [
		{ id: "1", name: "React Component Dev", timestamp: "2 min ago", active: true },
		{ id: "2", name: "API Integration", timestamp: "1 hour ago", active: false },
		{ id: "3", name: "Bug Fixes", timestamp: "3 hours ago", active: false },
	];

	const settingsItems = [
		{ icon: Settings, label: "Settings", badge: null },
		{ icon: FileText, label: "Documentation", badge: null },
	];

	const availableMcpTools = [
		{ id: "puppeteer", name: "Puppeteer", description: "Browser automation" },
		{ id: "weather-api", name: "Weather API", description: "Weather information" },
		{ id: "database", name: "Database Tools", description: "SQL operations" },
		{ id: "git", name: "Git Integration", description: "Version control" },
		{ id: "docker", name: "Docker Tools", description: "Container management" },
	];

	const modelOptions = [
		{ value: "opus-4", label: "Opus 4" },
		{ value: "sonnet-4", label: "Sonnet 4" },
	];

	const editorOptions = [
		{ value: "vscode", label: "VS Code" },
		{ value: "cursor", label: "Cursor" },
		{ value: "zed", label: "Zed" },
		{ value: "vim", label: "Vim" },
	];

	const [builtInTools, setBuiltInTools] = useState([
		{ id: "bash", name: "Bash Terminal", enabled: true, description: "Execute shell commands" },
		{ id: "files", name: "File Operations", enabled: true, description: "Read, write, edit files" },
		{
			id: "text",
			name: "Text Processing",
			enabled: true,
			description: "Search, grep, text manipulation",
		},
		{ id: "analysis", name: "Code Analysis", enabled: false, description: "Static code analysis" },
	]);

	const handleSendMessage = () => {
		if (chatMessage.trim()) {
			// Handle sending message
			console.log("Sending message:", chatMessage);
			setChatMessage("");
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const handleAddMcpTool = () => {
		if (selectedMcpTool) {
			const toolToAdd = availableMcpTools.find((tool) => tool.id === selectedMcpTool);
			if (toolToAdd && !enabledMcpTools.find((tool) => tool.id === toolToAdd.id)) {
				setEnabledMcpTools([...enabledMcpTools, toolToAdd]);
				setSelectedMcpTool("");
			}
		}
	};

	const handleRemoveMcpTool = (toolId: string) => {
		setEnabledMcpTools(enabledMcpTools.filter((tool) => tool.id !== toolId));
	};

	const handleToggleBuiltInTool = (toolId: string) => {
		setBuiltInTools(
			builtInTools.map((tool) => (tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool)),
		);
	};

	const handleEditorChange = (editorValue: string) => {
		setSelectedEditor(editorValue);
		if (editorValue) {
			// Handle opening in selected editor
			console.log("Opening in:", editorValue);
			// Reset selection after action
			setTimeout(() => setSelectedEditor(""), 100);
		}
	};

	const handleContinueInTerminal = () => {
		const command = "claude-code --resume";
		navigator.clipboard.writeText(command);
		// Could show a toast notification here
		console.log("Copied to clipboard:", command);
	};

	const toggleProject = (projectId: string) => {
		setProjects((prev) =>
			prev.map((p) => (p.id === projectId ? { ...p, expanded: !p.expanded } : p)),
		);
	};

	const handleSessionSelect = (sessionId: string) => {
		setSelectedSession(sessionId);
		onSelectSession?.(sessionId);
	};

	const filteredSessions = mockSessions.filter((session) =>
		session.name.toLowerCase().includes(sessionSearch.toLowerCase()),
	);

	return (
		<div className={cn("h-screen flex bg-background", className)}>
			{/* Floating Sidebar */}
			{!hideSidebar && (
				<div
					className={cn(
						"fixed left-4 top-4 bottom-4 z-50 flex flex-col bg-background border border-border rounded-lg shadow-lg transition-all duration-300",
						sidebarCollapsed ? "w-16" : "w-64",
					)}
				>
					{/* Sidebar Header */}
					<div className="p-4 border-b border-border">
						<div className="flex items-center justify-between">
							{!sidebarCollapsed && (
								<div className="flex items-center gap-2">
									<div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
										<MessageSquare className="w-4 h-4 text-white" />
									</div>
									<span className="font-semibold text-sm">Claude Chat</span>
								</div>
							)}
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
								className="h-8 w-8 p-0"
							>
								{sidebarCollapsed ? (
									<ChevronRight className="w-4 h-4" />
								) : (
									<ChevronLeft className="w-4 h-4" />
								)}
							</Button>
						</div>
					</div>

					{/* Sidebar Content */}
					<div className="flex-1 p-2 overflow-auto flex flex-col">
						{/* Main Navigation */}
						<nav className="space-y-1 mb-4">
							{sidebarItems.map((item, index) => (
								<Button
									key={index}
									variant={item.active ? "secondary" : "ghost"}
									className={cn("w-full justify-start", sidebarCollapsed ? "px-2" : "px-3")}
								>
									<item.icon className="w-4 h-4" />
									{!sidebarCollapsed && (
										<>
											<span className="ml-2">{item.label}</span>
											{item.badge && (
												<Badge variant="secondary" className="ml-auto text-xs">
													{item.badge}
												</Badge>
											)}
										</>
									)}
								</Button>
							))}
						</nav>

						{/* Sessions Tree */}
						{!sidebarCollapsed && (
							<>
								<Separator className="my-4" />
								<ScrollArea className="flex-1 scrollbar-hide">
									<div className="p-2 space-y-2">
										<div className="flex items-center justify-between mb-3 px-1">
											<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
												Sessions
											</span>
											<Button size="icon" variant="ghost" className="h-6 w-6">
												<Plus className="h-3 w-3" />
											</Button>
										</div>

										{/* Search Sessions */}
										<div className="relative mb-3 px-1">
											<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
											<Input
												placeholder="Search sessions..."
												className="pl-7 h-7 text-xs w-full"
												value={sessionSearch}
												onChange={(e) => setSessionSearch(e.target.value)}
											/>
										</div>

										{/* Projects Tree */}
										<div className="space-y-1 px-1">
											{projects.map((project) => (
												<div key={project.id}>
													<Button
														variant="ghost"
														size="sm"
														className="w-full justify-start h-7 px-2"
														onClick={() => toggleProject(project.id)}
													>
														{project.expanded ? (
															<ChevronDown className="w-3 h-3 mr-1" />
														) : (
															<ChevronRight className="w-3 h-3 mr-1" />
														)}
														{project.expanded ? (
															<FolderOpen className="w-3 h-3 mr-2 text-blue-500" />
														) : (
															<Folder className="w-3 h-3 mr-2 text-blue-500" />
														)}
														<span className="truncate flex-1 text-left text-xs">
															{project.name}
														</span>
														<Badge variant="outline" className="text-xs h-4 px-1">
															{project.sessionCount}
														</Badge>
													</Button>

													{project.expanded && (
														<div className="ml-4 mt-1 space-y-1">
															{filteredSessions
																.filter((s) => s.projectId === project.id)
																.map((session) => (
																	<Button
																		key={session.id}
																		variant="ghost"
																		size="sm"
																		className={`w-full justify-start h-6 text-xs px-2 ${
																			selectedSession === session.id
																				? "bg-blue-100 dark:bg-blue-900/30"
																				: ""
																		}`}
																		onClick={() => handleSessionSelect(session.id)}
																	>
																		<div
																			className={`w-2 h-2 rounded-full mr-2 ${
																				session.status === "active"
																					? "bg-green-500"
																					: session.status === "completed"
																						? "bg-blue-500"
																						: "bg-gray-500"
																			}`}
																		/>
																		<span className="truncate flex-1 text-left">
																			{session.name}
																		</span>
																		{session.starred && (
																			<Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
																		)}
																	</Button>
																))}
														</div>
													)}
												</div>
											))}
										</div>

										{/* Keyboard hint */}
										<div className="mt-3 text-xs text-muted-foreground flex items-center gap-1 px-1">
											<ArrowUp className="w-3 h-3" />
											<ArrowDown className="w-3 h-3" />
											<span>Navigate</span>
										</div>
									</div>
								</ScrollArea>

								{/* Settings at bottom */}
								<div className="mt-auto pt-4">
									<nav className="space-y-1">
										{settingsItems.map((item, index) => (
											<Button key={index} variant="ghost" className="w-full justify-start px-3">
												<item.icon className="w-4 h-4" />
												<span className="ml-2">{item.label}</span>
												{item.badge && (
													<Badge variant="secondary" className="ml-auto text-xs">
														{item.badge}
													</Badge>
												)}
											</Button>
										))}
									</nav>
								</div>
							</>
						)}
					</div>

					{/* User Section */}
					<div className="p-4 border-t border-border">
						<Button
							variant="ghost"
							className={cn("w-full justify-start", sidebarCollapsed ? "px-2" : "px-3")}
						>
							<User className="w-4 h-4" />
							{!sidebarCollapsed && <span className="ml-2">User Settings</span>}
						</Button>
					</div>
				</div>
			)}

			{/* Main Content Area */}
			<div
				className={cn(
					"flex-1 flex transition-all duration-300",
					hideSidebar ? "ml-0" : sidebarCollapsed ? "ml-24" : "ml-72",
				)}
			>
				{/* Chat Area */}
				<div
					className={cn(
						"flex-1 flex flex-col transition-all duration-300 relative",
						rightDrawerOpen && !hideTools ? "mr-80" : "mr-0",
					)}
				>
					{/* Chat Header */}
					{!hideSessionHeader && (
						<div className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6">
							<div className="flex items-center gap-3">
								<h1 className="text-xl font-semibold">Chat Session</h1>
							</div>

							<div className="flex items-center gap-2">
								<Select value={selectedEditor} onValueChange={handleEditorChange}>
									<SelectTrigger className="w-40">
										<SelectValue placeholder="Open in Editor" />
									</SelectTrigger>
									<SelectContent>
										{editorOptions.map((editor) => (
											<SelectItem key={editor.value} value={editor.value}>
												<Code className="w-3 h-3 mr-2" />
												{editor.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button variant="outline" size="sm" onClick={handleContinueInTerminal}>
												<Terminal className="w-3 h-3 mr-1" />
												Open in Terminal
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>Copy the command to continue this session in your terminal</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
						</div>
					)}

					{/* Chat Messages Area */}
					<div className="flex-1 overflow-auto scrollbar-hide">
						<div className="max-w-4xl mx-auto p-6 pb-44">{children}</div>
					</div>

					{/* Modern Chat Input */}
					{!hideChat && (
						<div className="fixed bottom-0 left-0 right-0 bg-background">
							{/* Full width separator */}
							<Separator className="w-full" />
							
							<div 
								className={cn(
									"transition-all duration-300",
									hideSidebar ? "ml-0" : sidebarCollapsed ? "ml-24" : "ml-72",
									rightDrawerOpen && !hideTools ? "mr-80" : "mr-0"
								)}
							>
								<div className="px-6 pt-3 pb-4">
									{/* Controls Bar */}
									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-2">
											{/* Model Selector */}
											<Select value={selectedModel} onValueChange={setSelectedModel}>
												<SelectTrigger className="h-8 w-28 text-xs">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{modelOptions.map((model) => (
														<SelectItem key={model.value} value={model.value}>
															{model.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>

											{/* Action Buttons */}
											<Button variant="ghost" size="icon" className="h-8 w-8">
												<Play className="w-3 h-3" />
											</Button>
											<Button variant="ghost" size="icon" className="h-8 w-8">
												<Pause className="w-3 h-3" />
											</Button>
										</div>

										{/* Tools Settings */}
										{!hideTools && (
											<Button
												variant="ghost"
												size="sm"
												className="h-8 px-3 gap-2"
												onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
											>
												<Wrench className="w-3 h-3" />
												<span className="text-xs">Tools</span>
											</Button>
										)}
									</div>

									{/* Message Input Area */}
									<div className="relative">
										<Textarea
											placeholder="Type your message..."
											value={chatMessage}
											onChange={(e) => setChatMessage(e.target.value)}
											onKeyPress={handleKeyPress}
											className="min-h-[80px] max-h-[200px] resize-none text-sm pr-20"
										/>
										<Button
											onClick={handleSendMessage}
											disabled={!chatMessage.trim()}
											className="absolute bottom-2 right-2 h-12 w-12 rounded-lg bg-primary hover:bg-primary/90 transition-colors"
											size="icon"
										>
											<ArrowUp className="w-4 h-4" />
										</Button>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Right Controls Drawer */}
				{rightDrawerOpen && !hideTools && (
					<div className="fixed right-4 top-4 bottom-4 w-72 bg-background border border-border rounded-lg shadow-lg overflow-hidden flex flex-col">
						{/* Drawer Header */}
						<div className="p-4 border-b border-border">
							<div className="flex items-center justify-between">
								<h2 className="font-semibold text-sm flex items-center gap-2">
									<Wrench className="w-4 h-4" />
									Tools
								</h2>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setRightDrawerOpen(false)}
									className="h-8 w-8 p-0"
								>
									<X className="w-4 h-4" />
								</Button>
							</div>
						</div>

						{/* Drawer Content */}
						<div className="flex-1 overflow-auto scrollbar-hide p-4 space-y-6">
							{/* Built-in Tool Permissions */}
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm flex items-center gap-2">
										<Shield className="w-4 h-4" />
										Built-in Tools
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									{builtInTools.map((tool, index) => (
										<div key={tool.id}>
											<div className="flex items-center justify-between">
												<div className="space-y-0.5">
													<div className="text-sm font-medium">{tool.name}</div>
													<div className="text-xs text-muted-foreground">{tool.description}</div>
												</div>
												<Switch
													checked={tool.enabled}
													onCheckedChange={() => handleToggleBuiltInTool(tool.id)}
												/>
											</div>
											{index < builtInTools.length - 1 && <Separator className="mt-3" />}
										</div>
									))}
								</CardContent>
							</Card>

							{/* MCP Tools */}
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm flex items-center gap-2">
										<Wrench className="w-4 h-4" />
										MCP Tools
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Add New MCP Tool */}
									<div className="space-y-2">
										<div className="flex gap-2">
											<Select value={selectedMcpTool} onValueChange={setSelectedMcpTool}>
												<SelectTrigger className="w-[180px]">
													<SelectValue placeholder="Select MCP tool to add" />
												</SelectTrigger>
												<SelectContent>
													{availableMcpTools
														.filter(
															(tool) => !enabledMcpTools.find((enabled) => enabled.id === tool.id),
														)
														.map((tool) => (
															<SelectItem key={tool.id} value={tool.id}>
																<div className="truncate max-w-[160px]" title={tool.name}>
																	{tool.name}
																</div>
															</SelectItem>
														))}
												</SelectContent>
											</Select>
											<Button
												size="sm"
												onClick={handleAddMcpTool}
												disabled={!selectedMcpTool}
												className="w-8 h-8 p-0 flex-shrink-0"
											>
												<Plus className="w-4 h-4" />
											</Button>
										</div>
									</div>

									{/* Enabled MCP Tools */}
									{enabledMcpTools.length > 0 && (
										<div className="space-y-3">
											<Separator />
											{enabledMcpTools.map((tool, index) => (
												<div key={tool.id}>
													<div className="flex items-center justify-between">
														<div className="space-y-0.5 flex-1 min-w-0 mr-2">
															<div className="text-sm font-medium truncate" title={tool.name}>
																{tool.name}
															</div>
															<div
																className="text-xs text-muted-foreground truncate"
																title={tool.description}
															>
																{tool.description}
															</div>
														</div>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleRemoveMcpTool(tool.id)}
															className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													</div>
													{index < enabledMcpTools.length - 1 && <Separator className="mt-3" />}
												</div>
											))}
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

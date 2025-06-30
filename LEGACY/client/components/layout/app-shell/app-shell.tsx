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
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { NavbarSkeleton } from "@/components/ui/loading-skeleton";
import { NavbarError } from "@/components/ui/error-state";
import { useNavbarData } from "./use-navbar-data";

export interface AppShellProps {
	children: React.ReactNode;
	className?: string;
	onSelectSession?: (sessionId: string) => void;
	hideChat?: boolean;
	hideSessionHeader?: boolean;
	hideTools?: boolean;
	hideSidebar?: boolean;
	onNavigateQuickStart?: () => void;
	currentPath?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
	children,
	className,
	onSelectSession,
	hideChat = false,
	hideSessionHeader = false,
	hideTools = false,
	hideSidebar = false,
	onNavigateQuickStart,
	currentPath,
}) => {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
	const [chatMessage, setChatMessage] = useState("");
	const [selectedMcpTool, setSelectedMcpTool] = useState("");
	const [selectedModel, setSelectedModel] = useState("sonnet-4");
	const [selectedEditor, setSelectedEditor] = useState("");
	const [selectedSession, setSelectedSession] = useState<string | null>("1");
	const [sessionSearch, setSessionSearch] = useState("");
	const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
	const [enabledMcpTools, setEnabledMcpTools] = useState([
		{
			id: "sequential-thinking",
			name: "Sequential Thinking",
			description: "Break down complex problems",
		},
		{ id: "context7", name: "Context7", description: "Library documentation lookup" },
		{ id: "file-system", name: "File System", description: "File operations" },
	]);

	// Use the navbar data hook for real API data
	const {
		projects: apiProjects,
		sessions,
		sessionsByProject,
		activeSessions,
		isLoading,
		error,
		filterSessions,
		refetch,
	} = useNavbarData();

	// Add expanded state to projects
	const projects = useMemo(() => {
		return apiProjects.map((project) => ({
			...project,
			expanded: expandedProjects.has(project.id),
		}));
	}, [apiProjects, expandedProjects]);

	// Filter sessions based on search
	const filteredSessions = useMemo(() => {
		return filterSessions(sessionSearch);
	}, [filterSessions, sessionSearch]);

	const sidebarItems = [
		{
			icon: MessageSquare,
			label: "Quick Start",
			badge: null,
			active: currentPath?.includes("quick-start") ?? false,
			disabled: false,
		},
		{ icon: Bot, label: "Agents", badge: null, active: false, disabled: true },
		{ icon: Workflow, label: "Workflows", badge: null, active: false, disabled: true },
		{ icon: BarChart3, label: "Analytics", badge: null, active: false, disabled: true },
	];

	const settingsItems = [
		{ icon: Settings, label: "Settings", badge: null, disabled: true },
		{ icon: FileText, label: "Documentation", badge: null, disabled: false },
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
		setExpandedProjects((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(projectId)) {
				newSet.delete(projectId);
			} else {
				newSet.add(projectId);
			}
			return newSet;
		});
	};

	const handleSessionSelect = (sessionId: string) => {
		setSelectedSession(sessionId);
		onSelectSession?.(sessionId);
	};

	// Show loading skeleton while data is loading
	if (isLoading && !hideSidebar) {
		return (
			<div className={cn("h-screen flex bg-background", className)}>
				<NavbarSkeleton />
				<div className="flex-1">{children}</div>
			</div>
		);
	}

	// Show error state if there's an error
	if (error && !hideSidebar) {
		return (
			<div className={cn("h-screen flex bg-background", className)}>
				<NavbarError onRetry={refetch} />
				<div className="flex-1">{children}</div>
			</div>
		);
	}

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
					<div className="flex-1 p-2 flex flex-col overflow-hidden">
						{/* Main Navigation */}
						<nav className="space-y-1 mb-4">
							{sidebarItems.map((item, index) => (
								<Button
									key={index}
									variant={item.active ? "secondary" : "ghost"}
									className={cn("w-full justify-start", sidebarCollapsed ? "px-2" : "px-3")}
									disabled={item.disabled}
									onClick={() => {
										if (item.label === "Quick Start" && onNavigateQuickStart) {
											onNavigateQuickStart();
										}
									}}
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
								<div className="flex-1 flex flex-col overflow-hidden">
									<div className="p-2 space-y-2 flex-shrink-0">
										<div className="mb-3 px-1">
											<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
												Sessions
											</span>
										</div>

										{/* Search Sessions */}
										<div className="relative mb-3 px-1">
											<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
											<Input
												placeholder="Search sessions..."
												className="pl-7 h-7 text-xs"
												value={sessionSearch}
												onChange={(e) => setSessionSearch(e.target.value)}
											/>
										</div>
									</div>

									{/* Projects Tree - Scrollable */}
									<ScrollArea className="flex-1 min-h-0">
										<div className="px-3 pb-2">
											<div className="space-y-1">
												{projects.length === 0 ? (
													<div className="text-center py-8 text-sm text-muted-foreground">
														No projects found
													</div>
												) : (
													projects.map((project) => {
														const projectSessions = sessionsByProject.get(project.id) || [];
														const filteredProjectSessions = filteredSessions.filter(
															(s) => s.projectId === project.id,
														);

														return (
															<div key={project.id}>
																<div className="flex items-center group">
																	<Button
																		variant="ghost"
																		size="sm"
																		className="flex-1 justify-start h-7 px-2"
																		onClick={() => toggleProject(project.id)}
																	>
																		{expandedProjects.has(project.id) ? (
																			<ChevronDown className="w-3 h-3 mr-1" />
																		) : (
																			<ChevronRight className="w-3 h-3 mr-1" />
																		)}
																		{expandedProjects.has(project.id) ? (
																			<FolderOpen className="w-3 h-3 mr-2 text-blue-500" />
																		) : (
																			<Folder className="w-3 h-3 mr-2 text-blue-500" />
																		)}
																		<span
																			className="truncate flex-1 text-left text-xs"
																			title={project.path}
																		>
																			{project.name}
																		</span>
																		{project.hasActiveSessions && (
																			<div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
																		)}
																		<Badge variant="outline" className="text-xs h-4 px-1">
																			{project.sessionCount}
																		</Badge>
																	</Button>
																</div>

																{expandedProjects.has(project.id) && (
																	<div className="ml-4 mt-1 space-y-1">
																		{filteredProjectSessions.length === 0 ? (
																			<div className="text-xs text-muted-foreground px-2 py-1">
																				No sessions found
																			</div>
																		) : (
																			filteredProjectSessions.map((session) => (
																				<Button
																					key={session.id}
																					variant="ghost"
																					size="sm"
																					className={`w-full justify-start h-6 text-xs px-2 overflow-hidden ${
																						selectedSession === session.id
																							? "bg-blue-100 dark:bg-blue-900/30"
																							: ""
																					}`}
																					onClick={() => handleSessionSelect(session.id)}
																				>
																					<div
																						className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
																							session.status === "active"
																								? "bg-green-500"
																								: "bg-blue-500"
																						}`}
																					/>
																					<span
																						className="truncate flex-1 text-left min-w-0"
																						title={`${session.name} (${session.lastActivity})`}
																					>
																						{session.name}
																					</span>
																					<div className="flex items-center gap-1 flex-shrink-0 ml-1">
																						<span className="text-xs text-muted-foreground">
																							{session.messageCount}
																						</span>
																						{session.hasToolUsage && (
																							<Terminal className="w-3 h-3 text-muted-foreground" />
																						)}
																						{session.starred && (
																							<Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
																						)}
																					</div>
																				</Button>
																			))
																		)}
																	</div>
																)}
															</div>
														);
													})
												)}
											</div>
										</div>
									</ScrollArea>
								</div>

								{/* Keyboard hint */}
								<div className="mt-3 text-xs text-muted-foreground flex items-center gap-1 px-3 flex-shrink-0">
									<ArrowUp className="w-3 h-3" />
									<ArrowDown className="w-3 h-3" />
									<span>Navigate</span>
								</div>

								{/* Settings at bottom */}
								<div className="mt-auto pt-4 border-t border-border">
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

					{/* Chat Messages Area and Input */}
					{!hideChat ? (
						<>
							{/* Messages scroll area - constrained by flex layout */}
							<div className="flex-1 overflow-y-auto overflow-x-hidden p-6 scrollbar-hide">
								{children}
							</div>

							{/* Chat Input Area - fixed height at bottom */}
							<div className="flex-shrink-0 p-4 border-t border-border bg-background">
								<div
									className={cn(
										"transition-all duration-300",
										rightDrawerOpen && !hideTools ? "mr-72" : "mr-0",
									)}
								>
									<div className="bg-background border border-border rounded-lg shadow-lg p-4">
										<div className="flex flex-col gap-3">
											{/* Model Selection and Controls */}
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Select value={selectedModel} onValueChange={setSelectedModel}>
														<SelectTrigger className="w-32">
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
												</div>
												<div className="flex items-center gap-2">
													<Button variant="outline" size="sm">
														<Play className="w-3 h-3 mr-1" />
														Start
													</Button>
													<Button variant="outline" size="sm">
														<Pause className="w-3 h-3 mr-1" />
														Pause
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
													>
														<Wrench className="w-3 h-3 mr-1" />
														Tools
													</Button>
												</div>
											</div>

											{/* Message Input */}
											<div className="flex gap-2">
												<Textarea
													placeholder="Type your message..."
													value={chatMessage}
													onChange={(e) => setChatMessage(e.target.value)}
													onKeyPress={handleKeyPress}
													className="flex-1 min-h-[60px] resize-none"
												/>
												<Button
													onClick={handleSendMessage}
													disabled={!chatMessage.trim()}
													className="self-end h-[60px] w-12 p-0"
													size="sm"
												>
													<ArrowUp className="w-4 h-4" />
												</Button>
											</div>
										</div>
									</div>
								</div>
							</div>
						</>
					) : (
						/* When chat is hidden, just show children */
						<div className="flex-1 overflow-y-auto overflow-x-hidden p-6 scrollbar-hide">
							{children}
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
						<div className="flex-1 overflow-auto p-4 space-y-6">
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

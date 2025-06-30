import React from "react";
import {
	Plus,
	Trash2,
	Archive,
	MoreVertical,
	FolderPlus,
	MessageSquare,
	RefreshCw,
	Download,
	Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useActiveSession } from "@/hooks/use-active-session";
import { useSessionNavigation } from "@/hooks/use-session-navigation";
import { useState } from "react";

interface SessionActionsProps {
	sessionId?: string;
	projectPath?: string;
	onNewSession?: () => void;
	onDeleteSession?: (sessionId: string) => void;
	onArchiveSession?: (sessionId: string) => void;
	variant?: "navbar" | "page" | "minimal";
	className?: string;
}

/**
 * Session action buttons component
 * Provides common actions for sessions like create, delete, archive
 */
export function SessionActions({
	sessionId,
	projectPath,
	onNewSession,
	onDeleteSession,
	onArchiveSession,
	variant = "navbar",
	className,
}: SessionActionsProps) {
	const { createAndActivateSession, isCreating } = useActiveSession();
	const { navigateToNewSession, navigateToSession } = useSessionNavigation();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showArchiveDialog, setShowArchiveDialog] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isArchiving, setIsArchiving] = useState(false);

	const handleNewSession = async () => {
		if (onNewSession) {
			onNewSession();
		} else if (projectPath) {
			try {
				const session = await createAndActivateSession(projectPath);
				if (session) {
					navigateToSession(session.id);
				}
			} catch (error) {
				console.error("Failed to create session:", error);
			}
		} else {
			navigateToNewSession();
		}
	};

	const handleDeleteSession = async () => {
		if (!sessionId || !onDeleteSession) return;

		setIsDeleting(true);
		try {
			await onDeleteSession(sessionId);
			setShowDeleteDialog(false);
		} catch (error) {
			console.error("Failed to delete session:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleArchiveSession = async () => {
		if (!sessionId || !onArchiveSession) return;

		setIsArchiving(true);
		try {
			await onArchiveSession(sessionId);
			setShowArchiveDialog(false);
		} catch (error) {
			console.error("Failed to archive session:", error);
		} finally {
			setIsArchiving(false);
		}
	};

	if (variant === "minimal") {
		return (
			<div className={className}>
				<Button
					size="icon"
					variant="ghost"
					onClick={handleNewSession}
					disabled={isCreating}
					title="New Session"
				>
					{isCreating ? (
						<RefreshCw className="h-4 w-4 animate-spin" />
					) : (
						<Plus className="h-4 w-4" />
					)}
				</Button>
			</div>
		);
	}

	if (variant === "navbar") {
		return (
			<>
				<div className={className}>
					<Button
						size="icon"
						variant="ghost"
						onClick={handleNewSession}
						disabled={isCreating}
						className="h-6 w-6"
						title={projectPath ? `New session in ${projectPath}` : "New session"}
					>
						{isCreating ? (
							<RefreshCw className="h-3 w-3 animate-spin" />
						) : (
							<Plus className="h-3 w-3" />
						)}
					</Button>
				</div>

				{/* Delete confirmation dialog */}
				<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete Session</DialogTitle>
							<DialogDescription>
								Are you sure you want to delete this session? This action cannot be undone.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
								Cancel
							</Button>
							<Button variant="destructive" onClick={handleDeleteSession} disabled={isDeleting}>
								{isDeleting ? "Deleting..." : "Delete"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</>
		);
	}

	// Full page variant
	return (
		<>
			<div className={className}>
				<div className="flex items-center gap-2">
					<Button onClick={handleNewSession} disabled={isCreating} size="sm">
						{isCreating ? (
							<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
						) : projectPath ? (
							<FolderPlus className="h-4 w-4 mr-2" />
						) : (
							<MessageSquare className="h-4 w-4 mr-2" />
						)}
						{projectPath ? "New Session in Project" : "New Session"}
					</Button>

					{sessionId && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon">
									<MoreVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>Session Actions</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => navigator.clipboard.writeText(sessionId)}>
									Copy Session ID
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Download className="h-4 w-4 mr-2" />
									Export Session
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Upload className="h-4 w-4 mr-2" />
									Import to Session
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								{onArchiveSession && (
									<DropdownMenuItem onClick={() => setShowArchiveDialog(true)}>
										<Archive className="h-4 w-4 mr-2" />
										Archive Session
									</DropdownMenuItem>
								)}
								{onDeleteSession && (
									<DropdownMenuItem
										onClick={() => setShowDeleteDialog(true)}
										className="text-destructive"
									>
										<Trash2 className="h-4 w-4 mr-2" />
										Delete Session
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>

			{/* Delete confirmation dialog */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Session</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this session? This action cannot be undone. All
							conversation history will be permanently removed.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDeleteSession} disabled={isDeleting}>
							{isDeleting ? (
								<>
									<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
									Deleting...
								</>
							) : (
								"Delete Session"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Archive confirmation dialog */}
			<Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Archive Session</DialogTitle>
						<DialogDescription>
							Are you sure you want to archive this session? Archived sessions can be restored later
							from the archives.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowArchiveDialog(false)}>
							Cancel
						</Button>
						<Button onClick={handleArchiveSession} disabled={isArchiving}>
							{isArchiving ? (
								<>
									<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
									Archiving...
								</>
							) : (
								"Archive Session"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

import type { LucideIcon } from "lucide-react";
import { CheckCircle, Clock, Loader2, StopCircle, XCircle } from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ToolStatus = "pending" | "completed" | "failed" | "in_progress" | "interrupted";

export interface StatusConfig {
	icon: LucideIcon;
	color: string;
	bgColor: string;
	badgeVariant: "default" | "secondary" | "destructive" | "outline";
	label: string;
}

export interface StatusBadgeProps {
	status: ToolStatus;
	className?: string;
	showLabel?: boolean;
}

/**
 * Returns icon, colors, and styling for a given status
 * Maps each status to appropriate Lucide icon and Tailwind colors
 */
export function getStatusConfig(status: ToolStatus): StatusConfig {
	switch (status) {
		case "pending":
			return {
				icon: Clock,
				color: "text-yellow-500",
				bgColor: "bg-yellow-500/10",
				badgeVariant: "outline",
				label: "Pending",
			};
		case "in_progress":
			return {
				icon: Loader2,
				color: "text-blue-500",
				bgColor: "bg-blue-500/10",
				badgeVariant: "default",
				label: "In Progress",
			};
		case "completed":
			return {
				icon: CheckCircle,
				color: "text-green-500",
				bgColor: "bg-green-500/10",
				badgeVariant: "secondary",
				label: "Completed",
			};
		case "failed":
			return {
				icon: XCircle,
				color: "text-red-500",
				bgColor: "bg-red-500/10",
				badgeVariant: "destructive",
				label: "Failed",
			};
		case "interrupted":
			return {
				icon: StopCircle,
				color: "text-orange-500",
				bgColor: "bg-orange-500/10",
				badgeVariant: "outline",
				label: "Interrupted",
			};
		default:
			return {
				icon: Clock,
				color: "text-gray-500",
				bgColor: "bg-gray-500/10",
				badgeVariant: "outline",
				label: "Unknown",
			};
	}
}

/**
 * Returns just the icon component for a status
 * Quick access to status icon without full config
 */
export function getStatusIcon(status: ToolStatus): LucideIcon {
	return getStatusConfig(status).icon;
}

/**
 * Reusable status badge component
 * Renders icon + optional label with consistent styling
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
	status,
	className,
	showLabel = true,
}) => {
	const config = getStatusConfig(status);
	const Icon = config.icon;

	return (
		<Badge variant={config.badgeVariant} className={cn("flex items-center gap-1", className)}>
			<Icon className={cn("w-3 h-3", config.color, status === "in_progress" && "animate-spin")} />
			{showLabel && <span className="text-xs">{config.label}</span>}
		</Badge>
	);
};

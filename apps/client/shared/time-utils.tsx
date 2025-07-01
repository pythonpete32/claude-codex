import type React from "react";
import { cn } from "@/lib/utils";

export interface TimeDisplayProps {
	timestamp: string;
	format?: "relative" | "absolute" | "both";
	className?: string;
}

/**
 * Formats ISO timestamp for display
 * "relative" = "2 min ago", "absolute" = "14:30:45"
 */
export function formatTimestamp(
	timestamp: string,
	format: "relative" | "absolute" = "relative",
): string {
	const date = new Date(timestamp);
	const now = new Date();

	if (format === "absolute") {
		return date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		});
	}

	// Relative format
	const diffMs = now.getTime() - date.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSeconds < 60) {
		return diffSeconds <= 1 ? "just now" : `${diffSeconds}s ago`;
	} else if (diffMinutes < 60) {
		return `${diffMinutes} min ago`;
	} else if (diffHours < 24) {
		return `${diffHours}h ago`;
	} else if (diffDays < 7) {
		return `${diffDays}d ago`;
	} else {
		// For older dates, show absolute format
		return date.toLocaleDateString([], {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}
}

/**
 * Calculates and formats execution duration
 * Smart unit selection (ms/s/min) based on duration
 */
export function formatDuration(startTime: string, endTime?: string): string {
	const start = new Date(startTime);
	const end = endTime ? new Date(endTime) : new Date();

	const durationMs = end.getTime() - start.getTime();

	if (durationMs < 1000) {
		return `${durationMs}ms`;
	} else if (durationMs < 60000) {
		const seconds = (durationMs / 1000).toFixed(1);
		return `${seconds}s`;
	} else {
		const minutes = Math.floor(durationMs / 60000);
		const seconds = Math.floor((durationMs % 60000) / 1000);
		return `${minutes}m ${seconds}s`;
	}
}

/**
 * Reusable timestamp display component
 * Consistent time display with tooltip for full timestamp
 */
export const TimeDisplay: React.FC<TimeDisplayProps> = ({
	timestamp,
	format = "relative",
	className,
}) => {
	const formattedTime = formatTimestamp(timestamp, format);
	const absoluteTime = formatTimestamp(timestamp, "absolute");
	const fullDate = new Date(timestamp).toLocaleString();

	if (format === "both") {
		return (
			<span className={cn("text-xs text-muted-foreground", className)} title={fullDate}>
				{formattedTime} ({absoluteTime})
			</span>
		);
	}

	return (
		<span
			className={cn("text-xs text-muted-foreground", className)}
			title={
				format === "relative" ? fullDate : `${formatTimestamp(timestamp, "relative")} (${fullDate})`
			}
		>
			{formattedTime}
		</span>
	);
};

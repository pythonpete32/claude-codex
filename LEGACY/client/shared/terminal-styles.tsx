import type React from "react";
import { cn } from "@/lib/utils";

export interface TerminalTheme {
	background: string;
	foreground: string;
	accent: string;
	success: string;
	error: string;
	warning: string;
	muted: string;
}

export interface TerminalTextProps {
	children: React.ReactNode;
	variant?: "stdout" | "stderr" | "command" | "comment";
	className?: string;
}

/**
 * Returns current terminal color scheme
 * Respects light/dark mode, consistent across components
 */
export function getTerminalTheme(): TerminalTheme {
	return {
		background: "bg-gray-900 dark:bg-gray-950",
		foreground: "text-gray-300 dark:text-gray-200",
		accent: "text-blue-400 dark:text-blue-300",
		success: "text-green-400 dark:text-green-300",
		error: "text-red-400 dark:text-red-300",
		warning: "text-yellow-400 dark:text-yellow-300",
		muted: "text-gray-500 dark:text-gray-400",
	};
}

/**
 * Get terminal color classes for different text variants
 */
function getVariantClasses(variant: TerminalTextProps["variant"]): string {
	const theme = getTerminalTheme();

	switch (variant) {
		case "stdout":
			return theme.foreground;
		case "stderr":
			return theme.error;
		case "command":
			return theme.accent;
		case "comment":
			return theme.muted;
		default:
			return theme.foreground;
	}
}

/**
 * Styled text for terminal content
 * Applies consistent terminal typography and colors
 */
export const TerminalText: React.FC<TerminalTextProps> = ({
	children,
	variant = "stdout",
	className,
}) => {
	const variantClasses = getVariantClasses(variant);

	return (
		<span className={cn("font-mono text-sm leading-relaxed", variantClasses, className)}>
			{children}
		</span>
	);
};

/**
 * Terminal window container with consistent styling
 */
export const TerminalContainer: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = ({ children, className }) => {
	const theme = getTerminalTheme();

	return (
		<div
			className={cn(
				"rounded-md border border-gray-700 overflow-hidden",
				theme.background,
				className,
			)}
		>
			{children}
		</div>
	);
};

/**
 * Terminal header with consistent styling
 */
export const TerminalHeader: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = ({ children, className }) => {
	return (
		<div
			className={cn(
				"flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/50",
				className,
			)}
		>
			{children}
		</div>
	);
};

/**
 * Terminal content area with scrolling
 */
export const TerminalContent: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = ({ children, className }) => {
	const theme = getTerminalTheme();

	return (
		<div className={cn("p-3 overflow-auto max-h-96", theme.background, className)}>{children}</div>
	);
};

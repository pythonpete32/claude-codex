import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
	error?: Error | null;
	onRetry?: () => void;
	className?: string;
	variant?: "default" | "compact";
	title?: string;
	description?: string;
}

/**
 * Error state component for showing error messages with retry functionality
 */
export function ErrorState({
	error,
	onRetry,
	className,
	variant = "default",
	title = "Something went wrong",
	description,
}: ErrorStateProps) {
	const errorMessage = description || error?.message || "An unexpected error occurred";

	if (variant === "compact") {
		return (
			<div className={cn("flex items-center gap-2 p-2 text-sm text-destructive", className)}>
				<AlertCircle className="h-4 w-4" />
				<span className="flex-1">{errorMessage}</span>
				{onRetry && (
					<Button size="sm" variant="ghost" onClick={onRetry} className="h-6 px-2">
						<RefreshCw className="h-3 w-3" />
					</Button>
				)}
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
			<div className="rounded-full bg-destructive/10 p-3 mb-4">
				<AlertCircle className="h-6 w-6 text-destructive" />
			</div>
			<h3 className="text-lg font-semibold mb-2">{title}</h3>
			<p className="text-sm text-muted-foreground mb-4 max-w-sm">{errorMessage}</p>
			{onRetry && (
				<Button onClick={onRetry} size="sm" variant="outline">
					<RefreshCw className="h-4 w-4 mr-2" />
					Try Again
				</Button>
			)}
		</div>
	);
}

/**
 * Navbar-specific error state
 */
export function NavbarError({ onRetry }: { onRetry?: () => void }) {
	return (
		<div className="fixed left-4 top-4 bottom-4 w-64 bg-background border border-border rounded-lg shadow-lg p-4">
			<div className="h-full flex flex-col items-center justify-center">
				<div className="rounded-full bg-destructive/10 p-4 mb-4">
					<WifiOff className="h-8 w-8 text-destructive" />
				</div>
				<h3 className="text-base font-semibold mb-2">Connection Error</h3>
				<p className="text-sm text-muted-foreground text-center mb-4">
					Unable to load projects and sessions
				</p>
				{onRetry && (
					<Button onClick={onRetry} size="sm" variant="outline" className="w-full">
						<RefreshCw className="h-4 w-4 mr-2" />
						Retry
					</Button>
				)}
			</div>
		</div>
	);
}

/**
 * Inline error message for form fields or small areas
 */
export function InlineError({ error, className }: { error: string; className?: string }) {
	return (
		<div className={cn("flex items-center gap-1 text-sm text-destructive", className)}>
			<AlertCircle className="h-3 w-3" />
			<span>{error}</span>
		</div>
	);
}

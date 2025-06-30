import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
	className?: string;
	variant?: "default" | "text" | "circular" | "rectangular";
	width?: string | number;
	height?: string | number;
	animate?: boolean;
}

/**
 * Loading skeleton component for showing placeholder content while data loads
 */
export function LoadingSkeleton({
	className,
	variant = "default",
	width,
	height,
	animate = true,
}: LoadingSkeletonProps) {
	const baseClasses = cn(
		"bg-muted/50",
		animate && "animate-pulse",
		variant === "circular" && "rounded-full",
		variant === "text" && "h-4 rounded",
		variant === "rectangular" && "rounded-md",
		className,
	);

	const style: React.CSSProperties = {
		width: width || (variant === "text" ? "100%" : undefined),
		height: height || (variant === "text" ? "1rem" : undefined),
	};

	return <div className={baseClasses} style={style} />;
}

/**
 * Navbar-specific loading skeleton
 */
export function NavbarSkeleton() {
	return (
		<div className="fixed left-4 top-4 bottom-4 w-64 bg-background border border-border rounded-lg shadow-lg p-4 space-y-4">
			{/* Header skeleton */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<LoadingSkeleton variant="circular" width={32} height={32} />
					<LoadingSkeleton variant="text" width={100} />
				</div>
				<LoadingSkeleton variant="rectangular" width={32} height={32} />
			</div>

			{/* Navigation items skeleton */}
			<div className="space-y-1">
				{[1, 2, 3, 4].map((i) => (
					<LoadingSkeleton key={i} variant="rectangular" height={36} className="mb-1" />
				))}
			</div>

			<div className="border-t border-border my-4" />

			{/* Sessions header skeleton */}
			<div className="flex items-center justify-between mb-3">
				<LoadingSkeleton variant="text" width={80} />
				<LoadingSkeleton variant="rectangular" width={24} height={24} />
			</div>

			{/* Search skeleton */}
			<LoadingSkeleton variant="rectangular" height={32} className="mb-3" />

			{/* Project tree skeleton */}
			<div className="space-y-2">
				{[1, 2, 3].map((i) => (
					<div key={i}>
						<LoadingSkeleton variant="rectangular" height={28} className="mb-1" />
						{i === 1 && (
							<div className="ml-4 space-y-1">
								<LoadingSkeleton variant="rectangular" height={24} className="mb-1" />
								<LoadingSkeleton variant="rectangular" height={24} className="mb-1" />
							</div>
						)}
					</div>
				))}
			</div>

			{/* User section skeleton */}
			<div className="mt-auto pt-4 border-t border-border">
				<LoadingSkeleton variant="rectangular" height={36} />
			</div>
		</div>
	);
}

/**
 * Project item loading skeleton
 */
export function ProjectItemSkeleton() {
	return (
		<div className="flex items-center gap-2 p-2">
			<LoadingSkeleton variant="circular" width={16} height={16} />
			<LoadingSkeleton variant="text" className="flex-1" />
			<LoadingSkeleton variant="rectangular" width={24} height={16} />
		</div>
	);
}

/**
 * Session item loading skeleton
 */
export function SessionItemSkeleton() {
	return (
		<div className="flex items-center gap-2 p-2 ml-4">
			<LoadingSkeleton variant="circular" width={8} height={8} />
			<LoadingSkeleton variant="text" className="flex-1" />
		</div>
	);
}

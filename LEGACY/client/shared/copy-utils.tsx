import { Copy } from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UseCopyToClipboardReturn {
	copied: boolean;
	copy: (text: string) => Promise<void>;
	error: string | null;
}

export interface CopyButtonProps {
	text: string;
	label?: string;
	className?: string;
	size?: "sm" | "md" | "lg";
	variant?: "ghost" | "outline" | "default";
}

/**
 * React hook for clipboard operations with state management
 * Manages clipboard operation, auto-resets copied state after 2 seconds
 */
export function useCopyToClipboard(): UseCopyToClipboardReturn {
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const copy = useCallback(async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setError(null);

			// Auto-reset copied state after 2 seconds
			setTimeout(() => {
				setCopied(false);
			}, 2000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to copy to clipboard");
			setCopied(false);
		}
	}, []);

	return { copied, copy, error };
}

/**
 * Reusable copy button with consistent styling
 * Button with copy icon, shows "Copied!" feedback briefly
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
	text,
	label,
	className,
	size = "sm",
	variant = "ghost",
}) => {
	const { copied, copy } = useCopyToClipboard();

	const handleCopy = () => {
		copy(text);
	};

	const sizeClasses = {
		sm: "h-6 px-2",
		md: "h-8 px-3",
		lg: "h-10 px-4",
	};

	const iconSizes = {
		sm: "w-3 h-3",
		md: "w-4 h-4",
		lg: "w-5 h-5",
	};

	return (
		<Button
			variant={variant}
			size={size}
			onClick={handleCopy}
			className={cn(sizeClasses[size], "flex items-center gap-1", className)}
			title={copied ? "Copied!" : `Copy ${label || "content"}`}
		>
			<Copy className={iconSizes[size]} />
			{copied ? (
				<span className="text-xs text-green-600">Copied!</span>
			) : (
				label && <span className="text-xs">{label}</span>
			)}
		</Button>
	);
};

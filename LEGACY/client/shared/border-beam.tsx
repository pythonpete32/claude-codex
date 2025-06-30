import { cn } from "@/lib/utils";

interface BorderBeamProps {
	className?: string;
	size?: number;
	duration?: number;
	borderWidth?: number;
	colorFrom?: string;
	colorTo?: string;
	delay?: number;
}

export const BorderBeam = ({
	className,
	size = 200,
	duration = 8,
	borderWidth = 1,
	colorFrom = "#3b82f6",
	colorTo = "#06b6d4",
	delay = 0,
}: BorderBeamProps) => {
	return (
		<div
			style={
				{
					"--duration": `${duration}s`,
					animation: `gradient-x var(--duration) ease-in-out infinite`,
				} as React.CSSProperties
			}
			className={cn(
				"pointer-events-none absolute inset-0 rounded-[inherit] p-[1px]",
				"bg-gradient-to-r from-blue-500/50 via-cyan-400/50 to-blue-500/50",
				"bg-[length:200%_200%]",
				"[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]",
				"[mask-composite:xor]",
				"[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]",
				"[-webkit-mask-composite:xor]",
				className,
			)}
		/>
	);
};

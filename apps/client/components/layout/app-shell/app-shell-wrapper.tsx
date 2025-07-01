"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AppShell } from "./app-shell";

interface AppShellWrapperProps {
	children?: React.ReactNode;
	className?: string;
}

export function AppShellWrapper({ children, className }: AppShellWrapperProps) {
	const [selectedSession, setSelectedSession] = React.useState<string | null>(null);

	return (
		<div className={cn("min-h-screen overflow-hidden flex flex-col", className)}>
			<AppShell onSelectSession={setSelectedSession}>{children}</AppShell>
		</div>
	);
}

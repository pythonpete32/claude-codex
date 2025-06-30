"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { ApiClientProvider } from "@/hooks/use-api-client";
import { QueryProvider } from "@/providers/query-provider";

interface ProvidersProps {
	children: ReactNode;
}

/**
 * Root providers component that wraps the application
 * with all necessary context providers
 */
export function Providers({ children }: ProvidersProps) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="dark"
			enableSystem={false}
			disableTransitionOnChange
		>
			<QueryProvider>
				<ApiClientProvider>{children}</ApiClientProvider>
			</QueryProvider>
		</ThemeProvider>
	);
}

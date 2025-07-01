"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReadTool } from "@/components/tools/read";

export default function ReadToolPage() {
	const timestamp = new Date().toISOString();

	return (
		<div className="min-h-screen bg-gray-950 p-8">
			<div className="max-w-6xl mx-auto">
				<Link 
					href="/tools" 
					className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Tools
				</Link>
				
				<h1 className="text-3xl font-bold text-white mb-8">Read Tool Examples</h1>
				
				<div className="space-y-8">
					{/* Example 1: TypeScript file */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">1. TypeScript Component</h2>
						<ReadTool
							id="read-1"
							uuid="uuid-read-1"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							filePath="/src/components/Button.tsx"
							content={`import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-colors',
        {
          'bg-blue-500 text-white hover:bg-blue-600': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          'bg-transparent text-gray-700 hover:bg-gray-100': variant === 'ghost',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};`}
							fileSize={892}
							totalLines={33}
							fileType="tsx"
							language="typescript"
							duration={23}
							description="Reading React component file"
						/>
					</section>

					{/* Example 2: JSON config */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">2. JSON Configuration</h2>
						<ReadTool
							id="read-2"
							uuid="uuid-read-2"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							filePath="/package.json"
							content={`{
  "name": "@claude-codex/client",
  "version": "1.0.0",
  "description": "Claude Codex client application",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "framer-motion": "^10.0.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}`}
							fileSize={524}
							totalLines={24}
							fileType="json"
							language="json"
							duration={15}
						/>
					</section>

					{/* Example 3: Error case */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">3. File Not Found</h2>
						<ReadTool
							id="read-3"
							uuid="uuid-read-3"
							timestamp={timestamp}
							status={{ normalized: "failed", original: "error" }}
							filePath="/src/missing-file.ts"
							content=""
							errorMessage="File not found: /src/missing-file.ts"
						/>
					</section>

					{/* Example 4: Truncated file */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">4. Large Truncated File</h2>
						<ReadTool
							id="read-4"
							uuid="uuid-read-4"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							filePath="/logs/application.log"
							content={`[2024-01-15 10:00:00] INFO: Application started
[2024-01-15 10:00:01] INFO: Loading configuration from config.json
[2024-01-15 10:00:02] INFO: Connecting to database...
[2024-01-15 10:00:03] INFO: Database connection established
[2024-01-15 10:00:04] INFO: Starting HTTP server on port 3000
[2024-01-15 10:00:05] INFO: Server started successfully
[2024-01-15 10:00:10] INFO: GET /api/health - 200 OK (5ms)
[2024-01-15 10:00:15] INFO: GET /api/users - 200 OK (23ms)
[2024-01-15 10:00:20] WARN: Slow query detected: SELECT * FROM orders (125ms)
[2024-01-15 10:00:25] INFO: POST /api/users - 201 Created (45ms)
[2024-01-15 10:00:30] ERROR: Failed to process payment: Connection timeout
[2024-01-15 10:00:31] INFO: Retrying payment processing...
[2024-01-15 10:00:35] INFO: Payment processed successfully on retry
[2024-01-15 10:00:40] INFO: Cache hit for key: user:123
[2024-01-15 10:00:45] INFO: Background job started: email-notifications`}
							fileSize={2097152} // 2MB
							totalLines={50000}
							truncated={true}
							duration={87}
							description="Reading large log file (truncated)"
						/>
					</section>

					{/* Example 5: Binary file */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">5. Binary File</h2>
						<ReadTool
							id="read-5"
							uuid="uuid-read-5"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							filePath="/assets/logo.png"
							content="\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00"
							fileSize={45678}
							fileType="png"
							duration={34}
						/>
					</section>

					{/* Example 6: Empty file */}
					<section>
						<h2 className="text-xl font-semibold text-gray-300 mb-4">6. Empty File</h2>
						<ReadTool
							id="read-6"
							uuid="uuid-read-6"
							timestamp={timestamp}
							status={{ normalized: "completed" }}
							filePath="/src/utils/placeholder.ts"
							content=""
							fileSize={0}
							totalLines={0}
							fileType="ts"
							duration={8}
							description="Reading empty TypeScript file"
						/>
					</section>
				</div>
			</div>
		</div>
	);
}
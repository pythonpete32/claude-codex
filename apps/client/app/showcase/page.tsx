"use client";

import React from "react";
import { BashTool } from "@/components/chat-items/bash-tool";
import { EditTool } from "@/components/chat-items/edit-tool";
import { GlobTool } from "@/components/chat-items/glob-tool";
import { GrepTool } from "@/components/chat-items/grep-tool";
import { LsTool } from "@/components/chat-items/ls-tool";
import { MultiEditTool } from "@/components/chat-items/multi-edit-tool";
import { ReadTool } from "@/components/chat-items/read-tool";

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Chat Items Showcase</h1>
          <p className="text-muted-foreground">
            A collection of all available chat item components
          </p>
        </div>

        {/* Bash Tool */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Bash Tool</h2>
          <div className="grid gap-4">
            <BashTool
              command="npm install --save react framer-motion"
              description="Installing React dependencies"
              output="added 245 packages, and audited 1337 packages in 3s\n\nfound 0 vulnerabilities"
              status="completed"
              duration={3247}
              timestamp="2024-06-28 23:45:12"
              animated={true}
            />
            <BashTool
              command="bun test --watch"
              description="Running tests in watch mode"
              status="running"
              animated={true}
            />
          </div>
        </section>

        {/* Edit Tool */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Edit Tool</h2>
          <EditTool
            filePath="/src/components/Button.tsx"
            oldContent="export const Button = ({ children }) => {"
            newContent="export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary' }) => {"
            status="completed"
            description="Adding TypeScript types to Button component"
            timestamp="2024-06-28 23:45:12"
          />
        </section>

        {/* Glob Tool */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Glob Tool</h2>
          <GlobTool
            pattern="**/*.tsx"
            matches={[
              { filePath: "/src/components/Button.tsx", isDirectory: false },
              { filePath: "/src/components/Card.tsx", isDirectory: false },
              { filePath: "/src/components/Input.tsx", isDirectory: false },
              { filePath: "/src/components/Layout.tsx", isDirectory: false },
            ]}
            status="completed"
            description="Finding all TypeScript React files"
            timestamp="2024-06-28 23:45:12"
          />
        </section>

        {/* Grep Tool */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Grep Tool</h2>
          <GrepTool
            pattern="useState"
            searchPath="/src"
            fileMatches={[
              {
                filePath: "/src/components/Counter.tsx",
                matches: [
                  {
                    line: 5,
                    content: "const [count, setCount] = useState(0);",
                    matchStart: 26,
                    matchEnd: 34,
                  },
                ],
                totalMatches: 1,
              },
              {
                filePath: "/src/components/Form.tsx",
                matches: [
                  {
                    line: 12,
                    content: "const [values, setValues] = useState({});",
                    matchStart: 28,
                    matchEnd: 36,
                  },
                ],
                totalMatches: 1,
              },
            ]}
            status="completed"
            description="Searching for React hooks usage"
            timestamp="2024-06-28 23:45:12"
          />
        </section>

        {/* LS Tool */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">LS Tool</h2>
          <LsTool
            path="/src/components"
            files={[
              { name: "Button.tsx", type: "file", size: 1234, extension: "tsx" },
              { name: "Card.tsx", type: "file", size: 567, extension: "tsx" },
              { name: "ui", type: "directory" },
              { name: "hooks", type: "directory" },
            ]}
            status="completed"
            description="Listing component directory contents"
            timestamp="2024-06-28 23:45:12"
          />
        </section>

        {/* Multi Edit Tool */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Multi Edit Tool</h2>
          <MultiEditTool
            fileEdits={[
              {
                filePath: "/src/utils/constants.ts",
                oldContent: "const API_URL = 'http://localhost:3000';",
                newContent: "const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';",
              },
              {
                filePath: "/src/utils/constants.ts",
                oldContent: "const TIMEOUT = 5000;",
                newContent: "const TIMEOUT = 10000;",
              },
            ]}
            status="completed"
            description="Updating configuration constants"
            timestamp="2024-06-28 23:45:12"
          />
        </section>

        {/* Read Tool */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Read Tool</h2>
          <ReadTool
            filePath="/src/components/Button.tsx"
            content={`import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  onClick?: () => void;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  className
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-colors',
        {
          'bg-blue-500 hover:bg-blue-600 text-white': variant === 'primary',
          'bg-gray-200 hover:bg-gray-300 text-gray-800': variant === 'secondary',
          'border border-gray-300 hover:bg-gray-50': variant === 'outline',
        },
        className
      )}
    >
      {children}
    </button>
  );
};`}
            status="completed"
            totalLines={32}
            description="Reading Button component source"
            timestamp="2024-06-28 23:45:12"
          />
        </section>
      </div>
    </div>
  );
}
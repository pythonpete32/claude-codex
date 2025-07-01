import type { Meta, StoryObj } from "@storybook/react";
import { ReadTool } from "./read-tool";

const meta = {
	title: "Chat Items/Read Tool",
	component: ReadTool,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		status: {
			control: { type: "select" },
			options: ["pending", "completed", "error"],
		},
		showLineNumbers: {
			control: { type: "boolean" },
		},
	},
} satisfies Meta<typeof ReadTool>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleCode = `import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Counter = () => {
  const [count, setCount] = useState(0);
  
  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Counter Component</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Button onClick={() => setCount(count - 1)}>-</Button>
          <span className="text-2xl font-bold">{count}</span>
          <Button onClick={() => setCount(count + 1)}>+</Button>
        </div>
      </CardContent>
    </Card>
  );
};`;

export const Default: Story = {
	args: {
		filePath: "/Users/user/project/src/components/Counter.tsx",
		content: sampleCode,
		description: "React component with TypeScript",
		status: "completed",
		timestamp: "2024-06-28 23:45:12",
		fileSize: 1024,
		totalLines: 20,
	},
};

export const LargeFile: Story = {
	args: {
		filePath: "/Users/user/project/src/App.tsx",
		content: sampleCode,
		description: "Large file with pagination",
		status: "completed",
		timestamp: "2024-06-28 23:45:12",
		fileSize: 15680,
		totalLines: 500,
		startLine: 1,
		endLine: 20,
	},
};

export const JSONFile: Story = {
	args: {
		filePath: "/Users/user/project/package.json",
		content: `{
  "name": "atomic-codex-ui",
  "version": "1.0.0",
  "description": "UI components for atomic codex",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "storybook": "storybook dev -p 6006"
  },
  "dependencies": {
    "react": "^19.1.0",
    "framer-motion": "^12.19.2"
  }
}`,
		description: "Package configuration file",
		status: "completed",
		timestamp: "2024-06-28 23:45:12",
		fileSize: 512,
	},
};

export const BinaryFile: Story = {
	args: {
		filePath: "/Users/user/project/assets/logo.png",
		content: "",
		description: "Binary image file",
		status: "completed",
		timestamp: "2024-06-28 23:45:12",
		fileSize: 45678,
	},
};

export const NoLineNumbers: Story = {
	args: {
		filePath: "/Users/user/project/README.md",
		content: `# Atomic Codex UI Components

A comprehensive library of React components for building chat interfaces and displaying tool results from Claude conversations.

## Features

- **Bash Tool**: Display terminal commands with syntax highlighting
- **File Tools**: File browsers, code viewers, and editors
- **Search Tools**: Grep and glob result displays
- **Magic UI Integration**: Beautiful animations and effects

## Installation

\`\`\`bash
bun add @dao/ui-components
\`\`\``,
		description: "Markdown documentation",
		status: "completed",
		showLineNumbers: false,
		timestamp: "2024-06-28 23:45:12",
		fileSize: 1024,
	},
};

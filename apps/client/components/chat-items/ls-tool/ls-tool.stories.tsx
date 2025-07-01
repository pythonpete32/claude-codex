import type { Meta, StoryObj } from "@storybook/react";
import { LsTool } from "./ls-tool";

const meta = {
	title: "Chat Items/LS Tool",
	component: LsTool,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		status: {
			control: { type: "select" },
			options: ["pending", "completed", "failed", "in_progress", "interrupted"],
		},
	},
} satisfies Meta<typeof LsTool>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleEntries = [
	{
		name: ".git",
		type: "directory" as const,
		hidden: true,
		permissions: "drwxr-xr-x",
		lastModified: "2024-06-28T23:45:00Z",
	},
	{
		name: ".env",
		type: "file" as const,
		size: 245,
		hidden: true,
		permissions: "-rw-r--r--",
		lastModified: "2024-06-28T10:30:00Z",
	},
	{
		name: "node_modules",
		type: "directory" as const,
		hidden: false,
		permissions: "drwxr-xr-x",
		lastModified: "2024-06-28T15:22:00Z",
	},
	{
		name: "src",
		type: "directory" as const,
		hidden: false,
		permissions: "drwxr-xr-x",
		lastModified: "2024-06-28T23:40:00Z",
	},
	{
		name: "package.json",
		type: "file" as const,
		size: 1520,
		hidden: false,
		permissions: "-rw-r--r--",
		lastModified: "2024-06-28T22:15:00Z",
	},
	{
		name: "README.md",
		type: "file" as const,
		size: 2847,
		hidden: false,
		permissions: "-rw-r--r--",
		lastModified: "2024-06-28T18:30:00Z",
	},
	{
		name: "App.tsx",
		type: "file" as const,
		size: 892,
		hidden: false,
		permissions: "-rw-r--r--",
		lastModified: "2024-06-28T23:45:00Z",
	},
	{
		name: "vite.config.ts",
		type: "file" as const,
		size: 456,
		hidden: false,
		permissions: "-rw-r--r--",
		lastModified: "2024-06-28T20:10:00Z",
	},
];

export const Default: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "ls_default",
			name: "LS",
			input: {
				path: "/Users/user/atomic-codex/packages/ui-components",
			},
		},
		status: "completed",
		timestamp: "2024-06-28T23:45:12.000Z",
		toolResult: {
			entries: sampleEntries,
			entryCount: sampleEntries.length,
			path: "/Users/user/atomic-codex/packages/ui-components",
			isError: false,
		},
	},
};

export const WithIgnorePatterns: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "ls_ignore",
			name: "LS",
			input: {
				path: "/Users/user/projects/react-app",
				ignore: ["*.log", "*.tmp"],
			},
		},
		status: "completed",
		timestamp: "2024-06-28T23:45:12.000Z",
		toolResult: {
			entries: sampleEntries.slice(2), // Exclude hidden files
			entryCount: sampleEntries.length - 2,
			path: "/Users/user/projects/react-app",
			isError: false,
		},
	},
};

export const EmptyDirectory: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "ls_empty",
			name: "LS",
			input: {
				path: "/tmp/empty-folder",
			},
		},
		status: "completed",
		timestamp: "2024-06-28T23:45:12.000Z",
		toolResult: {
			entries: [],
			entryCount: 0,
			path: "/tmp/empty-folder",
			isError: false,
		},
	},
};

export const PendingState: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "ls_pending",
			name: "LS",
			input: {
				path: "/Users/user/loading-folder",
			},
		},
		status: "pending",
		timestamp: "2024-06-28T23:45:12.000Z",
		toolResult: {
			entries: [],
			entryCount: 0,
			path: "/Users/user/loading-folder",
			isError: false,
		},
	},
};

export const InProgressState: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "ls_running",
			name: "LS",
			input: {
				path: "/var/log",
			},
		},
		status: "in_progress",
		timestamp: "2024-06-28T23:45:12.000Z",
		toolResult: {
			entries: [],
			entryCount: 0,
			path: "/var/log",
			isError: false,
		},
	},
};

export const FailedState: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "ls_failed",
			name: "LS",
			input: {
				path: "/nonexistent/directory",
			},
		},
		status: "failed",
		timestamp: "2024-06-28T23:45:12.000Z",
		toolResult: {
			entries: [],
			entryCount: 0,
			path: "/nonexistent/directory",
			isError: true,
			errorMessage: "ENOENT: no such file or directory '/nonexistent/directory'",
		},
	},
};

export const InterruptedState: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "ls_interrupted",
			name: "LS",
			input: {
				path: "/large/directory",
			},
		},
		status: "interrupted",
		timestamp: "2024-06-28T23:45:12.000Z",
		toolResult: {
			entries: [],
			entryCount: 0,
			path: "/large/directory",
			isError: true,
			errorMessage: "Operation was interrupted by user",
		},
	},
};

import type { Meta, StoryObj } from "@storybook/react"
import { GlobTool } from "./glob-tool"

const meta = {
	title: "Chat Items/Glob Tool",
	component: GlobTool,
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
} satisfies Meta<typeof GlobTool>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "glob_123",
			name: "Glob",
			input: {
				pattern: "**/*.tsx",
			},
		},
		status: "completed",
		timestamp: "2024-06-29T01:45:12.000Z",
		toolResult: {
			matches: [
				"./src/components/Button.tsx",
				"./src/components/Card.tsx",
				"./src/pages/Home.tsx",
				"./src/pages/About.tsx",
			],
			matchCount: 4,
			isError: false,
		},
	},
}

export const WithDirectories: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "glob_456",
			name: "Glob",
			input: {
				pattern: "src/**",
				path: "./",
			},
		},
		status: "completed",
		timestamp: "2024-06-29T01:45:12.000Z",
		toolResult: {
			matches: [
				"./src/components/",
				"./src/components/Button.tsx",
				"./src/components/Card.tsx",
				"./src/hooks/",
				"./src/hooks/useCounter.ts",
				"./src/utils/",
				"./src/utils/helpers.ts",
			],
			matchCount: 7,
			isError: false,
		},
	},
}

export const NoMatches: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "glob_789",
			name: "Glob",
			input: {
				pattern: "**/*.xyz",
			},
		},
		status: "completed",
		timestamp: "2024-06-29T01:45:12.000Z",
		toolResult: {
			matches: [],
			matchCount: 0,
			isError: false,
		},
	},
}

export const ConfigFiles: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "glob_999",
			name: "Glob",
			input: {
				pattern: "**/.*rc*",
			},
		},
		status: "completed",
		timestamp: "2024-06-29T01:45:12.000Z",
		toolResult: {
			matches: ["./.eslintrc.js", "./.prettierrc", "./packages/ui/.eslintrc.json"],
			matchCount: 3,
			isError: false,
		},
	},
}

export const InProgressState: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "glob_running",
			name: "Glob",
			input: {
				pattern: "**/*.js",
				path: "src/",
			},
		},
		status: "in_progress",
		timestamp: "2024-06-29T01:45:12.000Z",
		toolResult: {
			matches: [],
			matchCount: 0,
			isError: false,
		},
	},
}

export const FailedState: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "glob_error",
			name: "Glob",
			input: {
				pattern: "[invalid glob",
				path: "/nonexistent/path",
			},
		},
		status: "failed",
		timestamp: "2024-06-29T01:45:12.000Z",
		toolResult: {
			matches: [],
			matchCount: 0,
			isError: true,
			errorMessage: "Error: Invalid glob pattern: [invalid glob",
		},
	},
}

export const InterruptedState: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "glob_interrupted",
			name: "Glob",
			input: {
				pattern: "**/*.py",
				path: "src/",
			},
		},
		status: "interrupted",
		timestamp: "2024-06-29T01:45:12.000Z",
		toolResult: {
			matches: [],
			matchCount: 0,
			isError: true,
			errorMessage: "Operation was interrupted by user",
		},
	},
}

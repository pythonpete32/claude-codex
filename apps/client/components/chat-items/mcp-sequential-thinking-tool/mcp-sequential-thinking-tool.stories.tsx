import type { Meta, StoryObj } from "@storybook/react"
import { MCPSequentialThinkingTool } from "./mcp-sequential-thinking-tool"

const meta = {
	title: "Chat Items/MCP Sequential Thinking Tool",
	component: MCPSequentialThinkingTool,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		status: {
			control: { type: "select" },
			options: ["pending", "completed", "error"],
		},
	},
} satisfies Meta<typeof MCPSequentialThinkingTool>

export default meta
type Story = StoryObj<typeof meta>

// Real fixture data from mcp--sequential-thinking--sequentialthinking-fixtures.json

export const Step1of8: Story = {
	args: {
		toolUse: {
			id: "toolu_01A17VvPLs7UHubkfVy3f867",
			name: "mcp__sequential-thinking__sequentialthinking",
			input: {
				thought:
					"Let me deeply think about the smallest, most fundamental piece we need to build for a Claude log processor. Looking at the analysis, they recommend RxJS + pure functions. The absolute smallest thing would be a single pure function that takes a JSONL string and returns a parsed, typed message object. This is the foundation - we can't process logs without parsing them first.",
				nextThoughtNeeded: true,
				thoughtNumber: 1,
				totalThoughts: 8,
			},
		},
		toolResult: {
			stdout: [
				{
					type: "text",
					text: '{\n  "thoughtNumber": 1,\n  "totalThoughts": 8,\n  "nextThoughtNeeded": true,\n  "branches": [],\n  "thoughtHistoryLength": 1\n}',
				},
			],
			stderr: "",
			interrupted: false,
			isError: false,
		},
		status: "completed",
		timestamp: "2025-06-29T01:35:07.522Z",
	},
}

export const Step4of8: Story = {
	args: {
		toolUse: {
			id: "toolu_014U47C5rFQPATaK1GiHvK8W",
			name: "mcp__sequential-thinking__sequentialthinking",
			input: {
				thought:
					'So the absolute smallest testable unit would be a function called `identifyMessageType(obj: any): MessageType`. This function takes a parsed JSON object and returns an enum or string literal type identifying what kind of message it is. The test would be: given {role: "user", content: "Hello"}, it returns "user_message". This is pure, simple, and the foundation for everything else.',
				nextThoughtNeeded: true,
				thoughtNumber: 4,
				totalThoughts: 8,
			},
		},
		toolResult: {
			stdout: [
				{
					type: "text",
					text: '{\n  "thoughtNumber": 4,\n  "totalThoughts": 8,\n  "nextThoughtNeeded": true,\n  "branches": [],\n  "thoughtHistoryLength": 4\n}',
				},
			],
			stderr: "",
			interrupted: false,
			isError: false,
		},
		status: "completed",
		timestamp: "2025-06-29T01:35:07.522Z",
	},
}

export const FinalStep: Story = {
	args: {
		toolUse: {
			id: "toolu_01FinalStep8",
			name: "mcp__sequential-thinking__sequentialthinking",
			input: {
				thought:
					"After careful consideration of all the factors, I believe the best approach is to start with the simplest possible implementation and iterate from there. This gives us a solid foundation while maintaining flexibility for future enhancements.",
				nextThoughtNeeded: false,
				thoughtNumber: 8,
				totalThoughts: 8,
			},
		},
		toolResult: {
			stdout: [
				{
					type: "text",
					text: '{\n  "thoughtNumber": 8,\n  "totalThoughts": 8,\n  "nextThoughtNeeded": false,\n  "branches": [],\n  "thoughtHistoryLength": 8\n}',
				},
			],
			stderr: "",
			interrupted: false,
			isError: false,
		},
		status: "completed",
		timestamp: "2025-06-29T01:35:07.522Z",
	},
}

export const PendingStep: Story = {
	args: {
		toolUse: {
			id: "toolu_01Pending",
			name: "mcp__sequential-thinking__sequentialthinking",
			input: {
				thought: "Let me think about this more carefully...",
				nextThoughtNeeded: true,
				thoughtNumber: 3,
				totalThoughts: 8,
			},
		},
		status: "pending",
		timestamp: "2025-06-29T01:35:07.522Z",
	},
}

export const ErrorStep: Story = {
	args: {
		toolUse: {
			id: "toolu_01Error",
			name: "mcp__sequential-thinking__sequentialthinking",
			input: {
				thought: "Something went wrong while processing this thought.",
				nextThoughtNeeded: false,
				thoughtNumber: 4,
				totalThoughts: 8,
			},
		},
		toolResult: {
			stderr: "Error: Failed to process thinking step",
			isError: true,
		},
		status: "error",
		timestamp: "2025-06-29T01:35:07.522Z",
	},
}

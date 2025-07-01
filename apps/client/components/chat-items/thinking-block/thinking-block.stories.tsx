import type { Meta, StoryObj } from "@storybook/react";
import { ThinkingBlock } from "./thinking-block";

const meta = {
	title: "Chat Items/Thinking Block",
	component: ThinkingBlock,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		status: {
			control: { type: "select" },
			options: ["pending", "completed", "error"],
		},
		variant: {
			control: { type: "select" },
			options: ["terminal", "card", "minimal"],
		},
	},
} satisfies Meta<typeof ThinkingBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample thinking data based on the fixtures
const sampleThought =
	"Let me deeply think about the smallest, most fundamental piece we need to build for a Claude log processor. Looking at the analysis, they recommend RxJS + pure functions. The absolute smallest thing would be a single pure function that takes a JSONL string and returns a parsed, typed message object. This is the foundation - we can't process logs without parsing them first.";

const longThought =
	"For TDD, we need to think: what's the first test we would write? The simplest test would be: 'Given a valid JSONL line representing a user message, parse it and return a typed UserMessage object.' This means our smallest unit is a parseLogLine() function that takes a string and returns a typed message. But wait - that's not small enough. Even smaller would be: 'Given a JSON object, identify its type.' So the absolute smallest testable unit would be a function called `identifyMessageType(obj: any): MessageType`. This function takes a parsed JSON object and returns an enum or string literal type identifying what kind of message it is.";

const shortThought =
	"Actually, even before parsing, we need to understand what we're parsing. Let me look at an actual Claude log file to see the structure.";

export const TerminalVariant: Story = {
	args: {
		thought: sampleThought,
		thoughtNumber: 1,
		totalThoughts: 8,
		nextThoughtNeeded: true,
		toolUse: {
			id: "toolu_01A17VvPLs7UHubkfVy3f867",
			name: "mcp__sequential-thinking__sequentialthinking",
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
		variant: "terminal",
	},
};

export const CardVariant: Story = {
	args: {
		thought: sampleThought,
		thoughtNumber: 3,
		totalThoughts: 5,
		nextThoughtNeeded: true,
		status: "completed",
		timestamp: "2025-06-29T01:35:07.522Z",
		variant: "card",
	},
};

export const MinimalVariant: Story = {
	args: {
		thought: shortThought,
		thoughtNumber: 2,
		totalThoughts: 8,
		nextThoughtNeeded: true,
		status: "completed",
		timestamp: "2025-06-29T01:35:07.522Z",
		variant: "minimal",
	},
};

export const LongThought: Story = {
	args: {
		thought: longThought,
		thoughtNumber: 5,
		totalThoughts: 8,
		nextThoughtNeeded: true,
		status: "completed",
		timestamp: "2025-06-29T01:35:07.522Z",
		variant: "terminal",
	},
};

export const FirstThought: Story = {
	args: {
		thought:
			"Starting to analyze the problem space and breaking it down into smaller, manageable components.",
		thoughtNumber: 1,
		totalThoughts: 10,
		nextThoughtNeeded: true,
		status: "completed",
		timestamp: "2025-06-29T01:35:07.522Z",
		variant: "terminal",
	},
};

export const FinalThought: Story = {
	args: {
		thought:
			"After careful consideration of all the factors, I believe the best approach is to start with the simplest possible implementation and iterate from there. This gives us a solid foundation while maintaining flexibility for future enhancements.",
		thoughtNumber: 8,
		totalThoughts: 8,
		nextThoughtNeeded: false,
		status: "completed",
		timestamp: "2025-06-29T01:35:07.522Z",
		variant: "terminal",
	},
};

export const PendingThought: Story = {
	args: {
		thought: "Let me think about this more carefully...",
		thoughtNumber: 3,
		totalThoughts: 8,
		nextThoughtNeeded: true,
		status: "pending",
		timestamp: "2025-06-29T01:35:07.522Z",
		variant: "terminal",
	},
};

export const ErrorThought: Story = {
	args: {
		thought: "Something went wrong while processing this thought.",
		thoughtNumber: 4,
		totalThoughts: 8,
		nextThoughtNeeded: false,
		status: "error",
		timestamp: "2025-06-29T01:35:07.522Z",
		variant: "terminal",
	},
};

export const ComparisonShowcase: Story = {
	args: {
		thought: "Demo of different thinking block variants",
		thoughtNumber: 1,
		totalThoughts: 3,
		nextThoughtNeeded: true,
		status: "completed",
		variant: "terminal",
	},
	render: () => (
		<div className="space-y-6 w-full max-w-4xl">
			<h2 className="text-xl font-bold mb-4">Thinking Block Variants</h2>

			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Terminal Variant</h3>
				<ThinkingBlock
					thought={sampleThought}
					thoughtNumber={1}
					totalThoughts={8}
					nextThoughtNeeded={true}
					status="completed"
					variant="terminal"
				/>
			</div>

			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Card Variant</h3>
				<ThinkingBlock
					thought={sampleThought}
					thoughtNumber={2}
					totalThoughts={8}
					nextThoughtNeeded={true}
					status="completed"
					variant="card"
				/>
			</div>

			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Minimal Variant</h3>
				<ThinkingBlock
					thought={shortThought}
					thoughtNumber={3}
					totalThoughts={8}
					nextThoughtNeeded={true}
					status="completed"
					variant="minimal"
				/>
			</div>
		</div>
	),
};

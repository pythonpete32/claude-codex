import type { Meta, StoryObj } from "@storybook/react"
import { NativeThinkingBlock } from "./native-thinking-block"

const meta = {
	title: "Chat Items/Native Thinking Block",
	component: NativeThinkingBlock,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		associatedWith: {
			control: { type: "select" },
			options: ["message", "tool_call"],
		},
	},
} satisfies Meta<typeof NativeThinkingBlock>

export default meta
type Story = StoryObj<typeof meta>

const sampleThinking = `I need to help the user create a thinking block component. Let me consider:

1. They want it to show the model's internal reasoning
2. It should be visually grouped with what it produces (message or tool call)
3. The component should be collapsible for better UX
4. It needs to distinguish between thinking about messages vs tool calls

I'll create a component that clearly shows the relationship between thinking and output.`

const longThinking = `The user is asking about implementing a thinking block system. I need to understand that there are two different types:

1. Sequential Thinking MCP Tool - This is a tool call that can have numbered steps
2. Native Model Thinking - This is my internal reasoning process

For the native thinking blocks, they should always be paired with either:
- An assistant message (when I'm thinking about what to say)
- A tool call (when I'm thinking about what tool to use and how)

The visual design should make this relationship clear with connecting lines and appropriate icons. I should also consider:
- Collapsible/expandable behavior for long thoughts
- Clear visual distinction between message vs tool call thinking
- Timestamps for debugging
- Proper spacing and typography for readability`

const shortThinking =
	"I should use the \`ls\` command to list the directory contents first, then examine the files to understand the structure."

// Embedded message content (simplified for embedding)
const AssistantMessage = () => (
	<div className="text-foreground">
		<p className="text-sm leading-relaxed">
			I&apos;ll help you create a thinking block component that shows the model&apos;s internal reasoning process. This
			component will be visually grouped with either the resulting message or tool call.
		</p>
	</div>
)

// Embedded bash tool content (simplified for embedding)
const BashToolCall = () => (
	<div className="text-gray-300">
		<div className="mb-2">
			<span className="text-green-400">$</span> <span className="text-blue-300">ls -la /components/</span>
		</div>
		<pre className="text-xs text-gray-400 leading-relaxed">
			{`total 24
drwxr-xr-x  8 user user 256 Jun 29 12:34 .
drwxr-xr-x  3 user user  96 Jun 29 12:30 ..
-rw-r--r--  1 user user 1024 Jun 29 12:34 thinking-block.tsx
-rw-r--r--  1 user user  512 Jun 29 12:33 bash-tool.tsx
-rw-r--r--  1 user user  768 Jun 29 12:32 index.ts`}
		</pre>
	</div>
)

// Embedded MCP tool content (simplified for embedding)
const MCPThinkingToolCall = () => (
	<div className="text-gray-300">
		<div className="mb-2 flex items-center gap-2">
			<span className="text-blue-400 text-xs">mcp</span>
			<span className="text-purple-400 text-xs">sequential-thinking</span>
			<span className="text-yellow-400 text-xs">step 1/3</span>
		</div>
		<div className="text-sm mb-2">
			I need to carefully plan the component architecture to ensure it&apos;s maintainable and extensible.
		</div>
		<pre className="text-xs text-gray-400">
			{`{
  "thoughtNumber": 1,
  "totalThoughts": 3,
  "nextThoughtNeeded": true,
  "branches": [],
  "thoughtHistoryLength": 1
}`}
		</pre>
	</div>
)

export const ThinkingAboutMessage: Story = {
	args: {
		thinking: sampleThinking,
		associatedWith: "message",
		associatedContent: <AssistantMessage />,
		timestamp: "2025-06-29T01:35:07.522Z",
		defaultExpanded: true,
	},
}

export const ThinkingAboutBashTool: Story = {
	args: {
		thinking: shortThinking,
		associatedWith: "tool_call",
		associatedContent: <BashToolCall />,
		timestamp: "2025-06-29T01:35:07.522Z",
		defaultExpanded: true,
	},
}

export const ThinkingAboutMCPTool: Story = {
	args: {
		thinking: "I need to use sequential thinking to break down this complex problem into manageable steps.",
		associatedWith: "tool_call",
		associatedContent: <MCPThinkingToolCall />,
		timestamp: "2025-06-29T01:35:07.522Z",
		defaultExpanded: true,
	},
}

export const LongThinkingCollapsed: Story = {
	args: {
		thinking: longThinking,
		associatedWith: "message",
		associatedContent: <AssistantMessage />,
		timestamp: "2025-06-29T01:35:07.522Z",
		defaultExpanded: false,
	},
}

export const ThinkingOnly: Story = {
	args: {
		thinking: sampleThinking,
		associatedWith: "message",
		timestamp: "2025-06-29T01:35:07.522Z",
		defaultExpanded: true,
	},
}

export const ChatFlow: Story = {
	args: {
		thinking: "Demo of multiple thinking blocks in sequence",
		associatedWith: "message",
		defaultExpanded: true,
	},
	render: () => (
		<div className="space-y-6 w-full max-w-4xl">
			<NativeThinkingBlock
				thinking="First, I need to understand what the user is asking for. Let me list the directory contents to see what files exist."
				associatedWith="tool_call"
				associatedContent={<BashToolCall />}
				timestamp="2025-06-29T01:35:07.522Z"
				defaultExpanded={true}
			/>

			<NativeThinkingBlock
				thinking="Now I need to think systematically about how to approach this problem. I'll use sequential thinking to break it down."
				associatedWith="tool_call"
				associatedContent={<MCPThinkingToolCall />}
				timestamp="2025-06-29T01:35:08.522Z"
				defaultExpanded={true}
			/>

			<NativeThinkingBlock
				thinking="Based on my analysis, I can now provide a comprehensive response about implementing the thinking block system."
				associatedWith="message"
				associatedContent={<AssistantMessage />}
				timestamp="2025-06-29T01:35:09.522Z"
				defaultExpanded={true}
			/>
		</div>
	),
}

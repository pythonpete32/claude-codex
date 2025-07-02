import type { Meta, StoryObj } from "@storybook/react"
import { AssistantMessage } from "./assistant-message"

const meta = {
	title: "Chat Items/Assistant Message",
	component: AssistantMessage,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		defaultExpanded: {
			control: { type: "boolean" },
		},
	},
} satisfies Meta<typeof AssistantMessage>

export default meta
type Story = StoryObj<typeof meta>

const shortMessage = "I'll help you create those message components right away!"

const longMessage = `I'll help you create assistant and user message bubble components that follow the same terminal aesthetic as the native thinking block.

Here's what I'll implement:

1. **AssistantMessage**: Terminal-style with bot icon and blue accent
2. **UserMessage**: Terminal-style with user icon and green accent
3. **Similar structure**: Same header/content layout as thinking block
4. **Light backgrounds**: Clean white/light backgrounds for readability
5. **Syntax highlighting**: Support for inline code with backticks

Both components will maintain the consistent terminal aesthetic while being optimized for message content display.`

const messageWithCode = `You can use the \`ls -la\` command to list all files and directories with detailed information. Here's an example:

\`\`\`bash
ls -la /path/to/directory
\`\`\`

This will show permissions, ownership, size, and modification dates for all items in the specified directory.`

export const Short: Story = {
	args: {
		content: shortMessage,
		timestamp: "2025-06-29T01:35:07.522Z",
		defaultExpanded: true,
	},
}

export const Long: Story = {
	args: {
		content: longMessage,
		timestamp: "2025-06-29T01:35:07.522Z",
		defaultExpanded: true,
	},
}

export const WithCode: Story = {
	args: {
		content: messageWithCode,
		timestamp: "2025-06-29T01:35:07.522Z",
		defaultExpanded: true,
	},
}

export const Collapsed: Story = {
	args: {
		content: longMessage,
		timestamp: "2025-06-29T01:35:07.522Z",
		defaultExpanded: false,
	},
}

export const NoTimestamp: Story = {
	args: {
		content: shortMessage,
		defaultExpanded: true,
	},
}

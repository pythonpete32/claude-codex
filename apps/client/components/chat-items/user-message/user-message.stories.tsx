import type { Meta, StoryObj } from "@storybook/react"
import { UserMessage } from "./user-message"

const meta = {
	title: "Chat Items/User Message",
	component: UserMessage,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		defaultExpanded: {
			control: { type: "boolean" },
		},
	},
} satisfies Meta<typeof UserMessage>

export default meta
type Story = StoryObj<typeof meta>

const shortMessage = "Can you help me create message components for the chat interface?"

const longMessage = `I need help creating assistant and user message bubble components that match the terminal aesthetic we've been using throughout the application.

The requirements are:
- Similar styling to the native thinking block
- Terminal-style headers with appropriate icons
- Light backgrounds for good readability
- Support for inline code highlighting
- Collapsible content for long messages
- Copy functionality for the message content

Please make sure they integrate well with the existing component library and follow the same design patterns.`

const messageWithCode = `I want to run this command: \`ls -la /components/\` to see what files are in the directory. Can you help me understand what the output means?

Also, how do I use \`grep\` to search for specific patterns in files?`

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

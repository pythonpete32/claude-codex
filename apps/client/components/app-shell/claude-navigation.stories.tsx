import type { Meta, StoryObj } from "@storybook/react"
import { ClaudeNavigation } from "./claude-navigation"

const meta: Meta<typeof ClaudeNavigation> = {
  title: "Components/ClaudeNavigation",
  component: ClaudeNavigation,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Standalone Claude navigation component with collapsible sections. Context-free alternative to ClaudeSidebar for use in floating panels and modal overlays."
      }
    }
  },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-80 h-[600px] border rounded-lg">
      <ClaudeNavigation />
    </div>
  )
}

export const Narrow: Story = {
  render: () => (
    <div className="w-64 h-[600px] border rounded-lg">
      <ClaudeNavigation />
    </div>
  )
}

export const Wide: Story = {
  render: () => (
    <div className="w-96 h-[600px] border rounded-lg">
      <ClaudeNavigation />
    </div>
  )
}

export const InFloatingContext: Story = {
  render: () => (
    <div className="bg-muted/40 p-8 min-h-[600px]">
      <h2 className="text-2xl font-bold mb-4">Floating Panel Demo</h2>
      <p className="text-muted-foreground mb-6">
        This shows how the Claude navigation looks in a floating panel context.
      </p>
      <div className="w-80 h-[500px] border rounded-lg bg-background shadow-lg">
        <ClaudeNavigation />
      </div>
    </div>
  )
}
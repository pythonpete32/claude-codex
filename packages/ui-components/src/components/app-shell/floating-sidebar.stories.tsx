import type { Meta, StoryObj } from "@storybook/react"
import { FloatingSidebar } from "./floating-sidebar"
import { Button } from "@/components/ui/button"
import { IconSettings, IconUser, IconSearch } from "@tabler/icons-react"

const meta: Meta<typeof FloatingSidebar> = {
  title: "Layout/FloatingSidebar",
  component: FloatingSidebar,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "A floating sidebar component that appears as an overlay. Can be triggered from any position and customized with different sizes and sides."
      }
    }
  },
  tags: ["autodocs"],
  argTypes: {
    side: {
      control: { type: "select" },
      options: ["left", "right"]
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg", "xl"]
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Demo content for the page
const DemoContent = () => (
  <div className="min-h-screen bg-muted/40 p-8">
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Floating Sidebar Demo</h1>
        <p className="text-muted-foreground text-lg mt-2">
          Click the floating button to open the sidebar overlay.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Features</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Floating trigger button</li>
            <li>• Customizable position (left/right)</li>
            <li>• Multiple sizes (sm, md, lg, xl)</li>
            <li>• Smooth overlay animation</li>
            <li>• Custom trigger support</li>
            <li>• Backdrop blur effect</li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Use Cases</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Mobile-first navigation</li>
            <li>• Clean, minimal interfaces</li>
            <li>• Dashboard controls</li>
            <li>• Settings panels</li>
            <li>• Tool palettes</li>
            <li>• Context menus</li>
          </ul>
        </div>
      </div>
      
      <div className="bg-background p-6 rounded-lg border">
        <h3 className="font-semibold mb-2">Interactive Demo</h3>
        <p className="text-muted-foreground">
          The floating sidebar should appear when you click the trigger button. 
          It will overlay the current content and can be dismissed by clicking the X or outside the sidebar.
        </p>
      </div>
    </div>
  </div>
)

export const Default: Story = {
  args: {
    side: "left",
    size: "md"
  },
  render: (args) => (
    <div>
      <FloatingSidebar {...args} />
      <DemoContent />
    </div>
  )
}

export const RightSide: Story = {
  args: {
    side: "right",
    size: "md"
  },
  render: (args) => (
    <div>
      <FloatingSidebar {...args} />
      <DemoContent />
    </div>
  )
}

export const SmallSize: Story = {
  args: {
    side: "left",
    size: "sm"
  },
  render: (args) => (
    <div>
      <FloatingSidebar {...args} />
      <DemoContent />
    </div>
  )
}

export const LargeSize: Story = {
  args: {
    side: "left",
    size: "lg"
  },
  render: (args) => (
    <div>
      <FloatingSidebar {...args} />
      <DemoContent />
    </div>
  )
}

export const ExtraLargeSize: Story = {
  args: {
    side: "left",
    size: "xl"
  },
  render: (args) => (
    <div>
      <FloatingSidebar {...args} />
      <DemoContent />
    </div>
  )
}

export const CustomTrigger: Story = {
  args: {
    side: "left",
    size: "md",
    trigger: (
      <Button
        variant="default"
        className="fixed top-4 right-4 z-50 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <IconSettings className="h-4 w-4 mr-2" />
        Settings
      </Button>
    )
  },
  render: (args) => (
    <div>
      <FloatingSidebar {...args} />
      <DemoContent />
    </div>
  )
}

export const MultipleTriggers: Story = {
  render: () => (
    <div>
      {/* Left sidebar with default trigger */}
      <FloatingSidebar side="left" size="md" />
      
      {/* Right sidebar with custom trigger */}
      <FloatingSidebar 
        side="right" 
        size="sm"
        trigger={
          <Button
            variant="outline"
            size="icon"
            className="fixed top-4 right-4 z-50 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <IconUser className="h-4 w-4" />
          </Button>
        }
      />
      
      {/* Bottom trigger */}
      <FloatingSidebar 
        side="left" 
        size="lg"
        trigger={
          <Button
            variant="secondary"
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <IconSearch className="h-4 w-4 mr-2" />
            Search
          </Button>
        }
      />
      
      <DemoContent />
    </div>
  )
}
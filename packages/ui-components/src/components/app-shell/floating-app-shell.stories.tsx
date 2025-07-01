import type { Meta, StoryObj } from "@storybook/react"
import { FloatingAppShell } from "./floating-app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
// import { BashTool } from "@/components/chat-items/bash-tool"

const meta: Meta<typeof FloatingAppShell> = {
  title: "Layout/FloatingAppShell",
  component: FloatingAppShell,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Floating sidebar version of the Claude Log Monitor app shell. Features a floating trigger button that opens the sidebar as an overlay."
      }
    }
  },
  tags: ["autodocs"],
  argTypes: {
    connectionStatus: {
      control: { type: "select" },
      options: ["connected", "disconnected", "reconnecting"]
    },
    serverHealth: {
      control: { type: "select" },
      options: ["healthy", "unhealthy", "unknown"]
    },
    sidebarSide: {
      control: { type: "select" },
      options: ["left", "right"]
    },
    sidebarSize: {
      control: { type: "select" },
      options: ["sm", "md", "lg", "xl"]
    },
    activeSessions: {
      control: { type: "number", min: 0, max: 50 }
    },
    totalSessions: {
      control: { type: "number", min: 0, max: 1000 }
    },
    notifications: {
      control: { type: "number", min: 0, max: 99 }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Dashboard Content for floating layout
const FloatingDashboard = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-3xl font-bold tracking-tight">Claude Log Monitor</h2>
      <p className="text-muted-foreground">
        Clean, floating sidebar interface for monitoring Claude conversation logs.
      </p>
    </div>
    
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
          <Badge variant="default" className="bg-green-500">Live</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2</div>
          <p className="text-xs text-muted-foreground">Currently active</p>
          <Progress value={40} className="mt-2" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Log Entries</CardTitle>
          <Badge variant="secondary">24h</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">5,234</div>
          <p className="text-xs text-muted-foreground">+234 from yesterday</p>
          <Progress value={78} className="mt-2" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tool Usage</CardTitle>
          <Badge variant="outline">Top</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Bash Tool</div>
          <p className="text-xs text-muted-foreground">34% of total usage</p>
          <Progress value={34} className="mt-2" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Response Time</CardTitle>
          <Badge variant="secondary">Avg</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1.2s</div>
          <p className="text-xs text-muted-foreground">-0.3s improvement</p>
          <Progress value={85} className="mt-2" />
        </CardContent>
      </Card>
    </div>
    
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Recent Tool Activity</CardTitle>
          <CardDescription>Latest tool usage from active sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-mono">$ ls -la /project/src</p>
              <p className="text-xs text-muted-foreground mt-1">List project source files</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Use the floating menu button (top-left) to access navigation and controls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Button variant="outline" className="justify-start">
              View All Sessions
            </Button>
            <Button variant="outline" className="justify-start">
              Export Recent Logs
            </Button>
            <Button variant="outline" className="justify-start">
              Configure Monitoring
            </Button>
            <Button variant="outline" className="justify-start">
              View Analytics Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    
    <div className="text-center text-muted-foreground text-sm">
      💡 Click the floating menu button in the top-left corner to access the navigation sidebar
    </div>
  </div>
)

export const Default: Story = {
  args: {
    children: <FloatingDashboard />,
    connectionStatus: "connected",
    activeSessions: 2,
    totalSessions: 15,
    serverHealth: "healthy",
    notifications: 0,
    sidebarSide: "left",
    sidebarSize: "md",
    showSidebarTrigger: true
  }
}

export const RightSidebar: Story = {
  args: {
    children: <FloatingDashboard />,
    connectionStatus: "connected",
    activeSessions: 2,
    totalSessions: 15,
    serverHealth: "healthy",
    notifications: 0,
    sidebarSide: "right",
    sidebarSize: "md",
    showSidebarTrigger: true
  }
}

export const LargeSidebar: Story = {
  args: {
    children: <FloatingDashboard />,
    connectionStatus: "connected",
    activeSessions: 3,
    totalSessions: 18,
    serverHealth: "healthy",
    notifications: 5,
    sidebarSide: "left",
    sidebarSize: "lg",
    showSidebarTrigger: true
  }
}

export const CompactSidebar: Story = {
  args: {
    children: <FloatingDashboard />,
    connectionStatus: "connected",
    activeSessions: 1,
    totalSessions: 8,
    serverHealth: "healthy",
    notifications: 0,
    sidebarSide: "left",
    sidebarSize: "sm",
    showSidebarTrigger: true
  }
}

export const WithNotifications: Story = {
  args: {
    children: <FloatingDashboard />,
    connectionStatus: "connected",
    activeSessions: 4,
    totalSessions: 22,
    serverHealth: "healthy",
    notifications: 12,
    sidebarSide: "left",
    sidebarSize: "md",
    showSidebarTrigger: true
  }
}

export const Disconnected: Story = {
  args: {
    children: (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-red-500 mb-4 text-4xl">⚠️</div>
        <h3 className="text-lg font-semibold text-red-600">Connection Lost</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          Unable to connect to Claude Log Server. The floating sidebar is still accessible for offline navigation.
        </p>
        <Button className="mt-4" variant="outline">Retry Connection</Button>
      </div>
    ),
    connectionStatus: "disconnected",
    activeSessions: 0,
    totalSessions: 15,
    serverHealth: "unhealthy",
    notifications: 1,
    sidebarSide: "left",
    sidebarSize: "md",
    showSidebarTrigger: true
  }
}

export const NoSidebarTrigger: Story = {
  args: {
    children: (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h3 className="text-lg font-semibold">Clean Layout</h3>
        <p className="text-muted-foreground mt-2">
          No floating sidebar trigger - perfect for embedded or minimal interfaces.
        </p>
      </div>
    ),
    connectionStatus: "connected",
    activeSessions: 2,
    totalSessions: 15,
    serverHealth: "healthy",
    notifications: 0,
    showSidebarTrigger: false
  }
}
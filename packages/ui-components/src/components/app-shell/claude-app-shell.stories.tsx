import type { Meta, StoryObj } from "@storybook/react"
import { ClaudeAppShell } from "./claude-app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
// import { div } from "@/components/chat-items/bash-tool"

const meta: Meta<typeof ClaudeAppShell> = {
  title: "Layout/ClaudeAppShell",
  component: ClaudeAppShell,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Complete Claude Log Monitor application shell with Claude-specific navigation and real-time status monitoring."
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

// Claude Dashboard Content
const ClaudeDashboard = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-3xl font-bold tracking-tight">Claude Log Monitor</h2>
      <p className="text-muted-foreground">
        Real-time monitoring and analysis of your Claude conversation logs.
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
          <CardTitle>Live Tool Activity</CardTitle>
          <CardDescription>Real-time tool usage from active sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div 
              command="ls -la /project/src"
              description="List project source files"
              timeout={5000}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Session Summary</CardTitle>
          <CardDescription>Overview of current active sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { 
                session: "web-dev-session-001", 
                project: "E-commerce App", 
                tools: 12, 
                duration: "2h 34m",
                status: "active"
              },
              { 
                session: "data-analysis-002", 
                project: "ML Pipeline", 
                tools: 8, 
                duration: "1h 15m",
                status: "active"
              }
            ].map((session, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{session.project}</p>
                  <p className="text-xs text-muted-foreground">{session.session}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{session.tools} tools</Badge>
                    <Badge variant="secondary" className="text-xs">{session.duration}</Badge>
                  </div>
                </div>
                <Badge 
                  variant={session.status === "active" ? "default" : "secondary"}
                  className={session.status === "active" ? "bg-green-500" : ""}
                >
                  {session.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)

export const Default: Story = {
  args: {
    children: <ClaudeDashboard />,
    defaultSidebarOpen: true,
    connectionStatus: "connected",
    activeSessions: 2,
    totalSessions: 15,
    serverHealth: "healthy",
    notifications: 0
  }
}

export const WithNotifications: Story = {
  args: {
    children: <ClaudeDashboard />,
    defaultSidebarOpen: true,
    connectionStatus: "connected",
    activeSessions: 3,
    totalSessions: 18,
    serverHealth: "healthy",
    notifications: 5
  }
}

export const Disconnected: Story = {
  args: {
    children: (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-red-500 mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-red-600">Connection Lost</h3>
        <p className="text-muted-foreground mt-2">
          Unable to connect to Claude Log Server. Attempting to reconnect...
        </p>
        <Button className="mt-4" variant="outline">Retry Connection</Button>
      </div>
    ),
    defaultSidebarOpen: true,
    connectionStatus: "disconnected",
    activeSessions: 0,
    totalSessions: 15,
    serverHealth: "unhealthy",
    notifications: 0
  }
}

export const Reconnecting: Story = {
  args: {
    children: (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-yellow-500 mb-4 animate-spin">⟳</div>
        <h3 className="text-lg font-semibold text-yellow-600">Reconnecting...</h3>
        <p className="text-muted-foreground mt-2">
          Attempting to restore connection to Claude Log Server.
        </p>
        <Progress value={65} className="w-48 mt-4" />
      </div>
    ),
    defaultSidebarOpen: true,
    connectionStatus: "reconnecting",
    activeSessions: 2,
    totalSessions: 15,
    serverHealth: "unknown",
    notifications: 1
  }
}

export const HighActivity: Story = {
  args: {
    children: <ClaudeDashboard />,
    defaultSidebarOpen: true,
    connectionStatus: "connected",
    activeSessions: 8,
    totalSessions: 45,
    serverHealth: "healthy",
    notifications: 12
  }
}

export const SidebarCollapsed: Story = {
  args: {
    children: <ClaudeDashboard />,
    defaultSidebarOpen: false,
    connectionStatus: "connected",
    activeSessions: 2,
    totalSessions: 15,
    serverHealth: "healthy",
    notifications: 3
  }
}
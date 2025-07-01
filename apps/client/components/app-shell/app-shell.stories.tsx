import type { Meta, StoryObj } from "@storybook/react"
import { AppShell } from "./app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof AppShell> = {
  title: "Layout/AppShell",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Complete application shell with sidebar, header, main content area, and status bar."
      }
    }
  },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

// Sample dashboard content
const DashboardContent = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <p className="text-muted-foreground">
        Welcome to Claude Log Monitor - monitor your conversation logs in real-time.
      </p>
    </div>
    
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
          <Badge variant="secondary">Live</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">3</div>
          <p className="text-xs text-muted-foreground">+2 from last hour</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          <Badge variant="outline">24h</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,234</div>
          <p className="text-xs text-muted-foreground">+15% from yesterday</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projects</CardTitle>
          <Badge variant="outline">All time</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">3 active</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          <Badge variant="secondary">Performance</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2.4s</div>
          <p className="text-xs text-muted-foreground">-0.3s from avg</p>
        </CardContent>
      </Card>
    </div>
    
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest log entries from your Claude sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { project: "Web Dev Project", time: "2 min ago", type: "Bash Tool" },
              { project: "Data Analysis", time: "5 min ago", type: "Read Tool" },
              { project: "Documentation", time: "12 min ago", type: "Edit Tool" },
              { project: "Web Dev Project", time: "18 min ago", type: "Grep Tool" }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.project}</p>
                  <p className="text-xs text-muted-foreground">{item.type}</p>
                </div>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and monitoring actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Button variant="outline" className="justify-start">
              View All Sessions
            </Button>
            <Button variant="outline" className="justify-start">
              Export Logs
            </Button>
            <Button variant="outline" className="justify-start">
              Configure Monitoring
            </Button>
            <Button variant="outline" className="justify-start">
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)

export const Default: Story = {
  args: {
    children: <DashboardContent />,
    defaultSidebarOpen: true
  }
}

export const SidebarClosed: Story = {
  args: {
    children: <DashboardContent />,
    defaultSidebarOpen: false
  }
}

export const EmptyState: Story = {
  args: {
    children: (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h3 className="text-lg font-semibold">No content</h3>
        <p className="text-muted-foreground mt-2">
          This is how the app shell looks with minimal content.
        </p>
      </div>
    ),
    defaultSidebarOpen: true
  }
}

export const WithCustomContent: Story = {
  args: {
    children: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Session Details</h2>
        <Card>
          <CardHeader>
            <CardTitle>Session: web-dev-session-001</CardTitle>
            <CardDescription>Active session started 2 hours ago</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This shows how the app shell adapts to different content types.</p>
          </CardContent>
        </Card>
      </div>
    ),
    defaultSidebarOpen: true
  }
}
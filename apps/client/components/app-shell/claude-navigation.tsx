import * as React from "react"
import {
  IconActivity,
  IconChartDots3,
  IconDatabase,
  IconFileAi,
  IconFolderOpen,
  IconHistory,
  IconHome,
  IconSearch,
  IconSettings,
  IconTerminal,
  IconUsers,
  IconWifi,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

const claudeNavData = {
  user: {
    name: "Claude User",
    email: "user@example.com",
    avatar: "/avatars/claude-user.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#dashboard",
      icon: IconHome,
    },
    {
      title: "Live Sessions",
      url: "#sessions",
      icon: IconActivity,
    },
    {
      title: "Session History",
      url: "#history", 
      icon: IconHistory,
    },
    {
      title: "Analytics",
      url: "#analytics",
      icon: IconChartDots3,
    },
    {
      title: "Projects",
      url: "#projects",
      icon: IconFolderOpen,
    },
  ],
  navTools: [
    {
      title: "Tools",
      icon: IconTerminal,
      isActive: true,
      items: [
        {
          title: "Bash Tool",
          url: "#tools/bash",
        },
        {
          title: "File Operations",
          url: "#tools/files",
        },
        {
          title: "Search & Grep", 
          url: "#tools/search",
        },
        {
          title: "Edit Tools",
          url: "#tools/edit",
        },
      ],
    },
    {
      title: "Chat Items",
      icon: IconFileAi,
      items: [
        {
          title: "Recent Conversations",
          url: "#chat-items/recent",
        },
        {
          title: "Archived Chats",
          url: "#chat-items/archived",
        },
        {
          title: "Favorites",
          url: "#chat-items/favorites",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Real-time Monitor",
      url: "#monitor",
      icon: IconWifi,
    },
    {
      title: "Search Logs",
      url: "#search",
      icon: IconSearch,
    },
    {
      title: "Settings",
      url: "#settings",
      icon: IconSettings,
    },
  ],
  documents: [
    {
      name: "Log Database",
      url: "#database",
      icon: IconDatabase,
    },
    {
      name: "Export Data",
      url: "#export",
      icon: IconUsers,
    },
  ],
}

export interface ClaudeNavigationProps {
  className?: string
}

export function ClaudeNavigation({ className }: ClaudeNavigationProps) {
  const [expandedSections, setExpandedSections] = React.useState<string[]>(["tools"])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <IconFileAi className="h-5 w-5 text-blue-500" />
          <span className="font-semibold">Claude Monitor</span>
        </div>
      </div>

      {/* Navigation Content */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 py-4">
          {/* Main Navigation */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">
              Navigation
            </h4>
            <div className="space-y-1">
              {claudeNavData.navMain.map((item) => (
                <Button
                  key={item.title}
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                >
                  <a href={item.url}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </a>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tools & Chat Items */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">
              Tools & Content
            </h4>
            <div className="space-y-1">
              {claudeNavData.navTools.map((section) => (
                <Collapsible
                  key={section.title}
                  open={expandedSections.includes(section.title.toLowerCase())}
                  onOpenChange={() => toggleSection(section.title.toLowerCase())}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start">
                      <section.icon className="mr-2 h-4 w-4" />
                      {section.title}
                      {section.isActive && (
                        <Badge variant="secondary" className="ml-auto">
                          Active
                        </Badge>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pl-6">
                    {section.items.map((item) => (
                      <Button
                        key={item.title}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        asChild
                      >
                        <a href={item.url}>{item.title}</a>
                      </Button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>

          <Separator />

          {/* Data & Export */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">
              Data
            </h4>
            <div className="space-y-1">
              {claudeNavData.documents.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                >
                  <a href={item.url}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </a>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Secondary Actions */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">
              Actions
            </h4>
            <div className="space-y-1">
              {claudeNavData.navSecondary.map((item) => (
                <Button
                  key={item.title}
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                >
                  <a href={item.url}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={claudeNavData.user.avatar} alt={claudeNavData.user.name} />
            <AvatarFallback>CU</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{claudeNavData.user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{claudeNavData.user.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
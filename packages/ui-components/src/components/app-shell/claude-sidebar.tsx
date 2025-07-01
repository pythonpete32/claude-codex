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

import { NavDocuments } from "@/components/navigation/nav-documents"
import { NavMain } from "@/components/navigation/nav-main"
import { NavSecondary } from "@/components/navigation/nav-secondary"
import { NavUser } from "@/components/navigation/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const claudeData = {
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
      url: "#tools",
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
      url: "#chat-items",
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

export function ClaudeSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#dashboard">
                <IconFileAi className="!size-5 text-blue-500" />
                <span className="text-base font-semibold">Claude Monitor</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={claudeData.navMain} />
        <NavDocuments items={claudeData.navTools} title="Tools & Chat Items" />
        <NavDocuments items={claudeData.documents} title="Data" />
        <NavSecondary items={claudeData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={claudeData.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
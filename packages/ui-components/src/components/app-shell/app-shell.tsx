import * as React from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { AppHeader } from "@/components/app-shell/app-header"
import { MainContent } from "@/components/app-shell/main-content"
import { StatusBar } from "@/components/app-shell/status-bar"

export interface AppShellProps {
  children?: React.ReactNode
  defaultSidebarOpen?: boolean
}

export function AppShell({ 
  children, 
  defaultSidebarOpen = true 
}: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <MainContent>
            {children}
          </MainContent>
          <StatusBar />
        </div>
      </div>
    </SidebarProvider>
  )
}
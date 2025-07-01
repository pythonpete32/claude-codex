import * as React from "react"
import { cn } from "@/lib/utils"

export interface MainContentProps {
  children?: React.ReactNode
  className?: string
}

export function MainContent({ children, className }: MainContentProps) {
  return (
    <main className={cn(
      "flex-1 overflow-y-auto bg-muted/40 p-4 lg:p-6",
      className
    )}>
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </main>
  )
}
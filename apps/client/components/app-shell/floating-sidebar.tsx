import * as React from "react"
import { IconX, IconMenu2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ClaudeNavigation } from "./claude-navigation"
import { cn } from "@/lib/utils"

export interface FloatingSidebarProps {
  children?: React.ReactNode
  className?: string
  side?: "left" | "right"
  size?: "sm" | "md" | "lg" | "xl"
  trigger?: React.ReactNode
}

export function FloatingSidebar({
  children,
  className,
  side = "left",
  size = "md",
  trigger
}: FloatingSidebarProps) {
  const [open, setOpen] = React.useState(false)

  const getSizeClass = () => {
    switch (size) {
      case "sm": return "w-64"
      case "md": return "w-80" 
      case "lg": return "w-96"
      case "xl": return "w-[28rem]"
      default: return "w-80"
    }
  }

  const defaultTrigger = (
    <Button
      variant="outline"
      size="icon"
      className="fixed top-4 left-4 z-50 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-200"
    >
      <IconMenu2 className="h-4 w-4" />
      <span className="sr-only">Open sidebar</span>
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent 
        side={side} 
        className={cn(
          "p-0 border-0",
          getSizeClass(),
          className
        )}
      >
        <div className="flex h-full flex-col">
          {children ? (
            <>
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold text-lg">Navigation</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="h-6 w-6"
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                {children}
              </div>
            </>
          ) : (
            <div className="relative h-full">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 z-10 h-6 w-6"
              >
                <IconX className="h-4 w-4" />
              </Button>
              <ClaudeNavigation />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
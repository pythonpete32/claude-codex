"use client"

import { SessionSelector } from '@/components/session-selector'

export default function SessionsPage() {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Claude Codex</h1>
          <p className="text-muted-foreground">
            View and explore your Claude Code conversation history
          </p>
        </div>
        
        <SessionSelector />
      </div>
    </div>
  )
}
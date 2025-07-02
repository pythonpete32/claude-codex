/**
 * API client for Claude Codex backend
 * Connects to the enhanced-history endpoint to fetch parsed tool props
 */

export interface SessionSummary {
  id: string
  projectPath: string
  lastActivity: string
  messageCount: number
  hasToolUsage: boolean
  isActive: boolean
  createdAt: string
  fileSize: number
}

export interface SessionsResponse {
  sessions: SessionSummary[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface ParsedProps {
  toolType: string
  props: any
  correlationId: string
}

export interface HistoryEntry {
  uuid: string
  parentUuid: string | null
  sessionId: string
  timestamp: string
  type: 'user' | 'assistant'
  content: any
  isSidechain: boolean
  parsedProps?: ParsedProps
}

export interface HistoryResponse {
  history: HistoryEntry[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  session: {
    id: string
    projectPath: string
  }
}

export interface HealthResponse {
  status: string
  timestamp: string
  version: string
  uptime: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        response.status,
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const apiClient = {
  /**
   * Check API server health
   */
  async getHealth(): Promise<HealthResponse> {
    return fetchApi<HealthResponse>('/health')
  },

  /**
   * Get all sessions with pagination
   */
  async getSessions(options?: {
    limit?: number
    offset?: number
    active?: boolean
    window?: number
  }): Promise<SessionsResponse> {
    const params = new URLSearchParams()
    if (options?.limit) params.set('limit', options.limit.toString())
    if (options?.offset) params.set('offset', options.offset.toString())
    if (options?.active) params.set('active', 'true')
    if (options?.window) params.set('window', options.window.toString())

    const query = params.toString()
    return fetchApi<SessionsResponse>(`/sessions${query ? `?${query}` : ''}`)
  },

  /**
   * Get specific session details
   */
  async getSession(sessionId: string): Promise<SessionSummary> {
    return fetchApi<SessionSummary>(`/sessions/${sessionId}`)
  },

  /**
   * Get raw session history
   */
  async getSessionHistory(sessionId: string, options?: {
    limit?: number
    offset?: number
    type?: 'user' | 'assistant'
    since?: string
  }): Promise<HistoryResponse> {
    const params = new URLSearchParams()
    if (options?.limit) params.set('limit', options.limit.toString())
    if (options?.offset) params.set('offset', options.offset.toString())
    if (options?.type) params.set('type', options.type)
    if (options?.since) params.set('since', options.since)

    const query = params.toString()
    return fetchApi<HistoryResponse>(`/sessions/${sessionId}/history${query ? `?${query}` : ''}`)
  },

  /**
   * Get enhanced session history with parsed tool props
   * This is the main endpoint for the client
   */
  async getEnhancedHistory(sessionId: string, options?: {
    limit?: number
    offset?: number
    type?: 'user' | 'assistant'
    since?: string
  }): Promise<HistoryResponse> {
    const params = new URLSearchParams()
    if (options?.limit) params.set('limit', options.limit.toString())
    if (options?.offset) params.set('offset', options.offset.toString())
    if (options?.type) params.set('type', options.type)
    if (options?.since) params.set('since', options.since)

    const query = params.toString()
    return fetchApi<HistoryResponse>(`/sessions/${sessionId}/enhanced-history${query ? `?${query}` : ''}`)
  },
}

export { ApiError }
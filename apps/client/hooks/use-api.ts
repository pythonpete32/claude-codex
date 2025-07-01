/**
 * React hooks for API data management
 */

import { useState, useEffect, useCallback } from 'react'
import { apiClient, SessionSummary, HistoryEntry, ApiError } from '@/lib/api-client'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseSessionsOptions {
  limit?: number
  offset?: number
  active?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseHistoryOptions {
  limit?: number
  offset?: number
  type?: 'user' | 'assistant'
  autoRefresh?: boolean
  refreshInterval?: number
}

/**
 * Hook to manage sessions list
 */
export function useSessions(options: UseSessionsOptions = {}) {
  const [state, setState] = useState<UseApiState<SessionSummary[]>>({
    data: null,
    loading: true,
    error: null,
  })

  const fetchSessions = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const response = await apiClient.getSessions({
        limit: options.limit || 50,
        offset: options.offset || 0,
        active: options.active,
      })
      setState({
        data: response.sessions,
        loading: false,
        error: null,
      })
      return response
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? `API Error (${error.status}): ${error.message}`
        : error instanceof Error 
        ? error.message 
        : 'Unknown error occurred'
      
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      })
      throw error
    }
  }, [options.limit, options.offset, options.active])

  const refresh = useCallback(() => {
    return fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Auto-refresh setup
  useEffect(() => {
    if (!options.autoRefresh) return

    const interval = setInterval(() => {
      fetchSessions()
    }, options.refreshInterval || 30000) // Default 30 seconds

    return () => clearInterval(interval)
  }, [fetchSessions, options.autoRefresh, options.refreshInterval])

  return {
    sessions: state.data,
    loading: state.loading,
    error: state.error,
    refresh,
  }
}

/**
 * Hook to manage session history with parsed props
 */
export function useEnhancedHistory(sessionId: string | null, options: UseHistoryOptions = {}) {
  const [state, setState] = useState<UseApiState<HistoryEntry[]>>({
    data: null,
    loading: !!sessionId,
    error: null,
  })

  const [pagination, setPagination] = useState({
    total: 0,
    hasMore: false,
    offset: 0,
  })

  const fetchHistory = useCallback(async (loadMore = false) => {
    if (!sessionId) {
      setState({ data: null, loading: false, error: null })
      return
    }

    try {
      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null 
      }))

      const currentOffset = loadMore ? pagination.offset + (options.limit || 50) : (options.offset || 0)
      
      const response = await apiClient.getEnhancedHistory(sessionId, {
        limit: options.limit || 50,
        offset: currentOffset,
        type: options.type,
      })

      setState(prev => ({
        data: loadMore && prev.data ? [...prev.data, ...response.history] : response.history,
        loading: false,
        error: null,
      }))

      setPagination({
        total: response.pagination.total,
        hasMore: response.pagination.hasMore,
        offset: currentOffset,
      })

      return response
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? `API Error (${error.status}): ${error.message}`
        : error instanceof Error 
        ? error.message 
        : 'Unknown error occurred'
      
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      })
      throw error
    }
  }, [sessionId, options.limit, options.offset, options.type, pagination.offset])

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !state.loading) {
      return fetchHistory(true)
    }
  }, [fetchHistory, pagination.hasMore, state.loading])

  const refresh = useCallback(() => {
    setPagination(prev => ({ ...prev, offset: 0 }))
    return fetchHistory(false)
  }, [fetchHistory])

  useEffect(() => {
    fetchHistory(false)
  }, [sessionId, options.limit, options.type]) // Don't include fetchHistory to avoid infinite loops

  // Auto-refresh setup
  useEffect(() => {
    if (!options.autoRefresh || !sessionId) return

    const interval = setInterval(() => {
      // Only refresh if we're looking at the first page
      if (pagination.offset === 0) {
        fetchHistory(false)
      }
    }, options.refreshInterval || 30000) // Default 30 seconds

    return () => clearInterval(interval)
  }, [fetchHistory, options.autoRefresh, options.refreshInterval, sessionId, pagination.offset])

  return {
    history: state.data,
    loading: state.loading,
    error: state.error,
    pagination,
    loadMore,
    refresh,
  }
}

/**
 * Hook to get parsed tool props from history entries
 */
export function useToolEntries(history: HistoryEntry[] | null) {
  return history?.filter(entry => entry.parsedProps) || []
}

/**
 * Hook to check API health
 */
export function useApiHealth() {
  const [state, setState] = useState<UseApiState<{ status: string; version: string }>>({
    data: null,
    loading: true,
    error: null,
  })

  const checkHealth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const health = await apiClient.getHealth()
      setState({
        data: { status: health.status, version: health.version },
        loading: false,
        error: null,
      })
      return health
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? `API Error (${error.status}): ${error.message}`
        : error instanceof Error 
        ? error.message 
        : 'API server unavailable'
      
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      })
      throw error
    }
  }, [])

  useEffect(() => {
    checkHealth()
    
    // Check health every 60 seconds
    const interval = setInterval(checkHealth, 60000)
    return () => clearInterval(interval)
  }, [checkHealth])

  return {
    health: state.data,
    loading: state.loading,
    error: state.error,
    checkHealth,
  }
}
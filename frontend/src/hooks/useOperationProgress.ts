import { useState, useCallback, useRef } from 'react'
import axios, { AxiosError, CancelTokenSource } from 'axios'

export type OperationType = 
  | 'upload'
  | 'slice'
  | 'boolean'
  | 'transform'
  | 'analysis'
  | 'quality'
  | 'curvature'
  | 'split'
  | 'merge'

export interface OperationProgress {
  id: string
  type: OperationType
  status: 'pending' | 'started' | 'completed' | 'failed'
  progress: number
  message: string
  startedAt: number
  completedAt?: number
  error?: string
}

interface UseOperationProgressReturn {
  operations: Map<string, OperationProgress>
  startOperation: (type: OperationType, message?: string) => string
  updateProgress: (id: string, progress: number, message?: string) => void
  completeOperation: (id: string, message?: string) => void
  failOperation: (id: string, error: string) => void
  clearOperation: (id: string) => void
  clearAllOperations: () => void
  getActiveOperations: () => OperationProgress[]
  isOperationActive: (type?: OperationType) => boolean
}

const operationMessages: Record<OperationType, { start: string; progress: string; complete: string }> = {
  upload: {
    start: 'Uploading file...',
    progress: 'Uploading...',
    complete: 'Upload complete'
  },
  slice: {
    start: 'Slicing mesh...',
    progress: 'Slicing...',
    complete: 'Slice complete'
  },
  boolean: {
    start: 'Processing boolean operation...',
    progress: 'Processing...',
    complete: 'Boolean operation complete'
  },
  transform: {
    start: 'Applying transform...',
    progress: 'Transforming...',
    complete: 'Transform complete'
  },
  analysis: {
    start: 'Analyzing mesh...',
    progress: 'Analyzing...',
    complete: 'Analysis complete'
  },
  quality: {
    start: 'Computing quality metrics...',
    progress: 'Computing quality...',
    complete: 'Quality analysis complete'
  },
  curvature: {
    start: 'Computing curvature...',
    progress: 'Computing curvature...',
    complete: 'Curvature analysis complete'
  },
  split: {
    start: 'Splitting mesh...',
    progress: 'Splitting...',
    complete: 'Mesh split complete'
  },
  merge: {
    start: 'Merging meshes...',
    progress: 'Merging...',
    complete: 'Meshes merged'
  }
}

export function useOperationProgress(): UseOperationProgressReturn {
  const [operations, setOperations] = useState<Map<string, OperationProgress>>(new Map())
  const cancelSourceRef = useRef<CancelTokenSource | null>(null)

  const startOperation = useCallback((type: OperationType, customMessage?: string): string => {
    const id = `${type}-${Date.now()}`
    const message = customMessage || operationMessages[type].start
    
    setOperations(prev => {
      const newMap = new Map(prev)
      newMap.set(id, {
        id,
        type,
        status: 'started',
        progress: 0,
        message,
        startedAt: Date.now()
      })
      return newMap
    })
    
    return id
  }, [])

  const updateProgress = useCallback((id: string, progress: number, message?: string) => {
    setOperations(prev => {
      const op = prev.get(id)
      if (!op) return prev
      
      const newMap = new Map(prev)
      newMap.set(id, {
        ...op,
        progress: Math.min(100, Math.max(0, progress)),
        message: message || operationMessages[op.type].progress
      })
      return newMap
    })
  }, [])

  const completeOperation = useCallback((id: string, customMessage?: string) => {
    setOperations(prev => {
      const op = prev.get(id)
      if (!op) return prev
      
      const newMap = new Map(prev)
      newMap.set(id, {
        ...op,
        status: 'completed',
        progress: 100,
        message: customMessage || operationMessages[op.type].complete,
        completedAt: Date.now()
      })
      return newMap
    })
  }, [])

  const failOperation = useCallback((id: string, error: string) => {
    setOperations(prev => {
      const op = prev.get(id)
      if (!op) return prev
      
      const newMap = new Map(prev)
      newMap.set(id, {
        ...op,
        status: 'failed',
        error
      })
      return newMap
    })
  }, [])

  const clearOperation = useCallback((id: string) => {
    setOperations(prev => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
  }, [])

  const clearAllOperations = useCallback(() => {
    setOperations(new Map())
  }, [])

  const getActiveOperations = useCallback((): OperationProgress[] => {
    return Array.from(operations.values()).filter(
      op => op.status === 'started' || op.status === 'pending'
    )
  }, [operations])

  const isOperationActive = useCallback((type?: OperationType): boolean => {
    const activeOps = getActiveOperations()
    if (type) {
      return activeOps.some(op => op.type === type)
    }
    return activeOps.length > 0
  }, [getActiveOperations])

  return {
    operations,
    startOperation,
    updateProgress,
    completeOperation,
    failOperation,
    clearOperation,
    clearAllOperations,
    getActiveOperations,
    isOperationActive
  }
}

// API error handling utilities
export function getErrorMessage(error: unknown): string {
  if (axios.isCancel(error)) {
    return 'Request was cancelled'
  }
  
  if (error instanceof AxiosError) {
    if (!error.response) {
      // Network error
      return 'Unable to connect to server. Please check your connection.'
    }
    
    const status = error.response.status
    const data = error.response.data as any
    
    if (status === 400) {
      return data?.detail || 'Invalid request'
    }
    if (status === 404) {
      return 'Resource not found'
    }
    if (status === 500) {
      return 'Server error. Please try again.'
    }
    if (status === 503) {
      return 'Service unavailable. Please try again later.'
    }
    
    return data?.detail || 'An error occurred'
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response && !error.config?.signal?.aborted
  }
  return false
}

export default useOperationProgress

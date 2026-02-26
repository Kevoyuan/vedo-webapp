import { useCallback, useState, useEffect } from 'react'
import { MeshData } from '../types'

// Maximum history stack size
const MAX_HISTORY_SIZE = 50

// Operation types
export type OperationType = 
  | 'import'
  | 'rotate'
  | 'scale'
  | 'translate'
  | 'fill_holes'
  | 'smooth'
  | 'decimate'
  | 'slice'
  | 'boolean'
  | 'split'
  | 'extract_largest'
  | 'curvature'
  | 'quality'

// Human-readable operation names
export const OPERATION_LABELS: Record<OperationType, string> = {
  import: 'Import Mesh',
  rotate: 'Rotate',
  scale: 'Scale',
  translate: 'Translate',
  fill_holes: 'Fill Holes',
  smooth: 'Smooth',
  decimate: 'Decimate',
  slice: 'Slice',
  boolean: 'Boolean',
  split: 'Split',
  extract_largest: 'Extract Largest',
  curvature: 'Curvature Analysis',
  quality: 'Quality Analysis',
}

// History entry
export interface HistoryEntry {
  id: string
  operation: OperationType
  timestamp: number
  meshData: MeshData
  description?: string
}

interface UseHistoryReturn {
  // State
  canUndo: boolean
  canRedo: boolean
  history: HistoryEntry[]
  currentIndex: number
  
  // Actions
  pushHistory: (operation: OperationType, meshData: MeshData, description?: string) => void
  undo: () => MeshData | null
  redo: () => MeshData | null
  clearHistory: () => void
  getCurrentMeshData: () => MeshData | null
}

export function useHistory(): UseHistoryReturn {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  // Can we undo?
  const canUndo = currentIndex >= 0

  // Can we redo?
  const canRedo = currentIndex < history.length - 1

  // Push a new history entry
  const pushHistory = useCallback((
    operation: OperationType, 
    meshData: MeshData,
    description?: string
  ) => {
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operation,
      timestamp: Date.now(),
      meshData: { ...meshData }, // Clone to avoid reference issues
      description,
    }

    setHistory(prev => {
      // Remove any entries after current index (discard redo stack)
      const newHistory = prev.slice(0, currentIndex + 1)
      
      // Add new entry
      newHistory.push(entry)
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift()
        return newHistory
      }
      
      return newHistory
    })

    setCurrentIndex(prev => {
      const newIndex = prev + 1
      // Adjust if we hit the limit
      if (history.length >= MAX_HISTORY_SIZE) {
        return Math.min(newIndex, MAX_HISTORY_SIZE - 1)
      }
      return newIndex
    })
  }, [currentIndex, history.length])

  // Undo - go back to previous state
  const undo = useCallback((): MeshData | null => {
    if (!canUndo) return null
    
    const newIndex = currentIndex - 1
    setCurrentIndex(newIndex)
    
    if (newIndex >= 0) {
      return { ...history[newIndex].meshData }
    }
    
    return null
  }, [canUndo, currentIndex, history])

  // Redo - go forward to next state
  const redo = useCallback((): MeshData | null => {
    if (!canRedo) return null
    
    const newIndex = currentIndex + 1
    setCurrentIndex(newIndex)
    
    return { ...history[newIndex].meshData }
  }, [canRedo, currentIndex, history])

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([])
    setCurrentIndex(-1)
  }, [])

  // Get current mesh data (latest)
  const getCurrentMeshData = useCallback((): MeshData | null => {
    if (currentIndex >= 0 && currentIndex < history.length) {
      return { ...history[currentIndex].meshData }
    }
    return null
  }, [currentIndex, history])

  return {
    canUndo,
    canRedo,
    history,
    currentIndex,
    pushHistory,
    undo,
    redo,
    clearHistory,
    getCurrentMeshData,
  }
}

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MeshData, SceneMesh } from '../types'

interface Props {
  meshes: MeshData[]
  selectedMeshId: string | null
  onSelectMesh: (id: string | null) => void
  onDeleteMesh: (id: string) => void
  onToggleVisibility: (id: string, visible: boolean) => void
  onMergeMeshes: (ids: string[]) => void
  onVisualizeMesh: (id: string) => Promise<any>
}

export default function MeshListPanel({
  meshes,
  selectedMeshId,
  onSelectMesh,
  onDeleteMesh,
  onToggleVisibility,
  onMergeMeshes,
  onVisualizeMesh,
}: Props) {
  const [meshVisibility, setMeshVisibility] = useState<Record<string, boolean>>({})
  const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set())
  const [mergedMeshIds, setMergedMeshIds] = useState<Record<string, { vertices: number[][], faces: number[][] }>>({})

  // Initialize visibility from meshes
  useEffect(() => {
    const visibility: Record<string, boolean> = {}
    meshes.forEach(m => {
      visibility[m.id] = true
    })
    setMeshVisibility(visibility)
  }, [meshes])

  const handleToggleVisibility = useCallback((id: string) => {
    const newVisibility = !meshVisibility[id]
    setMeshVisibility(prev => ({ ...prev, [id]: newVisibility }))
    onToggleVisibility(id, newVisibility)
  }, [meshVisibility, onToggleVisibility])

  const handleSelectForMerge = useCallback((id: string) => {
    setSelectedForMerge(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const handleMerge = useCallback(() => {
    if (selectedForMerge.size >= 2) {
      onMergeMeshes(Array.from(selectedForMerge))
      setSelectedForMerge(new Set())
    }
  }, [selectedForMerge, onMergeMeshes])

  const handleLoadVisualization = useCallback(async (id: string) => {
    try {
      const data = await onVisualizeMesh(id)
      setMergedMeshIds(prev => ({
        ...prev,
        [id]: data
      }))
    } catch (err) {
      console.error('Failed to load visualization:', err)
    }
  }, [onVisualizeMesh])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111113] rounded-xl border border-white/5 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <h3 className="text-sm font-medium text-gray-300">Meshes</h3>
          <span className="text-xs text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
            {meshes.length}
          </span>
        </div>
        
        {selectedForMerge.size >= 2 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleMerge}
            className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded hover:bg-cyan-500/30 transition-colors"
          >
            Merge ({selectedForMerge.size})
          </motion.button>
        )}
      </div>

      {/* Mesh List */}
      <div className="max-h-64 overflow-y-auto">
        {meshes.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            No meshes loaded
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            <AnimatePresence>
              {meshes.map((mesh) => (
                <motion.div
                  key={mesh.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`
                    px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors
                    ${selectedMeshId === mesh.id ? 'bg-cyan-500/10' : 'hover:bg-white/5'}
                  `}
                  onClick={() => {
                    onSelectMesh(mesh.id === selectedMeshId ? null : mesh.id)
                    handleLoadVisualization(mesh.id)
                  }}
                >
                  {/* Checkbox for merge selection */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectForMerge(mesh.id)
                    }}
                    className={`
                      w-4 h-4 rounded border flex items-center justify-center transition-colors
                      ${selectedForMerge.has(mesh.id) 
                        ? 'bg-cyan-500 border-cyan-500' 
                        : 'border-gray-600 hover:border-gray-500'}
                    `}
                  >
                    {selectedForMerge.has(mesh.id) && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {/* Visibility toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleVisibility(mesh.id)
                    }}
                    className="text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {meshVisibility[mesh.id] !== false ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>

                  {/* Mesh info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">
                      {mesh.filename || mesh.id}
                    </p>
                    <p className="text-xs text-gray-500">
                      {mesh.n_points?.toLocaleString() || 0} pts • {mesh.n_cells?.toLocaleString() || 0} faces
                    </p>
                  </div>

                  {/* Selected indicator */}
                  {selectedMeshId === mesh.id && (
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  )}

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteMesh(mesh.id)
                    }}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1"
                    title="Delete mesh"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer with stats */}
      {meshes.length > 0 && (
        <div className="px-4 py-2 border-t border-white/5 text-xs text-gray-500 flex justify-between">
          <span>
            {meshes.length} mesh{meshes.length !== 1 ? 'es' : ''}
          </span>
          <span>
            {meshes.reduce((acc, m) => acc + (m.n_cells || 0), 0).toLocaleString()} total faces
          </span>
        </div>
      )}
    </motion.div>
  )
}

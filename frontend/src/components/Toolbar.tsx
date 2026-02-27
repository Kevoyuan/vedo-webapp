import { useState, memo, useCallback, useRef, useEffect } from 'react'
import { Button, Group, ActionIcon, Tooltip, Text, SegmentedControl, Divider, Select, Modal, Stack, NumberInput } from '@mantine/core'
import { 
  ArrowClockwise, 
  ArrowCounterClockwise, 
  MagnifyingGlassPlus, 
  MagnifyingGlassMinus,
  ArrowsOut,
  ArrowClockwise as Rotate,
  Scissors,
  Cubes,
  ArrowsIn,
  Waveform,
  ChartLine,
  Circle as CircleDashed,
  Split,
  Merge,
  ChartPie,
  Download
} from '@phosphor-icons/react'
import axios, { AxiosError } from 'axios'

// API base URL - could be moved to environment config
const API_BASE_URL = 'http://localhost:8000'

interface Props {
  meshId: string
  onUpdate: (data: unknown) => void
  onAnalysisResult?: (result: unknown) => void
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  onError?: (message: string) => void
  onProgress?: (id: string, progress: number, message?: string) => void
  onOperationComplete?: (id: string, message?: string) => void
  onOperationFail?: (id: string, error: string) => void
  startOperation?: (type: 'upload' | 'transform' | 'analysis' | 'quality' | 'curvature' | 'slice' | 'boolean' | 'split' | 'merge', message?: string) => string
}

interface ToolButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  loading?: boolean
  accent?: boolean
  disabled?: boolean
}

/**
 * Tool button component - memoized for performance
 */
const ToolButton = memo(function ToolButton({ icon, label, onClick, loading, accent, disabled }: ToolButtonProps) {
  return (
    <Tooltip label={label} position="top" withArrow>
      <ActionIcon 
        variant={accent ? 'filled' : 'subtle'}
        color={accent ? 'cyan' : 'gray'}
        size="lg"
        radius="md"
        onClick={onClick}
        loading={loading}
        disabled={disabled}
        className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        styles={{
          root: accent ? {
            background: 'rgba(0, 212, 255, 0.15)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            '&:hover': {
              background: 'rgba(0, 212, 255, 0.25)',
            }
          } : {}
        }}
      >
        {icon}
      </ActionIcon>
    </Tooltip>
  )
})

ToolButton.displayName = 'ToolButton'

interface FixButtonProps {
  label: string
  onClick: () => void
  loading?: boolean
  variant?: 'fill-holes' | 'smooth' | 'decimate' | 'slice' | 'boolean' | 'curvature' | 'quality' | 'split' | 'merge'
}

const FIX_BUTTON_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'fill-holes': { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)', text: 'text-emerald-400' },
  'smooth': { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.2)', text: 'text-purple-400' },
  'decimate': { bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.2)', text: 'text-orange-400' },
  'slice': { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)', text: 'text-blue-400' },
  'boolean': { bg: 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.2)', text: 'text-pink-400' },
  'curvature': { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.2)', text: 'text-yellow-400' },
  'quality': { bg: 'rgba(20, 184, 166, 0.1)', border: 'rgba(20, 184, 166, 0.2)', text: 'text-teal-400' },
  'split': { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.2)', text: 'text-violet-400' },
  'merge': { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.2)', text: 'text-cyan-400' },
}

/**
 * Fix button component - memoized for performance
 */
const FixButton = memo(function FixButton({ label, onClick, loading, variant = 'fill-holes' }: FixButtonProps) {
  const style = FIX_BUTTON_COLORS[variant]
  
  return (
    <Button
      size="xs"
      variant="subtle"
      onClick={onClick}
      loading={loading}
      className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      styles={{
        root: {
          background: style.bg,
          border: `1px solid ${style.border}`,
          color: style.text,
          '&:hover': {
            background: style.bg,
            filter: 'brightness(1.2)',
          }
        }
      }}
    >
      {label}
    </Button>
  )
})

FixButton.displayName = 'FixButton'

/**
 * Debounce utility function
 */
function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

// ============================================================================
// Toolbar Component
// ============================================================================

function ToolbarComponent({ 
  meshId, 
  onUpdate, 
  onAnalysisResult, 
  canUndo, 
  canRedo, 
  onUndo, 
  onRedo,
  onError,
  onProgress,
  onOperationComplete,
  onOperationFail,
  startOperation
}: Props) {
  const [loading, setLoading] = useState(false)
  const [transformMode, setTransformMode] = useState('rotate')
  const [sliceModalOpen, setSliceModalOpen] = useState(false)
  const [booleanModalOpen, setBooleanModalOpen] = useState(false)
  const [sliceAxis, setSliceAxis] = useState('z')
  const [slicePosition, setSlicePosition] = useState(0)
  const [booleanMeshId, setBooleanMeshId] = useState('')
  const [availableMeshes, setAvailableMeshes] = useState<{value: string, label: string}[]>([])
  
  // Export state
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState('stl')
  const [exportBinary, setExportBinary] = useState(true)
  const [exporting, setExporting] = useState(false)
  
  // Ref to track pending requests for debouncing
  const pendingRequestRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Fetch available meshes for boolean operations
  const fetchAvailableMeshes = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/mesh/`)
      const meshes = data.meshes || []
      setAvailableMeshes(
        meshes
          .filter((m: { id: string }) => m.id !== meshId)
          .map((m: { id: string; filename: string }) => ({
            value: m.id,
            label: m.filename
          }))
      )
    } catch (err) {
      console.error('Failed to fetch meshes:', err)
    }
  }, [meshId])

  /**
   * Handle mesh transformation - debounced to prevent API spam
   */
  const handleTransform = useCallback(async (op: string, params: Record<string, unknown>) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    setLoading(true)
    
    // Start operation tracking
    let operationId: string | null = null
    if (startOperation) {
      operationId = startOperation('transform', `Applying ${op}...`)
    }
    
    try {
      // Simulate progress for transform operations
      if (onProgress && operationId) {
        onProgress(operationId, 30, `Applying ${op}...`)
      }
      
      await axios.post(`${API_BASE_URL}/mesh/${meshId}/transform`, {
        operation: op,
        params
      }, {
        signal: abortControllerRef.current.signal
      })
      
      if (onProgress && operationId) {
        onProgress(operationId, 70, 'Fetching results...')
      }
      
      const { data } = await axios.get(`${API_BASE_URL}/mesh/${meshId}/analyze`, {
        signal: abortControllerRef.current.signal
      })
      
      if (onOperationComplete && operationId) {
        onOperationComplete(operationId, `${op} applied successfully`)
      }
      
      onUpdate(data)
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error('Transform error:', err)
        
        let errorMessage = 'Failed to apply transform'
        if (err instanceof AxiosError) {
          if (!err.response) {
            errorMessage = 'Unable to connect to server'
          } else {
            errorMessage = err.response.data?.detail || 'Failed to apply transform'
          }
        }
        
        if (onOperationFail && operationId) {
          onOperationFail(operationId, errorMessage)
        }
        
        if (onError) {
          onError(errorMessage)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [meshId, onUpdate, onError, onProgress, onOperationComplete, onOperationFail, startOperation])

  // Debounced version
  const debouncedTransform = useCallback(
    debounce((op: string, params: Record<string, unknown>) => {
      handleTransform(op, params)
    }, 300),
    [handleTransform]
  )

  // Transform handlers
  const handleRotateMinus = useCallback(() => {
    handleTransform('rotate', { angle: -90, axis: 'z' })
  }, [handleTransform])

  const handleRotatePlus = useCallback(() => {
    handleTransform('rotate', { angle: 90, axis: 'z' })
  }, [handleTransform])

  const handleScaleDown = useCallback(() => {
    handleTransform('scale', { x: 0.8, y: 0.8, z: 0.8 })
  }, [handleTransform])

  const handleScaleUp = useCallback(() => {
    handleTransform('scale', { x: 1.2, y: 1.2, z: 1.2 })
  }, [handleTransform])

  const handleFillHoles = useCallback(() => {
    handleTransform('fill_holes', {})
  }, [handleTransform])

  const handleSmooth = useCallback(() => {
    handleTransform('smooth', { iterations: 20 })
  }, [handleTransform])

  const handleDecimate = useCallback(() => {
    handleTransform('decimate', { reduction: 0.5 })
  }, [handleTransform])

  // Slicing operation
  const handleSlice = useCallback(async () => {
    setLoading(true)
    
    // Start operation tracking
    let operationId: string | null = null
    if (startOperation) {
      operationId = startOperation('slice', 'Slicing mesh...')
    }
    
    try {
      if (onProgress && operationId) {
        onProgress(operationId, 30, 'Slicing mesh...')
      }
      
      const { data } = await axios.post(`${API_BASE_URL}/mesh/${meshId}/slice`, {
        axis: sliceAxis,
        position: slicePosition,
        invert: false
      })
      
      if (onProgress && operationId) {
        onProgress(operationId, 70, 'Processing results...')
      }
      
      if (data.new_mesh_id) {
        // Refresh data with new mesh
        const { data: newData } = await axios.get(`${API_BASE_URL}/mesh/${data.new_mesh_id}/analyze`)
        onUpdate(newData)
      }
      
      if (onOperationComplete && operationId) {
        onOperationComplete(operationId, 'Mesh sliced successfully')
      }
      
      setSliceModalOpen(false)
    } catch (err) {
      console.error('Slice error:', err)
      
      let errorMessage = 'Failed to slice mesh'
      if (err instanceof AxiosError) {
        if (!err.response) {
          errorMessage = 'Unable to connect to server'
        } else {
          errorMessage = err.response.data?.detail || 'Failed to slice mesh'
        }
      }
      
      if (onOperationFail && operationId) {
        onOperationFail(operationId, errorMessage)
      }
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [meshId, sliceAxis, slicePosition, onUpdate, onError, onProgress, onOperationComplete, onOperationFail, startOperation])

  // Boolean operations
  const handleBoolean = useCallback(async (operation: string) => {
    if (!booleanMeshId) return
    
    setLoading(true)
    
    // Start operation tracking
    let operationId: string | null = null
    if (startOperation) {
      operationId = startOperation('boolean', `Performing ${operation}...`)
    }
    
    try {
      if (onProgress && operationId) {
        onProgress(operationId, 30, `Performing ${operation}...`)
      }
      
      const { data } = await axios.post(`${API_BASE_URL}/mesh/${meshId}/boolean`, {
        operation,
        mesh_id_2: booleanMeshId
      })
      
      if (onProgress && operationId) {
        onProgress(operationId, 70, 'Processing results...')
      }
      
      if (data.new_mesh_id) {
        const { data: newData } = await axios.get(`${API_BASE_URL}/mesh/${data.new_mesh_id}/analyze`)
        onUpdate(newData)
      }
      
      if (onOperationComplete && operationId) {
        onOperationComplete(operationId, `Boolean ${operation} complete`)
      }
      
      setBooleanModalOpen(false)
    } catch (err) {
      console.error('Boolean error:', err)
      
      let errorMessage = 'Failed to perform boolean operation'
      if (err instanceof AxiosError) {
        if (!err.response) {
          errorMessage = 'Unable to connect to server'
        } else {
          errorMessage = err.response.data?.detail || 'Failed to perform boolean operation'
        }
      }
      
      if (onOperationFail && operationId) {
        onOperationFail(operationId, errorMessage)
      }
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [meshId, booleanMeshId, onUpdate, onError, onProgress, onOperationComplete, onOperationFail, startOperation])

  // Curvature analysis
  const handleCurvature = useCallback(async (method: string) => {
    setLoading(true)
    
    // Start operation tracking
    let operationId: string | null = null
    if (startOperation) {
      operationId = startOperation('curvature', 'Computing curvature...')
    }
    
    try {
      if (onProgress && operationId) {
        onProgress(operationId, 30, 'Computing curvature...')
      }
      
      const { data } = await axios.post(`${API_BASE_URL}/mesh/${meshId}/curvature`, {
        method
      })
      
      if (onProgress && operationId) {
        onProgress(operationId, 80, 'Finalizing...')
      }
      
      if (onAnalysisResult) {
        onAnalysisResult(data)
      }
      
      if (onOperationComplete && operationId) {
        onOperationComplete(operationId, 'Curvature analysis complete')
      }
    } catch (err) {
      console.error('Curvature error:', err)
      
      let errorMessage = 'Failed to compute curvature'
      if (err instanceof AxiosError) {
        if (!err.response) {
          errorMessage = 'Unable to connect to server'
        } else {
          errorMessage = err.response.data?.detail || 'Failed to compute curvature'
        }
      }
      
      if (onOperationFail && operationId) {
        onOperationFail(operationId, errorMessage)
      }
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [meshId, onAnalysisResult, onError, onProgress, onOperationComplete, onOperationFail, startOperation])

  // Quality analysis
  const handleQuality = useCallback(async () => {
    setLoading(true)
    
    // Start operation tracking
    let operationId: string | null = null
    if (startOperation) {
      operationId = startOperation('quality', 'Computing quality metrics...')
    }
    
    try {
      if (onProgress && operationId) {
        onProgress(operationId, 30, 'Computing quality metrics...')
      }
      
      const { data } = await axios.post(`${API_BASE_URL}/mesh/${meshId}/quality`, {
        compute_aspect_ratio: true,
        compute_skewness: true,
        compute_orthogonality: true
      })
      
      if (onProgress && operationId) {
        onProgress(operationId, 80, 'Finalizing...')
      }
      
      if (onAnalysisResult) {
        onAnalysisResult(data)
      }
      
      if (onOperationComplete && operationId) {
        onOperationComplete(operationId, 'Quality analysis complete')
      }
    } catch (err) {
      console.error('Quality error:', err)
      
      let errorMessage = 'Failed to compute quality metrics'
      if (err instanceof AxiosError) {
        if (!err.response) {
          errorMessage = 'Unable to connect to server'
        } else {
          errorMessage = err.response.data?.detail || 'Failed to compute quality metrics'
        }
      }
      
      if (onOperationFail && operationId) {
        onOperationFail(operationId, errorMessage)
      }
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [meshId, onAnalysisResult, onError, onProgress, onOperationComplete, onOperationFail, startOperation])

  // Split mesh
  const handleSplit = useCallback(async () => {
    setLoading(true)
    
    // Start operation tracking
    let operationId: string | null = null
    if (startOperation) {
      operationId = startOperation('split', 'Splitting mesh...')
    }
    
    try {
      if (onProgress && operationId) {
        onProgress(operationId, 30, 'Splitting mesh...')
      }
      
      const { data } = await axios.post(`${API_BASE_URL}/mesh/${meshId}/split-merge`, {
        operation: 'split',
        params: {}
      })
      
      if (onProgress && operationId) {
        onProgress(operationId, 70, 'Processing results...')
      }
      
      if (data.mesh_ids && data.mesh_ids.length > 0) {
        // Load first component
        const firstComp = data.mesh_ids[0]
        const { data: newData } = await axios.get(`${API_BASE_URL}/mesh/${firstComp.id}/analyze`)
        onUpdate(newData)
      }
      
      if (onOperationComplete && operationId) {
        onOperationComplete(operationId, 'Mesh split complete')
      }
    } catch (err) {
      console.error('Split error:', err)
      
      let errorMessage = 'Failed to split mesh'
      if (err instanceof AxiosError) {
        if (!err.response) {
          errorMessage = 'Unable to connect to server'
        } else {
          errorMessage = err.response.data?.detail || 'Failed to split mesh'
        }
      }
      
      if (onOperationFail && operationId) {
        onOperationFail(operationId, errorMessage)
      }
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [meshId, onUpdate, onError, onProgress, onOperationComplete, onOperationFail, startOperation])

  // Extract largest component
  const handleExtractLargest = useCallback(async () => {
    setLoading(true)
    
    // Start operation tracking
    let operationId: string | null = null
    if (startOperation) {
      operationId = startOperation('merge', 'Extracting largest component...')
    }
    
    try {
      if (onProgress && operationId) {
        onProgress(operationId, 30, 'Extracting largest component...')
      }
      
      const { data } = await axios.post(`${API_BASE_URL}/mesh/${meshId}/split-merge`, {
        operation: 'extract_largest',
        params: {}
      })
      
      if (onProgress && operationId) {
        onProgress(operationId, 70, 'Processing results...')
      }
      
      const { data: newData } = await axios.get(`${API_BASE_URL}/mesh/${meshId}/analyze`)
      onUpdate(newData)
      
      if (onOperationComplete && operationId) {
        onOperationComplete(operationId, 'Largest component extracted')
      }
    } catch (err) {
      console.error('Extract largest error:', err)
      
      let errorMessage = 'Failed to extract largest component'
      if (err instanceof AxiosError) {
        if (!err.response) {
          errorMessage = 'Unable to connect to server'
        } else {
          errorMessage = err.response.data?.detail || 'Failed to extract largest component'
        }
      }
      
      if (onOperationFail && operationId) {
        onOperationFail(operationId, errorMessage)
      }
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [meshId, onUpdate, onError, onProgress, onOperationComplete, onOperationFail, startOperation])

  // Open boolean modal
  const openBooleanModal = useCallback(() => {
    fetchAvailableMeshes()
    setBooleanModalOpen(true)
  }, [fetchAvailableMeshes])

  // Export mesh handler
  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      const response = await axios.post(
        `${API_BASE_URL}/mesh/${meshId}/export`,
        {
          format: exportFormat,
          binary: exportBinary
        },
        {
          responseType: 'blob'
        }
      )
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      // Get filename from content-disposition header or generate one
      const contentDisposition = response.headers['content-disposition']
      let filename = `mesh_${meshId}.${exportFormat}`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }
      
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      link.remove()
      window.URL.revokeObjectURL(url)
      
      setExportModalOpen(false)
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }, [meshId, exportFormat, exportBinary])

  return (
    <div className="glass-light rounded-xl p-4 animate-scale-in">
      {/* Undo/Redo Controls */}
      {(canUndo !== undefined || canRedo !== undefined) && (
        <Group justify="space-between" mb="md">
          <Text size="sm" fw={600}>History</Text>
          <Group gap={4}>
            <Tooltip label="Undo (Ctrl+Z)">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="md"
                onClick={onUndo}
                disabled={!canUndo}
                className="transition-all duration-200 hover:bg-white/5 disabled:opacity-30"
              >
                <ArrowCounterClockwise size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Redo (Ctrl+Shift+Z)">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="md"
                onClick={onRedo}
                disabled={!canRedo}
                className="transition-all duration-200 hover:bg-white/5 disabled:opacity-30"
              >
                <ArrowClockwise size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      )}

      {/* Conditional divider if history controls shown */}
      {(canUndo !== undefined || canRedo !== undefined) && <Divider my="sm" color="white/5" />}

      {/* Transform Mode Selector */}
      <Group justify="space-between" mb="md">
        <Text size="sm" fw={600}>Transform</Text>
        <SegmentedControl
          size="xs"
          value={transformMode}
          onChange={setTransformMode}
          data={[
            { label: <Group gap={4}><Rotate size={12} />Rotate</Group>, value: 'rotate' },
            { label: <Group gap={4}><ArrowsOut size={12} />Scale</Group>, value: 'scale' },
          ]}
          styles={{
            root: {
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }
          }}
        />
      </Group>
      
      {/* Transform Tools */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <ToolButton 
          icon={<ArrowCounterClockwise size={18} />}
          label="Rotate -90°"
          onClick={handleRotateMinus}
          loading={loading}
        />
        <ToolButton 
          icon={<ArrowClockwise size={18} />}
          label="Rotate +90°"
          onClick={handleRotatePlus}
          loading={loading}
        />
        <ToolButton 
          icon={<MagnifyingGlassMinus size={18} />}
          label="Scale Down"
          onClick={handleScaleDown}
          loading={loading}
          accent
        />
        <ToolButton 
          icon={<MagnifyingGlassPlus size={18} />}
          label="Scale Up"
          onClick={handleScaleUp}
          loading={loading}
          accent
        />
      </div>

      <Divider my="sm" color="white/5" />

      {/* Mesh Repair Tools */}
      <Text size="sm" fw={600} mb="sm">Repair</Text>
      
      <div className="flex flex-wrap gap-2">
        <FixButton 
          label="Fill Holes" 
          onClick={handleFillHoles}
          loading={loading}
          variant="fill-holes"
        />
        <FixButton 
          label="Smooth" 
          onClick={handleSmooth}
          loading={loading}
          variant="smooth"
        />
        <FixButton 
          label="Decimate" 
          onClick={handleDecimate}
          loading={loading}
          variant="decimate"
        />
      </div>

      <Divider my="sm" color="white/5" />

      {/* Advanced Operations */}
      <Text size="sm" fw={600} mb="sm">Advanced</Text>
      
      <div className="flex flex-wrap gap-2">
        <FixButton 
          label="Slice" 
          onClick={() => setSliceModalOpen(true)}
          loading={loading}
          variant="slice"
        />
        <FixButton 
          label="Boolean" 
          onClick={openBooleanModal}
          loading={loading}
          variant="boolean"
        />
        <FixButton 
          label="Curvature" 
          onClick={() => handleCurvature('gaussian')}
          loading={loading}
          variant="curvature"
        />
        <FixButton 
          label="Quality" 
          onClick={handleQuality}
          loading={loading}
          variant="quality"
        />
      </div>

      <Divider my="sm" color="white/5" />

      {/* Split/Merge */}
      <Text size="sm" fw={600} mb="sm">Topology</Text>
      
      <div className="flex flex-wrap gap-2">
        <FixButton 
          label="Split" 
          onClick={handleSplit}
          loading={loading}
          variant="split"
        />
        <FixButton 
          label="Extract Largest" 
          onClick={handleExtractLargest}
          loading={loading}
          variant="merge"
        />
      </div>

      <Divider my="sm" color="white/5" />

      {/* Export */}
      <Text size="sm" fw={600} mb="sm">Export</Text>
      
      <div className="flex flex-wrap gap-2">
        <Button
          size="xs"
          variant="light"
          color="cyan"
          leftSection={<Download size={14} />}
          onClick={() => setExportModalOpen(true)}
          className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          Export Mesh
        </Button>
      </div>

      {/* Slicing Modal */}
      <Modal
        opened={sliceModalOpen}
        onClose={() => setSliceModalOpen(false)}
        title="Slice Mesh"
        centered
        styles={{
          content: { background: '#1A1B1E' },
          header: { background: '#1A1B1E' }
        }}
      >
        <Stack>
          <Select
            label="Axis"
            value={sliceAxis}
            onChange={(v) => setSliceAxis(v || 'z')}
            data={[
              { value: 'x', label: 'X Axis' },
              { value: 'y', label: 'Y Axis' },
              { value: 'z', label: 'Z Axis' },
            ]}
          />
          <NumberInput
            label="Position"
            value={slicePosition}
            onChange={(v) => setSlicePosition(Number(v) || 0)}
            description="Position along the axis"
          />
          <Button onClick={handleSlice} loading={loading}>
            Slice
          </Button>
        </Stack>
      </Modal>

      {/* Boolean Modal */}
      <Modal
        opened={booleanModalOpen}
        onClose={() => setBooleanModalOpen(false)}
        title="Boolean Operation"
        centered
        styles={{
          content: { background: '#1A1B1E' },
          header: { background: '#1A1B1E' }
        }}
      >
        <Stack>
          <Select
            label="Second Mesh"
            value={booleanMeshId}
            onChange={(v) => setBooleanMeshId(v || '')}
            data={availableMeshes}
            placeholder="Select a mesh"
            searchable
          />
          <Group grow>
            <Button 
              onClick={() => handleBoolean('union')}
              loading={loading}
              variant="light"
              color="pink"
            >
              Union
            </Button>
            <Button 
              onClick={() => handleBoolean('intersection')}
              loading={loading}
              variant="light"
              color="pink"
            >
              Intersect
            </Button>
            <Button 
              onClick={() => handleBoolean('difference')}
              loading={loading}
              variant="light"
              color="pink"
            >
              Subtract
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Export Modal */}
      <Modal
        opened={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Mesh"
        centered
        styles={{
          content: { background: '#1A1B1E' },
          header: { background: '#1A1B1E' }
        }}
      >
        <Stack>
          <Select
            label="Format"
            value={exportFormat}
            onChange={(v) => setExportFormat(v || 'stl')}
            data={[
              { value: 'stl', label: 'STL (Stereo Lithography)' },
              { value: 'obj', label: 'OBJ (Wavefront)' },
              { value: 'ply', label: 'PLY (Polygon File)' },
              { value: 'vtk', label: 'VTK (Visualization Toolkit)' },
              { value: 'gltf', label: 'GLTF (GL Transmission Format)' },
            ]}
          />
          
          {exportFormat === 'stl' && (
            <div>
              <Text size="sm" fw={500} mb="xs">Format Options</Text>
              <SegmentedControl
                size="xs"
                value={exportBinary ? 'binary' : 'ascii'}
                onChange={(v) => setExportBinary(v === 'binary')}
                data={[
                  { label: 'Binary', value: 'binary' },
                  { label: 'ASCII', value: 'ascii' },
                ]}
                fullWidth
              />
              <Text size="xs" c="dimmed" mt={4}>
                Binary is smaller and faster. ASCII is human-readable.
              </Text>
            </div>
          )}
          
          <Button 
            onClick={handleExport}
            loading={exporting}
            color="cyan"
            leftSection={<Download size={16} />}
          >
            Download
          </Button>
        </Stack>
      </Modal>
    </div>
  )
}

// Memoize the entire component
const Toolbar = memo(ToolbarComponent, (prevProps, nextProps) => {
  return prevProps.meshId === nextProps.meshId
})

Toolbar.displayName = 'Toolbar'

export default Toolbar

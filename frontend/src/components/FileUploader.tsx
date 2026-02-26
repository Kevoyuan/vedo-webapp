import { useCallback, useState, memo, useRef, useEffect } from 'react'
import { Button } from '@mantine/core'
import { Upload } from '@phosphor-icons/react'
import axios, { AxiosError } from 'axios'

// API base URL - could be moved to environment config
const API_BASE_URL = 'http://localhost:8000'

// Supported file extensions - all formats supported by Vedo backend
const SUPPORTED_EXTENSIONS = [
  '.stl', '.obj', '.vtk', '.ply', '.3ds',
  '.gltf', '.glb', '.3mf', '.off', '.wrl', '.xyz'
]

// Human-readable format names
const SUPPORTED_FORMATS = [
  'STL', 'OBJ', 'VTK', 'PLY', '3DS',
  'GLTF', 'GLB', '3MF', 'OFF', 'WRL', 'XYZ'
]

// Format descriptions for tooltips
const FORMAT_DESCRIPTIONS: Record<string, string> = {
  'STL': 'Stereolithography - common for 3D printing',
  'OBJ': 'Wavefront OBJ - universal 3D format',
  'VTK': 'Visualization Toolkit',
  'PLY': 'Polygon File Format - supports colors',
  '3DS': '3D Studio Max',
  'GLTF': 'GL Transmission Format - web-ready',
  'GLB': 'GL Binary - web-ready 3D',
  '3MF': '3D Manufacturing Format - 3D printing',
  'OFF': 'Object File Format',
  'WRL': 'VRML - Virtual Reality',
  'XYZ': 'XYZ Point Cloud',
}

/**
 * Detect file format from filename extension
 */
function detectFormat(filename: string): string {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'))
  const idx = SUPPORTED_EXTENSIONS.indexOf(ext)
  return idx >= 0 ? SUPPORTED_FORMATS[idx] : 'Unknown'
}

interface Props {
  onUpload: (data: unknown) => void
  loading: boolean
  setLoading: (value: boolean | ((prev: boolean) => boolean)) => void
  onError?: (message: string) => void
  onProgress?: (id: string, progress: number, message?: string) => void
  onOperationComplete?: (id: string, message?: string) => void
  onOperationFail?: (id: string, error: string) => void
  startOperation?: (type: 'upload' | 'transform' | 'analysis' | 'quality' | 'curvature' | 'slice' | 'boolean' | 'split' | 'merge', message?: string) => string
}

/**
 * FileUploader Component
 * Handles drag-and-drop and click-to-upload functionality
 * Optimized with memoization
 */
function FileUploaderComponent({ 
  onUpload, 
  loading, 
  setLoading,
  onError,
  onProgress,
  onOperationComplete,
  onOperationFail,
  startOperation
}: Props) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null)
  
  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const operationIdRef = useRef<string | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * Upload file to server - with abort support
   */
  const uploadFile = useCallback(async (file: File) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    setLoading(true)
    setUploadProgress(0)
    
    // Start operation tracking
    if (startOperation) {
      operationIdRef.current = startOperation('upload', `Uploading ${file.name}...`)
    }
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const { data } = await axios.post(`${API_BASE_URL}/mesh/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: abortControllerRef.current.signal,
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setUploadProgress(progress)
          if (onProgress && operationIdRef.current) {
            onProgress(operationIdRef.current, progress, `Uploading ${file.name}...`)
          }
        }
      })
      
      // Complete the operation
      if (onOperationComplete && operationIdRef.current) {
        onOperationComplete(operationIdRef.current, `Uploaded ${file.name}`)
      }
      
      onUpload(data)
    } catch (err) {
      // Don't show error for aborted requests
      if (!axios.isCancel(err)) {
        console.error('Upload error:', err)
        
        // Get error message
        let errorMessage = 'Failed to upload mesh'
        if (err instanceof AxiosError) {
          if (!err.response) {
            errorMessage = 'Unable to connect to server. Please check your connection.'
          } else {
            errorMessage = err.response.data?.detail || 'Failed to upload mesh'
          }
        }
        
        if (onOperationFail && operationIdRef.current) {
          onOperationFail(operationIdRef.current, errorMessage)
        }
        
        if (onError) {
          onError(errorMessage)
        }
      }
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }, [onUpload, setLoading, onError, onProgress, onOperationComplete, onOperationFail, startOperation])

  /**
   * Validate file extension
   */
  const isValidFile = useCallback((file: File): boolean => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    return SUPPORTED_EXTENSIONS.includes(ext)
  }, [])

  /**
   * Handle file selection - validates and uploads
   */
  const handleFile = useCallback((file: File) => {
    if (!isValidFile(file)) {
      alert(`Invalid file format. Supported: ${SUPPORTED_FORMATS.join(', ')}`)
      return
    }
    uploadFile(file)
  }, [isValidFile, uploadFile])

  // Drag event handlers - memoized
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
      // Detect format on drag enter
      const file = e.dataTransfer?.files?.[0]
      if (file) {
        const format = detectFormat(file.name)
        setDetectedFormat(FORMAT_DESCRIPTIONS[format] || format)
      }
    } else if (e.type === 'dragleave') {
      setDragActive(false)
      setDetectedFormat(null)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setDetectedFormat(null)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  // Memoize the file input click handler
  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div 
      className={`
        relative rounded-2xl border-2 transition-all duration-500 overflow-hidden
        ${dragActive 
          ? 'border-cyan-400 bg-cyan-400/5 shadow-glow' 
          : 'border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent hover:border-white/10 hover:shadow-card'
        }
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Animated gradient overlay */}
      <div className={`
        absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 
        opacity-0 transition-opacity duration-500 ${dragActive ? 'opacity-100' : ''}
        animate-pulse
      `} />
      
      {/* Corner accents */}
      <div className={`absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-cyan-400/0 transition-all duration-300 ${dragActive ? 'border-cyan-400/50' : ''} rounded-tl-2xl`} />
      <div className={`absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-cyan-400/0 transition-all duration-300 ${dragActive ? 'border-cyan-400/50' : ''} rounded-tr-2xl`} />
      <div className={`absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-cyan-400/0 transition-all duration-300 ${dragActive ? 'border-cyan-400/50' : ''} rounded-bl-2xl`} />
      <div className={`absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-cyan-400/0 transition-all duration-300 ${dragActive ? 'border-cyan-400/50' : ''} rounded-br-2xl`} />
      
      <div className="relative p-6 text-center">
        {/* Upload icon with animated ring */}
        <div className={`
          relative w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
          transition-all duration-500 group
          ${dragActive ? 'bg-cyan-500/20 scale-110' : 'bg-white/[0.03] hover:bg-white/[0.06]'}
        `}>
          {/* Animated ring */}
          <div className={`
            absolute inset-0 rounded-2xl border-2 transition-all duration-500
            ${dragActive ? 'border-cyan-400 scale-100 opacity-100' : 'border-white/5 scale-90 opacity-0'}
          `} />
          <div className={`
            absolute inset-[-4px] rounded-[18px] border border-cyan-400/0 transition-all duration-500
            ${dragActive ? 'border-cyan-300/30 animate-ping' : ''}
          `} />
          <Upload 
            size={28} 
            weight="duotone"
            className={`transition-all duration-300 ${dragActive ? 'text-cyan-400 scale-110' : 'text-gray-500 group-hover:text-gray-400'}`} 
          />
        </div>

        <p className="text-sm text-gray-300 mb-1 font-medium">
          {dragActive ? 'Drop your file here' : 'Drag & drop mesh file'}
        </p>
        <p className="text-xs text-gray-500 mb-4">
          {detectedFormat || 'or click to browse'}
        </p>
        
        <label className="block">
          <input 
            ref={fileInputRef}
            type="file" 
            accept={SUPPORTED_EXTENSIONS.join(',')}
            className="hidden"
            onChange={handleInputChange}
          />
          <button 
            type="button"
            className={`
              px-6 py-2.5 rounded-xl font-medium text-sm
              transition-all duration-300 cursor-pointer
              ${loading 
                ? 'bg-cyan-500/10 text-cyan-400 cursor-wait' 
                : 'btn-primary hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]'
              }
            `}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading...
              </span>
            ) : (
              'Select File'
            )}
          </button>
        </label>
        
        {/* Upload progress bar */}
        {loading && uploadProgress > 0 && (
          <div className="mt-4 animate-fade-in">
            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-500 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              >
                <div className="h-full w-full bg-white/30 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">{uploadProgress}%</p>
          </div>
        )}
        
        {/* Supported formats */}
        <div className="mt-5 pt-4 border-t border-white/5">
          <p className="text-xs text-gray-500 mb-2">Supported formats</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {SUPPORTED_FORMATS.map((ext, i) => (
              <span 
                key={ext}
                className="px-2.5 py-1 text-[10px] font-medium bg-white/[0.03] text-gray-400 rounded-lg border border-white/5 hover:border-cyan-400/20 hover:text-cyan-400/70 transition-all duration-200"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {ext}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
const FileUploader = memo(FileUploaderComponent, (prevProps, nextProps) => {
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.onUpload === nextProps.onUpload
  )
})

FileUploader.displayName = 'FileUploader'

export default FileUploader

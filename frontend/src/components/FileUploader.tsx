import { useCallback, useState, memo, useRef, useEffect } from 'react'
import { Button } from '@mantine/core'
import { Upload } from '@phosphor-icons/react'
import axios, { AxiosError } from 'axios'

// API base URL - could be moved to environment config
const API_BASE_URL = 'http://localhost:8000'

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.stl', '.obj', '.vtk', '.ply', '.3ds']
const SUPPORTED_FORMATS = ['STL', 'OBJ', 'VTK', 'PLY', '3DS']

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
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
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
        relative rounded-xl border-2 transition-all duration-300 overflow-hidden
        ${dragActive 
          ? 'border-cyan-400 bg-cyan-500/5' 
          : 'border-white/5 bg-[#111113] hover:border-white/10'
        }
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 ${dragActive ? 'opacity-100' : ''}`} />
      
      <div className="relative p-6 text-center">
        {/* Upload icon with animated ring */}
        <div className={`
          relative w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center
          transition-all duration-300
          ${dragActive ? 'bg-cyan-500/20' : 'bg-white/5'}
        `}>
          <div className={`
            absolute inset-0 rounded-xl border transition-all duration-300
            ${dragActive ? 'border-cyan-400/50' : 'border-white/5'}
          `} />
          <Upload 
            size={24} 
            className={`transition-colors duration-300 ${dragActive ? 'text-cyan-400' : 'text-gray-500'}`} 
          />
        </div>

        <p className="text-sm text-gray-400 mb-1">
          {dragActive ? 'Drop your file here' : 'Drag & drop mesh file'}
        </p>
        <p className="text-xs text-gray-600 mb-4">or click to browse</p>
        
        <label className="block">
          <input 
            ref={fileInputRef}
            type="file" 
            accept={SUPPORTED_EXTENSIONS.join(',')}
            className="hidden"
            onChange={handleInputChange}
          />
          <Button 
            component="span" 
            loading={loading}
            variant="gradient"
            gradient={{ from: 'cyan', to: 'blue', deg: 135 }}
            size="sm"
            className="cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            styles={{
              root: {
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(0, 180, 216, 0.15) 100%)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.25) 0%, rgba(0, 180, 216, 0.25) 100%)',
                }
              }
            }}
          >
            {loading ? 'Uploading...' : 'Select File'}
          </Button>
        </label>
        
        {/* Upload progress bar */}
        {loading && uploadProgress > 0 && (
          <div className="mt-4 animate-fade-in">
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{uploadProgress}%</p>
          </div>
        )}
        
        {/* Supported formats */}
        <div className="mt-5 pt-4 border-t border-white/5">
          <p className="text-xs text-gray-600 mb-2">Supported formats</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {SUPPORTED_FORMATS.map((ext) => (
              <span 
                key={ext}
                className="px-2 py-0.5 text-[10px] bg-white/[0.03] text-gray-500 rounded"
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

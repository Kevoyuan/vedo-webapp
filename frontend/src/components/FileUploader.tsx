import { useCallback, useState } from 'react'
import { Button } from '@mantine/core'
import { Upload, File } from '@phosphor-icons/react'
import axios from 'axios'

interface Props {
  onUpload: (data: any) => void
  loading: boolean
  setLoading: (v: boolean) => void
}

export default function FileUploader({ onUpload, loading, setLoading }: Props) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFile = useCallback(async (file: File) => {
    setLoading(true)
    setUploadProgress(0)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const { data } = await axios.post('http://localhost:8000/mesh/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setUploadProgress(progress)
        }
      })
      
      onUpload(data)
    } catch (err) {
      console.error(err)
      alert('Failed to upload mesh')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }, [onUpload, setLoading])

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
    if (file) handleFile(file)
  }, [handleFile])

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
            type="file" 
            accept=".stl,.obj,.vtk,.ply,.3ds"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
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
            {['STL', 'OBJ', 'VTK', 'PLY', '3DS'].map((ext) => (
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

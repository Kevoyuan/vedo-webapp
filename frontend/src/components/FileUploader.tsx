import { useCallback } from 'react'
import { Button } from '@mantine/core'
import { Upload } from '@phosphor-icons/react'
import axios from 'axios'

interface Props {
  onUpload: (data: any) => void
  loading: boolean
  setLoading: (v: boolean) => void
}

export default function FileUploader({ onUpload, loading, setLoading }: Props) {
  const handleFile = useCallback(async (file: File) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const { data } = await axios.post('http://localhost:8000/mesh/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      onUpload(data)
    } catch (err) {
      console.error(err)
      alert('Failed to upload mesh')
    } finally {
      setLoading(false)
    }
  }, [onUpload, setLoading])

  return (
    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-cyan-500 transition-colors">
      <Upload size={32} className="mx-auto mb-2 text-gray-400" />
      <p className="text-sm text-gray-400 mb-3">Drop mesh file here</p>
      <label>
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
          variant="light"
          size="sm"
        >
          {loading ? 'Uploading...' : 'Browse Files'}
        </Button>
      </label>
      <p className="text-xs text-gray-500 mt-2">STL, OBJ, VTK, PLY</p>
    </div>
  )
}

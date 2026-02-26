import { useState } from 'react'
import { MantineProvider, createTheme } from '@mantine/core'
import '@mantine/core/styles.css'
import MeshViewer from './components/MeshViewer'
import FileUploader from './components/FileUploader'
import MeshInfo from './components/MeshInfo'
import Toolbar from './components/Toolbar'
import './index.css'

const theme = createTheme({
  primaryColor: 'cyan',
  fontFamily: 'Geist, sans-serif',
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5C5F66',
      '#373A40',
      '#2C2E33',
      '#25262B',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
})

function App() {
  const [meshData, setMeshData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <div className="min-h-screen bg-background text-white">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center px-6">
          <h1 className="text-lg font-semibold">Vedo WebApp</h1>
        </header>

        <main className="flex h-[calc(100vh-3.5rem)]">
          {/* Sidebar */}
          <aside className="w-72 border-r border-border p-4 flex flex-col gap-4">
            <FileUploader 
              onUpload={setMeshData} 
              loading={loading}
              setLoading={setLoading}
            />
            {meshData && <MeshInfo data={meshData} />}
            {meshData && <Toolbar meshId={meshData.id} onUpdate={setMeshData} />}
          </aside>

          {/* Main Viewer */}
          <section className="flex-1 relative">
            <MeshViewer meshData={meshData} />
          </section>
        </main>
      </div>
    </MantineProvider>
  )
}

export default App

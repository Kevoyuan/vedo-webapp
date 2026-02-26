import { useState } from 'react'
import { MantineProvider, createTheme } from '@mantine/core'
import '@mantine/core/styles.css'
import MeshViewer from './components/MeshViewer'
import FileUploader from './components/FileUploader'
import MeshInfo from './components/MeshInfo'
import Toolbar from './components/Toolbar'
import { MeshData } from './types'
import './index.css'

const theme = createTheme({
  primaryColor: 'cyan',
  fontFamily: 'Geist, sans-serif',
  colors: {
    cyan: [
      '#e0fbff',
      '#b3f5ff',
      '#80eeff',
      '#4de7ff',
      '#1ae0ff',
      '#00d4ff',
      '#00b4dc',
      '#0094b8',
      '#007594',
      '#005570',
    ],
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
  other: {
    accentCyan: '#00d4ff',
  }
})

function App() {
  const [meshData, setMeshData] = useState<MeshData | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <div className="min-h-screen bg-[#0a0a0b] text-white overflow-hidden">
        {/* Header - Asymmetric design with gradient accent */}
        <header className="h-16 glass border-b border-white/5 flex items-center justify-between px-6 relative overflow-hidden">
          {/* Decorative gradient orb */}
          <div className="absolute top-0 right-20 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-4 animate-fade-in">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Vedo WebApp</h1>
              <p className="text-xs text-gray-500 -mt-0.5">3D Mesh Viewer</p>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 animate-fade-in stagger-2">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-xs text-gray-500">{loading ? 'Processing...' : 'Ready'}</span>
          </div>
        </header>

        <main className="flex h-[calc(100vh-4rem)]">
          {/* Sidebar - Creative asymmetric layout */}
          <aside className="w-80 border-r border-white/5 p-5 flex flex-col gap-5 overflow-y-auto">
            {/* File uploader section */}
            <div className="animate-slide-up stagger-1">
              <FileUploader 
                onUpload={setMeshData} 
                loading={loading}
                setLoading={setLoading}
              />
            </div>

            {/* Mesh info with elegant card */}
            {meshData && (
              <div className="animate-slide-up stagger-2">
                <MeshInfo data={meshData} />
              </div>
            )}

            {/* Toolbar with transform controls */}
            {meshData && (
              <div className="animate-slide-up stagger-3">
                <Toolbar meshId={meshData.id} onUpdate={setMeshData} />
              </div>
            )}
          </aside>

          {/* Main Viewer - Premium canvas area */}
          <section className="flex-1 relative">
            <MeshViewer meshData={meshData} />
          </section>
        </main>
      </div>
    </MantineProvider>
  )
}

export default App

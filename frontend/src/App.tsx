import { useState, useEffect, useCallback } from 'react'
import { MantineProvider, createTheme } from '@mantine/core'
import '@mantine/core/styles.css'
import { AnimatePresence, motion } from 'framer-motion'
import MeshViewer from './components/MeshViewer'
import FileUploader from './components/FileUploader'
import MeshInfo from './components/MeshInfo'
import Toolbar from './components/Toolbar'
import AnalysisPanel from './components/AnalysisPanel'
import ViewerControls from './components/ViewerControls'
import { MeshData } from './types'
import { ViewerSettings, defaultViewerSettings } from './types/viewer'
import { ToastProvider, useToast } from './components/Toast'
import { FileUploaderSkeleton, MeshInfoSkeleton, ToolbarSkeleton, ViewerSkeleton } from './components/Skeleton'
import ErrorState from './components/ErrorState'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
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

function AppContent() {
  const [meshData, setMeshData] = useState<MeshData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false)
  const [viewerSettings, setViewerSettings] = useState<ViewerSettings>(defaultViewerSettings)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const { showToast } = useToast()

  // Keyboard shortcuts
  const shortcuts = [
    {
      key: '?',
      handler: () => setShortcutsModalOpen(true),
      description: 'Show shortcuts'
    },
    {
      key: 'r',
      handler: () => {
        if (error) {
          handleRetry()
        }
      },
      description: 'Retry'
    },
    {
      key: 'Escape',
      handler: () => {
        setShortcutsModalOpen(false)
        setError(null)
      },
      description: 'Close modal'
    }
  ]

  useKeyboardShortcuts(shortcuts)

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.message)
      showToast('error', 'An unexpected error occurred')
    }
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(event.reason?.message || 'Request failed')
      showToast('error', 'Request failed. Please try again.')
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [showToast])

  const handleRetry = useCallback(() => {
    setError(null)
  }, [])

  const handleUploadSuccess = useCallback((data: MeshData) => {
    setMeshData(data)
    setError(null)
    showToast('success', `Mesh "${data.id}" loaded successfully`)
  }, [showToast])

  const handleTransformSuccess = useCallback((data: MeshData) => {
    setMeshData(data)
    showToast('success', 'Transform applied')
  }, [showToast])

  const handleViewerSettingsChange = (newSettings: Partial<ViewerSettings>) => {
    setViewerSettings(prev => ({ ...prev, ...newSettings }))
  }

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <div className="min-h-screen bg-[#0a0a0b] text-white overflow-hidden">
        {/* Header - Asymmetric design with gradient accent */}
        <header className="h-16 glass border-b border-white/5 flex items-center justify-between px-6 relative overflow-hidden">
          {/* Decorative gradient orb */}
          <div className="absolute top-0 right-20 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Vedo WebApp</h1>
              <p className="text-xs text-gray-500 -mt-0.5">3D Mesh Viewer</p>
            </div>
          </motion.div>

          {/* Status indicator & shortcuts button */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={() => setShortcutsModalOpen(true)}
              className="text-xs text-gray-500 hover:text-gray-400 transition-colors px-2 py-1 rounded hover:bg-white/5"
              title="Keyboard shortcuts (?)"
            >
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-gray-500 text-[10px]">?</kbd>
            </button>
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-xs text-gray-500">{loading ? 'Processing...' : 'Ready'}</span>
          </motion.div>
        </header>

        <main className="flex h-[calc(100vh-4rem)]">
          {/* Sidebar - Creative asymmetric layout */}
          <aside className="w-80 border-r border-white/5 p-5 flex flex-col gap-5 overflow-y-auto">
            {/* File uploader section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              {loading ? (
                <FileUploaderSkeleton />
              ) : (
                <FileUploader 
                  onUpload={handleUploadSuccess} 
                  loading={loading}
                  setLoading={setLoading}
                />
              )}
            </motion.div>

            {/* Mesh info with elegant card */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="skeleton-info"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <MeshInfoSkeleton />
                </motion.div>
              ) : meshData ? (
                <motion.div
                  key="mesh-info"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <MeshInfo data={meshData} />
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Toolbar with transform controls */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="skeleton-toolbar"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ToolbarSkeleton />
                </motion.div>
              ) : meshData ? (
                <motion.div
                  key="toolbar"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Toolbar 
                    meshId={meshData.id} 
                    onUpdate={handleTransformSuccess}
                    onAnalysisResult={setAnalysisResult}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Analysis Panel - Shows results from quality/curvature analysis */}
            <AnimatePresence mode="wait">
              {analysisResult && (
                <motion.div
                  key="analysis-panel"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <AnalysisPanel 
                    qualityData={analysisResult.mesh_id ? analysisResult : null}
                    curvatureData={analysisResult.curvature || analysisResult.method ? analysisResult : null}
                    onClear={() => setAnalysisResult(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Viewer Controls Panel - Always visible when mesh loaded */}
            {meshData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <ViewerControls 
                  settings={viewerSettings}
                  onSettingsChange={handleViewerSettingsChange}
                  onScreenshot={() => {
                    if ((window as any).vedoTakeScreenshot) {
                      (window as any).vedoTakeScreenshot()
                    }
                  }}
                  onRecording={() => {
                    const isRecording = (window as any).vedoIsRecording
                    if (isRecording) {
                      // Trigger stop recording - handled by MeshViewer
                      document.dispatchEvent(new CustomEvent('vedo-stop-recording'))
                    } else {
                      document.dispatchEvent(new CustomEvent('vedo-start-recording'))
                    }
                  }}
                  isRecording={(window as any).vedoIsRecording || false}
                />
              </motion.div>
            )}
          </aside>

          {/* Main Viewer - Premium canvas area */}
          <section className="flex-1 relative">
            <AnimatePresence mode="wait">
              {loading ? (
                <ViewerSkeleton key="loading-viewer" />
              ) : error ? (
                <ErrorState 
                  key="error-viewer"
                  message={error}
                  onRetry={handleRetry}
                />
              ) : meshData ? (
                <motion.div
                  key="mesh-viewer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <MeshViewer 
                    meshData={meshData} 
                    loading={loading}
                    settings={viewerSettings}
                    onSettingsChange={handleViewerSettingsChange}
                  />
                </motion.div>
              ) : (
                <MeshViewer 
                  key="empty-viewer"
                  meshData={null} 
                  loading={loading}
                  settings={viewerSettings}
                  onSettingsChange={handleViewerSettingsChange}
                />
              )}
            </AnimatePresence>
          </section>
        </main>

        <KeyboardShortcutsModal 
          opened={shortcutsModalOpen} 
          onClose={() => setShortcutsModalOpen(false)} 
        />
      </div>
    </MantineProvider>
  )
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

export default App

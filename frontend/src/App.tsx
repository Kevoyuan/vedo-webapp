import { useState, useEffect, useCallback, useMemo } from 'react'
import { MantineProvider, createTheme } from '@mantine/core'
import '@mantine/core/styles.css'
import { AnimatePresence, motion } from 'framer-motion'
import MeshViewer from './components/MeshViewer'
import FileUploader from './components/FileUploader'
import MeshInfo from './components/MeshInfo'
import Toolbar from './components/Toolbar'
import AnalysisPanel from './components/AnalysisPanel'
import ViewerControls from './components/ViewerControls'
import HistoryPanel from './components/HistoryPanel'
import MeshListPanel from './components/MeshListPanel'
import { MeshData } from './types'
import { ViewerSettings, defaultViewerSettings } from './types/viewer'
import { ToastProvider, useToast } from './components/Toast'
import { FileUploaderSkeleton, MeshInfoSkeleton, ToolbarSkeleton, ViewerSkeleton } from './components/Skeleton'
import ErrorState from './components/ErrorState'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useHistory, OperationType } from './hooks/useHistory'
import useOnlineStatus from './hooks/useOnlineStatus'
import { useOperationProgress, OperationProgress } from './hooks/useOperationProgress'
import OfflineIndicator from './components/OfflineIndicator'
import { OperationProgressList } from './components/OperationProgressBar'
import * as api from './lib/api'
import './index.css'

// Responsive hook
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [matches, query])
  
  return matches
}

// Bottom Sheet Component for Mobile
function BottomSheet({ 
  open, 
  onToggle,
  children 
}: { 
  open: boolean
  onToggle: () => void
  children: React.ReactNode 
}) {
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const startY = e.touches[0].clientY
    
    const handleMove = (moveEvent: TouchEvent) => {
      const diff = startY - moveEvent.touches[0].clientY
      if (diff > 100) {
        onToggle()
        document.removeEventListener('touchmove', handleMove)
      }
    }
    
    document.addEventListener('touchmove', handleMove, { passive: true })
  }, [onToggle])

  return (
    <>
      <div 
        className={`bottom-sheet-overlay ${open ? 'open' : ''}`}
        onClick={onToggle}
      />
      <motion.div 
        className={`bottom-sheet ${open ? 'open' : ''}`}
        onTouchMove={handleTouchMove}
        initial={{ y: '100%' }}
        animate={{ y: open ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="bottom-sheet-handle" onClick={onToggle} />
        <div className="pb-safe">
          {children}
        </div>
      </motion.div>
    </>
  )
}

// Mobile Toggle Button
function MobileToggleButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button 
      className="mobile-controls-toggle"
      onClick={onClick}
      aria-label={open ? 'Close controls' : 'Open controls'}
    >
      {open ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v18M3 12h18" />
        </svg>
      )}
    </button>
  )
}

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
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false)
  const [viewerSettings, setViewerSettings] = useState<ViewerSettings>(defaultViewerSettings)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const { showToast } = useToast()
  
  // Online status tracking
  const { isOnline, wasOffline, checkConnection } = useOnlineStatus()
  
  // Operation progress tracking
  const { 
    operations, 
    startOperation, 
    updateProgress, 
    completeOperation, 
    failOperation,
    clearOperation 
  } = useOperationProgress()
  
  // Convert operations map to array for rendering
  const operationsList = useMemo(() => {
    return Array.from(operations.values())
  }, [operations])
  
  // Responsive state
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isTablet)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  
  // Auto-collapse sidebar on tablet
  useEffect(() => {
    if (isTablet) {
      setSidebarCollapsed(true)
    }
  }, [isTablet])
  
  // History management
  const { 
    canUndo, 
    canRedo, 
    history, 
    currentIndex, 
    pushHistory, 
    undo, 
    redo, 
    clearHistory,
    getCurrentMeshData 
  } = useHistory()

  // Undo handler
  const handleUndo = useCallback(() => {
    if (canUndo) {
      const previousState = undo()
      if (previousState) {
        setMeshData(previousState)
        showToast('info', 'Undo: reverted to previous state')
      }
    }
  }, [canUndo, undo, showToast])

  // Redo handler
  const handleRedo = useCallback(() => {
    if (canRedo) {
      const nextState = redo()
      if (nextState) {
        setMeshData(nextState)
        showToast('info', 'Redo: restored state')
      }
    }
  }, [canRedo, redo, showToast])

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
    },
    {
      key: 'z',
      handler: () => handleUndo(),
      ctrl: true,
      shift: false,
      description: 'Undo'
    },
    {
      key: 'z',
      handler: () => handleRedo(),
      ctrl: true,
      shift: true,
      description: 'Redo'
    },
    {
      key: 'h',
      handler: () => setHistoryPanelOpen(prev => !prev),
      description: 'Toggle history panel'
    },
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
    pushHistory('import', data, `Imported: ${data.id}`)
    showToast('success', `Mesh "${data.id}" loaded successfully`)
  }, [showToast, pushHistory])

  const handleTransformSuccess = useCallback((data: MeshData, operation?: OperationType, description?: string) => {
    setMeshData(data)
    pushHistory(operation || 'rotate', data, description)
    showToast('success', 'Transform applied')
  }, [showToast, pushHistory])

  const handleViewerSettingsChange = (newSettings: Partial<ViewerSettings>) => {
    setViewerSettings(prev => ({ ...prev, ...newSettings }))
  }

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      {/* Offline indicator */}
      <OfflineIndicator 
        isOnline={isOnline} 
        wasOffline={wasOffline}
        onRetry={checkConnection}
      />
      
      <div className="min-h-screen bg-[#0a0a0b] text-white overflow-hidden">
        {/* Operation progress indicators */}
        {operationsList.length > 0 && (
          <div className="fixed bottom-6 left-6 z-40 max-w-sm">
            <OperationProgressList 
              operations={operationsList}
              onCancel={clearOperation}
            />
          </div>
        )}
        
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
            {/* Tablet sidebar toggle */}
            {isTablet && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-xs text-gray-500 hover:text-gray-400 transition-colors p-2 rounded hover:bg-white/5"
                title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {sidebarCollapsed ? (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  ) : (
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  )}
                </svg>
              </button>
            )}
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
          {/* Mobile Toggle Button */}
          {isMobile && meshData && (
            <MobileToggleButton 
              open={bottomSheetOpen} 
              onClick={() => setBottomSheetOpen(!bottomSheetOpen)} 
            />
          )}
          
          {/* Sidebar - Creative asymmetric layout */}
          {/* Tablet: collapsed by default, Mobile: hidden (bottom sheet instead) */}
          <aside className={`
            border-r border-white/5 p-5 flex flex-col gap-5 overflow-y-auto
            transition-all duration-300 ease-in-out
            ${isMobile ? 'hidden' : ''}
            ${isTablet ? (sidebarCollapsed ? 'w-0 p-0 overflow-hidden' : 'w-80') : 'w-80'}
          `}>
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
                  onError={(msg) => {
                    setError(msg)
                    showToast('error', msg)
                  }}
                  onProgress={updateProgress}
                  onOperationComplete={completeOperation}
                  onOperationFail={failOperation}
                  startOperation={startOperation}
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
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onError={(msg) => {
                      setError(msg)
                      showToast('error', msg)
                    }}
                    onProgress={updateProgress}
                    onOperationComplete={completeOperation}
                    onOperationFail={failOperation}
                    startOperation={startOperation}
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

            {/* History Panel */}
            {meshData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <HistoryPanel 
                  history={history}
                  currentIndex={currentIndex}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onClear={clearHistory}
                  isOpen={historyPanelOpen}
                  onToggle={() => setHistoryPanelOpen(prev => !prev)}
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

        {/* Mobile Bottom Sheet - Shows controls on mobile */}
        {isMobile && (
          <BottomSheet 
            open={bottomSheetOpen} 
            onToggle={() => setBottomSheetOpen(!bottomSheetOpen)}
          >
            <div className="flex flex-col gap-4">
              {/* File uploader in bottom sheet */}
              <div className="mobile-p-3">
                {loading ? (
                  <FileUploaderSkeleton />
                ) : (
                  <FileUploader 
                    onUpload={(data) => {
                      handleUploadSuccess(data)
                      setBottomSheetOpen(false)
                    }} 
                    loading={loading}
                    setLoading={setLoading}
                  />
                )}
              </div>
              
              {/* Mesh info in bottom sheet */}
              {meshData && (
                <div className="mobile-p-3">
                  <MeshInfo data={meshData} />
                </div>
              )}
              
              {/* Viewer controls in bottom sheet */}
              {meshData && (
                <div className="mobile-p-3">
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
                        document.dispatchEvent(new CustomEvent('vedo-stop-recording'))
                      } else {
                        document.dispatchEvent(new CustomEvent('vedo-start-recording'))
                      }
                    }}
                    isRecording={(window as any).vedoIsRecording || false}
                  />
                </div>
              )}
            </div>
          </BottomSheet>
        )}

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

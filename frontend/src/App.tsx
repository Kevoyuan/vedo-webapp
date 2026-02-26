import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
import ProjectManager from './components/ProjectManager'
import { MeshData } from './types'
import { ViewerSettings, defaultViewerSettings } from './types/viewer'
import { ToastProvider, useToast } from './components/Toast'
import { FileUploaderSkeleton, MeshInfoSkeleton, ToolbarSkeleton, ViewerSkeleton } from './components/Skeleton'
import ErrorState from './components/ErrorState'
import KeyboardShortcutsModal, { useKeyboardShortcuts, CommandPalette } from './hooks/useKeyboardShortcuts'
import { useHistory, OperationType } from './hooks/useHistory'
import useOnlineStatus from './hooks/useOnlineStatus'
import { useOperationProgress, OperationProgress } from './hooks/useOperationProgress'
import OfflineIndicator from './components/OfflineIndicator'
import { OperationProgressList } from './components/OperationProgressBar'
import * as api from './lib/api'
import * as storage from './lib/storage'
import StoragePanel from './components/StoragePanel'
import { 
  Project, 
  ProjectCamera, 
  ProjectSettings, 
  initDB, 
  autoSaveToLocalStorage, 
  loadAutoSave,
  saveProject as saveProjectToDB 
} from './lib/projectStorage'
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
  // Multi-mesh state
  const [meshes, setMeshes] = useState<MeshData[]>([])
  const [selectedMeshId, setSelectedMeshId] = useState<string | null>(null)
  const [meshVisualizations, setMeshVisualizations] = useState<Record<string, { vertices: number[][], faces: number[][] }>>({})
  
  // Legacy single mesh state (for backwards compatibility)
  const [meshData, setMeshData] = useState<MeshData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false)
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false)
  const [viewerSettings, setViewerSettings] = useState<ViewerSettings>(defaultViewerSettings)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const { showToast } = useToast()
  
  // Storage/Project state
  const [storagePanelOpen, setStoragePanelOpen] = useState(false)
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null)
  
  // Project management state
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [projectCamera, setProjectCamera] = useState<ProjectCamera>({
    position: [4, 4, 4],
    target: [0, 0, 0]
  })
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Initialize IndexedDB
  useEffect(() => {
    initDB().catch(err => console.error('Failed to init project DB:', err))
  }, [])
  
  // Auto-save to localStorage when state changes (debounced)
  useEffect(() => {
    if (!currentProject) return
    
    // Debounce auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveToLocalStorage({
        currentProjectId: currentProject.id,
        meshes,
        meshVisualizations,
        viewerSettings: viewerSettings as ProjectSettings,
        camera: projectCamera
      })
    }, 2000) // Auto-save after 2 seconds of inactivity
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [meshes, meshVisualizations, viewerSettings, projectCamera, currentProject])
  
  // Load project handler
  const handleLoadProject = useCallback((project: Project) => {
    // Load meshes from project
    const loadedMeshes: MeshData[] = project.meshes.map(m => ({
      id: m.id,
      filename: m.filename,
      n_points: m.n_points,
      n_cells: m.n_cells,
      volume: m.volume,
      area: m.area,
      bounds: m.bounds
    }))
    
    const loadedVisualizations: Record<string, { vertices: number[][], faces: number[][] }> = {}
    project.meshes.forEach(m => {
      loadedVisualizations[m.id] = {
        vertices: m.vertices,
        faces: m.faces
      }
    })
    
    setMeshes(loadedMeshes)
    setMeshVisualizations(loadedVisualizations)
    
    // Set first mesh as selected
    if (loadedMeshes.length > 0) {
      setSelectedMeshId(loadedMeshes[0].id)
      setMeshData(loadedMeshes[0])
    }
    
    // Load camera
    if (project.camera) {
      setProjectCamera(project.camera)
    }
    
    // Load settings
    if (project.settings) {
      setViewerSettings({
        ...defaultViewerSettings,
        ...project.settings
      })
    }
    
    setCurrentProjectName(project.name)
  }, [])
  
  // Handle project change
  const handleProjectChange = useCallback((project: Project | null) => {
    setCurrentProject(project)
    if (project) {
      setCurrentProjectName(project.name)
    } else {
      setCurrentProjectName(null)
    }
  }, [])
  
  // Quick save handler (Ctrl+S)
  const handleQuickSave = useCallback(async () => {
    if (!currentProject) {
      showToast('info', 'Create or load a project first')
      return
    }
    
    try {
      const projectMeshes = meshes.map(mesh => ({
        id: mesh.id,
        filename: mesh.filename || mesh.id,
        vertices: meshVisualizations[mesh.id]?.vertices || [],
        faces: meshVisualizations[mesh.id]?.faces || [],
        n_points: mesh.n_points,
        n_cells: mesh.n_cells,
        volume: mesh.volume,
        area: mesh.area,
        bounds: mesh.bounds
      }))

      const updatedProject: Project = {
        ...currentProject,
        meshes: projectMeshes,
        camera: projectCamera,
        settings: viewerSettings as ProjectSettings,
        modified: Date.now()
      }

      await saveProjectToDB(updatedProject)
      setCurrentProject(updatedProject)
      showToast('success', 'Project saved')
    } catch (err) {
      showToast('error', 'Failed to save project')
    }
  }, [currentProject, meshes, meshVisualizations, projectCamera, viewerSettings, showToast])
  
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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  
  const shortcuts = [
    // General
    {
      key: '?',
      handler: () => setShortcutsModalOpen(true),
      description: 'Show shortcuts'
    },
    {
      key: 'k',
      handler: () => setCommandPaletteOpen(true),
      ctrl: true,
      description: 'Open command palette'
    },
    {
      key: 'Escape',
      handler: () => {
        setShortcutsModalOpen(false)
        setCommandPaletteOpen(false)
        setError(null)
      },
      description: 'Close modal'
    },
    
    // Undo/Redo
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
      key: 'y',
      handler: () => handleRedo(),
      ctrl: true,
      description: 'Redo'
    },
    {
      key: 's',
      handler: () => handleQuickSave(),
      ctrl: true,
      description: 'Save project'
    },
    
    // View toggles
    {
      key: 'h',
      handler: () => setHistoryPanelOpen(prev => !prev),
      description: 'Toggle history panel'
    },
    {
      key: ' ',
      handler: () => {
        if (!isMobile) {
          setSidebarCollapsed(prev => !prev)
        }
      },
      description: 'Toggle sidebar'
    },
    {
      key: 'g',
      handler: () => setViewerSettings(prev => ({ ...prev, showGrid: !prev.showGrid })),
      description: 'Toggle grid'
    },
    {
      key: 'a',
      handler: () => setViewerSettings(prev => ({ ...prev, showAxes: !prev.showAxes })),
      description: 'Toggle axes'
    },
    
    // Transform modes
    {
      key: '1',
      handler: () => {}, // Rotate mode - handled by toolbar
      description: 'Rotate mode'
    },
    {
      key: '2',
      handler: () => {}, // Scale mode - handled by toolbar
      description: 'Scale mode'
    },
    {
      key: '3',
      handler: () => {}, // Translate mode - handled by toolbar
      description: 'Translate mode'
    },
    
    // Camera presets
    {
      key: '5',
      handler: () => setViewerSettings(prev => ({ ...prev, cameraPreset: 'free' })),
      description: 'Free camera'
    },
    {
      key: '6',
      handler: () => setViewerSettings(prev => ({ ...prev, cameraPreset: 'top' })),
      description: 'Top view'
    },
    {
      key: '7',
      handler: () => setViewerSettings(prev => ({ ...prev, cameraPreset: 'front' })),
      description: 'Front view'
    },
    {
      key: '8',
      handler: () => setViewerSettings(prev => ({ ...prev, cameraPreset: 'side' })),
      description: 'Side view'
    },
    {
      key: '9',
      handler: () => setViewerSettings(prev => ({ ...prev, cameraPreset: 'isometric' })),
      description: 'Isometric view'
    },
    
    // Display
    {
      key: 'w',
      handler: () => setViewerSettings(prev => ({ 
        ...prev, 
        viewMode: prev.viewMode === 'wireframe' ? 'solid' : 'wireframe' 
      })),
      description: 'Toggle wireframe'
    },
    {
      key: 'x',
      handler: () => setViewerSettings(prev => ({ 
        ...prev, 
        viewMode: prev.viewMode === 'xray' ? 'solid' : 'xray' 
      })),
      description: 'Toggle X-Ray mode'
    },
    {
      key: '+',
      handler: () => {}, // Zoom in - handled by viewer
      description: 'Zoom in'
    },
    {
      key: '-',
      handler: () => {}, // Zoom out - handled by viewer
      description: 'Zoom out'
    },
    {
      key: '0',
      handler: () => setViewerSettings(prev => ({ ...prev, cameraPreset: 'free' })),
      description: 'Reset camera'
    },
    
    // Error handling
    {
      key: 'r',
      handler: () => {
        if (error) {
          handleRetry()
        }
      },
      description: 'Retry'
    },
    
    // Delete mesh
    {
      key: 'Delete',
      handler: () => {
        if (selectedMeshId) {
          handleDeleteMesh(selectedMeshId)
        }
      },
      description: 'Delete selected mesh'
    },
    {
      key: 'Backspace',
      handler: () => {
        if (selectedMeshId) {
          handleDeleteMesh(selectedMeshId)
        }
      },
      description: 'Delete selected mesh'
    },
  ]

  useKeyboardShortcuts(shortcuts)

  // Command palette commands
  const commands = useMemo(() => [
    // General
    { id: 'shortcuts', label: 'Keyboard Shortcuts', description: 'View all shortcuts', shortcut: '?', category: 'General', action: () => setShortcutsModalOpen(true) },
    { id: 'command-palette', label: 'Command Palette', shortcut: 'Ctrl+K', category: 'General', action: () => setCommandPaletteOpen(true) },
    
    // File
    { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z', category: 'File', action: handleUndo },
    { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Shift+Z', category: 'File', action: handleRedo },
    
    // View
    { id: 'toggle-sidebar', label: 'Toggle Sidebar', shortcut: 'Space', category: 'View', action: () => setSidebarCollapsed(prev => !prev) },
    { id: 'toggle-history', label: 'Toggle History Panel', shortcut: 'H', category: 'View', action: () => setHistoryPanelOpen(prev => !prev) },
    { id: 'toggle-grid', label: 'Toggle Grid', shortcut: 'G', category: 'View', action: () => setViewerSettings(prev => ({ ...prev, showGrid: !prev.showGrid })) },
    { id: 'toggle-axes', label: 'Toggle Axes', shortcut: 'A', category: 'View', action: () => setViewerSettings(prev => ({ ...prev, showAxes: !prev.showAxes })) },
    
    // Camera
    { id: 'camera-free', label: 'Camera: Free', shortcut: '5', category: 'Camera', action: () => setViewerSettings(prev => ({ ...prev, cameraPreset: 'free' })) },
    { id: 'camera-top', label: 'Camera: Top', shortcut: '6', category: 'Camera', action: () => setViewerSettings(prev => ({ ...prev, cameraPreset: 'top' })) },
    { id: 'camera-front', label: 'Camera: Front', shortcut: '7', category: 'Camera', action: () => setViewerSettings(prev => ({ ...prev, cameraPreset: 'front' })) },
    { id: 'camera-side', label: 'Camera: Side', shortcut: '8', category: 'Camera', action: () => setViewerSettings(prev => ({ ...prev, cameraPreset: 'side' })) },
    { id: 'camera-iso', label: 'Camera: Isometric', shortcut: '9', category: 'Camera', action: () => setViewerSettings(prev => ({ ...prev, cameraPreset: 'isometric' })) },
    { id: 'camera-reset', label: 'Reset Camera', shortcut: '0', category: 'Camera', action: () => setViewerSettings(prev => ({ ...prev, cameraPreset: 'free' })) },
    
    // Display
    { id: 'wireframe', label: 'Toggle Wireframe', shortcut: 'W', category: 'Display', action: () => setViewerSettings(prev => ({ ...prev, viewMode: prev.viewMode === 'wireframe' ? 'solid' : 'wireframe' })) },
    { id: 'xray', label: 'Toggle X-Ray Mode', shortcut: 'X', category: 'Display', action: () => setViewerSettings(prev => ({ ...prev, viewMode: prev.viewMode === 'xray' ? 'solid' : 'xray' })) },
    
    // Mesh
    ...(selectedMeshId ? [{ id: 'delete-mesh', label: 'Delete Selected Mesh', shortcut: 'Del', category: 'Mesh', action: () => handleDeleteMesh(selectedMeshId) }] : []),
  ], [handleUndo, handleRedo, selectedMeshId, sidebarCollapsed, viewerSettings])

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

  // Handle mesh upload success - adds to mesh list
  const handleUploadSuccess = useCallback(async (data: MeshData) => {
    try {
      // Get visualization data
      const vizData = await api.getMeshVisualize(data.id)
      
      // Add to meshes list
      setMeshes(prev => [...prev, data])
      setMeshVisualizations(prev => ({
        ...prev,
        [data.id]: vizData
      }))
      
      // Also set as current for backwards compatibility
      setMeshData(data)
      setSelectedMeshId(data.id)
      
      setError(null)
      pushHistory('import', data, `Imported: ${data.id}`)
      showToast('success', `Mesh "${data.filename || data.id}" loaded successfully`)
    } catch (err) {
      showToast('error', 'Failed to load mesh visualization')
    }
  }, [showToast, pushHistory])

  const handleTransformSuccess = useCallback((data: MeshData, operation?: OperationType, description?: string) => {
    setMeshData(data)
    pushHistory(operation || 'rotate', data, description)
    showToast('success', 'Transform applied')
  }, [showToast, pushHistory])

  const handleViewerSettingsChange = (newSettings: Partial<ViewerSettings>) => {
    setViewerSettings(prev => ({ ...prev, ...newSettings }))
  }

  // Multi-mesh handlers
  const handleSelectMesh = useCallback((id: string | null) => {
    setSelectedMeshId(id)
    const mesh = meshes.find(m => m.id === id)
    if (mesh) {
      setMeshData(mesh)
    }
  }, [meshes])

  const handleDeleteMesh = useCallback(async (id: string) => {
    try {
      await api.deleteMesh(id)
      setMeshes(prev => prev.filter(m => m.id !== id))
      setMeshVisualizations(prev => {
        const newViz = { ...prev }
        delete newViz[id]
        return newViz
      })
      
      if (selectedMeshId === id) {
        setSelectedMeshId(null)
        setMeshData(null)
      }
      
      showToast('info', 'Mesh deleted')
    } catch (err) {
      showToast('error', 'Failed to delete mesh')
    }
  }, [selectedMeshId, showToast])

  const handleToggleVisibility = useCallback((id: string, visible: boolean) => {
    setMeshVisualizations(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        visible
      }
    }))
  }, [])

  const handleMergeMeshes = useCallback(async (ids: string[]) => {
    if (ids.length < 2) return
    
    try {
      setLoading(true)
      const merged = await api.mergeMeshes(ids, 'merge', 'merged_mesh')
      
      // Get visualization for merged mesh
      const vizData = await api.getMeshVisualize(merged.id)
      
      setMeshes(prev => [...prev, merged])
      setMeshVisualizations(prev => ({
        ...prev,
        [merged.id]: vizData
      }))
      
      setSelectedMeshId(merged.id)
      setMeshData(merged)
      
      showToast('success', `Merged ${ids.length} meshes`)
    } catch (err: any) {
      showToast('error', err.message || 'Failed to merge meshes')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const handleVisualizeMesh = useCallback(async (id: string) => {
    try {
      const vizData = await api.getMeshVisualize(id)
      setMeshVisualizations(prev => ({
        ...prev,
        [id]: vizData
      }))
      return vizData
    } catch (err) {
      showToast('error', 'Failed to load mesh')
      throw err
    }
  }, [showToast])

  // Storage handlers
  const handleSaveProject = useCallback(async (name: string) => {
    const savedMeshes = meshes.map(mesh => ({
      id: mesh.id,
      filename: mesh.filename || mesh.id,
      analyzeData: mesh,
      visualizationData: meshVisualizations[mesh.id]
    }))

    const project = storage.createProjectFromState(
      name,
      savedMeshes,
      viewerSettings,
      selectedMeshId
    )

    try {
      await storage.saveProject(project)
      setCurrentProjectName(name)
      showToast('success', `Project "${name}" saved`)
    } catch (err) {
      showToast('error', 'Failed to save project')
    }
  }, [meshes, meshVisualizations, viewerSettings, selectedMeshId, showToast])

  const handleLoadProject = useCallback(async (project: storage.SavedProject) => {
    try {
      // Clear current state
      setMeshes([])
      setMeshVisualizations({})
      setSelectedMeshId(null)
      setMeshData(null)

      // Load project meshes
      const loadedMeshes: MeshData[] = []
      const loadedViz: Record<string, { vertices: number[][], faces: number[][] }> = {}

      for (const savedMesh of project.meshes) {
        loadedMeshes.push(savedMesh.analyzeData)
        if (savedMesh.visualizationData) {
          loadedViz[savedMesh.id] = savedMesh.visualizationData
          // Also cache to localStorage for quick access
          storage.saveMeshToLocalStorage(savedMesh.id, savedMesh.visualizationData)
        }
      }

      setMeshes(loadedMeshes)
      setMeshVisualizations(loadedViz)

      // Restore viewer settings
      if (project.viewerSettings) {
        setViewerSettings(project.viewerSettings)
      }

      // Select the project's selected mesh or first mesh
      if (project.selectedMeshId && loadedMeshes.find(m => m.id === project.selectedMeshId)) {
        setSelectedMeshId(project.selectedMeshId)
        setMeshData(loadedMeshes.find(m => m.id === project.selectedMeshId)!)
      } else if (loadedMeshes.length > 0) {
        setSelectedMeshId(loadedMeshes[0].id)
        setMeshData(loadedMeshes[0])
      }

      setCurrentProjectName(project.name)
      clearHistory()
      showToast('success', `Project "${project.name}" loaded`)
    } catch (err) {
      showToast('error', 'Failed to load project')
    }
  }, [showToast, clearHistory])

  // Auto-save on changes
  useEffect(() => {
    if (!currentProjectName || meshes.length === 0) return

    const timer = setTimeout(() => {
      handleSaveProject(currentProjectName)
    }, 3000) // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(timer)
  }, [meshes, meshVisualizations, viewerSettings, selectedMeshId, currentProjectName])

  // Get meshes for viewer
  const viewerMeshes = useMemo(() => {
    return meshes.map(mesh => ({
      id: mesh.id,
      vertices: meshVisualizations[mesh.id]?.vertices || [],
      faces: meshVisualizations[mesh.id]?.faces || [],
      visible: meshVisualizations[mesh.id] !== undefined,
      filename: mesh.filename
    }))
  }, [meshes, meshVisualizations])

  // Get current selected mesh data
  const currentMesh = selectedMeshId ? meshes.find(m => m.id === selectedMeshId) : null

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
            {/* Storage/Projects button */}
            <button
              onClick={() => setStoragePanelOpen(true)}
              className="text-xs text-gray-500 hover:text-gray-400 transition-colors px-2 py-1 rounded hover:bg-white/5"
              title="Storage & Projects"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
              </svg>
            </button>
            {currentProjectName && (
              <span className="text-xs text-cyan-400/70">{currentProjectName}</span>
            )}
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

            {/* Project Manager */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
            >
              <ProjectManager 
                currentProject={currentProject}
                onProjectChange={handleProjectChange}
                onLoadProject={handleLoadProject}
                meshes={meshes}
                meshVisualizations={meshVisualizations}
                viewerSettings={viewerSettings}
                camera={projectCamera}
                showToast={showToast}
              />
            </motion.div>

            {/* Mesh List Panel - Multi-mesh support */}
            <AnimatePresence mode="wait">
              {meshes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                >
                  <MeshListPanel 
                    meshes={meshes}
                    selectedMeshId={selectedMeshId}
                    onSelectMesh={handleSelectMesh}
                    onDeleteMesh={handleDeleteMesh}
                    onToggleVisibility={handleToggleVisibility}
                    onMergeMeshes={handleMergeMeshes}
                    onVisualizeMesh={handleVisualizeMesh}
                  />
                </motion.div>
              )}
            </AnimatePresence>

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
              ) : meshData || meshes.length > 0 ? (
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
                    meshes={viewerMeshes}
                    selectedMeshId={selectedMeshId}
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

        <CommandPalette 
          opened={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          commands={commands}
        />

        {/* Storage Panel */}
        <StoragePanel
          opened={storagePanelOpen}
          onClose={() => setStoragePanelOpen(false)}
          onLoadProject={handleLoadProject}
          onSaveProject={handleSaveProject}
          meshes={meshes.map(mesh => ({
            id: mesh.id,
            filename: mesh.filename || mesh.id,
            analyzeData: mesh,
            visualizationData: meshVisualizations[mesh.id]
          }))}
          viewerSettings={viewerSettings}
          selectedMeshId={selectedMeshId}
          currentProjectName={currentProjectName}
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

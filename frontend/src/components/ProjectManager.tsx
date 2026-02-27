import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  createProject,
  getAllProjects,
  deleteProject,
  saveProject,
  getProject,
  Project,
  ProjectCamera,
  ProjectSettings
} from '../lib/projectStorage'
import { MeshData } from '../types'
import { ViewerSettings } from '../types/viewer'

interface Props {
  currentProject: Project | null
  onProjectChange: (project: Project | null) => void
  onLoadProject: (project: Project) => void
  meshes: MeshData[]
  meshVisualizations: Record<string, { vertices: number[][], faces: number[][] }>
  viewerSettings: ViewerSettings
  camera: ProjectCamera
  showToast: (type: 'success' | 'error' | 'info', message: string) => void
}

export default function ProjectManager({
  currentProject,
  onProjectChange,
  onLoadProject,
  meshes,
  meshVisualizations,
  viewerSettings,
  camera,
  showToast
}: Props) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProjectInput, setShowNewProjectInput] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [saving, setSaving] = useState(false)

  // Load all projects
  const loadProjects = useCallback(async () => {
    try {
      const allProjects = await getAllProjects()
      setProjects(allProjects)
    } catch (err) {
      console.error('Failed to load projects:', err)
      showToast('error', 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // Create new project
  const handleCreateProject = useCallback(async () => {
    if (!newProjectName.trim()) {
      showToast('error', 'Please enter a project name')
      return
    }

    try {
      const project = await createProject(newProjectName.trim())
      setProjects(prev => [project, ...prev])
      setNewProjectName('')
      setShowNewProjectInput(false)
      onProjectChange(project)
      showToast('success', `Project "${project.name}" created`)
    } catch (err) {
      showToast('error', 'Failed to create project')
    }
  }, [newProjectName, onProjectChange, showToast])

  // Save current project
  const handleSaveProject = useCallback(async () => {
    if (!currentProject) {
      showToast('info', 'No project to save')
      return
    }

    setSaving(true)
    try {
      // Convert mesh data to project mesh format
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
        camera,
        settings: viewerSettings as ProjectSettings
      }

      await saveProject(updatedProject)
      onProjectChange(updatedProject)
      
      // Update in list
      setProjects(prev => prev.map(p => 
        p.id === updatedProject.id ? updatedProject : p
      ))

      showToast('success', 'Project saved')
    } catch (err) {
      showToast('error', 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }, [currentProject, meshes, meshVisualizations, camera, viewerSettings, onProjectChange, showToast])

  // Load a project
  const handleLoadProject = useCallback(async (project: Project) => {
    try {
      const fullProject = await getProject(project.id)
      if (fullProject) {
        onLoadProject(fullProject)
        onProjectChange(fullProject)
        showToast('success', `Loaded "${fullProject.name}"`)
      }
    } catch (err) {
      showToast('error', 'Failed to load project')
    }
  }, [onLoadProject, onProjectChange, showToast])

  // Delete a project
  const handleDeleteProject = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      return
    }

    try {
      await deleteProject(id)
      setProjects(prev => prev.filter(p => p.id !== id))
      
      if (currentProject?.id === id) {
        onProjectChange(null)
      }
      
      showToast('info', 'Project deleted')
    } catch (err) {
      showToast('error', 'Failed to delete project')
    }
  }, [currentProject, onProjectChange, showToast])

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="project-manager">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Projects
        </h3>
        <button
          onClick={() => setShowNewProjectInput(true)}
          className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
          title="New project"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* New Project Input */}
      <AnimatePresence>
        {showNewProjectInput && (
          <div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                placeholder="Project name..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                autoFocus
              />
              <button
                onClick={handleCreateProject}
                className="p-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-400 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setShowNewProjectInput(false)
                  setNewProjectName('')
                }}
                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Current Project Info */}
      {currentProject && (
        <div className="mb-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-cyan-400 truncate">{currentProject.name}</span>
            <button
              onClick={handleSaveProject}
              disabled={saving}
              className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
              title="Save project"
            >
              {saving ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              )}
            </button>
          </div>
          <div className="text-xs text-gray-500">
            <div>{currentProject.meshes.length} mesh{currentProject.meshes.length !== 1 ? 'es' : ''}</div>
            <div>Modified: {formatDate(currentProject.modified)}</div>
          </div>
        </div>
      )}

      {/* Projects List */}
      {loading ? (
        <div className="text-center py-4 text-gray-500 text-sm">Loading...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          <p className="mb-2">No projects yet</p>
          <button
            onClick={() => setShowNewProjectInput(true)}
            className="text-cyan-400 hover:text-cyan-300"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {projects.map((project) => (
            <div
              key={project.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`
                group p-3 rounded-lg cursor-pointer transition-all
                ${currentProject?.id === project.id 
                  ? 'bg-cyan-500/20 border border-cyan-500/30' 
                  : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                }
              `}
              onClick={() => handleLoadProject(project)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-200 truncate">
                    {project.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span>{project.meshes.length} mesh{project.meshes.length !== 1 ? 'es' : ''}</span>
                    <span className="mx-1.5">•</span>
                    <span>{formatDate(project.modified)}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteProject(project.id, e)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete project"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Keyboard shortcut hint */}
      {projects.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <p className="text-xs text-gray-600">
            Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-gray-500">Ctrl+S</kbd> to save
          </p>
        </div>
      )}
    </div>
  )
}

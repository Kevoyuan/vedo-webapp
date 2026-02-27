import { useState, useEffect } from 'react'
import { Modal, Button, TextInput, Select, ActionIcon, Menu, Text, Badge, Group, List, Divider } from '@mantine/core'
import { useToast } from './Toast'
import {
  getRecentFiles,
  clearRecentFiles,
  getAllProjects,
  loadProject,
  deleteProject,
  downloadProjectAsJSON,
  importProjectFromJSON,
  SavedProject,
  RecentFile
} from '../lib/storage'
import { MeshData } from '../types'
import { ViewerSettings } from '../types/viewer'

interface StoragePanelProps {
  opened: boolean
  onClose: () => void
  onLoadProject: (project: SavedProject) => void
  onSaveProject: (name: string) => void
  meshes: SavedMesh[]
  viewerSettings: ViewerSettings
  selectedMeshId: string | null
  currentProjectName: string | null
}

interface SavedMesh {
  id: string
  filename: string
  analyzeData: MeshData
  visualizationData?: {
    vertices: number[][],
    faces: number[][]
  }
}

export default function StoragePanel({
  opened,
  onClose,
  onLoadProject,
  onSaveProject,
  meshes,
  viewerSettings,
  selectedMeshId,
  currentProjectName
}: StoragePanelProps) {
  const { showToast } = useToast()
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])
  const [projects, setProjects] = useState<SavedProject[]>([])
  const [activeTab, setActiveTab] = useState<'recent' | 'projects' | 'import'>('recent')
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [projectName, setProjectName] = useState(currentProjectName || '')

  useEffect(() => {
    if (opened) {
      loadData()
    }
  }, [opened])

  useEffect(() => {
    setProjectName(currentProjectName || '')
  }, [currentProjectName])

  const loadData = async () => {
    const recent = getRecentFiles()
    setRecentFiles(recent)
    
    const allProjects = await getAllProjects()
    setProjects(allProjects.sort((a, b) => b.updatedAt - a.updatedAt))
  }

  const handleLoadProject = async (projectId: string) => {
    const project = await loadProject(projectId)
    if (project) {
      onLoadProject(project)
      showToast('success', `Loaded project: ${project.name}`)
      onClose()
    } else {
      showToast('error', 'Failed to load project')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId)
      showToast('info', 'Project deleted')
      loadData()
    } catch (error) {
      showToast('error', 'Failed to delete project')
    }
  }

  const handleSaveProject = () => {
    if (!projectName.trim()) {
      showToast('error', 'Please enter a project name')
      return
    }
    onSaveProject(projectName.trim())
    setSaveModalOpen(false)
    showToast('success', `Project saved: ${projectName}`)
    loadData()
  }

  const handleExport = () => {
    if (meshes.length === 0) {
      showToast('error', 'No meshes to export')
      return
    }
    
    const project: SavedProject = {
      id: `export-${Date.now()}`,
      name: currentProjectName || 'Untitled',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      meshes,
      viewerSettings,
      selectedMeshId
    }
    
    downloadProjectAsJSON(project)
    showToast('success', 'Project exported')
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const project = importProjectFromJSON(content)
        onLoadProject(project)
        showToast('success', `Imported project: ${project.name}`)
        onClose()
      } catch (error) {
        showToast('error', 'Failed to import project: Invalid format')
      }
    }
    reader.readAsText(file)
    
    // Reset input
    event.target.value = ''
  }

  const handleClearRecent = () => {
    clearRecentFiles()
    setRecentFiles([])
    showToast('info', 'Recent files cleared')
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
              </svg>
            </div>
            <span className="font-semibold">Storage & Projects</span>
          </div>
        }
        size="lg"
        radius="lg"
        padding="lg"
        classNames={{
          header: 'glass border-b border-white/5',
          content: 'glass-card',
          body: 'p-0'
        }}
      >
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 p-1 bg-white/[0.02] rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'recent' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-white/[0.03]'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'projects' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-white/[0.03]'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'import' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-white/[0.03]'
            }`}
          >
            Import
          </button>
        </div>

        {/* Recent Files Tab */}
        {activeTab === 'recent' && (
          <div>
            {recentFiles.length > 0 ? (
              <>
                <Group justify="space-between" mb="sm">
                  <Text size="sm" c="dimmed">Recent projects</Text>
                  <Button variant="subtle" size="xs" color="gray" onClick={handleClearRecent}>
                    Clear
                  </Button>
                </Group>
                <List spacing="xs">
                  {recentFiles.map((file) => (
                    <List.Item
                      key={file.id}
                      onClick={() => handleLoadProject(file.id)}
                      style={{ cursor: 'pointer', padding: '8px', borderRadius: '4px' }}
                      className="hover:bg-white/5"
                    >
                      <Group justify="space-between">
                        <div>
                          <Text size="sm">{file.name}</Text>
                          <Text size="xs" c="dimmed">{formatDate(file.timestamp)}</Text>
                        </div>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLoadProject(file.id)
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                          </svg>
                        </ActionIcon>
                      </Group>
                    </List.Item>
                  ))}
                </List>
              </>
            ) : (
              <Text c="dimmed" ta="center" py="xl">No recent files</Text>
            )}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div>
            <Group justify="space-between" mb="md">
              <Button
                size="xs"
                onClick={() => setSaveModalOpen(true)}
                disabled={meshes.length === 0}
              >
                Save Current
              </Button>
              <Button
                size="xs"
                variant="subtle"
                onClick={handleExport}
                disabled={meshes.length === 0}
              >
                Export JSON
              </Button>
            </Group>

            {projects.length > 0 ? (
              <List spacing="xs">
                {projects.map((project) => (
                  <List.Item
                    key={project.id}
                    style={{ cursor: 'pointer', padding: '8px', borderRadius: '4px' }}
                    className="hover:bg-white/5"
                  >
                    <Group justify="space-between">
                      <div onClick={() => handleLoadProject(project.id)} style={{ flex: 1 }}>
                        <Group gap="xs">
                          <Text size="sm">{project.name}</Text>
                          <Badge size="xs" color="cyan">{project.meshes.length} meshes</Badge>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {formatDate(project.updatedAt)}
                        </Text>
                      </div>
                      <Menu shadow="md" width={120}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray" size="sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                            </svg>
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item onClick={() => downloadProjectAsJSON(project)}>
                            Export
                          </Menu.Item>
                          <Menu.Item color="red" onClick={() => handleDeleteProject(project.id)}>
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </List.Item>
                ))}
              </List>
            ) : (
              <Text c="dimmed" ta="center" py="xl">No saved projects</Text>
            )}
          </div>
        )}

        {/* Import/Export Tab */}
        {activeTab === 'import' && (
          <div>
            <Divider mb="md" />
            
            <Text size="sm" fw={500} mb="sm">Import Project</Text>
            <label style={{ display: 'block', cursor: 'pointer' }}>
              <input
                type="file"
                accept=".json,.vedo.json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
              <Button
                component="span"
                variant="outline"
                fullWidth
                leftSection={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                }
              >
                Choose File
              </Button>
            </label>

            <Divider my="md" />

            <Text size="sm" fw={500} mb="sm">Export Current Project</Text>
            <Text size="xs" c="dimmed" mb="sm">
              {meshes.length > 0 
                ? `${meshes.length} mesh(es) will be exported`
                : 'No meshes to export'}
            </Text>
            <Button
              variant="outline"
              fullWidth
              disabled={meshes.length === 0}
              onClick={handleExport}
              leftSection={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
              }
            >
              Export as JSON
            </Button>
          </div>
        )}
      </Modal>

      {/* Save Project Modal */}
      <Modal
        opened={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save Project"
        size="sm"
        styles={{
          header: { backgroundColor: '#1A1B1E' },
          body: { backgroundColor: '#1A1B1E' }
        }}
      >
        <TextInput
          label="Project Name"
          placeholder="Enter project name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          mb="md"
        />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={() => setSaveModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveProject}>
            Save
          </Button>
        </Group>
      </Modal>
    </>
  )
}

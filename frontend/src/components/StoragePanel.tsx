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
        title="Storage & Projects"
        size="md"
        styles={{
          header: { backgroundColor: '#1A1B1E' },
          body: { backgroundColor: '#1A1B1E' }
        }}
      >
        {/* Tab Navigation */}
        <Group gap="xs" mb="md">
          <Button
            variant={activeTab === 'recent' ? 'filled' : 'subtle'}
            size="xs"
            onClick={() => setActiveTab('recent')}
            color={activeTab === 'recent' ? 'cyan' : 'gray'}
          >
            Recent
          </Button>
          <Button
            variant={activeTab === 'projects' ? 'filled' : 'subtle'}
            size="xs"
            onClick={() => setActiveTab('projects')}
            color={activeTab === 'projects' ? 'cyan' : 'gray'}
          >
            Saved Projects
          </Button>
          <Button
            variant={activeTab === 'import' ? 'filled' : 'subtle'}
            size="xs"
            onClick={() => setActiveTab('import')}
            color={activeTab === 'import' ? 'cyan' : 'gray'}
          >
            Import/Export
          </Button>
        </Group>

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

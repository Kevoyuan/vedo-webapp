// IndexedDB-based project storage for Vedo WebApp
// Handles persistent storage of projects with meshes, camera, and settings

const DB_NAME = 'vedo-projects-db'
const DB_VERSION = 1
const STORE_NAME = 'projects'

export interface ProjectMesh {
  id: string
  filename: string
  vertices: number[][]
  faces: number[][]
  n_points: number
  n_cells: number
  volume?: number
  area?: number
  bounds?: {
    x_min: number
    x_max: number
    y_min: number
    y_max: number
    z_min: number
    z_max: number
  }
}

export interface ProjectCamera {
  position: [number, number, number]
  target: [number, number, number]
}

export interface ProjectSettings {
  viewMode: 'solid' | 'wireframe' | 'xray' | 'annotation'
  ambientIntensity: number
  directionalIntensity: number
  directionalPosition: [number, number, number]
  pointIntensity: number
  pointPosition: [number, number, number]
  enableShadows: boolean
  materialPreset: 'metallic' | 'glass' | 'ceramic' | 'matte' | 'custom'
  materialColor: string
  metalness: number
  roughness: number
  opacity: number
  transparent: boolean
  colorMapEnabled: boolean
  colorMapType: 'viridis' | 'plasma' | 'inferno' | 'magma' | 'rainbow'
  colorMapMin: number
  colorMapMax: number
  cameraPreset: 'free' | 'top' | 'front' | 'side' | 'isometric'
  measurementMode: 'none' | 'distance' | 'angle' | 'area'
  measurements: any[]
  annotations: any[]
  showGrid: boolean
  showAxes: boolean
}

export interface Project {
  id: string
  name: string
  created: number
  modified: number
  meshes: ProjectMesh[]
  camera: ProjectCamera
  settings: ProjectSettings
}

let db: IDBDatabase | null = null

// Initialize IndexedDB
export async function initDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      
      // Create projects object store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('name', 'name', { unique: false })
        store.createIndex('modified', 'modified', { unique: false })
      }
    }
  })
}

// Generate a unique project ID
function generateId(): string {
  return `project-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Create a new project
export async function createProject(name: string): Promise<Project> {
  const database = await initDB()
  
  const project: Project = {
    id: generateId(),
    name,
    created: Date.now(),
    modified: Date.now(),
    meshes: [],
    camera: {
      position: [4, 4, 4],
      target: [0, 0, 0]
    },
    settings: getDefaultProjectSettings()
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add(project)

    request.onsuccess = () => {
      console.log('Project created:', project.id)
      resolve(project)
    }

    request.onerror = () => {
      console.error('Failed to create project:', request.error)
      reject(request.error)
    }
  })
}

// Save/update a project
export async function saveProject(project: Project): Promise<Project> {
  const database = await initDB()
  
  const updatedProject: Project = {
    ...project,
    modified: Date.now()
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(updatedProject)

    request.onsuccess = () => {
      console.log('Project saved:', updatedProject.id)
      resolve(updatedProject)
    }

    request.onerror = () => {
      console.error('Failed to save project:', request.error)
      reject(request.error)
    }
  })
}

// Get a project by ID
export async function getProject(id: string): Promise<Project | null> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => {
      resolve(request.result || null)
    }

    request.onerror = () => {
      console.error('Failed to get project:', request.error)
      reject(request.error)
    }
  })
}

// Get all projects (sorted by modified date, newest first)
export async function getAllProjects(): Promise<Project[]> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const projects = (request.result || []).sort((a, b) => b.modified - a.modified)
      resolve(projects)
    }

    request.onerror = () => {
      console.error('Failed to get all projects:', request.error)
      reject(request.error)
    }
  })
}

// Delete a project
export async function deleteProject(id: string): Promise<void> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => {
      console.log('Project deleted:', id)
      resolve()
    }

    request.onerror = () => {
      console.error('Failed to delete project:', request.error)
      reject(request.error)
    }
  })
}

// Get default project settings
function getDefaultProjectSettings(): ProjectSettings {
  return {
    viewMode: 'solid',
    ambientIntensity: 0.4,
    directionalIntensity: 1.2,
    directionalPosition: [8, 10, 5],
    pointIntensity: 0.3,
    pointPosition: [0, 5, 0],
    enableShadows: false,
    materialPreset: 'metallic',
    materialColor: '#00d4ff',
    metalness: 0.4,
    roughness: 0.3,
    opacity: 1,
    transparent: false,
    colorMapEnabled: false,
    colorMapType: 'viridis',
    colorMapMin: 0,
    colorMapMax: 1,
    cameraPreset: 'free',
    measurementMode: 'none',
    measurements: [],
    annotations: [],
    showGrid: true,
    showAxes: false
  }
}

// Auto-save key for localStorage
const AUTOSAVE_KEY = 'vedo-autosave'

// Auto-save current state to localStorage
export function autoSaveToLocalStorage(data: {
  currentProjectId: string | null
  meshes: any[]
  meshVisualizations: any
  viewerSettings: ProjectSettings
  camera: ProjectCamera
}): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
      ...data,
      timestamp: Date.now()
    }))
  } catch (e) {
    console.warn('Auto-save to localStorage failed:', e)
  }
}

// Load auto-save from localStorage
export function loadAutoSave(): {
  currentProjectId: string | null
  meshes: any[]
  meshVisualizations: any
  viewerSettings: ProjectSettings
  camera: ProjectCamera
} | null {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed to load auto-save:', e)
  }
  return null
}

// Clear auto-save
export function clearAutoSave(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY)
  } catch (e) {
    console.warn('Failed to clear auto-save:', e)
  }
}

/**
 * Cloud Storage Service for Vedo WebApp
 * Handles localStorage, IndexedDB, auto-save, export/import, and recent files
 */

import { MeshData } from '../types'
import { ViewerSettings } from '../types/viewer'

// Types
export interface SavedProject {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  meshes: SavedMesh[]
  viewerSettings: ViewerSettings
  selectedMeshId: string | null
}

export interface SavedMesh {
  id: string
  filename: string
  analyzeData: MeshData
  visualizationData?: {
    vertices: number[][]
    faces: number[][]
  }
}

export interface RecentFile {
  id: string
  name: string
  timestamp: number
  thumbnail?: string
}

// Constants
const DB_NAME = 'vedo-webapp-db'
const DB_VERSION = 1
const STORE_PROJECTS = 'projects'
const STORE_MESH_CACHE = 'meshCache'
const RECENT_FILES_KEY = 'vedo-recent-files'
const MAX_RECENT_FILES = 10
const MESH_CACHE_PREFIX = 'vedo-mesh-'
const AUTO_SAVE_DELAY = 2000 // 2 seconds

// IndexedDB helpers
let db: IDBDatabase | null = null

async function openDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Projects store
      if (!database.objectStoreNames.contains(STORE_PROJECTS)) {
        database.createObjectStore(STORE_PROJECTS, { keyPath: 'id' })
      }

      // Mesh cache store
      if (!database.objectStoreNames.contains(STORE_MESH_CACHE)) {
        database.createObjectStore(STORE_MESH_CACHE, { keyPath: 'id' })
      }
    }
  })
}

// ==================== Mesh Cache (localStorage) ====================

/**
 * Save mesh visualization data to localStorage
 * Best for quick cache of mesh geometry data
 */
export function saveMeshToLocalStorage(meshId: string, visualizationData: { vertices: number[][], faces: number[][] }): void {
  try {
    const key = MESH_CACHE_PREFIX + meshId
    const data = JSON.stringify(visualizationData)
    localStorage.setItem(key, data)
  } catch (error) {
    console.error('Failed to save mesh to localStorage:', error)
  }
}

/**
 * Load mesh visualization data from localStorage
 */
export function loadMeshFromLocalStorage(meshId: string): { vertices: number[][], faces: number[][] } | null {
  try {
    const key = MESH_CACHE_PREFIX + meshId
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to load mesh from localStorage:', error)
    return null
  }
}

/**
 * Remove mesh from localStorage cache
 */
export function removeMeshFromLocalStorage(meshId: string): void {
  try {
    const key = MESH_CACHE_PREFIX + meshId
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to remove mesh from localStorage:', error)
  }
}

/**
 * Clear all mesh cache from localStorage
 */
export function clearMeshCache(): void {
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(MESH_CACHE_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  } catch (error) {
    console.error('Failed to clear mesh cache:', error)
  }
}

/**
 * Get all cached mesh IDs
 */
export function getCachedMeshIds(): string[] {
  const ids: string[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(MESH_CACHE_PREFIX)) {
        ids.push(key.replace(MESH_CACHE_PREFIX, ''))
      }
    }
  } catch (error) {
    console.error('Failed to get cached mesh IDs:', error)
  }
  return ids
}

// ==================== Project State (IndexedDB) ====================

/**
 * Save project to IndexedDB
 */
export async function saveProject(project: SavedProject): Promise<void> {
  try {
    const database = await openDB()
    const transaction = database.transaction([STORE_PROJECTS], 'readwrite')
    const store = transaction.objectStore(STORE_PROJECTS)
    
    project.updatedAt = Date.now()
    store.put(project)
    
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error)
    })

    // Update recent files
    await addToRecentFiles({ id: project.id, name: project.name, timestamp: Date.now() })
  } catch (error) {
    console.error('Failed to save project:', error)
    throw error
  }
}

/**
 * Load project from IndexedDB
 */
export async function loadProject(projectId: string): Promise<SavedProject | null> {
  try {
    const database = await openDB()
    const transaction = database.transaction([STORE_PROJECTS], 'readonly')
    const store = transaction.objectStore(STORE_PROJECTS)
    
    return new Promise((resolve, reject) => {
      const request = store.get(projectId)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to load project:', error)
    return null
  }
}

/**
 * Get all saved projects
 */
export async function getAllProjects(): Promise<SavedProject[]> {
  try {
    const database = await openDB()
    const transaction = database.transaction([STORE_PROJECTS], 'readonly')
    const store = transaction.objectStore(STORE_PROJECTS)
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to get all projects:', error)
    return []
  }
}

/**
 * Delete project from IndexedDB
 */
export async function deleteProject(projectId: string): Promise<void> {
  try {
    const database = await openDB()
    const transaction = database.transaction([STORE_PROJECTS], 'readwrite')
    const store = transaction.objectStore(STORE_PROJECTS)
    store.delete(projectId)
    
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error)
    })

    // Remove from recent files
    await removeFromRecentFiles(projectId)
  } catch (error) {
    console.error('Failed to delete project:', error)
    throw error
  }
}

// ==================== Mesh Cache (IndexedDB) ====================

/**
 * Save mesh data to IndexedDB cache
 */
export async function cacheMesh(meshId: string, data: { analyzeData: MeshData, visualizationData?: { vertices: number[][], faces: number[][] } }): Promise<void> {
  try {
    const database = await openDB()
    const transaction = database.transaction([STORE_MESH_CACHE], 'readwrite')
    const store = transaction.objectStore(STORE_MESH_CACHE)
    
    store.put({ id: meshId, ...data, cachedAt: Date.now() })
    
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error)
    })

    // Also save to localStorage for quick access
    if (data.visualizationData) {
      saveMeshToLocalStorage(meshId, data.visualizationData)
    }
  } catch (error) {
    console.error('Failed to cache mesh:', error)
  }
}

/**
 * Load mesh data from IndexedDB cache
 */
export async function loadCachedMesh(meshId: string): Promise<{ analyzeData: MeshData, visualizationData?: { vertices: number[][], faces: number[][] } } | null> {
  // First try localStorage for quick access
  const localData = loadMeshFromLocalStorage(meshId)
  if (localData) {
    return { analyzeData: { id: meshId, n_points: 0, n_cells: 0 }, visualizationData: localData }
  }

  // Fall back to IndexedDB
  try {
    const database = await openDB()
    const transaction = database.transaction([STORE_MESH_CACHE], 'readonly')
    const store = transaction.objectStore(STORE_MESH_CACHE)
    
    return new Promise((resolve, reject) => {
      const request = store.get(meshId)
      request.onsuccess = () => {
        const result = request.result
        if (result) {
          const { id, cachedAt, ...data } = result
          resolve(data)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to load cached mesh:', error)
    return null
  }
}

/**
 * Clear all mesh cache from IndexedDB
 */
export async function clearMeshCacheDB(): Promise<void> {
  try {
    const database = await openDB()
    const transaction = database.transaction([STORE_MESH_CACHE], 'readwrite')
    const store = transaction.objectStore(STORE_MESH_CACHE)
    store.clear()
    
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error)
    })

    // Also clear localStorage
    clearMeshCache()
  } catch (error) {
    console.error('Failed to clear mesh cache DB:', error)
  }
}

// ==================== Recent Files ====================

/**
 * Get recent files list
 */
export function getRecentFiles(): RecentFile[] {
  try {
    const data = localStorage.getItem(RECENT_FILES_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to get recent files:', error)
    return []
  }
}

/**
 * Add file to recent files list
 */
export async function addToRecentFiles(file: RecentFile): Promise<void> {
  try {
    const recentFiles = getRecentFiles()
    
    // Remove if already exists
    const filtered = recentFiles.filter(f => f.id !== file.id)
    
    // Add to beginning
    filtered.unshift(file)
    
    // Limit to max
    const limited = filtered.slice(0, MAX_RECENT_FILES)
    
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(limited))
  } catch (error) {
    console.error('Failed to add to recent files:', error)
  }
}

/**
 * Remove file from recent files list
 */
export async function removeFromRecentFiles(fileId: string): Promise<void> {
  try {
    const recentFiles = getRecentFiles()
    const filtered = recentFiles.filter(f => f.id !== fileId)
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to remove from recent files:', error)
  }
}

/**
 * Clear recent files list
 */
export function clearRecentFiles(): void {
  try {
    localStorage.removeItem(RECENT_FILES_KEY)
  } catch (error) {
    console.error('Failed to clear recent files:', error)
  }
}

// ==================== Export/Import ====================

/**
 * Export project to JSON file
 */
export function exportProjectToJSON(project: SavedProject): string {
  return JSON.stringify(project, null, 2)
}

/**
 * Import project from JSON file
 */
export function importProjectFromJSON(jsonString: string): SavedProject {
  try {
    const project = JSON.parse(jsonString) as SavedProject
    
    // Validate required fields
    if (!project.id || !project.name || !project.meshes) {
      throw new Error('Invalid project file format')
    }
    
    // Update timestamps
    const now = Date.now()
    project.createdAt = now
    project.updatedAt = now
    
    return project
  } catch (error) {
    console.error('Failed to import project:', error)
    throw new Error('Invalid project file format')
  }
}

/**
 * Download project as JSON file
 */
export function downloadProjectAsJSON(project: SavedProject, filename?: string): void {
  const json = exportProjectToJSON(project)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `${project.name.replace(/[^a-z0-9]/gi, '_')}.vedo.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Create project from current app state
 */
export function createProjectFromState(
  name: string,
  meshes: SavedMesh[],
  viewerSettings: ViewerSettings,
  selectedMeshId: string | null
): SavedProject {
  return {
    id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    meshes,
    viewerSettings,
    selectedMeshId
  }
}

// ==================== Auto-Save ====================

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
let autoSaveCallback: (() => Promise<SavedProject>) | null = null

/**
 * Set up auto-save with debouncing
 */
export function setupAutoSave(
  getProject: () => Promise<SavedProject>,
  onSave: (project: SavedProject) => void
): () => void {
  autoSaveCallback = async () => {
    if (autoSaveCallback) {
      const project = await getProject()
      onSave(project)
    }
  }

  return () => {
    autoSaveCallback = null
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
  }
}

/**
 * Trigger auto-save (debounced)
 */
export function triggerAutoSave(): void {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  if (autoSaveCallback) {
    autoSaveTimer = setTimeout(() => {
      autoSaveCallback?.()
    }, AUTO_SAVE_DELAY)
  }
}

/**
 * Cancel any pending auto-save
 */
export function cancelAutoSave(): void {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
}

// ==================== Storage Info ====================

/**
 * Get storage usage information
 */
export function getStorageInfo(): { localStorage: number, indexedDB: number } {
  let localStorageUsage = 0
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        localStorageUsage += localStorage.getItem(key)?.length || 0
      }
    }
  } catch (error) {
    console.error('Failed to calculate localStorage usage:', error)
  }

  // IndexedDB usage is harder to get accurately without request
  // This is an approximation
  return {
    localStorage: localStorageUsage * 2, // UTF-16 = 2 bytes per char
    indexedDB: 0 // Would need more complex implementation
  }
}

import { MeshData, SceneData } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ============================================================================
// Mesh API
// ============================================================================

export async function uploadMesh(file: File): Promise<MeshData> {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch(`${API_BASE}/mesh/import`, {
    method: 'POST',
    body: formData,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Failed to upload mesh')
  }
  
  return response.json()
}

export async function getMeshInfo(meshId: string): Promise<MeshData> {
  const response = await fetch(`${API_BASE}/mesh/${meshId}`)
  
  if (!response.ok) {
    throw new Error('Failed to get mesh info')
  }
  
  return response.json()
}

export async function getMeshVisualize(meshId: string, includeNormals = false) {
  const params = includeNormals ? '?include_normals=true' : ''
  const response = await fetch(`${API_BASE}/mesh/${meshId}/visualize${params}`)
  
  if (!response.ok) {
    throw new Error('Failed to get mesh visualization')
  }
  
  return response.json()
}

export async function deleteMesh(meshId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/mesh/${meshId}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete mesh')
  }
}

export async function listMeshes(): Promise<{ meshes: MeshData[], count: number }> {
  const response = await fetch(`${API_BASE}/mesh/`)
  
  if (!response.ok) {
    throw new Error('Failed to list meshes')
  }
  
  return response.json()
}

export async function transformMesh(meshId: string, operation: string, params: object) {
  const response = await fetch(`${API_BASE}/mesh/${meshId}/transform`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ operation, params }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to transform mesh')
  }
  
  return response.json()
}

export async function analyzeMesh(meshId: string, computeCurvature = false) {
  const params = computeCurvature ? '?compute_curvature=true' : ''
  const response = await fetch(`${API_BASE}/mesh/${meshId}/analyze${params}`)
  
  if (!response.ok) {
    throw new Error('Failed to analyze mesh')
  }
  
  return response.json()
}

export async function exportMesh(meshId: string, format: string, binary = true) {
  const response = await fetch(`${API_BASE}/mesh/${meshId}/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ format, binary }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to export mesh')
  }
  
  return response.blob()
}

// ============================================================================
// Scene API
// ============================================================================

export async function createScene(name: string): Promise<SceneData> {
  const response = await fetch(`${API_BASE}/api/scenes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create scene')
  }
  
  return response.json()
}

export async function listScenes(): Promise<SceneData[]> {
  const response = await fetch(`${API_BASE}/api/scenes`)
  
  if (!response.ok) {
    throw new Error('Failed to list scenes')
  }
  
  return response.json()
}

export async function getScene(sceneId: string): Promise<SceneData> {
  const response = await fetch(`${API_BASE}/api/scenes/${sceneId}`)
  
  if (!response.ok) {
    throw new Error('Failed to get scene')
  }
  
  return response.json()
}

export async function deleteScene(sceneId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/scenes/${sceneId}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete scene')
  }
}

export async function addMeshToScene(sceneId: string, meshId: string) {
  const response = await fetch(`${API_BASE}/api/scenes/${sceneId}/meshes/${meshId}`, {
    method: 'POST',
  })
  
  if (!response.ok) {
    throw new Error('Failed to add mesh to scene')
  }
  
  return response.json()
}

export async function removeMeshFromScene(sceneId: string, meshId: string) {
  const response = await fetch(`${API_BASE}/api/scenes/${sceneId}/meshes/${meshId}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    throw new Error('Failed to remove mesh from scene')
  }
  
  return response.json()
}

export async function setMeshVisibility(sceneId: string, meshId: string, visible: boolean) {
  const response = await fetch(`${API_BASE}/api/scenes/${sceneId}/meshes/${meshId}/visibility?visible=${visible}`, {
    method: 'POST',
  })
  
  if (!response.ok) {
    throw new Error('Failed to set mesh visibility')
  }
  
  return response.json()
}

export async function mergeMeshes(meshIds: string[], operation = 'merge', outputName = 'merged_mesh'): Promise<MeshData> {
  const response = await fetch(`${API_BASE}/api/merge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mesh_ids: meshIds, operation, output_name: outputName }),
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Failed to merge meshes')
  }
  
  return response.json()
}

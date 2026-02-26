// Mesh data types based on backend API responses

export interface MeshAnalyzeResponse {
  id: string
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

export interface MeshVisualizeResponse {
  vertices: number[][]
  faces: number[][]
}

export interface MeshData extends MeshAnalyzeResponse {
  visualize?: MeshVisualizeResponse
}

export interface TransformParams {
  operation: 'rotate' | 'scale' | 'translate'
  params: RotateParams | ScaleParams | TranslateParams
}

export interface RotateParams {
  angle: number
  axis: 'x' | 'y' | 'z'
}

export interface ScaleParams {
  x: number
  y: number
  z: number
}

export interface TranslateParams {
  x: number
  y: number
  z: number
}

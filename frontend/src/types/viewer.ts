// Viewer settings state for 3D visualization
export interface ViewerSettings {
  // View modes
  viewMode: 'solid' | 'wireframe' | 'xray' | 'annotation'
  
  // Lighting
  ambientIntensity: number
  directionalIntensity: number
  directionalPosition: [number, number, number]
  pointIntensity: number
  pointPosition: [number, number, number]
  enableShadows: boolean
  
  // Material
  materialPreset: 'metallic' | 'glass' | 'ceramic' | 'matte' | 'custom'
  materialColor: string
  metalness: number
  roughness: number
  opacity: number
  transparent: boolean
  
  // Color mapping
  colorMapEnabled: boolean
  colorMapType: 'viridis' | 'plasma' | 'inferno' | 'magma' | 'rainbow'
  colorMapMin: number
  colorMapMax: number
  
  // Camera
  cameraPreset: 'free' | 'top' | 'front' | 'side' | 'isometric'
  
  // Measurement
  measurementMode: 'none' | 'distance' | 'angle' | 'area'
  measurements: Measurement[]
  
  // Annotations
  annotations: Annotation[]
  
  // Display
  showGrid: boolean
  showAxes: boolean
}

export interface Measurement {
  id: string
  type: 'distance' | 'angle' | 'area'
  points: [number, number, number][]
  value: number
  label: string
}

export interface Annotation {
  id: string
  position: [number, number, number]
  text: string
  visible: boolean
}

export const defaultViewerSettings: ViewerSettings = {
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
  showAxes: false,
}

export const materialPresets = {
  metallic: { metalness: 0.9, roughness: 0.1, opacity: 1, transparent: false },
  glass: { metalness: 0.1, roughness: 0.05, opacity: 0.4, transparent: true },
  ceramic: { metalness: 0.1, roughness: 0.6, opacity: 1, transparent: false },
  matte: { metalness: 0.0, roughness: 0.9, opacity: 1, transparent: false },
}

export const cameraPresets = {
  free: { position: [4, 4, 4] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
  top: { position: [0, 10, 0] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
  front: { position: [0, 2, 10] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
  side: { position: [10, 2, 0] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
  isometric: { position: [6, 6, 6] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
}

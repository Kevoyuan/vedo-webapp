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
  materialPreset: 'metallic' | 'glass' | 'ceramic' | 'matte' | 'wood' | 'fabric' | 'custom'
  materialColor: string
  metalness: number
  roughness: number
  opacity: number
  transparent: boolean
  envMapIntensity: number
  envMapPreset: 'city' | 'sunset' | 'dawn' | 'night' | 'forest' | 'apartment' | 'studio' | 'park' | 'lobby'
  
  // Color mapping
  colorMapEnabled: boolean
  colorMapType: 'viridis' | 'plasma' | 'inferno' | 'magma' | 'rainbow'
  colorMapMin: number
  colorMapMax: number
  
  // Camera
  cameraPreset: 'free' | 'top' | 'front' | 'side' | 'isometric'
  
  // Measurement
  measurementMode: 'none' | 'distance' | 'angle' | 'area' | 'face-area'
  measurements: Measurement[]
  
  // Annotations
  annotations: Annotation[]
  
  // Clipping planes
  clippingEnabled: boolean
  clippingAxis: 'x' | 'y' | 'z' | 'none'
  clippingPosition: number
  clippingSide: 'above' | 'below'
  doubleSided: boolean
  
  // Post-processing settings
  postProcessing: {
    bloom: { enabled: boolean; intensity: number; luminanceThreshold: number }
    dof: { enabled: boolean; focusDistance: number; focalLength: number; bokehScale: number }
    ssao: { enabled: boolean; intensity: number; radius: number }
    fxaa: { enabled: boolean }
    toneMapping: { enabled: boolean; exposure: number; method: 'ACESFilmic' | 'Reinhard' | 'Cineon' }
  }
  
  // Display
  showGrid: boolean
  showAxes: boolean
}

export interface Measurement {
  id: string
  type: 'distance' | 'angle' | 'area' | 'face-area'
  points: [number, number, number][]
  value: number
  label: string
  faceIndex?: number
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
  metalness: 0.9,
  roughness: 0.1,
  opacity: 1,
  transparent: false,
  envMapIntensity: 1.5,
  envMapPreset: 'city',
  colorMapEnabled: false,
  colorMapType: 'viridis',
  colorMapMin: 0,
  colorMapMax: 1,
  cameraPreset: 'free',
  measurementMode: 'none',
  measurements: [],
  annotations: [],
  clippingEnabled: false,
  clippingAxis: 'z',
  clippingPosition: 0,
  clippingSide: 'below',
  doubleSided: true,
  showGrid: true,
  showAxes: false,
  postProcessing: {
    bloom: { enabled: true, intensity: 0.5, luminanceThreshold: 0.9 },
    dof: { enabled: false, focusDistance: 10, focalLength: 50, bokehScale: 3 },
    ssao: { enabled: false, intensity: 1.5, radius: 5 },
    fxaa: { enabled: true },
    toneMapping: { enabled: true, exposure: 1, method: 'ACESFilmic' }
  },
}

export const materialPresets = {
  metallic: { metalness: 0.95, roughness: 0.15, opacity: 1, transparent: false },
  glass: { metalness: 0.0, roughness: 0.05, opacity: 0.3, transparent: true },
  ceramic: { metalness: 0.05, roughness: 0.5, opacity: 1, transparent: false },
  matte: { metalness: 0.0, roughness: 0.95, opacity: 1, transparent: false },
  wood: { metalness: 0.0, roughness: 0.7, opacity: 1, transparent: false },
  fabric: { metalness: 0.0, roughness: 0.85, opacity: 1, transparent: false },
}

export const cameraPresets = {
  free: { position: [4, 4, 4] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
  top: { position: [0, 10, 0] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
  front: { position: [0, 2, 10] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
  side: { position: [10, 2, 0] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
  isometric: { position: [6, 6, 6] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
}

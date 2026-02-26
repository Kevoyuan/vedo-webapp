import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { 
  OrbitControls, 
  Grid, 
  Environment, 
  Center,
  AxesHelper,
  Html,
  Line,
  Text
} from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { ViewerSettings, cameraPresets, Measurement, Annotation } from '../types/viewer'
import { MeshData } from '../types'

interface MeshItem {
  id: string
  vertices: number[][]
  faces: number[][]
  visible: boolean
  filename?: string
}

interface Props {
  meshData: MeshData | null
  loading?: boolean
  settings: ViewerSettings
  onSettingsChange: (settings: Partial<ViewerSettings>) => void
  // Multi-mesh support
  meshes?: MeshItem[]
  selectedMeshId?: string | null
}

// Color map functions
const colorMaps = {
  viridis: [
    [0.267, 0.004, 0.329], [0.282, 0.14, 0.458], [0.254, 0.265, 0.53],
    [0.192, 0.407, 0.556], [0.126, 0.566, 0.55], [0.199, 0.719, 0.459],
    [0.564, 0.85, 0.258], [0.993, 0.906, 0.144]
  ],
  plasma: [
    [0.05, 0.03, 0.53], [0.44, 0.05, 0.71], [0.74, 0.2, 0.64],
    [0.96, 0.41, 0.46], [0.99, 0.65, 0.33], [0.94, 0.89, 0.14]
  ],
  inferno: [
    [0, 0, 0], [0.18, 0.05, 0.2], [0.49, 0.11, 0.19],
    [0.74, 0.21, 0.13], [0.96, 0.48, 0.15], [0.99, 0.88, 0.27]
  ],
  magma: [
    [0, 0, 0.02], [0.19, 0.06, 0.27], [0.47, 0.14, 0.37],
    [0.71, 0.22, 0.32], [0.92, 0.38, 0.27], [0.98, 0.68, 0.58]
  ],
  rainbow: [
    [1, 0, 0], [1, 0.5, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [0.5, 0, 1]
  ]
}

function getColorFromMap(value: number, mapType: string, min: number, max: number): THREE.Color {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const colors = colorMaps[mapType as keyof typeof colorMaps] || colorMaps.viridis
  const idx = normalized * (colors.length - 1)
  const i = Math.floor(idx)
  const t = idx - i
  
  if (i >= colors.length - 1) return new THREE.Color(...colors[colors.length - 1])
  
  const c1 = new THREE.Color(...colors[i])
  const c2 = new THREE.Color(...colors[i + 1])
  return c1.lerp(c2, t)
}

function Mesh({ vertices, faces, settings, visible = true, isSelected = false }: { 
  vertices: number[][]; 
  faces: number[][]; 
  settings: ViewerSettings
  visible?: boolean
  isSelected?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const geometry = useMemo(() => {
    if (!vertices.length) return null
    
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(vertices.flat())
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    if (faces.length) {
      const indices = new Uint32Array(faces.flat())
      geo.setIndex(new THREE.BufferAttribute(indices, 1))
    }
    
    geo.computeVertexNormals()
    
    // Calculate vertex colors for color mapping
    if (settings.colorMapEnabled && vertices.length > 0) {
      const colors: number[] = []
      const posAttr = geo.getAttribute('position')
      
      for (let i = 0; i < posAttr.count; i++) {
        const y = posAttr.getY(i)
        const color = getColorFromMap(y, settings.colorMapType, settings.colorMapMin, settings.colorMapMax)
        colors.push(color.r, color.g, color.b)
      }
      
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    }
    
    return geo
  }, [vertices, faces, settings.colorMapEnabled, settings.colorMapType, settings.colorMapMin, settings.colorMapMax])

  // Determine render mode
  const getMaterial = () => {
    const baseProps = {
      color: settings.materialColor,
      side: THREE.DoubleSide,
      metalness: settings.metalness,
      roughness: settings.roughness,
      envMapIntensity: 1.2,
      opacity: settings.opacity,
      transparent: settings.transparent || settings.opacity < 1,
    }

    const hasVertexColors = settings.colorMapEnabled && vertices.length > 0

    switch (settings.viewMode) {
      case 'wireframe':
        return hasVertexColors 
          ? <meshBasicMaterial vertexColors wireframe toneMapped={false} />
          : <meshBasicMaterial color={settings.materialColor} wireframe />
      case 'xray':
        return <meshStandardMaterial {...baseProps} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
      case 'annotation':
        return hasVertexColors
          ? <meshStandardMaterial {...baseProps} vertexColors toneMapped={false} />
          : <meshStandardMaterial {...baseProps} />
      default:
        return hasVertexColors
          ? <meshStandardMaterial {...baseProps} vertexColors toneMapped={false} />
          : <meshStandardMaterial {...baseProps} />
    }
  }

  if (!geometry || !visible) return null

  return (
    <mesh ref <Center>
     ={meshRef} geometry={geometry}>
        {getMaterial()}
        {/* Selection outline effect */}
        {isSelected && (
          <meshBasicMaterial 
            color="#00d4ff" 
            wireframe 
            transparent 
            opacity={0.3}
          />
        )}
      </mesh>
    </Center>
  )
}

// Multi-mesh scene component
function MultiMeshScene({ 
  meshes, 
  settings, 
  onAddMeasurement,
  selectedMeshId 
}: { 
  meshes: MeshItem[]
  settings: ViewerSettings
  onAddMeasurement: (m: Measurement) => void
  selectedMeshId?: string | null
}) {
  const takeScreenshot = useScreenshot()
  
  useEffect(() => {
    (window as any).vedoTakeScreenshot = takeScreenshot
  }, [takeScreenshot])
  
  const preset = settings.cameraPreset
  const cameraConfig = useMemo(() => {
    return cameraPresets[preset] || cameraPresets.free
  }, [preset])

  return (
    <>
      <color attach="background" args={['#0a0a0b']} />
      
      {/* Lighting */}
      <ambientLight intensity={settings.ambientIntensity} />
      <directionalLight 
        position={settings.directionalPosition} 
        intensity={settings.directionalIntensity} 
        castShadow={settings.enableShadows}
      />
      <directionalLight 
        position={[-8, -5, -5]} 
        intensity={0.4} 
        color="#4de7ff" 
      />
      <pointLight 
        position={settings.pointPosition} 
        intensity={settings.pointIntensity} 
        color="#00d4ff" 
      />
      
      {/* Grid */}
      {settings.showGrid && (
        <Grid 
          infiniteGrid 
          cellSize={0.5} 
          sectionSize={2} 
          fadeDistance={40}
          cellColor="#1a1a1d"
          sectionColor="#252528"
        />
      )}
      
      {/* Axes */}
      {settings.showAxes && (
        <axesHelper args={[5]} />
      )}
      
      {/* Render all meshes */}
      {meshes.map((mesh) => (
        <Mesh 
          key={mesh.id}
          vertices={mesh.vertices} 
          faces={mesh.faces}
          settings={settings}
          visible={mesh.visible}
          isSelected={selectedMeshId === mesh.id}
        />
      ))}
      
      {/* Measurement Tools */}
      <MeasurementPoints 
        settings={settings}
        onAddMeasurement={onAddMeasurement}
      />
      <MeasurementLabels measurements={settings.measurements} />
      
      {/* Annotations */}
      <Annotations annotations={settings.annotations} />
      
      <Environment preset="city" />
      <OrbitControls 
        makeDefault 
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        minDistance={1}
        maxDistance={20}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
      </>
    )
  }
}

// Measurement Points Component
function MeasurementPoints({ 
  settings, 
  onAddMeasurement 
}: { 
  settings: ViewerSettings
  onAddMeasurement: (m: Measurement) => void
}) {
  const { camera } = useThree()
  const [points, setPoints] = useState<[number, number, number][]>([])

  const handleClick = useCallback((e: any) => {
    if (settings.measurementMode === 'none') return
    
    const point = e.point
    const newPoints = [...points, [point.x, point.y, point.z] as [number, number, number]]
    setPoints(newPoints)

    // If we have enough points, create measurement
    if (settings.measurementMode === 'distance' && newPoints.length === 2) {
      const p1 = new THREE.Vector3(...newPoints[0])
      const p2 = new THREE.Vector3(...newPoints[1])
      const distance = p1.distanceTo(p2)
      
      onAddMeasurement({
        id: Date.now().toString(),
        type: 'distance',
        points: newPoints,
        value: distance,
        label: `D${settings.measurements.length + 1}`
      })
      setPoints([])
    } else if (settings.measurementMode === 'angle' && newPoints.length === 3) {
      const p1 = new THREE.Vector3(...newPoints[0])
      const p2 = new THREE.Vector3(...newPoints[1])
      const p3 = new THREE.Vector3(...newPoints[2])
      
      const v1 = p1.clone().sub(p2)
      const v2 = p3.clone().sub(p2)
      const angle = THREE.MathUtils.radToDeg(v1.angleTo(v2))
      
      onAddMeasurement({
        id: Date.now().toString(),
        type: 'angle',
        points: newPoints,
        value: angle,
        label: `A${settings.measurements.length + 1}`
      })
      setPoints([])
    } else if (settings.measurementMode === 'area' && newPoints.length === 3) {
      const p1 = new THREE.Vector3(...newPoints[0])
      const p2 = new THREE.Vector3(...newPoints[1])
      const p3 = new THREE.Vector3(...newPoints[2])
      
      const v1 = p2.clone().sub(p1)
      const v2 = p3.clone().sub(p1)
      const cross = new THREE.Vector3().crossVectors(v1, v2)
      const area = cross.length() / 2
      
      onAddMeasurement({
        id: Date.now().toString(),
        type: 'area',
        points: newPoints,
        value: area,
        label: `Area${settings.measurements.length + 1}`
      })
      setPoints([])
    }
  }, [points, settings.measurementMode, settings.measurements.length, onAddMeasurement])

  if (settings.measurementMode === 'none') return null

  return (
    <group>
      {points.map((p, i) => (
        <mesh key={i} position={p} onClick={handleClick}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#ff6b6b" />
        </mesh>
      ))}
      {points.length > 1 && (
        <Line
          points={points}
          color="#ff6b6b"
          lineWidth={2}
        />
      )}
    </group>
  )
}

// Measurement Labels Component
function MeasurementLabels({ measurements }: { measurements: Measurement[] }) {
  return (
    <>
      {measurements.map((m) => {
        if (m.type === 'distance' && m.points.length === 2) {
          const mid = [
            (m.points[0][0] + m.points[1][0]) / 2,
            (m.points[0][1] + m.points[1][1]) / 2,
            (m.points[0][2] + m.points[1][2]) / 2
          ] as [number, number, number]
          
          return (
            <Html key={m.id} position={mid} center>
              <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                {m.value.toFixed(2)}
              </div>
            </Html>
          )
        }
        
        if (m.type === 'angle' && m.points.length === 3) {
          return (
            <Html key={m.id} position={m.points[1]} center>
              <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                {m.value.toFixed(1)}°
              </div>
            </Html>
          )
        }
        
        if (m.type === 'area' && m.points.length === 3) {
          const center = [
            (m.points[0][0] + m.points[1][0] + m.points[2][0]) / 3,
            (m.points[0][1] + m.points[1][1] + m.points[2][1]) / 3,
            (m.points[0][2] + m.points[1][2] + m.points[2][2]) / 3
          ] as [number, number, number]
          
          return (
            <Html key={m.id} position={center} center>
              <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                {m.value.toFixed(2)}
              </div>
            </Html>
          )
        }
        
        return null
      })}
    </>
  )
}

// Annotations Component
function Annotations({ annotations }: { annotations: Annotation[] }) {
  return (
    <>
      {annotations.filter(a => a.visible).map((a) => (
        <Html key={a.id} position={a.position} center>
          <div className="bg-cyan-500/90 text-white px-2 py-1 rounded text-xs max-w-[150px]">
            {a.text}
          </div>
        </Html>
      ))}
    </>
  )
}

function EmptyState() {
  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-[#0a0a0b]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        {/* 3D placeholder icon */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-2xl rotate-45"
            animate={{ rotate: [45, 50, 45] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-4 bg-[#111113] rounded-xl border border-white/5 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-500/40">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          {/* Floating particles effect */}
          <motion.div 
            className="absolute -top-2 -right-2 w-3 h-3 bg-cyan-500/30 rounded-full" 
            animate={{ y: [0, -5, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400/20 rounded-full" 
            animate={{ y: [0, 3, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          />
        </div>
        
        <motion.h3 
          className="text-lg font-medium text-gray-300 mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          No mesh loaded
        </motion.h3>
        <motion.p 
          className="text-sm text-gray-500 max-w-xs mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Upload a mesh file to start viewing and transforming your 3D models
        </motion.p>
        
        {/* Supported formats */}
        <motion.div 
          className="mt-6 flex flex-wrap justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {['.STL', '.OBJ', '.VTK', '.PLY'].map((ext, i) => (
            <motion.span 
              key={ext} 
              className="px-2.5 py-1 text-xs bg-white/5 border border-white/5 rounded-md text-gray-500"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              {ext}
            </motion.span>
          ))}
        </motion.div>

        {/* Keyboard hint */}
        <motion.p 
          className="mt-4 text-xs text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-gray-500">O</kbd> to open file browser
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

function LoadingState() {
  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-[#0a0a0b] z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="text-center"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        <motion.div 
          className="w-16 h-16 mx-auto mb-4 relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-xl" />
          <div className="absolute inset-0 border-2 border-transparent border-t-cyan-400 rounded-xl" />
        </motion.div>
        <motion.p 
          className="text-sm text-gray-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading mesh...
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

// Screenshot functionality hook
function useScreenshot() {
  const { gl, scene, camera } = useThree()
  
  const takeScreenshot = useCallback(() => {
    gl.render(scene, camera)
    const dataUrl = gl.domElement.toDataURL('image/png')
    
    // Create download link
    const link = document.createElement('a')
    link.download = `vedo-screenshot-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }, [gl, scene, camera])
  
  return takeScreenshot
}

// Scene Content Component
function SceneContent({ 
  meshData, 
  settings, 
  onAddMeasurement 
}: { 
  meshData: any
  settings: ViewerSettings
  onAddMeasurement: (m: Measurement) => void
}) {
  const takeScreenshot = useScreenshot()
  
  // Expose screenshot function globally
  useEffect(() => {
    (window as any).vedoTakeScreenshot = takeScreenshot
  }, [takeScreenshot])
  
  const preset = settings.cameraPreset
  const cameraConfig = useMemo(() => {
    return cameraPresets[preset] || cameraPresets.free
  }, [preset])

  return (
    <>
      <color attach="background" args={['#0a0a0b']} />
      
      {/* Lighting */}
      <ambientLight intensity={settings.ambientIntensity} />
      <directionalLight 
        position={settings.directionalPosition} 
        intensity={settings.directionalIntensity} 
        castShadow={settings.enableShadows}
      />
      <directionalLight 
        position={[-8, -5, -5]} 
        intensity={0.4} 
        color="#4de7ff" 
      />
      <pointLight 
        position={settings.pointPosition} 
        intensity={settings.pointIntensity} 
        color="#00d4ff" 
      />
      
      {/* Grid */}
      {settings.showGrid && (
        <Grid 
          infiniteGrid 
          cellSize={0.5} 
          sectionSize={2} 
          fadeDistance={40}
          cellColor="#1a1a1d"
          sectionColor="#252528"
        />
      )}
      
      {/* Axes */}
      {settings.showAxes && (
        <axesHelper args={[5]} />
      )}
      
      {/* Mesh */}
      <Mesh 
        vertices={meshData?.visualize?.vertices || []} 
        faces={meshData?.visualize?.faces || []}
        settings={settings}
      />
      
      {/* Measurement Tools */}
      <MeasurementPoints 
        settings={settings}
        onAddMeasurement={onAddMeasurement}
      />
      <MeasurementLabels measurements={settings.measurements} />
      
      {/* Annotations */}
      <Annotations annotations={settings.annotations} />
      
      <Environment preset="city" />
      <OrbitControls 
        makeDefault 
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        minDistance={1}
        maxDistance={20}
        // Touch gesture support
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
      />
    </>
  )
}

export default function MeshViewer({ meshData, loading, settings, onSettingsChange }: Props) {
  // Handle add measurement
  const handleAddMeasurement = useCallback((m: Measurement) => {
    onSettingsChange({
      measurements: [...settings.measurements, m]
    })
  }, [settings.measurements, onSettingsChange])

  // Camera preset handling
  const cameraConfig = useMemo(() => {
    return cameraPresets[settings.cameraPreset] || cameraPresets.free
  }, [settings.cameraPreset])

  // Viewer controls hint keyboard shortcuts
  useKeyboardShortcuts([
    { key: '+', handler: () => {}, description: 'Zoom in' },
    { key: '-', handler: () => {}, description: 'Zoom out' },
  ])

  if (loading) {
    return <LoadingState />
  }

  if (!meshData) {
    return <EmptyState />
  }

  return (
    <>
      <Canvas 
        camera={{ position: cameraConfig.position, fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <SceneContent 
          meshData={meshData} 
          settings={settings}
          onAddMeasurement={handleAddMeasurement}
        />
      </Canvas>
      
      {/* Viewer controls hint - desktop only */}
      <motion.div 
        className="absolute bottom-4 left-4 glass-light rounded-lg px-3 py-2 hide-mobile"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-xs text-gray-500">
          <span className="text-gray-400">Drag</span> to rotate • <span className="text-gray-400">Scroll</span> to zoom • <span className="text-gray-400">Right-click</span> to pan
        </p>
      </motion.div>
      
      {/* Touch hints - mobile only */}
      <motion.div 
        className="touch-hint visible md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <span>1 finger: rotate</span> • <span>2 fingers: zoom/pan</span>
      </motion.div>
    </>
  )
}

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, Center, AxesHelper } from '@react-three/drei'
import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { ViewerSettings, materialPresets, cameraPresets } from '../types/viewer'

interface Props {
  meshData: any
  loading?: boolean
  settings: ViewerSettings
  onSettingsChange: (settings: Partial<ViewerSettings>) => void
}

function Mesh({ vertices, faces, settings }: { vertices: number[][]; faces: number[][]; settings: ViewerSettings }) {
  const geometry = useMemo(() => {
    if (!vertices.length) return null
    
    const geo = new THREE.BufferGeometry()
    
    // Set vertices
    const positions = new Float32Array(vertices.flat())
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    // Set faces
    if (faces.length) {
      const indices = new Uint32Array(faces.flat())
      geo.setIndex(new THREE.BufferAttribute(indices, 1))
    }
    
    geo.computeVertexNormals()
    return geo
  }, [vertices, faces])

  if (!geometry) return null

  // Determine render mode
  const getMaterial = () => {
    const baseProps = {
      color: settings.materialColor,
      side: THREE.DoubleSide,
      metalness: settings.metalness,
      roughness: settings.roughness,
      envMapIntensity: 1.2,
    }

    switch (settings.viewMode) {
      case 'wireframe':
        return <meshBasicMaterial color={settings.materialColor} wireframe />
      case 'xray':
        return <meshStandardMaterial {...baseProps} transparent opacity={0.3} depthWrite={false} />
      case 'annotation':
        return <meshStandardMaterial {...baseProps} />
      default:
        return <meshStandardMaterial {...baseProps} />
    }
  }

  return (
    <Center>
      <mesh geometry={geometry}>
        {getMaterial()}
      </mesh>
    </Center>
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

export default function MeshViewer({ meshData, loading, settings, onSettingsChange }: Props) {
  // Camera preset handling
  const cameraConfig = useMemo(() => {
    return cameraPresets[settings.cameraPreset] || cameraPresets.free
  }, [settings.cameraPreset])

  // Viewer controls hint keyboard shortcuts
  useKeyboardShortcuts([
    { key: '+', handler: () => {}, description: 'Zoom in' },
    { key: '-', handler: () => {}, description: 'Zoom out' },
  ])

  return (
    <>
      <Canvas 
        camera={{ position: cameraConfig.position, fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0a0a0b']} />
        
        {/* Premium lighting setup */}
        <ambientLight intensity={settings.ambientIntensity} />
        <directionalLight 
          position={settings.directionalPosition} 
          intensity={settings.directionalIntensity} 
          castShadow={settings.enableShadows}
        />
        <directionalLight position={[-8, -5, -5]} intensity={0.4} color="#4de7ff" />
        <pointLight 
          position={settings.pointPosition} 
          intensity={settings.pointIntensity} 
          color="#00d4ff" 
        />
        
        <Mesh 
          vertices={meshData?.visualize?.vertices || []} 
          faces={meshData?.visualize?.faces || []} 
          settings={settings}
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
        {settings.showAxes && <AxesHelper size={5} />}
        
        <Environment preset="city" />
        <OrbitControls 
          makeDefault 
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          minDistance={1}
          maxDistance={20}
        />
      </Canvas>
      
      {/* Viewer controls hint */}
      <motion.div 
        className="absolute bottom-4 left-4 glass-light rounded-lg px-3 py-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-xs text-gray-500">
          <span className="text-gray-400">Drag</span> to rotate • <span className="text-gray-400">Scroll</span> to zoom • <span className="text-gray-400">Right-click</span> to pan
        </p>
      </motion.div>
    </>
  )
}

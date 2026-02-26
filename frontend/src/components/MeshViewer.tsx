import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, Center } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

interface Props {
  meshData: any
  loading?: boolean
}

function Mesh({ vertices, faces }: { vertices: number[][]; faces: number[][] }) {
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

  return (
    <Center>
      <mesh geometry={geometry}>
        <meshStandardMaterial 
          color="#00d4ff" 
          side={THREE.DoubleSide}
          metalness={0.4}
          roughness={0.3}
          envMapIntensity={1.2}
        />
      </mesh>
    </Center>
  )
}

function EmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0b]">
      <div className="text-center animate-fade-in">
        {/* 3D placeholder icon */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-2xl rotate-45" />
          <div className="absolute inset-4 bg-[#111113] rounded-xl border border-white/5 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-500/40">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          {/* Floating particles effect */}
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-cyan-500/30 rounded-full animate-pulse" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400/20 rounded-full animate-pulse delay-300" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-300 mb-2">No mesh loaded</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Upload a mesh file to start viewing and transforming your 3D models
        </p>
        
        {/* Supported formats */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {['.STL', '.OBJ', '.VTK', '.PLY'].map((ext, i) => (
            <span 
              key={ext} 
              className="px-2.5 py-1 text-xs bg-white/5 border border-white/5 rounded-md text-gray-500"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {ext}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0b] z-10">
      <div className="text-center animate-pulse">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-xl" />
          <div className="absolute inset-0 border-2 border-transparent border-t-cyan-400 rounded-xl animate-spin" />
        </div>
        <p className="text-sm text-gray-400">Loading mesh...</p>
      </div>
    </div>
  )
}

export default function MeshViewer({ meshData, loading }: Props) {
  if (loading) {
    return <LoadingState />
  }

  if (!meshData) {
    return <EmptyState />
  }

  return (
    <>
      <Canvas 
        camera={{ position: [4, 4, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0a0a0b']} />
        
        {/* Premium lighting setup */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[8, 10, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-8, -5, -5]} intensity={0.4} color="#4de7ff" />
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#00d4ff" />
        
        <Mesh vertices={meshData.visualize?.vertices || []} faces={meshData.visualize?.faces || []} />
        
        {/* Enhanced grid */}
        <Grid 
          infiniteGrid 
          cellSize={0.5} 
          sectionSize={2} 
          fadeDistance={40}
          cellColor="#1a1a1d"
          sectionColor="#252528"
        />
        
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
      <div className="absolute bottom-4 left-4 glass-light rounded-lg px-3 py-2 animate-fade-in">
        <p className="text-xs text-gray-500">
          <span className="text-gray-400">Drag</span> to rotate • <span className="text-gray-400">Scroll</span> to zoom • <span className="text-gray-400">Right-click</span> to pan
        </p>
      </div>
    </>
  )
}

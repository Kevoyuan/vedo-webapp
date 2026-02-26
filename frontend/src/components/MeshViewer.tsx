import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

interface Props {
  meshData: any
}

function Mesh({ vertices, faces }: { vertices: number[][]; faces: number[][] }) {
  const geometry = {
    if (! useMemo(() =>vertices.length) return null
    
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
    <mesh geometry={geometry}>
      <meshStandardMaterial 
        color="#00d4ff" 
        side={THREE.DoubleSide}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  )
}

export default function MeshViewer({ meshData }: Props) {
  if (!meshData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        <p>No mesh loaded</p>
      </div>
    )
  }

  return (
    <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />
      
      <Mesh vertices={meshData.visualize?.vertices || []} faces={meshData.visualize?.faces || []} />
      
      <Grid 
        infiniteGrid 
        cellSize={0.5} 
        sectionSize={2} 
        fadeDistance={30}
        cellColor="#2a2a2a"
        sectionColor="#3a3a3a"
      />
      
      <Environment preset="city" />
      <OrbitControls makeDefault />
    </Canvas>
  )
}

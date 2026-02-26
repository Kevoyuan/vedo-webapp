import { useRef, useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { 
  EffectComposer, 
  Bloom,
  DepthOfField,
  N8AO,
  SMAA,
  ToneMapping
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { ViewerSettings } from '../types/viewer'

interface PostProcessingProps {
  settings: ViewerSettings
}

export default function PostProcessing({ settings }: PostProcessingProps) {
  const { gl, camera } = useThree()
  
  // Apply tone mapping settings to renderer
  useEffect(() => {
    if (settings.postProcessing.toneMapping.enabled) {
      gl.toneMappingExposure = settings.postProcessing.toneMapping.exposure
    }
  }, [gl, settings.postProcessing.toneMapping.enabled, settings.postProcessing.toneMapping.exposure])
  
  // Get tone mapping mode
  const toneMappingMode = useMemo(() => {
    switch (settings.postProcessing.toneMapping.method) {
      case 'ACESFilmic': return ToneMappingMode.ACES_FILMIC
      case 'Reinhard': return ToneMappingMode.REINHARD
      case 'Cineon': return ToneMappingMode.CINEON
      default: return ToneMappingMode.ACES_FILMIC
    }
  }, [settings.postProcessing.toneMapping.method])

  // Calculate focus distance based on camera distance
  const focusDistance = useMemo(() => {
    const cameraPos = camera.position
    const target = new THREE.Vector3(0, 0, 0)
    const distance = cameraPos.distanceTo(target)
    return distance / camera.fov
  }, [camera])

  const { bloom, dof, ssao, fxaa, toneMapping } = settings.postProcessing

  return (
    <EffectComposer>
      {/* Bloom Effect - Glow */}
      {bloom.enabled && (
        <Bloom 
          intensity={bloom.intensity}
          luminanceThreshold={bloom.luminanceThreshold}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      )}

      {/* Depth of Field */}
      {dof.enabled && (
        <DepthOfField
          focusDistance={dof.focusDistance * 0.01}
          focalLength={dof.focalLength}
          bokehScale={dof.bokehScale}
        />
      )}

      {/* Screen Space Ambient Occlusion */}
      {ssao.enabled && (
        <N8AO
          aoRadius={ssao.radius}
          intensity={ssao.intensity}
          distanceFalloff={1}
          color="black"
        />
      )}

      {/* SMAA Anti-aliasing */}
      {fxaa.enabled && (
        <SMAA />
      )}

      {/* Tone Mapping */}
      {toneMapping.enabled && (
        <ToneMapping
          mode={toneMappingMode}
          blendFunction={BlendFunction.NORMAL}
        />
      )}
    </EffectComposer>
  )
}

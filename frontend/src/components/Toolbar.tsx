import { useState } from 'react'
import { Button, Group, ActionIcon, Tooltip, Text, SegmentedControl, Divider } from '@mantine/core'
import { 
  ArrowClockwise, 
  ArrowCounterClockwise, 
  MagnifyingPlus, 
  MagnifyingMinus,
  Wrench,
  ArrowsOut,
  Rotate
} from '@phosphor-icons/react'
import axios from 'axios'

interface Props {
  meshId: string
  onUpdate: (data: any) => void
}

interface ToolButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  loading?: boolean
  accent?: boolean
}

function ToolButton({ icon, label, onClick, loading, accent }: ToolButtonProps) {
  return (
    <Tooltip label={label} position="top" withArrow>
      <ActionIcon 
        variant={accent ? 'filled' : 'subtle'}
        color={accent ? 'cyan' : 'gray'}
        size="lg"
        radius="md"
        onClick={onClick}
        loading={loading}
        className="transition-all duration-200 hover:scale-105 active:scale-95"
        styles={{
          root: accent ? {
            background: 'rgba(0, 212, 255, 0.15)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            '&:hover': {
              background: 'rgba(0, 212, 255, 0.25)',
            }
          } : {}
        }}
      >
        {icon}
      </ActionIcon>
    </Tooltip>
  )
}

interface FixButtonProps {
  label: string
  onClick: () => void
  loading?: boolean
  variant?: 'fill-holes' | 'smooth' | 'decimate'
}

function FixButton({ label, onClick, loading, variant = 'fill-holes' }: FixButtonProps) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    'fill-holes': { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)', text: 'text-emerald-400' },
    'smooth': { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.2)', text: 'text-purple-400' },
    'decimate': { bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.2)', text: 'text-orange-400' },
  }
  
  const style = colors[variant]
  
  return (
    <Button
      size="xs"
      variant="subtle"
      onClick={onClick}
      loading={loading}
      className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      styles={{
        root: {
          background: style.bg,
          border: `1px solid ${style.border}`,
          color: style.text,
          '&:hover': {
            background: style.bg,
            filter: 'brightness(1.2)',
          }
        }
      }}
    >
      {label}
    </Button>
  )
}

export default function Toolbar({ meshId, onUpdate }: Props) {
  const [loading, setLoading] = useState(false)
  const [transformMode, setTransformMode] = useState('rotate')

  const handleTransform = async (op: string, params: any) => {
    setLoading(true)
    try {
      await axios.post(`http://localhost:8000/mesh/${meshId}/transform`, {
        operation: op,
        params
      })
      // Refresh data
      const { data } = await axios.get(`http://localhost:8000/mesh/${meshId}/analyze`)
      onUpdate(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-light rounded-xl p-4 animate-scale-in">
      {/* Transform Mode Selector */}
      <Group justify="space-between" mb="md">
        <Text size="sm" fw={600}>Transform</Text>
        <SegmentedControl
          size="xs"
          value={transformMode}
          onChange={setTransformMode}
          data={[
            { label: <Group gap={4}><Rotate size={12} />Rotate</Group>, value: 'rotate' },
            { label: <Group gap={4}><ArrowsOut size={12} />Scale</Group>, value: 'scale' },
          ]}
          styles={{
            root: {
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }
          }}
        />
      </Group>
      
      {/* Transform Tools */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <ToolButton 
          icon={<ArrowCounterClockwise size={18} />}
          label="Rotate -90°"
          onClick={() => handleTransform('rotate', { angle: -90, axis: 'z' })}
          loading={loading}
        />
        <ToolButton 
          icon={<ArrowClockwise size={18} />}
          label="Rotate +90°"
          onClick={() => handleTransform('rotate', { angle: 90, axis: 'z' })}
          loading={loading}
        />
        <ToolButton 
          icon={<MagnifyingMinus size={18} />}
          label="Scale Down"
          onClick={() => handleTransform('scale', { x: 0.8, y: 0.8, z: 0.8 })}
          loading={loading}
          accent
        />
        <ToolButton 
          icon={<MagnifyingPlus size={18} />}
          label="Scale Up"
          onClick={() => handleTransform('scale', { x: 1.2, y: 1.2, z: 1.2 })}
          loading={loading}
          accent
        />
      </div>

      <Divider my="sm" color="white/5" />

      {/* Mesh Repair Tools */}
      <Text size="sm" fw={600} mb="sm">Repair</Text>
      
      <div className="flex flex-wrap gap-2">
        <FixButton 
          label="Fill Holes" 
          onClick={() => handleTransform('fill_holes', {})}
          loading={loading}
          variant="fill-holes"
        />
        <FixButton 
          label="Smooth" 
          onClick={() => handleTransform('smooth', {})}
          loading={loading}
          variant="smooth"
        />
        <FixButton 
          label="Decimate" 
          onClick={() => handleTransform('decimate', { ratio: 0.5 })}
          loading={loading}
          variant="decimate"
        />
      </div>
    </div>
  )
}

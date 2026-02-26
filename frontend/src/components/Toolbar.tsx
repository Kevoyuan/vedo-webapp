import { useState } from 'react'
import { Button, Group, ActionIcon, Tooltip, Text } from '@mantine/core'
import { 
  ArrowClockwise, 
  ArrowCounterClockwise, 
  MagnifyingPlus, 
  MagnifyingMinus,
  Wrench
} from '@phosphor-icons/react'
import axios from 'axios'

interface Props {
  meshId: string
  onUpdate: (data: any) => void
}

export default function Toolbar({ meshId, onUpdate }: Props) {
  const [loading, setLoading] = useState(false)

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
    <div className="border-t border-border pt-4">
      <Text size="sm" fw={600} mb="sm">Transform</Text>
      
      <Group gap="xs">
        <Tooltip label="Rotate 90deg">
          <ActionIcon 
            variant="light" 
            onClick={() => handleTransform('rotate', { angle: 90, axis: 'z' })}
            loading={loading}
          >
            <ArrowClockwise size={18} />
          </ActionIcon>
        </Tooltip>
        
        <Tooltip label="Scale 1.2x">
          <ActionIcon 
            variant="light"
            onClick={() => handleTransform('scale', { x: 1.2, y: 1.2, z: 1.2 })}
            loading={loading}
          >
            <MagnifyingPlus size={18} />
          </ActionIcon>
        </Tooltip>
        
        <Tooltip label="Scale 0.8x">
          <ActionIcon 
            variant="light"
            onClick={() => handleTransform('scale', { x: 0.8, y: 0.8, z: 0.8 })}
            loading={loading}
          >
            <MagnifyingMinus size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Text size="sm" fw={600} mt="md" mb="sm">Fix</Text>
      
      <Group gap="xs">
        <Button size="xs" variant="light" leftSection={<Wrench size={14} />}
          onClick={() => handleTransform('rotate', { angle: 0, axis: 'z' })}
          loading={loading}
        >
          Fill Holes
        </Button>
        
        <Button size="xs" variant="light" leftSection={<Wrench size={14} />}
          onClick={() => handleTransform('rotate', { angle: 0, axis: 'z' })}
          loading={loading}
        >
          Smooth
        </Button>
      </Group>
    </div>
  )
}

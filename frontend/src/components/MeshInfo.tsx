import { Card, Text, Group, Stack } from '@mantine/core'
import { Cube, Polygon, Ruler } from '@phosphor-icons/react'

interface Props {
  data: any
}

export default function MeshInfo({ data }: Props) {
  return (
    <Card withBorder bg="dark" c="white">
      <Text size="sm" fw={600} mb="sm">Mesh Info</Text>
      
      <Stack gap="xs">
        <Group>
          <Cube size={16} />
          <Text size="xs">Points: {data.n_points?.toLocaleString()}</Text>
        </Group>
        
        <Group>
          <Polygon size={16} />
          <Text size="xs">Faces: {data.n_cells?.toLocaleString()}</Text>
        </Group>
        
        {data.volume && (
          <Group>
            <Ruler size={16} />
            <Text size="xs">Volume: {data.volume.toFixed(2)}</Text>
          </Group>
        )}
        
        {data.area && (
          <Group>
            <Ruler size={16} />
            <Text size="xs">Area: {data.area.toFixed(2)}</Text>
          </Group>
        )}
      </Stack>
    </Card>
  )
}

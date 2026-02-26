import { memo, useMemo } from 'react'
import { Card, Text, Group, Stack, Badge } from '@mantine/core'
import { Cube, Polygon, Ruler, Waves } from '@phosphor-icons/react'
import type { MeshData } from '../types'

interface Props {
  data: MeshData
}

interface StatItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
  accent?: boolean
}

/**
 * Individual stat item component - memoized for performance
 */
const StatItem = memo(function StatItem({ icon, label, value, accent }: StatItemProps) {
  return (
    <Group gap="sm" className="group">
      <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
        ${accent 
          ? 'bg-cyan-500/10 text-cyan-400' 
          : 'bg-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-gray-400'
        }
      `}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <Text size="xs" c="dimmed" className="transition-colors duration-300 group-hover:text-gray-400">
          {label}
        </Text>
        <Text size="sm" fw={500} className="truncate">
          {value}
        </Text>
      </div>
    </Group>
  )
})

StatItem.displayName = 'StatItem'

/**
 * Format large numbers to human-readable format (e.g., 1.2K, 3.5M)
 */
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

/**
 * MeshInfo Component
 * Displays mesh statistics and metadata
 * Optimized with memoization to prevent unnecessary re-renders
 */
function MeshInfoComponent({ data }: Props) {
  // Memoize formatted values to avoid recalculation
  const stats = useMemo(() => ({
    vertices: formatNumber(data.n_points || 0),
    faces: formatNumber(data.n_cells || 0),
    volume: data.volume ? `${data.volume.toFixed(2)} units³` : null,
    area: data.area ? `${data.area.toFixed(2)} units²` : null,
    bounds: data.bounds ? [
      data.bounds[0], // x_min
      data.bounds[2], // y_min
      data.bounds[4], // z_min
    ] : null,
  }), [data])

  return (
    <Card 
      withBorder 
      bg="transparent" 
      className="glass-light rounded-xl overflow-hidden animate-scale-in"
      padding="lg"
    >
      {/* Header with accent */}
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-transparent border border-cyan-500/20 flex items-center justify-center">
            <Cube size={16} className="text-cyan-400" />
          </div>
          <Text size="sm" fw={600}>Mesh Info</Text>
        </Group>
        <Badge 
          size="xs" 
          variant="light" 
          color="cyan"
          className="animate-fade-in"
        >
          {data.type || 'Loaded'}
        </Badge>
      </Group>
      
      <Stack gap="md">
        <StatItem 
          icon={<Cube size={14} />}
          label="Vertices"
          value={stats.vertices}
          accent
        />
        
        <StatItem 
          icon={<Polygon size={14} />}
          label="Faces"
          value={stats.faces}
        />
        
        {stats.volume && (
          <StatItem 
            icon={<Waves size={14} />}
            label="Volume"
            value={stats.volume}
            accent
          />
        )}
        
        {stats.area && (
          <StatItem 
            icon={<Ruler size={14} />}
            label="Surface Area"
            value={stats.area}
          />
        )}

        {stats.bounds && (
          <div className="pt-2 border-t border-white/5">
            <Text size="xs" c="dimmed" mb="xs">Bounding Box</Text>
            <Group gap="xs">
              {['X', 'Y', 'Z'].map((axis, i) => (
                <div 
                  key={axis}
                  className="flex-1 px-2 py-1.5 bg-white/[0.03] rounded-lg text-center"
                >
                  <Text size="xs" c="dimmed">{axis}</Text>
                  <Text size="xs" fw={500}>
                    {stats.bounds[i]?.toFixed(2) || '0.00'}
                  </Text>
                </div>
              ))}
            </Group>
          </div>
        )}
      </Stack>
    </Card>
  )
}

// Memoize component to prevent unnecessary re-renders
const MeshInfo = memo(MeshInfoComponent, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id &&
    prevProps.data.n_points === nextProps.data.n_points &&
    prevProps.data.n_cells === nextProps.data.n_cells
})

MeshInfo.displayName = 'MeshInfo'

export default MeshInfo

import { Card, Text, Group, Stack, Badge } from '@mantine/core'
import { Cube, Polygon, Ruler, Waves } from '@phosphor-icons/react'

interface Props {
  data: any
}

interface StatItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
  accent?: boolean
}

function StatItem({ icon, label, value, accent }: StatItemProps) {
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
}

export default function MeshInfo({ data }: Props) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toLocaleString()
  }

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
          value={formatNumber(data.n_points || 0)}
          accent
        />
        
        <StatItem 
          icon={<Polygon size={14} />}
          label="Faces"
          value={formatNumber(data.n_cells || 0)}
        />
        
        {data.volume && (
          <StatItem 
            icon={<Waves size={14} />}
            label="Volume"
            value={`${data.volume.toFixed(2)} units³`}
            accent
          />
        )}
        
        {data.area && (
          <StatItem 
            icon={<Ruler size={14} />}
            label="Surface Area"
            value={`${data.area.toFixed(2)} units²`}
          />
        )}

        {data.bounds && (
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
                    {data.bounds[i]?.toFixed(2) || '0.00'}
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

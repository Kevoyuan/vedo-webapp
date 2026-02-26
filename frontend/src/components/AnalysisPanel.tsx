import { useState, useEffect } from 'react'
import { Card, Text, Group, Stack, Badge, Table, ScrollArea, Progress, Tooltip, ActionIcon, Collapse, RingProgress } from '@mantine/core'
import { 
  Cube, 
  Polygon, 
  Ruler, 
  Waves, 
  ChartLine, 
  ChartPie, 
  CheckCircle, 
  XCircle,
  Info,
  ChevronDown,
  ChevronUp
} from '@phosphor-icons/react'

interface QualityMetrics {
  aspect_ratio?: number
  skewness?: { min?: number; max?: number; mean?: number }
  orthogonality?: { min?: number; max?: number; mean?: number }
  compactness?: number
  solidity?: number
  sphericity?: number
  circularity?: number
  is_manifold?: boolean
  n_points?: number
  n_cells?: number
}

interface CurvatureData {
  mesh_id?: string
  method?: string
  curvature?: {
    min?: number
    max?: number
    mean?: number
    n_points?: number
    pc1_min?: number
    pc1_max?: number
    pc1_mean?: number
    pc2_min?: number
    pc2_max?: number
    pc2_mean?: number
  }
}

interface Props {
  qualityData?: QualityMetrics | null
  curvatureData?: CurvatureData | null
  onClear?: () => void
}

function QualityRing({ value, label, color }: { value: number; label: string; color: string }) {
  const percentage = Math.min(100, Math.max(0, (1 - value) * 100))
  const getColor = () => {
    if (percentage > 80) return 'green'
    if (percentage > 50) return 'yellow'
    return 'red'
  }
  
  return (
    <RingProgress
      size={80}
      thickness={8}
      roundCaps
      sections={[{ value: percentage, color: getColor() }]}
      label={
        <Text size="xs" ta="center" fw={600}>
          {value.toFixed(2)}
        </Text>
      }
    />
  )
}

function StatRow({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: boolean }) {
  return (
    <Table.Tr>
      <Table.Td className="border-b border-white/5 py-2">
        <Group gap="sm">
          <div className={`w-6 h-6 rounded flex items-center justify-center ${accent ? 'text-cyan-400' : 'text-gray-500'}`}>
            {icon}
          </div>
          <Text size="sm" c="dimmed">{label}</Text>
        </Group>
      </Table.Td>
      <Table.Td className="border-b border-white/5 py-2 text-right">
        <Text size="sm" fw={500} className={accent ? 'text-cyan-400' : ''}>
          {value}
        </Text>
      </Table.Td>
    </Table.Tr>
  )
}

export default function AnalysisPanel({ qualityData, curvatureData, onClear }: Props) {
  const [curvatureOpen, setCurvatureOpen] = useState(true)
  const [qualityOpen, setQualityOpen] = useState(true)

  if (!qualityData && !curvatureData) {
    return null
  }

  return (
    <Card 
      withBorder 
      bg="transparent" 
      className="glass-light rounded-xl overflow-hidden animate-scale-in"
      padding="lg"
    >
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-transparent border border-cyan-500/20 flex items-center justify-center">
            <ChartPie size={16} className="text-cyan-400" />
          </div>
          <Text size="sm" fw={600}>Analysis</Text>
        </Group>
        {onClear && (
          <ActionIcon variant="subtle" color="gray" onClick={onClear}>
            <XCircle size={16} />
          </ActionIcon>
        )}
      </Group>
      
      <ScrollArea scrollbarSize={6}>
        <Stack gap="md">
          
          {/* Curvature Section */}
          {curvatureData && curvatureData.curvature && (
            <div>
              <Group 
                justify="space-between" 
                mb="sm"
                className="cursor-pointer"
                onClick={() => setCurvatureOpen(!curvatureOpen)}
              >
                <Group gap="xs">
                  <ChartLine size={14} className="text-yellow-400" />
                  <Text size="xs" fw={600} c="dimmed">
                    Curvature ({curvatureData.method || 'gaussian'})
                  </Text>
                </Group>
                {curvatureOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Group>
              
              <Collapse in={curvatureOpen}>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                    <Text size="xs" c="dimmed">Min</Text>
                    <Text size="sm" fw={600}>
                      {curvatureData.curvature.min?.toFixed(4) || 'N/A'}
                    </Text>
                  </div>
                  <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                    <Text size="xs" c="dimmed">Max</Text>
                    <Text size="sm" fw={600}>
                      {curvatureData.curvature.max?.toFixed(4) || 'N/A'}
                    </Text>
                  </div>
                  <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                    <Text size="xs" c="dimmed">Mean</Text>
                    <Text size="sm" fw={600}>
                      {curvatureData.curvature.mean?.toFixed(4) || 'N/A'}
                    </Text>
                  </div>
                </div>
                
                {curvatureData.curvature.pc1_mean !== undefined && (
                  <div className="space-y-2">
                    <Text size="xs" c="dimmed" mb="xs">Principal Curvature 1</Text>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-1 bg-white/[0.02] rounded">
                        <Text size="xs" c="dimmed">Min</Text>
                        <Text size="xs">{curvatureData.curvature.pc1_min?.toFixed(4)}</Text>
                      </div>
                      <div className="text-center p-1 bg-white/[0.02] rounded">
                        <Text size="xs" c="dimmed">Max</Text>
                        <Text size="xs">{curvatureData.curvature.pc1_max?.toFixed(4)}</Text>
                      </div>
                      <div className="text-center p-1 bg-white/[0.02] rounded">
                        <Text size="xs" c="dimmed">Mean</Text>
                        <Text size="xs">{curvatureData.curvature.pc1_mean?.toFixed(4)}</Text>
                      </div>
                    </div>
                  </div>
                )}
              </Collapse>
            </div>
          )}

          {/* Quality Section */}
          {qualityData && (
            <div>
              <Group 
                justify="space-between" 
                mb="sm"
                className="cursor-pointer"
                onClick={() => setQualityOpen(!qualityOpen)}
              >
                <Group gap="xs">
                  <ChartPie size={14} className="text-teal-400" />
                  <Text size="xs" fw={600} c="dimmed">Quality Metrics</Text>
                </Group>
                {qualityOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Group>
              
              <Collapse in={qualityOpen}>
                {/* Manifold Status */}
                <div className="flex items-center gap-2 mb-3">
                  {qualityData.is_manifold ? (
                    <Badge color="green" variant="light" leftSection={<CheckCircle size={12} />}>
                      Manifold
                    </Badge>
                  ) : (
                    <Badge color="red" variant="light" leftSection={<XCircle size={12} />}>
                      Non-Manifold
                    </Badge>
                  )}
                </div>

                {/* Quality Metrics Table */}
                <Table verticalSpacing="xs" horizontalSpacing="sm">
                  <Table.Tbody>
                    {qualityData.aspect_ratio !== undefined && (
                      <StatRow 
                        icon={<Ruler size={12} />}
                        label="Aspect Ratio"
                        value={qualityData.aspect_ratio.toFixed(3)}
                        accent={qualityData.aspect_ratio < 10}
                      />
                    )}
                    
                    {qualityData.compactness !== undefined && (
                      <StatRow 
                        icon={<Cube size={12} />}
                        label="Compactness"
                        value={qualityData.compactness.toFixed(3)}
                      />
                    )}
                    
                    {qualityData.solidity !== undefined && (
                      <StatRow 
                        icon={<Polygon size={12} />}
                        label="Solidity"
                        value={qualityData.solidity.toFixed(3)}
                      />
                    )}
                    
                    {qualityData.sphericity !== undefined && (
                      <StatRow 
                        icon={<Waves size={12} />}
                        label="Sphericity"
                        value={qualityData.sphericity.toFixed(3)}
                      />
                    )}
                    
                    {qualityData.circularity !== undefined && (
                      <StatRow 
                        icon={<CircleDashed size={12} />}
                        label="Circularity"
                        value={qualityData.circularity.toFixed(3)}
                      />
                    )}
                  </Table.Tbody>
                </Table>

                {/* Skewness */}
                {qualityData.skewness && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <Text size="xs" c="dimmed" mb="xs">Skewness</Text>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                        <Text size="xs" c="dimmed">Min</Text>
                        <Text size="sm" fw={500}>{qualityData.skewness.min?.toFixed(3)}</Text>
                      </div>
                      <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                        <Text size="xs" c="dimmed">Max</Text>
                        <Text size="sm" fw={500}>{qualityData.skewness.max?.toFixed(3)}</Text>
                      </div>
                      <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                        <Text size="xs" c="dimmed">Mean</Text>
                        <Text size="sm" fw={500}>{qualityData.skewness.mean?.toFixed(3)}</Text>
                      </div>
                    </div>
                  </div>
                )}

                {/* Orthogonality */}
                {qualityData.orthogonality && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <Text size="xs" c="dimmed" mb="xs">Orthogonality</Text>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                        <Text size="xs" c="dimmed">Min</Text>
                        <Text size="sm" fw={500}>{qualityData.orthogonality.min?.toFixed(3)}</Text>
                      </div>
                      <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                        <Text size="xs" c="dimmed">Max</Text>
                        <Text size="sm" fw={500}>{qualityData.orthogonality.max?.toFixed(3)}</Text>
                      </div>
                      <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                        <Text size="xs" c="dimmed">Mean</Text>
                        <Text size="sm" fw={500}>{qualityData.orthogonality.mean?.toFixed(3)}</Text>
                      </div>
                    </div>
                  </div>
                )}
              </Collapse>
            </div>
          )}
        </Stack>
      </ScrollArea>
    </Card>
  )
}

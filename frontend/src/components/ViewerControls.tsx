import { useState } from 'react'
import { 
  ActionIcon, 
  Tooltip, 
  SegmentedControl,
  Select,
  Slider,
  Text,
  Divider,
  Collapse,
  Button,
  Badge,
  Popover,
  Stack,
  NumberInput,
  ColorSwatch,
  Group,
  Box,
  Tabs
} from '@mantine/core'
import { 
  SquaresFour, 
  Eye, 
  Sun, 
  Palette, 
  Ruler, 
  Camera, 
  CameraFill,
  Videocamera,
  DownloadSimple,
  Funnel,
  X,
  Plus,
  Trash,
  DotsThree,
  Eyedropper,
  Thermometer
} from '@phosphor-icons/react'
import { ViewerSettings, materialPresets, cameraPresets } from '../types/viewer'

interface Props {
  settings: ViewerSettings
  onSettingsChange: (settings: Partial<ViewerSettings>) => void
  onScreenshot: () => void
  onRecording: () => void
  isRecording: boolean
}

export default function ViewerControls({ 
  settings, 
  onSettingsChange, 
  onScreenshot, 
  onRecording,
  isRecording 
}: Props) {
  const [expandedPanel, setExpandedPanel] = useState<string | null>('view')
  
  const togglePanel = (panel: string) => {
    setExpandedPanel(expandedPanel === panel ? null : panel)
  }

  return (
    <div className="glass-light rounded-xl p-4 space-y-3 animate-scale-in">
      <Text size="sm" fw={600} mb="xs">Viewer Controls</Text>
      
      {/* View Mode */}
      <ControlPanel 
        title="View Mode" 
        icon={<SquaresFour size={16} />}
        expanded={expandedPanel === 'view'}
        onToggle={() => togglePanel('view')}
      >
        <SegmentedControl
          size="xs"
          fullWidth
          value={settings.viewMode}
          onChange={(v) => onSettingsChange({ viewMode: v as any })}
          data={[
            { label: 'Solid', value: 'solid' },
            { label: 'Wire', value: 'wireframe' },
            { label: 'X-Ray', value: 'xray' },
            { label: 'Annotate', value: 'annotation' },
          ]}
        />
      </ControlPanel>

      {/* Camera Presets */}
      <ControlPanel 
        title="Camera" 
        icon={<Camera size={16} />}
        expanded={expandedPanel === 'camera'}
        onToggle={() => togglePanel('camera')}
      >
        <SegmentedControl
          size="xs"
          fullWidth
          value={settings.cameraPreset}
          onChange={(v) => onSettingsChange({ cameraPreset: v as any })}
          data={[
            { label: 'Free', value: 'free' },
            { label: 'Top', value: 'top' },
            { label: 'Front', value: 'front' },
            { label: 'Side', value: 'side' },
            { label: 'Iso', value: 'isometric' },
          ]}
        />
      </ControlPanel>

      {/* Lighting Controls */}
      <ControlPanel 
        title="Lighting" 
        icon={<Sun size={16} />}
        expanded={expandedPanel === 'lighting'}
        onToggle={() => togglePanel('lighting')}
      >
        <Stack gap="sm">
          <SliderControl
            label="Ambient"
            value={settings.ambientIntensity}
            min={0}
            max={1}
            step={0.1}
            onChange={(v) => onSettingsChange({ ambientIntensity: v })}
          />
          <SliderControl
            label="Directional"
            value={settings.directionalIntensity}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => onSettingsChange({ directionalIntensity: v })}
          />
          <SliderControl
            label="Point"
            value={settings.pointIntensity}
            min={0}
            max={1}
            step={0.1}
            onChange={(v) => onSettingsChange({ pointIntensity: v })}
          />
        </Stack>
      </ControlPanel>

      {/* Material Presets */}
      <ControlPanel 
        title="Material" 
        icon={<Palette size={16} />}
        expanded={expandedPanel === 'material'}
        onToggle={() => togglePanel('material')}
      >
        <Stack gap="sm">
          <Select
            size="xs"
            label="Preset"
            value={settings.materialPreset}
            onChange={(v) => {
              const preset = v as keyof typeof materialPresets
              if (preset && preset !== 'custom') {
                onSettingsChange({
                  materialPreset: preset,
                  ...materialPresets[preset]
                })
              } else {
                onSettingsChange({ materialPreset: 'custom' })
              }
            }}
            data={[
              { value: 'metallic', label: 'Metallic' },
              { value: 'glass', label: 'Glass' },
              { value: 'ceramic', label: 'Ceramic' },
              { value: 'matte', label: 'Matte' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
          
          <ColorPicker
            label="Color"
            value={settings.materialColor}
            onChange={(v) => onSettingsChange({ materialColor: v })}
          />
          
          {settings.materialPreset === 'custom' && (
            <>
              <SliderControl
                label="Metalness"
                value={settings.metalness}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => onSettingsChange({ metalness: v })}
              />
              <SliderControl
                label="Roughness"
                value={settings.roughness}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => onSettingsChange({ roughness: v })}
              />
              <SliderControl
                label="Opacity"
                value={settings.opacity}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => onSettingsChange({ opacity: v })}
              />
            </>
          )}
        </Stack>
      </ControlPanel>

      {/* Color Mapping */}
      <ControlPanel 
        title="Color Map" 
        icon={<Funnel size={16} />}
        expanded={expandedPanel === 'colormap'}
        onToggle={() => togglePanel('colormap')}
      >
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="xs" c="dimmed">Enable</Text>
            <ActionIcon
              size="sm"
              variant={settings.colorMapEnabled ? 'filled' : 'subtle'}
              color={settings.colorMapEnabled ? 'cyan' : 'gray'}
              onClick={() => onSettingsChange({ colorMapEnabled: !settings.colorMapEnabled })}
            >
              <Eye size={14} />
            </ActionIcon>
          </Group>
          
          {settings.colorMapEnabled && (
            <>
              <Select
                size="xs"
                label="Type"
                value={settings.colorMapType}
                onChange={(v) => onSettingsChange({ colorMapType: v as any })}
                data={[
                  { value: 'viridis', label: 'Viridis' },
                  { value: 'plasma', label: 'Plasma' },
                  { value: 'inferno', label: 'Inferno' },
                  { value: 'magma', label: 'Magma' },
                  { value: 'rainbow', label: 'Rainbow' },
                ]}
              />
              <Group grow>
                <NumberInput
                  size="xs"
                  label="Min"
                  value={settings.colorMapMin}
                  onChange={(v) => onSettingsChange({ colorMapMin: Number(v) })}
                />
                <NumberInput
                  size="xs"
                  label="Max"
                  value={settings.colorMapMax}
                  onChange={(v) => onSettingsChange({ colorMapMax: Number(v) })}
                />
              </Group>
            </>
          )}
        </Stack>
      </ControlPanel>

      {/* Measurement Tools */}
      <ControlPanel 
        title="Measure" 
        icon={<Ruler size={16} />}
        expanded={expandedPanel === 'measure'}
        onToggle={() => togglePanel('measure')}
      >
        <Stack gap="sm">
          <SegmentedControl
            size="xs"
            fullWidth
            value={settings.measurementMode}
            onChange={(v) => onSettingsChange({ measurementMode: v as any })}
            data={[
              { label: 'None', value: 'none' },
              { label: 'Dist', value: 'distance' },
              { label: 'Angle', value: 'angle' },
              { label: 'Area', value: 'area' },
            ]}
          />
          
          {settings.measurements.length > 0 && (
            <div className="space-y-2">
              <Divider color="white/5" />
              {settings.measurements.map((m, i) => (
                <Group key={m.id} justify="space-between">
                  <Text size="xs" c="dimmed">
                    {m.type === 'distance' ? '📏' : m.type === 'angle' ? '📐' : '⬡'} {m.label}: {m.value.toFixed(2)}
                  </Text>
                  <ActionIcon 
                    size="xs" 
                    variant="subtle" 
                    color="red"
                    onClick={() => {
                      const newMs = [...settings.measurements]
                      newMs.splice(i, 1)
                      onSettingsChange({ measurements: newMs })
                    }}
                  >
                    <Trash size={12} />
                  </ActionIcon>
                </Group>
              ))}
            </div>
          )}
        </Stack>
      </ControlPanel>

      <Divider color="white/5" />

      {/* Screenshot & Recording */}
      <Group grow>
        <Tooltip label="Screenshot">
          <ActionIcon 
            variant="subtle" 
            size="lg"
            onClick={onScreenshot}
            className="transition-all duration-200 hover:scale-105"
          >
            <DownloadSimple size={18} />
          </ActionIcon>
        </Tooltip>
        
        <Tooltip label={isRecording ? 'Stop Recording' : 'Record Video'}>
          <ActionIcon 
            variant={isRecording ? 'filled' : 'subtle'}
            color={isRecording ? 'red' : 'gray'}
            size="lg"
            onClick={onRecording}
            className="transition-all duration-200 hover:scale-105"
          >
            <Videocamera size={18} />
          </ActionIcon>
        </Tooltip>
        
        <Tooltip label={settings.showGrid ? 'Hide Grid' : 'Show Grid'}>
          <ActionIcon 
            variant={settings.showGrid ? 'filled' : 'subtle'}
            color={settings.showGrid ? 'cyan' : 'gray'}
            size="lg"
            onClick={() => onSettingsChange({ showGrid: !settings.showGrid })}
            className="transition-all duration-200 hover:scale-105"
          >
            <DotsThree size={18} />
          </ActionIcon>
        </Tooltip>
        
        <Tooltip label={settings.showAxes ? 'Hide Axes' : 'Show Axes'}>
          <ActionIcon 
            variant={settings.showAxes ? 'filled' : 'subtle'}
            color={settings.showAxes ? 'cyan' : 'gray'}
            size="lg"
            onClick={() => onSettingsChange({ showAxes: !settings.showAxes })}
            className="transition-all duration-200 hover:scale-105"
          >
            <CameraFill size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
      
      {/* Recording indicator */}
      {isRecording && (
        <Badge color="red" size="sm" variant="filled" className="animate-pulse">
          ● Recording
        </Badge>
      )}
    </div>
  )
}

// Control Panel Component
interface ControlPanelProps {
  title: string
  icon: React.ReactNode
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

function ControlPanel({ title, icon, expanded, onToggle, children }: ControlPanelProps) {
  return (
    <div className="border border-white/5 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 hover:bg-white/5 transition-colors"
      >
        <Group gap="xs">
          <span className="text-cyan-400">{icon}</span>
          <Text size="xs" fw={500}>{title}</Text>
        </Group>
        <ActionIcon size="xs" variant="transparent" className={expanded ? 'rotate-180' : ''}>
          <Plus size={12} className="transition-transform" />
        </ActionIcon>
      </button>
      <Collapse in={expanded}>
        <div className="p-2 pt-0">
          {children}
        </div>
      </Collapse>
    </div>
  )
}

// Slider Control Component
interface SliderControlProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

function SliderControl({ label, value, min, max, step, onChange }: SliderControlProps) {
  return (
    <div>
      <Group justify="space-between" mb={4}>
        <Text size="xs" c="dimmed">{label}</Text>
        <Text size="xs" c="cyan">{value.toFixed(1)}</Text>
      </Group>
      <Slider
        size="xs"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        color="cyan"
        label={null}
      />
    </div>
  )
}

// Color Picker Component
interface ColorPickerProps {
  label: string
  value: string
  onChange: (value: string) => void
}

const colorSwatches = [
  '#00d4ff', '#4de7ff', '#00ff88', '#88ff00', 
  '#ffff00', '#ff8800', '#ff0000', '#ff00ff',
  '#8800ff', '#0000ff', '#ffffff', '#888888'
]

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [opened, setOpened] = useState(false)
  
  return (
    <div>
      <Group justify="space-between" mb={4}>
        <Text size="xs" c="dimmed">{label}</Text>
        <Popover opened={opened} onChange={setOpened} position="bottom-end">
          <Popover.Target>
            <ActionIcon 
              size="sm" 
              variant="subtle"
              onClick={() => setOpened(true)}
            >
              <ColorSwatch color={value} size={16} />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown>
            <Group gap={4}>
              {colorSwatches.map((c) => (
                <ColorSwatch 
                  key={c} 
                  color={c} 
                  size={24} 
                  onClick={() => {
                    onChange(c)
                    setOpened(false)
                  }}
                  className="cursor-pointer hover:scale-110 transition-transform"
                  style={c === value ? { outline: '2px solid white' } : {}}
                />
              ))}
            </Group>
          </Popover.Dropdown>
        </Popover>
      </Group>
    </div>
  )
}

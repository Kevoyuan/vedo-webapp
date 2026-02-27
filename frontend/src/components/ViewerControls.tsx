import { useState } from 'react'
import { 
  ActionIcon, 
  Tooltip, 
  SegmentedControl,
  Select,
  Slider,
  Divider,
  Button,
  Badge,
  Popover,
  Stack,
  Group,
  NumberInput,
  ColorSwatch
} from '@mantine/core'
import { 
  SquaresFour, 
  Eye, 
  Sun, 
  Palette, 
  Ruler, 
  Camera,
  Camera as CameraFill,
  VideoCamera as Videocamera,
  DownloadSimple,
  Funnel,
  X,
  Plus,
  Trash,
  DotsThree,
  Eyedropper,
  Thermometer,
  Scissors,
  Sparkle,
  FilePdf,
  FileCsv,
  FileCode as FileJson,
  TrashSimple
} from '@phosphor-icons/react'
import { ViewerSettings, materialPresets, cameraPresets } from '../types/viewer'
import { exportToJSON, exportToCSV, exportToPDF } from '../lib/measurementExport'

interface Props {
  settings: ViewerSettings
  onSettingsChange: (settings: Partial<ViewerSettings>) => void
  onScreenshot: () => void
  onRecording: () => void
  isRecording: boolean
  meshInfo?: {
    name: string
    vertices: number
    faces: number
  }
}

export default function ViewerControls({ 
  settings, 
  onSettingsChange, 
  onScreenshot, 
  onRecording,
  isRecording,
  meshInfo
}: Props) {
  const [expandedPanel, setExpandedPanel] = useState<string | null>('view')
  
  const togglePanel = (panel: string) => {
    setExpandedPanel(expandedPanel === panel ? null : panel)
  }

  return (
    <div className="glass-card p-4 space-y-3 animate-scale-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 flex items-center justify-center">
          <SquaresFour size={16} weight="duotone" className="text-cyan-400" />
        </div>
        <p className="text-sm font-semibold">Viewer Controls</p>
      </div>
      
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

      {/* Lighting & Environment */}
      <ControlPanel 
        title="Lighting" 
        icon={<Sun size={16} />}
        expanded={expandedPanel === 'lighting'}
        onToggle={() => togglePanel('lighting')}
      >
        <Stack gap="sm">
          <Select
            size="xs"
            label="Environment"
            value={settings.envMapPreset}
            onChange={(v) => onSettingsChange({ envMapPreset: v as any })}
            data={[
              { value: 'city', label: 'City' },
              { value: 'sunset', label: 'Sunset' },
              { value: 'dawn', label: 'Dawn' },
              { value: 'night', label: 'Night' },
              { value: 'forest', label: 'Forest' },
              { value: 'apartment', label: 'Apartment' },
              { value: 'studio', label: 'Studio' },
              { value: 'park', label: 'Park' },
              { value: 'lobby', label: 'Lobby' },
            ]}
          />
          <SliderControl
            label="Env Intensity"
            value={settings.envMapIntensity}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) => onSettingsChange({ envMapIntensity: v })}
          />
          <Divider color="white/5" />
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
              { value: 'wood', label: 'Wood' },
              { value: 'fabric', label: 'Fabric' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
          
          <ColorPicker
            label="Color"
            value={settings.materialColor}
            onChange={(v) => onSettingsChange({ materialColor: v })}
          />
          
          {/* Always show material sliders */}
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
            onChange={(v) => onSettingsChange({ 
              opacity: v,
              transparent: v < 1
            })}
          />
          
          {settings.materialPreset === 'custom' && (
            <>
              <SliderControl
                label="Custom Offset"
                value={settings.metalness}
                min={-0.5}
                max={0.5}
                step={0.05}
                onChange={(v) => onSettingsChange({ metalness: v + 0.5 })}
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
              { label: 'Face', value: 'face-area' },
            ]}
          />
          
          {settings.measurementMode !== 'none' && (
            <Text size="xs" c="dimmed">
              {settings.measurementMode === 'distance' && 'Click two points to measure distance'}
              {settings.measurementMode === 'angle' && 'Click three points to measure angle'}
              {settings.measurementMode === 'area' && 'Click three points to measure area'}
              {settings.measurementMode === 'face-area' && 'Click on mesh faces to measure area'}
            </Text>
          )}
          
          {settings.measurements.length > 0 && (
            <div className="space-y-2">
              <Divider color="white/5" />
              
              {/* Export Buttons */}
              <div className="flex gap-1">
                <Tooltip label="Export PDF">
                  <ActionIcon 
                    size="sm" 
                    variant="light" 
                    color="red"
                    onClick={() => exportToPDF(settings.measurements, meshInfo)}
                  >
                    <FilePdf size={14} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Export CSV">
                  <ActionIcon 
                    size="sm" 
                    variant="light" 
                    color="green"
                    onClick={() => exportToCSV(settings.measurements)}
                  >
                    <FileCsv size={14} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Export JSON">
                  <ActionIcon 
                    size="sm" 
                    variant="light" 
                    color="blue"
                    onClick={() => exportToJSON(settings.measurements)}
                  >
                    <FileJson size={14} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Clear All">
                  <ActionIcon 
                    size="sm" 
                    variant="light" 
                    color="gray"
                    onClick={() => onSettingsChange({ measurements: [] })}
                  >
                    <TrashSimple size={14} />
                  </ActionIcon>
                </Tooltip>
              </div>
              
              <Divider color="white/5" />
              
              {/* Measurement List */}
              {settings.measurements.map((m, i) => (
                <Group key={m.id} justify="space-between">
                  <Text size="xs" c="dimmed">
                    {m.type === 'distance' ? '📏' : m.type === 'angle' ? '📐' : '⬡'} {m.label}: {m.value.toFixed(3)}
                    {m.type === 'angle' && '°'}
                    {(m.type === 'area' || m.type === 'face-area') && ' sq'}
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
              
              {/* Summary */}
              <Divider color="white/5" />
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Total: {settings.measurements.length}
                </Text>
                {settings.measurements.length > 0 && (
                  <Text size="xs" c="cyan" fw={500}>
                    {settings.measurements.reduce((sum, m) => {
                      if (m.type === 'distance') return sum + m.value
                      if (m.type === 'area' || m.type === 'face-area') return sum + m.value
                      return sum
                    }, 0).toFixed(3)} total
                  </Text>
                )}
              </Group>
            </div>
          )}
        </Stack>
      </ControlPanel>

      {/* Clipping Planes */}
      <ControlPanel 
        title="Clipping" 
        icon={<Scissors size={16} />}
        expanded={expandedPanel === 'clipping'}
        onToggle={() => togglePanel('clipping')}
      >
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="xs" c="dimmed">Enable</Text>
            <ActionIcon
              size="sm"
              variant={settings.clippingEnabled ? 'filled' : 'subtle'}
              color={settings.clippingEnabled ? 'cyan' : 'gray'}
              onClick={() => onSettingsChange({ clippingEnabled: !settings.clippingEnabled })}
            >
              <Eye size={14} />
            </ActionIcon>
          </Group>
          
          {settings.clippingEnabled && (
            <>
              <SegmentedControl
                size="xs"
                fullWidth
                value={settings.clippingAxis}
                onChange={(v) => onSettingsChange({ clippingAxis: v as any })}
                data={[
                  { label: 'X', value: 'x' },
                  { label: 'Y', value: 'y' },
                  { label: 'Z', value: 'z' },
                  { label: 'None', value: 'none' },
                ]}
              />
              
              <SliderControl
                label="Position"
                value={settings.clippingPosition}
                min={-10}
                max={10}
                step={0.1}
                onChange={(v) => onSettingsChange({ clippingPosition: v })}
              />
              
              <SegmentedControl
                size="xs"
                fullWidth
                value={settings.clippingSide}
                onChange={(v) => onSettingsChange({ clippingSide: v as any })}
                data={[
                  { label: 'Below', value: 'below' },
                  { label: 'Above', value: 'above' },
                ]}
              />
              
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Double-Sided</Text>
                <ActionIcon
                  size="sm"
                  variant={settings.doubleSided ? 'filled' : 'subtle'}
                  color={settings.doubleSided ? 'cyan' : 'gray'}
                  onClick={() => onSettingsChange({ doubleSided: !settings.doubleSided })}
                >
                  <Eye size={14} />
                </ActionIcon>
              </Group>
            </>
          )}
        </Stack>
      </ControlPanel>

      {/* Post-Processing Effects */}
      <ControlPanel 
        title="Effects" 
        icon={<Sparkle size={16} />}
        expanded={expandedPanel === 'effects'}
        onToggle={() => togglePanel('effects')}
      >
        <Stack gap="sm">
          {/* Bloom */}
          <EffectToggle
            label="Bloom"
            enabled={settings.postProcessing.bloom.enabled}
            onToggle={() => onSettingsChange({
              postProcessing: {
                ...settings.postProcessing,
                bloom: { ...settings.postProcessing.bloom, enabled: !settings.postProcessing.bloom.enabled }
              }
            })}
          />
          {settings.postProcessing.bloom.enabled && (
            <>
              <SliderControl
                label="Intensity"
                value={settings.postProcessing.bloom.intensity}
                min={0}
                max={2}
                step={0.1}
                onChange={(v) => onSettingsChange({
                  postProcessing: {
                    ...settings.postProcessing,
                    bloom: { ...settings.postProcessing.bloom, intensity: v }
                  }
                })}
              />
              <SliderControl
                label="Threshold"
                value={settings.postProcessing.bloom.luminanceThreshold}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => onSettingsChange({
                  postProcessing: {
                    ...settings.postProcessing,
                    bloom: { ...settings.postProcessing.bloom, luminanceThreshold: v }
                  }
                })}
              />
            </>
          )}

          <Divider color="white/5" />

          {/* Depth of Field */}
          <EffectToggle
            label="Depth of Field"
            enabled={settings.postProcessing.dof.enabled}
            onToggle={() => onSettingsChange({
              postProcessing: {
                ...settings.postProcessing,
                dof: { ...settings.postProcessing.dof, enabled: !settings.postProcessing.dof.enabled }
              }
            })}
          />
          {settings.postProcessing.dof.enabled && (
            <>
              <SliderControl
                label="Focus Distance"
                value={settings.postProcessing.dof.focusDistance}
                min={1}
                max={20}
                step={0.5}
                onChange={(v) => onSettingsChange({
                  postProcessing: {
                    ...settings.postProcessing,
                    dof: { ...settings.postProcessing.dof, focusDistance: v }
                  }
                })}
              />
              <SliderControl
                label="Focal Length"
                value={settings.postProcessing.dof.focalLength}
                min={10}
                max={100}
                step={5}
                onChange={(v) => onSettingsChange({
                  postProcessing: {
                    ...settings.postProcessing,
                    dof: { ...settings.postProcessing.dof, focalLength: v }
                  }
                })}
              />
              <SliderControl
                label="Bokeh"
                value={settings.postProcessing.dof.bokehScale}
                min={1}
                max={10}
                step={0.5}
                onChange={(v) => onSettingsChange({
                  postProcessing: {
                    ...settings.postProcessing,
                    dof: { ...settings.postProcessing.dof, bokehScale: v }
                  }
                })}
              />
            </>
          )}

          <Divider color="white/5" />

          {/* SSAO */}
          <EffectToggle
            label="Ambient Occlusion"
            enabled={settings.postProcessing.ssao.enabled}
            onToggle={() => onSettingsChange({
              postProcessing: {
                ...settings.postProcessing,
                ssao: { ...settings.postProcessing.ssao, enabled: !settings.postProcessing.ssao.enabled }
              }
            })}
          />
          {settings.postProcessing.ssao.enabled && (
            <>
              <SliderControl
                label="Intensity"
                value={settings.postProcessing.ssao.intensity}
                min={0}
                max={4}
                step={0.1}
                onChange={(v) => onSettingsChange({
                  postProcessing: {
                    ...settings.postProcessing,
                    ssao: { ...settings.postProcessing.ssao, intensity: v }
                  }
                })}
              />
              <SliderControl
                label="Radius"
                value={settings.postProcessing.ssao.radius}
                min={1}
                max={15}
                step={0.5}
                onChange={(v) => onSettingsChange({
                  postProcessing: {
                    ...settings.postProcessing,
                    ssao: { ...settings.postProcessing.ssao, radius: v }
                  }
                })}
              />
            </>
          )}

          <Divider color="white/5" />

          {/* SMAA */}
          <EffectToggle
            label="Anti-Aliasing (SMAA)"
            enabled={settings.postProcessing.fxaa.enabled}
            onToggle={() => onSettingsChange({
              postProcessing: {
                ...settings.postProcessing,
                fxaa: { ...settings.postProcessing.fxaa, enabled: !settings.postProcessing.fxaa.enabled }
              }
            })}
          />

          <Divider color="white/5" />

          {/* Tone Mapping */}
          <EffectToggle
            label="Tone Mapping"
            enabled={settings.postProcessing.toneMapping.enabled}
            onToggle={() => onSettingsChange({
              postProcessing: {
                ...settings.postProcessing,
                toneMapping: { ...settings.postProcessing.toneMapping, enabled: !settings.postProcessing.toneMapping.enabled }
              }
            })}
          />
          {settings.postProcessing.toneMapping.enabled && (
            <>
              <Select
                size="xs"
                label="Method"
                value={settings.postProcessing.toneMapping.method}
                onChange={(v) => onSettingsChange({
                  postProcessing: {
                    ...settings.postProcessing,
                    toneMapping: { ...settings.postProcessing.toneMapping, method: v as any }
                  }
                })}
                data={[
                  { value: 'ACESFilmic', label: 'ACES Filmic' },
                  { value: 'Reinhard', label: 'Reinhard' },
                  { value: 'Cineon', label: 'Cineon' },
                ]}
              />
              <SliderControl
                label="Exposure"
                value={settings.postProcessing.toneMapping.exposure}
                min={0.1}
                max={3}
                step={0.1}
                onChange={(v) => onSettingsChange({
                  postProcessing: {
                    ...settings.postProcessing,
                    toneMapping: { ...settings.postProcessing.toneMapping, exposure: v }
                  }
                })}
              />
            </>
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
    <div className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.02] transition-all duration-300 hover:border-white/10">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-white/[0.03] transition-all duration-300"
      >
        <div className="flex items-center gap-2">
          <span className="text-cyan-400">{icon}</span>
          <span className="text-xs font-medium text-gray-300">{title}</span>
        </div>
        <div className={`w-5 h-5 rounded-md bg-white/[0.03] flex items-center justify-center transition-all duration-300 ${expanded ? 'bg-cyan-500/20' : ''}`}>
          <svg 
            size={12} 
            className={`text-gray-400 transition-transform duration-300 ${expanded ? 'text-cyan-400 rotate-180' : ''}`} 
            viewBox="0 0 256 256" 
            fill="currentColor"
          >
            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z" />
          </svg>
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-3 pt-0">
          {children}
        </div>
      </div>
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

// Effect Toggle Component
interface EffectToggleProps {
  label: string
  enabled: boolean
  onToggle: () => void
}

function EffectToggle({ label, enabled, onToggle }: EffectToggleProps) {
  return (
    <Group justify="space-between">
      <Text size="xs" c="dimmed">{label}</Text>
      <ActionIcon
        size="sm"
        variant={enabled ? 'filled' : 'subtle'}
        color={enabled ? 'cyan' : 'gray'}
        onClick={onToggle}
      >
        <Eye size={14} />
      </ActionIcon>
    </Group>
  )
}

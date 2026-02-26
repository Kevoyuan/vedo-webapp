import { useEffect, useCallback, useState, useMemo } from 'react'
import {
  Modal,
  Text,
  Group,
  Kbd,
  Stack,
  TextInput,
  ScrollArea,
  Highlight,
  ActionIcon,
  Badge,
  Divider
} from '@mantine/core'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlass,
  ArrowCounterClockwise,
  ArrowClockwise,
  Eye,
  EyeSlash,
  Trash,
  DownloadSimple,
  UploadSimple,
  SquaresFour,
  Sun,
  Palette,
  Camera,
  ArrowsOut,
  Rotate,
  Scissors,
  Cubes,
  Waveform,
  ChartLine,
  Split,
  Merge,
  Ruler,
  DotsThree,
  CaretRight,
  X,
  Gear,
  List,
  Keyboard
} from '@phosphor-icons/react'

// ============================================================================
// Types
// ============================================================================

type ShortcutKeyHandler = (e: KeyboardEvent) => void

export interface Shortcut {
  key: string
  handler: ShortcutKeyHandler
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  description?: string
  category?: string
  action?: string
}

export interface ShortcutItem {
  key: string
  description: string
  category: string
  action?: string
}

// ============================================================================
// Keyboard Shortcuts Hook
// ============================================================================

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs (except certain keys)
    const target = e.target as HTMLElement
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable

    // Allow some shortcuts even in inputs
    const allowedInInput = e.key === 'Escape' || e.key === 'Enter'
    
    if (isInput && !allowedInInput) {
      // Check if it's a navigation shortcut (arrow keys, etc.)
      const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown']
      if (!navKeys.includes(e.key)) {
        return
      }
    }

    for (const shortcut of shortcuts) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase() || 
                       e.key === shortcut.key // Handle special keys like '?'
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey)
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
      const altMatch = shortcut.alt ? e.altKey : !e.altKey

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault()
        shortcut.handler(e)
        break
      }
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// ============================================================================
// Default Shortcuts Catalog
// ============================================================================

export const defaultShortcuts: ShortcutItem[] = [
  // General
  { key: '?', description: 'Show keyboard shortcuts', category: 'General', action: 'show-shortcuts' },
  { key: 'Ctrl+K', description: 'Open command palette', category: 'General', action: 'command-palette' },
  { key: 'Escape', description: 'Close modal / Cancel', category: 'General', action: 'close-modal' },
  
  // File Operations
  { key: 'Ctrl+O', description: 'Open file browser', category: 'File', action: 'open-file' },
  { key: 'Ctrl+S', description: 'Save / Export mesh', category: 'File', action: 'save-file' },
  { key: 'Ctrl+Z', description: 'Undo last action', category: 'File', action: 'undo' },
  { key: 'Ctrl+Shift+Z', description: 'Redo last action', category: 'File', action: 'redo' },
  { key: 'Ctrl+Y', description: 'Redo last action', category: 'File', action: 'redo' },
  
  // View Modes
  { key: '1', description: 'Rotate mode', category: 'Transform', action: 'rotate-mode' },
  { key: '2', description: 'Scale mode', category: 'Transform', action: 'scale-mode' },
  { key: '3', description: 'Translate mode', category: 'Transform', action: 'translate-mode' },
  
  // Camera Presets
  { key: '5', description: 'Free camera', category: 'Camera', action: 'camera-free' },
  { key: '6', description: 'Top view', category: 'Camera', action: 'camera-top' },
  { key: '7', description: 'Front view', category: 'Camera', action: 'camera-front' },
  { key: '8', description: 'Side view', category: 'Camera', action: 'camera-side' },
  { key: '9', description: 'Isometric view', category: 'Camera', action: 'camera-iso' },
  
  // View Options
  { key: 'Space', description: 'Toggle sidebar', category: 'View', action: 'toggle-sidebar' },
  { key: 'H', description: 'Toggle history panel', category: 'View', action: 'toggle-history' },
  { key: 'G', description: 'Toggle grid', category: 'View', action: 'toggle-grid' },
  { key: 'A', description: 'Toggle axes', category: 'View', action: 'toggle-axes' },
  
  // Mesh Operations
  { key: 'Delete', description: 'Delete selected mesh', category: 'Mesh', action: 'delete-mesh' },
  { key: 'F', description: 'Fill mesh holes', category: 'Mesh', action: 'fill-holes' },
  { key: 'S', description: 'Smooth mesh', category: 'Mesh', action: 'smooth-mesh' },
  { key: 'D', description: 'Decimate mesh', category: 'Mesh', action: 'decimate-mesh' },
  { key: 'L', description: 'Split mesh', category: 'Mesh', action: 'split-mesh' },
  { key: 'M', description: 'Merge meshes', category: 'Mesh', action: 'merge-mesh' },
  
  // Display
  { key: 'W', description: 'Toggle wireframe', category: 'Display', action: 'toggle-wireframe' },
  { key: 'X', description: 'Toggle X-Ray mode', category: 'Display', action: 'toggle-xray' },
  { key: '+', description: 'Zoom in', category: 'Display', action: 'zoom-in' },
  { key: '-', description: 'Zoom out', category: 'Display', action: 'zoom-out' },
  { key: '0', description: 'Reset camera', category: 'Display', action: 'reset-camera' },
  
  // Analysis
  { key: 'Q', description: 'Quality analysis', category: 'Analysis', action: 'quality-analysis' },
  { key: 'C', description: 'Curvature analysis', category: 'Analysis', action: 'curvature-analysis' },
]

// Group shortcuts by category
export const groupedShortcuts = defaultShortcuts.reduce((acc, shortcut) => {
  if (!acc[shortcut.category]) {
    acc[shortcut.category] = []
  }
  acc[shortcut.category].push(shortcut)
  return acc
}, {} as Record<string, ShortcutItem[]>)

// ============================================================================
// Keyboard Shortcuts Modal
// ============================================================================

interface KeyboardShortcutsModalProps {
  opened: boolean
  onClose: () => void
}

export function KeyboardShortcutsModal({ opened, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Keyboard size={20} className="text-cyan-400" />
          <span className="text-lg font-semibold">Keyboard Shortcuts</span>
        </Group>
      }
      centered
      size="lg"
      overlayProps={{
        backgroundOpacity: 0.7,
        blur: 3,
      }}
      styles={{
        content: {
          background: 'rgba(20, 20, 22, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        },
        header: {
          background: 'transparent',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        },
        title: {
          color: '#f4f4f5',
        },
        close: {
          color: '#71717a',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.05)',
          }
        },
        body: {
          padding: '16px',
        }
      }}
    >
      <ScrollArea h={400}>
        <Stack gap="lg">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <Text size="xs" fw={600} c="dimmed" mb="xs" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                {category}
              </Text>
              <Stack gap={2}>
                <AnimatePresence>
                  {shortcuts.map((shortcut, index) => (
                    <motion.div
                      key={shortcut.key + shortcut.description}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Group 
                        justify="space-between" 
                        py="xs" 
                        px="sm" 
                        className="hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Text size="sm" c="dimmed">{shortcut.description}</Text>
                        <Kbd 
                          size="sm"
                          styles={{
                            root: {
                              background: 'rgba(0, 0, 0, 0.4)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#a1a1aa',
                              fontFamily: 'Geist, monospace',
                            }
                          }}
                        >
                          {shortcut.key}
                        </Kbd>
                      </Group>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Stack>
            </div>
          ))}
        </Stack>
      </ScrollArea>
      
      <Divider my="md" color="white/5" />
      
      <Group justify="center" gap="xl">
        <Group gap="xs">
          <Text size="xs" c="dimmed">Toggle shortcuts</Text>
          <Kbd size="xs">?</Kbd>
        </Group>
        <Group gap="xs">
          <Text size="xs" c="dimmed">Command palette</Text>
          <Kbd size="xs">Ctrl+K</Kbd>
        </Group>
      </Group>
    </Modal>
  )
}

// ============================================================================
// Command Palette
// ============================================================================

interface Command {
  id: string
  label: string
  description?: string
  shortcut?: string
  category: string
  action: () => void
  icon?: React.ReactNode
}

interface CommandPaletteProps {
  opened: boolean
  onClose: () => void
  commands: Command[]
}

export function CommandPalette({ opened, onClose, commands }: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands
    const searchLower = search.toLowerCase()
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.category.toLowerCase().includes(searchLower)
    )
  }, [commands, search])

  // Group commands by category
  const groupedCommands = useMemo(() => {
    return filteredCommands.reduce((acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = []
      }
      acc[cmd.category].push(cmd)
      return acc
    }, {} as Record<string, Command[]>)
  }, [filteredCommands])

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
          onClose()
          setSearch('')
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        setSearch('')
        break
    }
  }, [filteredCommands, selectedIndex, onClose])

  // Get flat index from grouped
  const getFlatIndex = useCallback((category: string, indexInCategory: number) => {
    let flatIndex = 0
    for (const cat of Object.keys(groupedCommands)) {
      if (cat === category) {
        return flatIndex + indexInCategory
      }
      flatIndex += groupedCommands[cat].length
    }
    return 0
  }, [groupedCommands])

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="lg"
      withCloseButton={false}
      padding={0}
      overlayProps={{
        backgroundOpacity: 0.7,
        blur: 3,
      }}
      styles={{
        content: {
          background: 'rgba(20, 20, 22, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        },
        body: {
          padding: 0,
        }
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Search Input */}
      <div className="p-4 border-b border-white/5">
        <Group gap="sm">
          <MagnifyingGlass size={20} className="text-gray-500" />
          <TextInput
            placeholder="Type a command or search..."
            variant="unstyled"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            styles={{
              input: {
                background: 'transparent',
                color: '#f4f4f5',
                fontSize: '16px',
                '&::placeholder': {
                  color: '#71717a',
                }
              }
            }}
            autoFocus
          />
          <ActionIcon 
            variant="subtle" 
            color="gray" 
            size="sm"
            onClick={onClose}
          >
            <X size={14} />
          </ActionIcon>
        </Group>
      </div>

      {/* Commands List */}
      <ScrollArea h={350}>
        {filteredCommands.length === 0 ? (
          <div className="p-8 text-center">
            <Text c="dimmed" size="sm">No commands found</Text>
          </div>
        ) : (
          <Stack gap="md" p="md">
            {Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <Text size="xs" fw={600} c="dimmed" mb="xs" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                  {category}
                </Text>
                <Stack gap={2}>
                  {cmds.map((cmd, idx) => {
                    const flatIdx = getFlatIndex(category, idx)
                    const isSelected = flatIdx === selectedIndex
                    return (
                      <motion.div
                        key={cmd.id}
                        onClick={() => {
                          cmd.action()
                          onClose()
                          setSearch('')
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`
                          flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all
                          ${isSelected 
                            ? 'bg-cyan-500/20 border border-cyan-500/30' 
                            : 'hover:bg-white/5 border border-transparent'
                          }
                        `}
                      >
                        <Group gap="sm">
                          {cmd.icon && <span className="text-cyan-400">{cmd.icon}</span>}
                          <div>
                            <Text size="sm" fw={500} c={isSelected ? 'cyan' : 'white'}>
                              {cmd.label}
                            </Text>
                            {cmd.description && (
                              <Text size="xs" c="dimmed">{cmd.description}</Text>
                            )}
                          </div>
                        </Group>
                        {cmd.shortcut && (
                          <Group gap={4}>
                            {cmd.shortcut.split('+').map((key, i) => (
                              <Kbd 
                                key={i}
                                size="xs"
                                styles={{
                                  root: {
                                    background: 'rgba(0, 0, 0, 0.4)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: '#a1a1aa',
                                    padding: '2px 6px',
                                    fontSize: '10px',
                                  }
                                }}
                              >
                                {key}
                              </Kbd>
                            ))}
                          </Group>
                        )}
                      </motion.div>
                    )
                  })}
                </Stack>
              </div>
            ))}
          </Stack>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 bg-black/20">
        <Group gap="xl" justify="center">
          <Group gap={4}>
            <Kbd size="xs" style={{ background: 'rgba(255,255,255,0.1)' }}>↑↓</Kbd>
            <Text size="xs" c="dimmed">Navigate</Text>
          </Group>
          <Group gap={4}>
            <Kbd size="xs" style={{ background: 'rgba(255,255,255,0.1)' }}>Enter</Kbd>
            <Text size="xs" c="dimmed">Select</Text>
          </Group>
          <Group gap={4}>
            <Kbd size="xs" style={{ background: 'rgba(255,255,255,0.1)' }}>Esc</Kbd>
            <Text size="xs" c="dimmed">Close</Text>
          </Group>
        </Group>
      </div>
    </Modal>
  )
}

// Export both components
export default KeyboardShortcutsModal

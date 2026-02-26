import { ActionIcon, Tooltip, Text, Group, ScrollArea, Badge, Stack, Button, Divider } from '@mantine/core'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowClockwise, ArrowCounterClockwise, Trash, History } from '@phosphor-icons/react'
import { HistoryEntry, OPERATION_LABELS, OperationType } from '../hooks/useHistory'

interface HistoryPanelProps {
  history: HistoryEntry[]
  currentIndex: number
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  isOpen: boolean
  onToggle: () => void
}

// Operation type badge colors
const OPERATION_COLORS: Record<OperationType, string> = {
  import: 'cyan',
  rotate: 'blue',
  scale: 'violet',
  translate: 'indigo',
  fill_holes: 'green',
  smooth: 'grape',
  decimate: 'orange',
  slice: 'cyan',
  boolean: 'pink',
  split: 'violet',
  extract_largest: 'cyan',
  curvature: 'yellow',
  quality: 'teal',
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function HistoryPanel({
  history,
  currentIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  isOpen,
  onToggle,
}: HistoryPanelProps) {
  if (!isOpen) {
    return (
      <Tooltip label="History" position="left">
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={onToggle}
          className="transition-all duration-200 hover:bg-white/5"
        >
          <History size={20} />
        </ActionIcon>
      </Tooltip>
    )
  }

  return (
    <div className="glass-light rounded-xl p-4 animate-scale-in">
      {/* Header */}
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <History size={18} className="text-cyan-400" />
          <Text size="sm" fw={600}>History</Text>
          <Badge size="xs" variant="dot" color="gray">
            {history.length}/{50}
          </Badge>
        </Group>
        <Group gap={4}>
          <Tooltip label="Undo (Ctrl+Z)">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="transition-all duration-200 hover:bg-white/5 disabled:opacity-30"
            >
              <ArrowCounterClockwise size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Redo (Ctrl+Shift+Z)">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="transition-all duration-200 hover:bg-white/5 disabled:opacity-30"
            >
              <ArrowClockwise size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Clear history">
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              onClick={onClear}
              disabled={history.length === 0}
              className="transition-all duration-200 hover:bg-red-500/10 disabled:opacity-30"
            >
              <Trash size={16} />
            </ActionIcon>
          </Tooltip>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={onToggle}
            className="ml-1"
          >
            <span className="text-xs">✕</span>
          </ActionIcon>
        </Group>
      </Group>

      {/* History List */}
      <ScrollArea h={200} offsetScrollbars>
        <Stack gap={4}>
          <AnimatePresence mode="popLayout">
            {history.length === 0 ? (
              <Text size="xs" c="dimmed" ta="center" py="lg">
                No operations yet
              </Text>
            ) : (
              history.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                >
                  <Group
                    gap="xs"
                    py={6}
                    px={8}
                    className={`rounded-lg transition-colors ${
                      index === currentIndex
                        ? 'bg-cyan-500/10 border border-cyan-500/20'
                        : index > currentIndex
                        ? 'opacity-40'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <Badge
                      size="xs"
                      variant="light"
                      color={OPERATION_COLORS[entry.operation]}
                      className="font-normal"
                    >
                      {OPERATION_LABELS[entry.operation]}
                    </Badge>
                    <Text size="xs" c="dimmed" className="flex-1 truncate">
                      {entry.description || `${entry.meshData.n_points} pts`}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatTime(entry.timestamp)}
                    </Text>
                  </Group>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </Stack>
      </ScrollArea>

      {/* Keyboard shortcuts hint */}
      <Divider my="sm" color="white/5" />
      <Group gap="xs" justify="center">
        <Text size="xs" c="dimmed">
          <kbd className="px-1 py-0.5 bg-white/5 rounded text-[10px]">Ctrl+Z</kbd> Undo
        </Text>
        <Text size="xs" c="dimmed">
          <kbd className="px-1 py-0.5 bg-white/5 rounded text-[10px]">Ctrl+Shift+Z</kbd> Redo
        </Text>
      </Group>
    </div>
  )
}

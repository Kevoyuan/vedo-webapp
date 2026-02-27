import { Modal, Text, Group, Kbd, Stack } from '@mantine/core'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface ShortcutItem {
  key: string
  description: string
}

const shortcuts: ShortcutItem[] = [
  { key: 'O', description: 'Open file browser' },
  { key: 'R', description: 'Retry last action' },
  { key: '1', description: 'Activate rotate mode' },
  { key: '2', description: 'Activate scale mode' },
  { key: '+', description: 'Zoom in' },
  { key: '-', description: 'Zoom out' },
  { key: 'F', description: 'Fill mesh holes' },
  { key: 'S', description: 'Smooth mesh' },
  { key: 'D', description: 'Decimate mesh' },
  { key: 'Esc', description: 'Close modal / Cancel' },
]

interface KeyboardShortcutsModalProps {
  opened: boolean
  onClose: () => void
}

export default function KeyboardShortcutsModal({ opened, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <span className="text-lg font-semibold">Keyboard Shortcuts</span>
        </Group>
      }
      centered
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
        }
      }}
    >
      <Stack gap="xs">
        <AnimatePresence>
          {shortcuts.map((shortcut, index) => (
            <div
              key={shortcut.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Group justify="space-between" py="xs" px="sm" className="hover:bg-white/5 rounded-lg transition-colors">
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
            </div>
          ))}
        </AnimatePresence>
      </Stack>
      
      <Text size="xs" c="dimmed" mt="md" ta="center">
        Press <Kbd size="xs">?</Kbd> anytime to toggle this panel
      </Text>
    </Modal>
  )
}

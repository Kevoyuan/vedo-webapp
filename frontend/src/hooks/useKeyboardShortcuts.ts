import { useEffect, useCallback } from 'react'

type KeyHandler = (e: KeyboardEvent) => void

interface Shortcut {
  key: string
  handler: KeyHandler
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description?: string
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    for (const shortcut of shortcuts) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true
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

export const defaultShortcuts = [
  { key: 'r', description: 'Retry last action' },
  { key: 'o', description: 'Open file' },
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: '1', description: 'Rotate mode' },
  { key: '2', description: 'Scale mode' },
  { key: '+', description: 'Zoom in' },
  { key: '-', description: 'Zoom out' },
  { key: 'Escape', description: 'Cancel / Close' },
]

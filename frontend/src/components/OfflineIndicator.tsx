import { motion, AnimatePresence } from 'framer-motion'
import { WifiSlash, ArrowsClockwise } from '@phosphor-icons/react'
import { Button } from '@mantine/core'

interface OfflineIndicatorProps {
  isOnline: boolean
  wasOffline: boolean
  onRetry?: () => void
}

export default function OfflineIndicator({ isOnline, wasOffline, onRetry }: OfflineIndicatorProps) {
  // Only show if we were offline (toast-like behavior)
  if (isOnline && !wasOffline) return null
  
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="glass border border-amber-500/30 bg-amber-500/10 backdrop-blur-xl rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl">
            <div className="relative">
              <WifiSlash size={20} className="text-amber-400" />
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-amber-400/30 rounded-full"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-200">You're offline</p>
              <p className="text-xs text-amber-300/70">Some features may be unavailable</p>
            </div>
            {onRetry && (
              <Button
                size="xs"
                variant="subtle"
                color="yellow"
                leftSection={<ArrowsClockwise size={14} />}
                onClick={onRetry}
                className="ml-2"
              >
                Retry
              </Button>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Show "Back online" notification briefly when connection is restored */}
      {isOnline && wasOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="glass border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-sm text-emerald-200">Back online</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

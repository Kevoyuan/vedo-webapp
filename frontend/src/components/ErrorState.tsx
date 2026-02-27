import { Button } from '@mantine/core'
import { ArrowsClockwise, WarningCircle, WifiSlash } from '@phosphor-icons/react'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  type?: 'error' | 'network'
}

export default function ErrorState({ 
  title = 'Something went wrong', 
  message, 
  onRetry,
  type = 'error'
}: ErrorStateProps) {
  const Icon = type === 'network' ? WifiSlash : WarningCircle
  
  return (
    <div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 flex items-center justify-center bg-[#0a0a0b]/90 backdrop-blur-sm z-20"
    >
      <div className="text-center max-w-sm px-6">
        <div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="relative w-20 h-20 mx-auto mb-5"
        >
          <div className="absolute inset-0 rounded-2xl bg-red-500/10 border border-red-500/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon size={32} weight="duotone" className="text-red-400" />
          </div>
          {/* Animated ring */}
          <div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl border border-red-400/30"
          />
        </div>
        
        <h3 className="text-lg font-medium text-gray-200 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        
        {onRetry && (
          <div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              variant="subtle"
              leftSection={<ArrowsClockwise size={16} />}
              onClick={onRetry}
              className="transition-all duration-200 hover:scale-[1.02]"
              styles={{
                root: {
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  '&:hover': {
                    background: 'rgba(239, 68, 68, 0.2)',
                  }
                }
              }}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Keyboard shortcut hint */}
        <p className="mt-4 text-xs text-gray-600">
          Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-gray-500">R</kbd> to retry
        </p>
      </div>
    </div>
  )
}

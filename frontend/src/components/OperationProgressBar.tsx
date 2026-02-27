import { Loader } from '@mantine/core'
import { AnimatePresence, motion } from 'framer-motion'

interface OperationProgressBarProps {
  progress: number
  message: string
  status?: 'started' | 'completed' | 'failed'
  onCancel?: () => void
}

export default function OperationProgressBar({ 
  progress, 
  message, 
  status = 'started',
  onCancel 
}: OperationProgressBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'from-emerald-500 to-emerald-400'
      case 'failed':
        return 'from-red-500 to-red-400'
      default:
        return 'from-cyan-500 to-cyan-400'
    }
  }

  const getStatusBorderColor = () => {
    switch (status) {
      case 'completed':
        return 'border-emerald-500/30'
      case 'failed':
        return 'border-red-500/30'
      default:
        return 'border-cyan-500/30'
    }
  }

  return (
    <div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`glass rounded-lg border ${getStatusBorderColor()} p-3 mb-3 overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {status === 'started' ? (
            <Loader size={14} color="cyan" />
          ) : status === 'completed' ? (
            <div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          ) : (
            <div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3 3L7 7M7 3L3 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          )}
          <span className="text-xs text-gray-300">{message}</span>
        </div>
        {status === 'started' && onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getStatusColor()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      
      {/* Percentage */}
      <div className="flex justify-end mt-1">
        <span className="text-[10px] text-gray-500">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

// Container for multiple operations
interface OperationProgressListProps {
  operations: Array<{
    id: string
    progress: number
    message: string
    status: 'started' | 'completed' | 'failed'
  }>
  onCancel?: (id: string) => void
}

export function OperationProgressList({ operations, onCancel }: OperationProgressListProps) {
  // Filter to show only active or recent operations
  const visibleOperations = operations.filter(
    op => op.status === 'started' || (op.status === 'completed' && op.progress < 100) || op.status === 'failed'
  )

  if (visibleOperations.length === 0) return null

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {visibleOperations.map((op) => (
          <OperationProgressBar
            key={op.id}
            progress={op.progress}
            message={op.message}
            status={op.status}
            onCancel={onCancel ? () => onCancel(op.id) : undefined}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

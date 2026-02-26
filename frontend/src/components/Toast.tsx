import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Warning, Info, X } from '@phosphor-icons/react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

const icons = {
  success: <CheckCircle size={20} weight="fill" className="text-emerald-400" />,
  error: <XCircle size={20} weight="fill" className="text-red-400" />,
  warning: <Warning size={20} weight="fill" className="text-amber-400" />,
  info: <Info size={20} weight="fill" className="text-cyan-400" />,
}

const colors = {
  success: 'border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_20px_rgba(52,211,153,0.1)]',
  error: 'border-red-500/20 bg-red-500/5 shadow-[0_0_20px_rgba(248,113,113,0.1)]',
  warning: 'border-amber-500/20 bg-amber-500/5 shadow-[0_0_20px_rgba(251,191,36,0.1)]',
  info: 'border-cyan-500/20 bg-cyan-500/5 shadow-[0_0_20px_rgba(34,211,238,0.1)]',
}

const iconBg = {
  success: 'bg-emerald-500/10',
  error: 'bg-red-500/10',
  warning: 'bg-amber-500/10',
  info: 'bg-cyan-500/10',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, type, message, duration }])
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95, x: 100 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`
                flex items-center gap-3 px-4 py-3.5 rounded-2xl border backdrop-blur-xl
                min-w-[300px] max-w-[420px] shadow-2xl pointer-events-auto
                ${colors[toast.type]}
              `}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg[toast.type]}`}>
                {icons[toast.type]}
              </div>
              <p className="flex-1 text-sm text-gray-200 font-medium leading-tight">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-gray-500 hover:text-gray-300 transition-all duration-200"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

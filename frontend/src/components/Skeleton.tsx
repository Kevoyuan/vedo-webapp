import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`skeleton-premium rounded-lg ${className}`} />
  )
}

// Loading skeleton for the file uploader area
export function FileUploaderSkeleton() {
  return (
    <div className="glass-card p-6">
      <div className="flex flex-col items-center">
        <div className="relative mb-4">
          <Skeleton className="w-16 h-16 rounded-2xl" />
          <div className="absolute inset-0 rounded-2xl bg-cyan-500/5 animate-pulse" />
        </div>
        <Skeleton className="w-36 h-5 mb-2" />
        <Skeleton className="w-28 h-4 mb-4" />
        <Skeleton className="w-32 h-10 rounded-xl" />
        <Skeleton className="w-full h-1.5 mt-4 rounded-full" />
        <div className="mt-5 pt-4 border-t border-white/5 w-full">
          <Skeleton className="w-24 h-3 mx-auto mb-3" />
          <div className="flex flex-wrap justify-center gap-2">
            {['STL', 'OBJ', 'VTK', 'PLY', '3DS'].map((ext) => (
              <Skeleton key={ext} className="w-10 h-6 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading skeleton for mesh info card
export function MeshInfoSkeleton() {
  return (
    <div className="glass-card p-5">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-20 h-5" />
        </div>
        <Skeleton className="w-16 h-6 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <Skeleton className="w-10 h-10 rounded-xl mb-2" />
            <Skeleton className="w-16 h-3 mb-1" />
            <Skeleton className="w-20 h-5" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Loading skeleton for toolbar
export function ToolbarSkeleton() {
  return (
    <div className="glass-card p-4">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="w-20 h-5" />
        <Skeleton className="w-36 h-8 rounded-xl" />
      </div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="w-10 h-10 rounded-xl" />
        ))}
      </div>
      <Skeleton className="w-full h-px my-3" />
      <Skeleton className="w-16 h-4 mb-3" />
      <div className="flex gap-2">
        <Skeleton className="w-20 h-7 rounded-lg" />
        <Skeleton className="w-16 h-7 rounded-lg" />
        <Skeleton className="w-18 h-7 rounded-lg" />
      </div>
    </div>
  )
}

// Loading skeleton for 3D viewer
export function ViewerSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0b]">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="relative w-20 h-20 mx-auto mb-5"
        >
          <div className="absolute inset-0 border-2 border-cyan-500/10 rounded-2xl" />
          <div className="absolute inset-0 border-2 border-transparent border-t-cyan-400 rounded-2xl" />
          <div className="absolute inset-2 border border-cyan-500/20 rounded-xl" />
        </motion.div>
        <Skeleton className="w-40 h-5 mx-auto mb-2" />
        <Skeleton className="w-32 h-4 mx-auto" />
      </div>
    </div>
  )
}

import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-shimmer rounded-lg ${className}`} />
  )
}

// Loading skeleton for the file uploader area
export function FileUploaderSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-[#111113] p-6">
      <div className="flex flex-col items-center">
        <Skeleton className="w-14 h-14 mb-4 rounded-xl" />
        <Skeleton className="w-32 h-4 mb-2" />
        <Skeleton className="w-24 h-3 mb-4" />
        <Skeleton className="w-28 h-8 rounded-lg" />
        <Skeleton className="w-full h-1 mt-4 rounded-full" />
        <div className="mt-5 pt-4 border-t border-white/5 w-full">
          <Skeleton className="w-20 h-3 mx-auto mb-2" />
          <div className="flex flex-wrap justify-center gap-1.5">
            {['STL', 'OBJ', 'VTK', 'PLY', '3DS'].map((ext) => (
              <Skeleton key={ext} className="w-8 h-5 rounded" />
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
    <div className="glass-light rounded-xl p-5">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-16 h-4" />
        </div>
        <Skeleton className="w-14 h-5 rounded-full" />
      </div>
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="w-16 h-3 mb-1" />
              <Skeleton className="w-24 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Loading skeleton for toolbar
export function ToolbarSkeleton() {
  return (
    <div className="glass-light rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="w-16 h-4" />
        <Skeleton className="w-32 h-6 rounded-md" />
      </div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="w-9 h-9 rounded-lg" />
        ))}
      </div>
      <Skeleton className="w-full h-px my-3" />
      <Skeleton className="w-12 h-4 mb-3" />
      <div className="flex gap-2">
        <Skeleton className="w-16 h-6 rounded-md" />
        <Skeleton className="w-14 h-6 rounded-md" />
        <Skeleton className="w-16 h-6 rounded-md" />
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
          className="relative w-16 h-16 mx-auto mb-4"
        >
          <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-xl" />
          <div className="absolute inset-0 border-2 border-transparent border-t-cyan-400 rounded-xl" />
        </motion.div>
        <Skeleton className="w-32 h-4 mx-auto mb-2" />
        <Skeleton className="w-24 h-3 mx-auto" />
      </div>
    </div>
  )
}

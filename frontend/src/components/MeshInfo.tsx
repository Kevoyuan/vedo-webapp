import { memo, useMemo } from 'react'
import { Cube, Polygon, Ruler, Waves } from '@phosphor-icons/react'
import type { MeshData } from '../types'

interface Props {
  data: MeshData
}

interface StatItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
  accent?: boolean
}

/**
 * Individual stat item component - memoized for performance
 */
const StatItem = memo(function StatItem({ icon, label, value, accent }: StatItemProps) {
  return (
    <div className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-400/20 transition-all duration-300 hover:bg-white/[0.03]">
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
        ${accent 
          ? 'bg-cyan-500/10 text-cyan-400 shadow-glow-sm' 
          : 'bg-white/[0.03] text-gray-500 group-hover:bg-white/[0.05] group-hover:text-gray-400'
        }
      `}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5 transition-colors duration-300 group-hover:text-gray-400">
          {label}
        </p>
        <p className="text-sm font-semibold text-gray-200 truncate">
          {value}
        </p>
      </div>
    </div>
  )
})

StatItem.displayName = 'StatItem'

/**
 * Format large numbers to human-readable format (e.g., 1.2K, 3.5M)
 */
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

/**
 * MeshInfo Component
 * Displays mesh statistics and metadata
 * Optimized with memoization to prevent unnecessary re-renders
 */
function MeshInfoComponent({ data }: Props) {
  // Memoize formatted values to avoid recalculation
  const stats = useMemo(() => ({
    vertices: formatNumber(data.n_points || 0),
    faces: formatNumber(data.n_cells || 0),
    volume: data.volume ? `${data.volume.toFixed(2)} units³` : null,
    area: data.area ? `${data.area.toFixed(2)} units²` : null,
    bounds: data.bounds ? [
      data.bounds[0], // x_min
      data.bounds[2], // y_min
      data.bounds[4], // z_min
    ] : null,
  }), [data])

  return (
    <div className="glass-card p-5 animate-scale-in">
      {/* Header with accent */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/20 flex items-center justify-center shadow-glow-sm">
            <Cube size={20} weight="duotone" className="text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-200">Mesh Info</p>
            <p className="text-xs text-gray-500">{data.filename || 'Untitled'}</p>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <p className="text-[10px] font-medium text-cyan-400 uppercase tracking-wider">
            {data.type || 'Loaded'}
          </p>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatItem 
          icon={<Cube size={16} weight="duotone" />}
          label="Vertices"
          value={stats.vertices}
          accent
        />
        
        <StatItem 
          icon={<Polygon size={16} weight="duotone" />}
          label="Faces"
          value={stats.faces}
        />
        
        {stats.volume && (
          <StatItem 
            icon={<Waves size={16} weight="duotone" />}
            label="Volume"
            value={stats.volume}
            accent
          />
        )}
        
        {stats.area && (
          <StatItem 
            icon={<Ruler size={16} weight="duotone" />}
            label="Surface Area"
            value={stats.area}
          />
        )}
      </div>

      {stats.bounds && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-xs text-gray-500 mb-3 font-medium">Bounding Box</p>
          <div className="flex gap-2">
            {['X', 'Y', 'Z'].map((axis, i) => (
              <div 
                key={axis}
                className="flex-1 px-3 py-2.5 bg-white/[0.02] rounded-xl border border-white/5 hover:border-cyan-400/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-gray-500 uppercase">{axis}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-cyan-400/60' : i === 1 ? 'bg-purple-400/60' : 'bg-emerald-400/60'}`} />
                </div>
                <p className="text-sm font-semibold text-gray-200">
                  {stats.bounds[i]?.toFixed(2) || '0.00'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
const MeshInfo = memo(MeshInfoComponent, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id &&
    prevProps.data.n_points === nextProps.data.n_points &&
    prevProps.data.n_cells === nextProps.data.n_cells
})

MeshInfo.displayName = 'MeshInfo'

export default MeshInfo

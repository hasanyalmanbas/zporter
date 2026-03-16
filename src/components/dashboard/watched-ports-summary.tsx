import { cn } from '@/lib/utils'
import type { WatchedPort } from '@/types'

interface WatchedPortsSummaryProps {
  watchedPorts: WatchedPort[]
  onNavigateToMonitor: () => void
}

export function WatchedPortsSummary({ watchedPorts, onNavigateToMonitor }: WatchedPortsSummaryProps) {
  if (watchedPorts.length === 0) return null
  return (
    <div className="bg-card border border-border rounded-md p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-muted-fg text-[9px] uppercase tracking-wider">Watched Ports</div>
        <button onClick={onNavigateToMonitor} className="text-muted-fg text-[10px] hover:text-fg">View all →</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {watchedPorts.map(wp => (
          <div key={wp.port} className={cn(
            'bg-muted border border-border rounded p-2',
            wp.status === 'active' ? 'border-l-[3px] border-l-status-active' : 'border-l-[3px] border-l-status-down'
          )}>
            <div className="flex items-center justify-between">
              <span className="text-fg font-semibold">:{wp.port}</span>
              <span className={cn('text-[9px] px-1 rounded', wp.status === 'active' ? 'text-status-active bg-status-active/15' : 'text-status-down bg-status-down/15')}>
                ● {wp.status.toUpperCase()}
              </span>
            </div>
            {wp.portInfo && (
              <div className="text-muted-fg text-[10px] mt-1">
                {wp.portInfo.source} · PID {wp.portInfo.pid}
                {wp.stats && ` · ${wp.stats.cpu_percent.toFixed(1)}% CPU`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

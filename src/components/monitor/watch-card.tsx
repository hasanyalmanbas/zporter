import { cn } from '@/lib/utils'
import { SourceBadge } from '@/components/scanner/source-badge'
import type { WatchedPort } from '@/types'

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
}

function formatUptime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

interface WatchCardProps {
  watched: WatchedPort
  onKill: (pid: number, force: boolean) => void
  onUnwatch: (port: number) => void
}

export function WatchCard({ watched, onKill, onUnwatch }: WatchCardProps) {
  const isActive = watched.status === 'active'
  return (
    <div className={cn('bg-card border border-border rounded-md p-3', isActive ? 'border-l-[3px] border-l-status-active' : 'border-l-[3px] border-l-status-down')}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-fg font-bold text-base">:{watched.port}</span>
          <span className={cn('text-[9px] px-1.5 py-0.5 rounded', isActive ? 'text-status-active bg-status-active/15' : 'text-status-down bg-status-down/15')}>
            &#x25CF; {isActive ? 'ACTIVE' : 'DOWN'}
          </span>
          {watched.portInfo && <SourceBadge source={watched.portInfo.source} />}
        </div>
        <div className="flex gap-1">
          {isActive && watched.portInfo && (
            <>
              <button onClick={() => onKill(watched.portInfo!.pid, false)} className="text-muted-fg border border-border px-2 py-1 rounded text-[10px]">&#x23FB; Stop</button>
              <button onClick={() => onKill(watched.portInfo!.pid, true)} className="text-destructive border border-border px-2 py-1 rounded text-[10px]">&#x2715; Kill</button>
            </>
          )}
          <button onClick={() => onUnwatch(watched.port)} className="text-muted-fg border border-border px-2 py-1 rounded text-[10px]">&#x2014; Unwatch</button>
        </div>
      </div>
      {isActive && watched.stats ? (
        <div className="grid grid-cols-4 gap-3 text-[10px]">
          <div><span className="text-muted-fg">PID</span><br /><span className="text-source-node">{watched.stats.pid}</span></div>
          <div><span className="text-muted-fg">CPU</span><br /><span className="text-fg">{watched.stats.cpu_percent.toFixed(1)}%</span></div>
          <div><span className="text-muted-fg">Memory</span><br /><span className="text-fg">{formatBytes(watched.stats.memory_bytes)}</span></div>
          <div><span className="text-muted-fg">Uptime</span><br /><span className="text-fg">{formatUptime(watched.stats.uptime_secs)}</span></div>
        </div>
      ) : !isActive ? (
        <div className="text-muted-fg text-[10px]">
          Last seen: {watched.lastSeen ? new Date(watched.lastSeen).toLocaleString() : 'unknown'}
          {watched.lastPid && <> · Last PID: <span className="text-source-node">{watched.lastPid}</span></>}
        </div>
      ) : null}
    </div>
  )
}

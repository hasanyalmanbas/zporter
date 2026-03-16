import type { HistoryEntry } from '@/types'

const DOT_COLORS: Record<string, string> = {
  kill: 'text-destructive', force_kill: 'text-destructive',
  scan: 'text-accent', scan_all: 'text-accent',
}
const ACTION_LABELS: Record<string, string> = {
  kill: 'Killed', force_kill: 'Force killed', scan: 'Scanned', scan_all: 'Scanned all',
}

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function RecentActivity({ entries }: { entries: HistoryEntry[] }) {
  const recent = entries.slice(0, 5)
  return (
    <div className="bg-card border border-border rounded-md p-3">
      <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">Recent Activity</div>
      {recent.length === 0 ? (
        <div className="text-muted-fg text-[10px]">No activity yet</div>
      ) : (
        <div className="space-y-1.5">
          {recent.map(e => (
            <div key={e.id} className="flex items-center gap-2 text-[11px]">
              <span className={`text-[8px] ${DOT_COLORS[e.action]}`}>●</span>
              <span className="text-fg">{ACTION_LABELS[e.action]}</span>
              {e.ports.length > 0 && <span className="text-accent">:{e.ports[0]}</span>}
              {e.processName && <span className="text-muted-fg">{e.processName}</span>}
              <span className="ml-auto text-muted-fg text-[10px]">{relativeTime(e.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

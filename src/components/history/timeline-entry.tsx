import type { HistoryEntry } from '@/types'

const DOT_COLORS: Record<string, string> = {
  kill: 'bg-destructive',
  force_kill: 'bg-destructive',
  scan: 'bg-accent',
  scan_all: 'bg-accent',
}

const ACTION_LABELS: Record<string, string> = {
  kill: 'Killed',
  force_kill: 'Force killed',
  scan: 'Scanned',
  scan_all: 'Scanned all ports',
}

export function TimelineEntry({ entry }: { entry: HistoryEntry }) {
  const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="relative ml-1.5 pl-4 pb-3">
      <div className={`absolute left-0 top-1.5 w-2 h-2 rounded-full border-2 border-bg ${DOT_COLORS[entry.action] || 'bg-muted-fg'}`} />
      <div className="flex items-center gap-1.5">
        <span className="text-fg font-semibold text-xs">{ACTION_LABELS[entry.action]}</span>
        {entry.ports.length > 0 && (
          <span className="text-accent text-xs">:{entry.ports.join(', :')}</span>
        )}
        <span className="ml-auto text-muted-fg text-[10px]">{time}</span>
      </div>
      {(entry.pid || entry.processName) && (
        <div className="text-muted-fg text-[10px] mt-0.5">
          {entry.pid && <>PID <span className="text-source-node">{entry.pid}</span></>}
          {entry.pid && entry.processName && ' · '}
          {entry.processName && <span className="text-fg">{entry.processName}</span>}
        </div>
      )}
    </div>
  )
}

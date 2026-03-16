import { useState, useMemo } from 'react'
import { useHistory } from '@/hooks/use-history'
import { TimelineEntry } from '@/components/history/timeline-entry'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

type HistoryFilter = 'all' | 'kills' | 'scans'

function groupByDay(entries: { timestamp: number; id: string }[]): Map<string, typeof entries> {
  const groups = new Map<string, typeof entries>()
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  for (const entry of entries) {
    const date = new Date(entry.timestamp).toDateString()
    const label = date === today ? 'Today' : date === yesterday ? 'Yesterday' : date
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(entry)
  }
  return groups
}

export function HistoryPage() {
  const { entries, clearHistory } = useHistory()
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [confirmClear, setConfirmClear] = useState(false)

  const filtered = useMemo(() => {
    if (filter === 'all') return entries
    if (filter === 'kills') return entries.filter(e => e.action === 'kill' || e.action === 'force_kill')
    return entries.filter(e => e.action === 'scan' || e.action === 'scan_all')
  }, [entries, filter])

  const grouped = useMemo(() => groupByDay(filtered), [filtered])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/80">
        <span className="text-fg text-xs font-semibold">History</span>
        <span className="flex-1" />
        {(['all', 'kills', 'scans'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn(
            'px-2 py-0.5 rounded text-[10px]',
            filter === f ? 'text-accent bg-accent/15' : 'text-muted-fg'
          )}>{f === 'all' ? 'All' : f === 'kills' ? 'Kills' : 'Scans'}</button>
        ))}
        <span className="text-border">│</span>
        <button onClick={() => setConfirmClear(true)} className="text-muted-fg text-[10px] hover:text-fg">Clear</button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-fg text-xs">No history yet</div>
        ) : (
          Array.from(grouped.entries()).map(([label, items]) => (
            <div key={label} className="mb-4">
              <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">{label}</div>
              <div className="border-l border-border">
                {items.map(entry => <TimelineEntry key={entry.id} entry={entry as any} />)}
              </div>
            </div>
          ))
        )}
      </div>
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Clear History</DialogTitle>
            <DialogDescription className="text-xs">Remove all history entries? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setConfirmClear(false)} className="text-muted-fg border border-border px-3 py-1.5 rounded text-xs">Cancel</button>
            <button onClick={() => { clearHistory(); setConfirmClear(false) }} className="bg-destructive text-white px-3 py-1.5 rounded text-xs">Clear</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useState } from 'react'
import { WatchCard } from '@/components/monitor/watch-card'
import { PollingIndicator } from '@/components/monitor/polling-indicator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { invoke } from '@tauri-apps/api/core'
import type { Settings, WatchedPort, HistoryEntry } from '@/types'

interface MonitorPageProps {
  settings: Settings
  watchedPorts: WatchedPort[]
  onAddToWatchlist: (port: number) => void
  onRemoveFromWatchlist: (port: number) => void
  onAddHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
}

export function MonitorPage({ settings, watchedPorts, onAddToWatchlist, onRemoveFromWatchlist, onAddHistoryEntry }: MonitorPageProps) {
  const [showAddPort, setShowAddPort] = useState(false)
  const [newPort, setNewPort] = useState('')

  const handleKill = async (pid: number, force: boolean) => {
    const wp = watchedPorts.find(w => w.portInfo?.pid === pid)
    await invoke('kill_process', { pid, force })
    onAddHistoryEntry({
      action: force ? 'force_kill' : 'kill',
      ports: wp ? [wp.port] : [],
      pid,
      processName: wp?.portInfo?.process_name,
    })
  }
  const handleAddPort = () => {
    const port = parseInt(newPort)
    if (!isNaN(port) && port >= 1 && port <= 65535) { onAddToWatchlist(port); setNewPort(''); setShowAddPort(false) }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/80">
        <span className="text-fg text-xs font-semibold">Watchlist</span>
        <span className="text-muted-fg text-[10px]">{watchedPorts.length} ports</span>
        <span className="flex-1" />
        <PollingIndicator interval={settings.pollingInterval} />
        <button onClick={() => setShowAddPort(true)} className="bg-muted border border-input-border text-fg px-2.5 py-1 rounded-md text-[10px]">+ Add Port</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {watchedPorts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-fg text-xs">No ports being watched. Click "+ Add Port" to start monitoring.</div>
        ) : (
          watchedPorts.map(wp => (<WatchCard key={wp.port} watched={wp} onKill={handleKill} onUnwatch={onRemoveFromWatchlist} />))
        )}
      </div>
      <Dialog open={showAddPort} onOpenChange={setShowAddPort}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Add Port to Watch</DialogTitle></DialogHeader>
          <input value={newPort} onChange={e => setNewPort(e.target.value)} placeholder="Port number" type="number" className="w-full bg-muted border border-input-border rounded-md px-2.5 py-1.5 text-xs text-fg outline-none mt-2" />
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={() => setShowAddPort(false)} className="text-muted-fg border border-border px-3 py-1.5 rounded text-xs">Cancel</button>
            <button onClick={handleAddPort} className="bg-accent text-accent-fg px-3 py-1.5 rounded text-xs">Watch</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

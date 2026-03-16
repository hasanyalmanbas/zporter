import { useState, useMemo, useCallback } from 'react'
import { usePorts } from '@/hooks/use-ports'
import { SearchBar } from '@/components/scanner/search-bar'
import { FilterBar } from '@/components/scanner/filter-bar'
import { ProcessTable } from '@/components/scanner/process-table'
import { ProcessCard } from '@/components/scanner/process-card'
import { BatchActionBar } from '@/components/scanner/batch-action-bar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'
import type { PortInfo, Settings, HistoryEntry } from '@/types'

interface ScannerPageProps {
  settings: Settings
  onAddHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
}

export function ScannerPage({ settings, onAddHistoryEntry }: ScannerPageProps) {
  const { portData, loading, scanPorts, scanAllPorts, killProcess } = usePorts()
  const [protocolFilter, setProtocolFilter] = useState<'all' | 'tcp' | 'udp'>('all')
  const [selectedPids, setSelectedPids] = useState<Set<number>>(new Set())
  const [confirmDialog, setConfirmDialog] = useState<{ pid: number; force: boolean; name: string } | null>(null)
  const [detailItem, setDetailItem] = useState<PortInfo | null>(null)

  const filtered = useMemo(() => {
    if (protocolFilter === 'all') return portData
    return portData.filter(p => p.protocol === protocolFilter)
  }, [portData, protocolFilter])

  const toggleSelect = useCallback((pid: number) => {
    setSelectedPids(prev => {
      const next = new Set(prev)
      next.has(pid) ? next.delete(pid) : next.add(pid)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedPids(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(p => p.pid)))
  }, [filtered])

  const doKill = useCallback(async (pid: number, force: boolean) => {
    const item = portData.find(p => p.pid === pid)
    await killProcess(pid, force)
    onAddHistoryEntry({
      action: force ? 'force_kill' : 'kill',
      ports: item ? [item.port] : [],
      pid,
      processName: item?.process_name,
    })
  }, [portData, killProcess, onAddHistoryEntry])

  const handleKill = useCallback((pid: number, force: boolean) => {
    if (settings.confirmBeforeKill) {
      const item = portData.find(p => p.pid === pid)
      setConfirmDialog({ pid, force, name: item?.process_name || `PID ${pid}` })
    } else {
      doKill(pid, force)
    }
  }, [portData, settings.confirmBeforeKill, doKill])

  const confirmKill = useCallback(async () => {
    if (!confirmDialog) return
    await doKill(confirmDialog.pid, confirmDialog.force)
    setConfirmDialog(null)
  }, [confirmDialog, doKill])

  const handleKillSelected = useCallback(() => {
    const force = settings.defaultKillMode === 'force'
    selectedPids.forEach(pid => doKill(pid, force))
    setSelectedPids(new Set())
  }, [selectedPids, settings.defaultKillMode, doKill])

  return (
    <div className="flex flex-col h-full">
      <SearchBar onScan={scanPorts} onScanAll={scanAllPorts} loading={loading} />
      {filtered.length > 0 && (
        <FilterBar resultCount={filtered.length} protocolFilter={protocolFilter} onProtocolChange={setProtocolFilter} />
      )}
      <ProcessTable data={filtered} selectedPids={selectedPids} onToggleSelect={toggleSelect} onToggleAll={toggleAll} onKill={handleKill} onDetails={setDetailItem} />
      <div className="lg:hidden flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.map(item => (
          <ProcessCard key={`${item.port}-${item.pid}`} item={item} onKill={handleKill} />
        ))}
      </div>
      {filtered.length === 0 && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-fg space-y-2">
            <p className="text-sm">No processes found</p>
            <p className="text-[10px]">Enter port numbers above and click Scan</p>
          </div>
        </div>
      )}
      <BatchActionBar selectedCount={selectedPids.size} totalCount={filtered.length} onKillSelected={handleKillSelected} />
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-accent" />
              Confirm {confirmDialog?.force ? 'Force' : 'Graceful'} Kill
            </DialogTitle>
            <DialogDescription className="text-xs">
              Kill <strong>{confirmDialog?.name}</strong> (PID {confirmDialog?.pid})?
              {confirmDialog?.force && ' This will force terminate without cleanup.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setConfirmDialog(null)} className="text-muted-fg border border-border px-3 py-1.5 rounded text-xs">Cancel</button>
            <button onClick={confirmKill} className="bg-destructive text-white px-3 py-1.5 rounded text-xs">Kill</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

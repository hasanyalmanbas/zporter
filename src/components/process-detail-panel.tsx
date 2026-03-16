import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { cn } from '@/lib/utils'
import { SourceBadge } from '@/components/scanner/source-badge'
import type { PortInfo, ProcessStats } from '@/types'

interface ProcessDetailPanelProps {
  item: PortInfo | null
  onClose: () => void
  onKill: (pid: number, force: boolean) => void
  onFavorite?: (port: number) => void
  onWatch?: (port: number) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
}

function formatUptime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
}

export function ProcessDetailPanel({ item, onClose, onKill, onFavorite, onWatch }: ProcessDetailPanelProps) {
  const [stats, setStats] = useState<ProcessStats | null>(null)

  useEffect(() => {
    if (!item) { setStats(null); return }
    const fetchStats = async () => {
      try {
        const result: ProcessStats = await invoke('get_process_stats', { pid: item.pid })
        setStats(result)
      } catch { setStats(null) }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 3000)
    return () => clearInterval(interval)
  }, [item?.pid])

  if (!item) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 lg:relative lg:inset-auto lg:bg-transparent" onClick={onClose} />
      <div className={cn(
        'fixed right-0 top-0 bottom-0 w-full sm:w-80 bg-card border-l border-border z-50 flex flex-col overflow-y-auto',
        'lg:relative lg:right-auto lg:top-auto lg:bottom-auto lg:z-auto'
      )}>
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-accent font-bold text-base">:{item.port}</span>
            <span className="text-status-active text-[9px] bg-status-active/15 px-1.5 py-0.5 rounded">● ACTIVE</span>
          </div>
          <button onClick={onClose} className="text-muted-fg hover:text-fg text-sm">✕</button>
        </div>
        <div className="flex gap-1.5 px-3.5 py-2.5 border-b border-border">
          <button onClick={() => onKill(item.pid, false)} className="flex-1 bg-muted border border-input-border text-fg py-1.5 rounded text-[10px] text-center">⏻ Stop</button>
          <button onClick={() => onKill(item.pid, true)} className="flex-1 bg-destructive/15 border border-destructive/30 text-destructive py-1.5 rounded text-[10px] text-center">✕ Kill</button>
          <button onClick={() => onFavorite?.(item.port)} className="flex-1 bg-muted border border-input-border text-fg py-1.5 rounded text-[10px] text-center">★ Fav</button>
          <button onClick={() => onWatch?.(item.port)} className="flex-1 bg-muted border border-input-border text-fg py-1.5 rounded text-[10px] text-center">◎ Watch</button>
        </div>
        <div className="px-3.5 py-2.5 border-b border-border">
          <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">Process Info</div>
          <div className="grid grid-cols-[80px_1fr] gap-1 text-[11px]">
            <span className="text-muted-fg">PID</span><span className="text-source-node">{item.pid}</span>
            <span className="text-muted-fg">User</span><span className="text-fg">{item.user}</span>
            <span className="text-muted-fg">Protocol</span><span className="text-fg">{item.protocol.toUpperCase()}</span>
            <span className="text-muted-fg">Source</span><SourceBadge source={item.source} />
            <span className="text-muted-fg">Status</span><span className="text-status-active">Running</span>
          </div>
        </div>
        {stats && (
          <div className="px-3.5 py-2.5 border-b border-border">
            <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">Resources</div>
            <div className="grid grid-cols-[80px_1fr] gap-1.5 text-[11px]">
              <span className="text-muted-fg">CPU</span>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1 bg-border rounded overflow-hidden"><div className="h-full bg-accent rounded" style={{ width: `${Math.min(stats.cpu_percent, 100)}%` }} /></div>
                <span className="text-fg text-[10px]">{stats.cpu_percent.toFixed(1)}%</span>
              </div>
              <span className="text-muted-fg">Memory</span>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1 bg-border rounded overflow-hidden"><div className="h-full bg-source-node rounded" style={{ width: `${Math.min((stats.memory_bytes / (1024 * 1024 * 256)) * 100, 100)}%` }} /></div>
                <span className="text-fg text-[10px]">{formatBytes(stats.memory_bytes)}</span>
              </div>
              <span className="text-muted-fg">Uptime</span><span className="text-fg">{formatUptime(stats.uptime_secs)}</span>
            </div>
          </div>
        )}
        <div className="px-3.5 py-2.5 border-b border-border">
          <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">Command</div>
          <div className="bg-bg border border-border rounded p-2 text-[10px] text-fg break-all leading-relaxed">{item.process_name}</div>
        </div>
        <div className="px-3.5 py-2.5 border-b border-border">
          <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">Executable</div>
          <div className="bg-bg border border-border rounded p-2 text-[10px] text-muted-fg break-all">{item.exe_path || 'N/A'}</div>
        </div>
        {item.remarks && (
          <div className="px-3.5 py-2.5">
            <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">Remarks</div>
            <div className="text-muted-fg text-[10px]">{item.remarks}</div>
          </div>
        )}
      </div>
    </>
  )
}

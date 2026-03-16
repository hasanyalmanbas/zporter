import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { StatCard } from '@/components/dashboard/stat-card'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { WatchedPortsSummary } from '@/components/dashboard/watched-ports-summary'
import type { PortInfo, HistoryEntry, QuickCommand, WatchedPort, Page } from '@/types'

interface DashboardPageProps {
  historyEntries: HistoryEntry[]
  quickCommands: QuickCommand[]
  watchedPorts: WatchedPort[]
  onNavigate: (page: Page) => void
  onExecuteCommand: (cmd: QuickCommand) => void
}

export function DashboardPage({ historyEntries, quickCommands, watchedPorts, onNavigate, onExecuteCommand }: DashboardPageProps) {
  const [activePorts, setActivePorts] = useState(0)
  const [totalProcesses, setTotalProcesses] = useState(0)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result: PortInfo[] = await invoke('list_all_ports')
        setTotalProcesses(result.length)
        setActivePorts(new Set(result.map(r => r.port)).size)
      } catch {}
    }
    fetchStats()
  }, [])

  const killedToday = historyEntries.filter(e => {
    const today = new Date().toDateString()
    return new Date(e.timestamp).toDateString() === today && (e.action === 'kill' || e.action === 'force_kill')
  }).length

  const watchingActive = watchedPorts.filter(w => w.status === 'active').length

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active Ports" value={activePorts} color="text-accent" />
        <StatCard label="Processes" value={totalProcesses} />
        <StatCard label="Watching" value={watchedPorts.length} color="text-status-active" subtitle={`${watchingActive} ok`} />
        <StatCard label="Killed Today" value={killedToday} color="text-destructive" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <QuickActions commands={quickCommands} onExecute={onExecuteCommand} />
        <RecentActivity entries={historyEntries} />
      </div>
      <WatchedPortsSummary watchedPorts={watchedPorts} onNavigateToMonitor={() => onNavigate('monitor')} />
    </div>
  )
}

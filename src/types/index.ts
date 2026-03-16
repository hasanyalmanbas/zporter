export interface PortInfo {
  port: number
  protocol: string
  pid: number
  process_name: string
  exe_path: string
  user: string
  source: string
  remarks: string
}

export interface KillResult {
  success: boolean
  message: string
}

export interface ProcessStats {
  pid: number
  cpu_percent: number
  memory_bytes: number
  uptime_secs: number
}

export type Page = 'dashboard' | 'scanner' | 'monitor' | 'favorites' | 'history' | 'settings'

export interface FavoritePort {
  port: number
  label: string
  groupId: string
}

export interface FavoriteGroup {
  id: string
  name: string
  ports: FavoritePort[]
}

export interface QuickCommand {
  id: string
  label: string
  action: 'kill' | 'scan'
  ports: number[]
}

export interface HistoryEntry {
  id: string
  action: 'kill' | 'force_kill' | 'scan' | 'scan_all'
  ports: number[]
  pid?: number
  processName?: string
  timestamp: number
}

export type ThemeMode = 'system' | 'light' | 'dark'
export type KillMode = 'graceful' | 'force'

export interface Settings {
  theme: ThemeMode
  compactMode: boolean
  confirmBeforeKill: boolean
  defaultKillMode: KillMode
  pollingInterval: 1 | 5 | 10 | 30
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  compactMode: false,
  confirmBeforeKill: true,
  defaultKillMode: 'graceful',
  pollingInterval: 5,
}

export interface WatchedPort {
  port: number
  status: 'active' | 'down'
  lastSeen?: number
  lastPid?: number
  stats?: ProcessStats
  portInfo?: PortInfo
}

# zPorter UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild zPorter's frontend into a production-ready, multi-page developer tool with consistent theming, sidebar navigation, and 5 pages.

**Architecture:** Full frontend rebuild keeping Tauri backend + shadcn/ui primitives. Monolithic App.tsx decomposed into ~35 focused files. State-based page routing, localStorage persistence, CSS variable theming with OS detection.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Radix UI, Lucide React, Tauri 2 (Rust backend)

**Spec:** `docs/superpowers/specs/2026-03-16-ui-redesign-design.md`

---

## Chunk 1: Foundation (Types, Theme, Settings, Layout Shell)

### Task 1: Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create shared TypeScript interfaces**

```typescript
// src/types/index.ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/hasanyalmanbas/Desktop/zporter && npx tsc --noEmit src/types/index.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add shared TypeScript interfaces for UI redesign"
```

---

### Task 2: Theme System (CSS + Hook)

**Files:**
- Modify: `src/index.css`
- Create: `src/hooks/use-theme.ts`

- [ ] **Step 1: Rewrite index.css with proper theme tokens**

Replace entire `src/index.css` with:

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: #fafafa;
  --foreground: #0f0f0f;
  --card: #ffffff;
  --card-foreground: #0f0f0f;
  --border: #e5e5e5;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --accent: #f59e0b;
  --accent-foreground: #000000;
  --destructive: #ef4444;
  --input-bg: #ffffff;
  --input-border: #d4d4d4;
  --hover: #f0f0f0;
}

.dark {
  --background: #0f0f0f;
  --foreground: #e5e5e5;
  --card: #161616;
  --card-foreground: #e5e5e5;
  --border: #2a2a2a;
  --muted: #1a1a1a;
  --muted-foreground: #666666;
  --accent: #f59e0b;
  --accent-foreground: #000000;
  --destructive: #ef4444;
  --input-bg: #1a1a1a;
  --input-border: #333333;
  --hover: #1e1e1e;
}

@theme inline {
  --color-bg: var(--background);
  --color-fg: var(--foreground);
  --color-card: var(--card);
  --color-card-fg: var(--card-foreground);
  --color-border: var(--border);
  --color-muted: var(--muted);
  --color-muted-fg: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-fg: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-input-bg: var(--input-bg);
  --color-input-border: var(--input-border);
  --color-hover: var(--hover);

  --color-source-docker: #a855f7;
  --color-source-node: #60a5fa;
  --color-source-brew: #22c55e;
  --color-source-systemd: #f59e0b;
  --color-source-launchd: #22d3ee;
  --color-source-unknown: #888888;

  --color-status-active: #22c55e;
  --color-status-down: #ef4444;
  --color-status-scanning: #f59e0b;

  --font-mono: ui-monospace, 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-bg text-fg font-mono text-xs antialiased;
  }
}
```

- [ ] **Step 2: Create use-theme hook**

```typescript
// src/hooks/use-theme.ts
import { useState, useEffect, useCallback } from 'react'
import type { ThemeMode } from '@/types'

const THEME_KEY = 'zporter-theme'

function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {}
  return 'system'
}

function getEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

function applyTheme(effective: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', effective === 'dark')
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(getStoredTheme)
  const [effective, setEffective] = useState<'light' | 'dark'>(() => getEffectiveTheme(getStoredTheme()))

  const setMode = useCallback((newMode: ThemeMode) => {
    try { localStorage.setItem(THEME_KEY, newMode) } catch {}
    setModeState(newMode)
    const eff = getEffectiveTheme(newMode)
    setEffective(eff)
    applyTheme(eff)
  }, [])

  useEffect(() => {
    applyTheme(effective)
  }, [effective])

  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const eff = getEffectiveTheme('system')
      setEffective(eff)
      applyTheme(eff)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  return { mode, effective, setMode }
}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/hasanyalmanbas/Desktop/zporter && npm run build`
Expected: Build succeeds (existing App.tsx still works with new CSS tokens)

- [ ] **Step 4: Commit**

```bash
git add src/index.css src/hooks/use-theme.ts
git commit -m "feat: add theme system with OS detection and CSS variable tokens"
```

---

### Task 3: Settings Hook

**Files:**
- Create: `src/hooks/use-settings.ts`

- [ ] **Step 1: Create settings hook with localStorage persistence**

```typescript
// src/hooks/use-settings.ts
import { useState, useCallback } from 'react'
import { DEFAULT_SETTINGS, type Settings } from '@/types'

const SETTINGS_KEY = 'zporter-settings'

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch {}
  return DEFAULT_SETTINGS
}

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(loadSettings)

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettingsState(prev => {
      const next = { ...prev, [key]: value }
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { settings, updateSetting }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-settings.ts
git commit -m "feat: add settings hook with localStorage persistence"
```

---

### Task 4: Layout Components (Sidebar, Bottom Nav, App Layout)

**Files:**
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/bottom-nav.tsx`
- Create: `src/components/layout/app-layout.tsx`

- [ ] **Step 1: Create sidebar component**

```typescript
// src/components/layout/sidebar.tsx
import { cn } from '@/lib/utils'
import type { Page } from '@/types'
import {
  LayoutDashboard, Search, Radio, Star, Clock, Settings
} from 'lucide-react'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

const NAV_ITEMS: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'scanner', label: 'Scanner', icon: Search },
  { page: 'monitor', label: 'Monitor', icon: Radio },
  { page: 'favorites', label: 'Favorites', icon: Star },
  { page: 'history', label: 'History', icon: Clock },
]

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden sm:flex w-[220px] lg:w-[220px] sm:w-[44px] flex-col bg-card border-r border-border h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 p-3 lg:px-3 sm:justify-center lg:justify-start">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center font-bold text-accent-fg text-xs shrink-0">
          Z
        </div>
        <span className="text-fg font-semibold text-sm hidden lg:block">zPorter</span>
        <span className="text-muted-fg text-[10px] ml-auto hidden lg:block">v1.0</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-1 space-y-0.5">
        <div className="text-muted-fg text-[9px] uppercase tracking-wider px-2 mb-1 hidden lg:block">
          Navigation
        </div>
        {NAV_ITEMS.map(({ page, label, icon: Icon }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] transition-colors',
              'sm:justify-center lg:justify-start',
              currentPage === page
                ? 'bg-accent/15 border border-accent/30 text-accent'
                : 'text-muted-fg hover:bg-hover hover:text-fg'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden lg:block">{label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => onNavigate('settings')}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-colors',
            'sm:justify-center lg:justify-start',
            currentPage === 'settings'
              ? 'bg-accent/15 border border-accent/30 text-accent'
              : 'text-muted-fg hover:bg-hover hover:text-fg'
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="hidden lg:block">Settings</span>
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create bottom nav for small screens**

```typescript
// src/components/layout/bottom-nav.tsx
import { cn } from '@/lib/utils'
import type { Page } from '@/types'
import {
  LayoutDashboard, Search, Radio, Star, MoreHorizontal
} from 'lucide-react'

interface BottomNavProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

const BOTTOM_ITEMS: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { page: 'scanner', label: 'Scan', icon: Search },
  { page: 'monitor', label: 'Monitor', icon: Radio },
  { page: 'favorites', label: 'Favs', icon: Star },
  { page: 'history', label: 'More', icon: MoreHorizontal },
]

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card flex justify-around py-2 z-50">
      {BOTTOM_ITEMS.map(({ page, label, icon: Icon }) => (
        <button
          key={page}
          onClick={() => onNavigate(page)}
          className={cn(
            'flex flex-col items-center gap-0.5 text-[9px]',
            currentPage === page ? 'text-accent' : 'text-muted-fg'
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </nav>
  )
}
```

- [ ] **Step 3: Create app layout shell**

```typescript
// src/components/layout/app-layout.tsx
import type { Page } from '@/types'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

interface AppLayoutProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  children: React.ReactNode
}

export function AppLayout({ currentPage, onNavigate, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="flex-1 overflow-y-auto pb-14 sm:pb-0">
        {children}
      </main>
      <BottomNav currentPage={currentPage} onNavigate={onNavigate} />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add sidebar, bottom nav, and app layout shell"
```

---

### Task 5: New App.tsx + Delete App.css

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/App.css`

- [ ] **Step 1: Replace App.tsx with layout shell + page router**

Replace entire `src/App.tsx` with:

```typescript
// src/App.tsx
import { useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/layout/app-layout'
import { useTheme } from '@/hooks/use-theme'
import { useSettings } from '@/hooks/use-settings'
import { ScannerPage } from '@/pages/scanner'
import type { Page } from '@/types'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('scanner')
  const theme = useTheme()
  const { settings, updateSetting } = useSettings()

  // Sync theme hook with settings
  if (settings.theme !== theme.mode) {
    theme.setMode(settings.theme)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'scanner':
        return <ScannerPage settings={settings} />
      case 'dashboard':
      case 'monitor':
      case 'favorites':
      case 'history':
        return (
          <div className="flex items-center justify-center h-full text-muted-fg">
            <p className="text-sm">{currentPage} — coming soon</p>
          </div>
        )
      case 'settings':
        return (
          <div className="flex items-center justify-center h-full text-muted-fg">
            <p className="text-sm">Settings — coming soon</p>
          </div>
        )
    }
  }

  return (
    <TooltipProvider>
      <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </AppLayout>
    </TooltipProvider>
  )
}
```

- [ ] **Step 2: Delete App.css**

```bash
rm src/App.css
```

- [ ] **Step 3: Remove App.css import from main.tsx if present**

Check `src/main.tsx` — it does NOT import App.css (only index.css), so no change needed.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/main.tsx
git rm src/App.css
git commit -m "feat: replace monolithic App.tsx with layout shell and page router"
```

---

### Task 6: Scanner Page (Port Existing Logic)

**Files:**
- Create: `src/pages/scanner.tsx`
- Create: `src/hooks/use-ports.ts`
- Create: `src/components/scanner/search-bar.tsx`
- Create: `src/components/scanner/filter-bar.tsx`
- Create: `src/components/scanner/source-badge.tsx`
- Create: `src/components/scanner/process-table.tsx`
- Create: `src/components/scanner/process-card.tsx`
- Create: `src/components/scanner/batch-action-bar.tsx`

- [ ] **Step 1: Create use-ports hook**

```typescript
// src/hooks/use-ports.ts
import { useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { PortInfo, KillResult } from '@/types'

function parsePortInput(input: string): number[] {
  const ports: number[] = []
  const parts = input.split(',').map(p => p.trim())
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(p => parseInt(p.trim()))
      if (!isNaN(start) && !isNaN(end) && start <= end && start >= 1 && end <= 65535) {
        for (let port = start; port <= end; port++) ports.push(port)
      }
    } else {
      const port = parseInt(part)
      if (!isNaN(port) && port >= 1 && port <= 65535) ports.push(port)
    }
  }
  return [...new Set(ports)].sort((a, b) => a - b)
}

export function usePorts() {
  const [portData, setPortData] = useState<PortInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scanPorts = useCallback(async (input: string) => {
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    try {
      const portNumbers = parsePortInput(input)
      if (portNumbers.length === 0) { setPortData([]); return }
      const result: PortInfo[] = await invoke('list_ports', {
        ports: portNumbers, onlyListening: true,
      })
      setPortData(result)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const scanAllPorts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result: PortInfo[] = await invoke('list_all_ports')
      setPortData(result)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const killProcess = useCallback(async (pid: number, force: boolean): Promise<KillResult> => {
    const result: KillResult = await invoke('kill_process', { pid, force })
    return result
  }, [])

  return { portData, loading, error, scanPorts, scanAllPorts, killProcess, setPortData }
}
```

- [ ] **Step 2: Create source-badge component**

```typescript
// src/components/scanner/source-badge.tsx
import { cn } from '@/lib/utils'

const SOURCE_COLORS: Record<string, string> = {
  docker: 'text-source-docker bg-source-docker/15',
  node: 'text-source-node bg-source-node/15',
  brew: 'text-source-brew bg-source-brew/15',
  systemd: 'text-source-systemd bg-source-systemd/15',
  launchd: 'text-source-launchd bg-source-launchd/15',
  unknown: 'text-source-unknown bg-source-unknown/15',
}

export function SourceBadge({ source }: { source: string }) {
  const colors = SOURCE_COLORS[source] || SOURCE_COLORS.unknown
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded', colors)}>
      {source}
    </span>
  )
}
```

- [ ] **Step 3: Create search-bar component**

```typescript
// src/components/scanner/search-bar.tsx
import { useState } from 'react'
import { Search, RefreshCw } from 'lucide-react'

interface SearchBarProps {
  onScan: (input: string) => void
  onScanAll: () => void
  loading: boolean
}

export function SearchBar({ onScan, onScanAll, loading }: SearchBarProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onScan(input)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card/80"
    >
      <Search className="w-4 h-4 text-muted-fg shrink-0" />
      <div className="flex-1 flex items-center bg-muted border border-input-border rounded-md px-2.5 py-1.5">
        <span className="text-muted-fg text-xs mr-1">ports:</span>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="3000, 5432, 8000-8100"
          className="flex-1 bg-transparent text-fg text-xs outline-none placeholder:text-muted-fg/50"
        />
        <span className="text-muted-fg text-[10px] border border-border px-1 rounded hidden sm:block">⏎</span>
      </div>
      <button
        type="submit"
        disabled={loading || !input.trim()}
        className="bg-accent text-accent-fg px-3 py-1.5 rounded-md font-semibold text-[11px] disabled:opacity-50 flex items-center gap-1.5"
      >
        {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
        Scan
      </button>
      <button
        type="button"
        onClick={onScanAll}
        disabled={loading}
        className="bg-muted border border-input-border text-fg px-3 py-1.5 rounded-md text-[11px] disabled:opacity-50"
      >
        All Ports
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Create filter-bar component**

```typescript
// src/components/scanner/filter-bar.tsx
import { cn } from '@/lib/utils'

interface FilterBarProps {
  resultCount: number
  protocolFilter: 'all' | 'tcp' | 'udp'
  onProtocolChange: (f: 'all' | 'tcp' | 'udp') => void
}

export function FilterBar({ resultCount, protocolFilter, onProtocolChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border bg-bg text-[11px]">
      <span className="text-accent font-semibold">{resultCount} results</span>
      <span className="text-border">│</span>
      <span className="text-muted-fg">Protocol:</span>
      {(['all', 'tcp', 'udp'] as const).map(p => (
        <button
          key={p}
          onClick={() => onProtocolChange(p)}
          className={cn(
            'px-1.5 py-0.5 rounded',
            protocolFilter === p
              ? 'text-accent bg-accent/15'
              : 'text-muted-fg hover:text-fg'
          )}
        >
          {p === 'all' ? 'All' : p.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Create process-table component (desktop)**

```typescript
// src/components/scanner/process-table.tsx
import { cn } from '@/lib/utils'
import type { PortInfo } from '@/types'
import { SourceBadge } from './source-badge'

interface ProcessTableProps {
  data: PortInfo[]
  selectedPids: Set<number>
  onToggleSelect: (pid: number) => void
  onToggleAll: () => void
  onKill: (pid: number, force: boolean) => void
  onDetails: (item: PortInfo) => void
}

export function ProcessTable({ data, selectedPids, onToggleSelect, onToggleAll, onKill, onDetails }: ProcessTableProps) {
  return (
    <div className="hidden lg:block flex-1 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center px-4 py-1.5 bg-card/50 border-b border-border text-[10px] uppercase tracking-wider text-muted-fg sticky top-0 z-10">
        <div className="w-6"><input type="checkbox" className="accent-accent" checked={selectedPids.size === data.length && data.length > 0} onChange={onToggleAll} /></div>
        <div className="w-16">Port</div>
        <div className="w-12">Proto</div>
        <div className="w-16">PID</div>
        <div className="flex-1">Command</div>
        <div className="w-20">User</div>
        <div className="w-20">Source</div>
        <div className="w-24 text-right">Actions</div>
      </div>
      {/* Rows */}
      {data.map(item => {
        const selected = selectedPids.has(item.pid)
        return (
          <div
            key={`${item.port}-${item.pid}-${item.protocol}`}
            className={cn(
              'flex items-center px-4 py-1 border-b border-border/50 text-xs hover:bg-hover transition-colors',
              selected && 'bg-accent/5 border-l-2 border-l-accent'
            )}
          >
            <div className="w-6"><input type="checkbox" className="accent-accent" checked={selected} onChange={() => onToggleSelect(item.pid)} /></div>
            <div className={cn('w-16 font-semibold', selected ? 'text-accent' : 'text-fg')}>{item.port}</div>
            <div className="w-12 text-muted-fg">{item.protocol.toUpperCase()}</div>
            <div className="w-16 text-source-node cursor-pointer">{item.pid}</div>
            <div className="flex-1 text-fg truncate">{item.process_name || item.exe_path}</div>
            <div className="w-20 text-muted-fg">{item.user}</div>
            <div className="w-20"><SourceBadge source={item.source} /></div>
            <div className="w-24 flex gap-1 justify-end">
              <button onClick={() => onKill(item.pid, false)} className="text-muted-fg border border-border px-1.5 py-0.5 rounded text-[10px] hover:text-fg">⏻</button>
              <button onClick={() => onKill(item.pid, true)} className="text-destructive border border-border px-1.5 py-0.5 rounded text-[10px] hover:text-destructive/80">✕</button>
              <button onClick={() => onDetails(item)} className="text-muted-fg border border-border px-1.5 py-0.5 rounded text-[10px] hover:text-fg">⋯</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 6: Create process-card component (mobile)**

```typescript
// src/components/scanner/process-card.tsx
import type { PortInfo } from '@/types'
import { SourceBadge } from './source-badge'

interface ProcessCardProps {
  item: PortInfo
  onKill: (pid: number, force: boolean) => void
}

export function ProcessCard({ item, onKill }: ProcessCardProps) {
  return (
    <div className="bg-card border border-border rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold text-sm">:{item.port}</span>
          <SourceBadge source={item.source} />
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => onKill(item.pid, false)} className="text-muted-fg border border-border px-2 py-1 rounded text-[10px]">⏻</button>
          <button onClick={() => onKill(item.pid, true)} className="text-destructive border border-border px-2 py-1 rounded text-[10px]">✕</button>
        </div>
      </div>
      <div className="text-[10px] text-muted-fg">
        PID <span className="text-source-node">{item.pid}</span> · <span className="text-fg">{item.process_name}</span>
      </div>
      <div className="text-[10px] text-muted-fg">
        user: {item.user} · {item.protocol.toUpperCase()}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create batch-action-bar component**

```typescript
// src/components/scanner/batch-action-bar.tsx
interface BatchActionBarProps {
  selectedCount: number
  totalCount: number
  onKillSelected: () => void
}

export function BatchActionBar({ selectedCount, totalCount, onKillSelected }: BatchActionBarProps) {
  if (selectedCount === 0) return null
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-card/80 text-[11px]">
      <span className="text-accent">{selectedCount} selected</span>
      <span className="text-border">│</span>
      <button onClick={onKillSelected} className="text-muted-fg border border-border px-2.5 py-1 rounded hover:text-fg">
        Kill Selected
      </button>
      <span className="flex-1" />
      <span className="text-muted-fg">Showing 1-{totalCount} of {totalCount}</span>
    </div>
  )
}
```

- [ ] **Step 8: Create scanner page**

```typescript
// src/pages/scanner.tsx
import { useState, useMemo, useCallback } from 'react'
import { usePorts } from '@/hooks/use-ports'
import { SearchBar } from '@/components/scanner/search-bar'
import { FilterBar } from '@/components/scanner/filter-bar'
import { ProcessTable } from '@/components/scanner/process-table'
import { ProcessCard } from '@/components/scanner/process-card'
import { BatchActionBar } from '@/components/scanner/batch-action-bar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'
import type { PortInfo, Settings } from '@/types'

interface ScannerPageProps {
  settings: Settings
}

export function ScannerPage({ settings }: ScannerPageProps) {
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
    setSelectedPids(prev =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map(p => p.pid))
    )
  }, [filtered])

  const handleKill = useCallback((pid: number, force: boolean) => {
    const item = portData.find(p => p.pid === pid)
    if (settings.confirmBeforeKill) {
      setConfirmDialog({ pid, force, name: item?.process_name || `PID ${pid}` })
    } else {
      killProcess(pid, force)
    }
  }, [portData, settings.confirmBeforeKill, killProcess])

  const confirmKill = useCallback(async () => {
    if (!confirmDialog) return
    await killProcess(confirmDialog.pid, confirmDialog.force)
    setConfirmDialog(null)
  }, [confirmDialog, killProcess])

  const handleKillSelected = useCallback(() => {
    const force = settings.defaultKillMode === 'force'
    selectedPids.forEach(pid => killProcess(pid, force))
    setSelectedPids(new Set())
  }, [selectedPids, settings.defaultKillMode, killProcess])

  return (
    <div className="flex flex-col h-full">
      <SearchBar onScan={scanPorts} onScanAll={scanAllPorts} loading={loading} />

      {filtered.length > 0 && (
        <FilterBar
          resultCount={filtered.length}
          protocolFilter={protocolFilter}
          onProtocolChange={setProtocolFilter}
        />
      )}

      {/* Desktop table */}
      <ProcessTable
        data={filtered}
        selectedPids={selectedPids}
        onToggleSelect={toggleSelect}
        onToggleAll={toggleAll}
        onKill={handleKill}
        onDetails={setDetailItem}
      />

      {/* Mobile cards */}
      <div className="lg:hidden flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.map(item => (
          <ProcessCard key={`${item.port}-${item.pid}`} item={item} onKill={handleKill} />
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-fg space-y-2">
            <p className="text-sm">No processes found</p>
            <p className="text-[10px]">Enter port numbers above and click Scan</p>
          </div>
        </div>
      )}

      <BatchActionBar
        selectedCount={selectedPids.size}
        totalCount={filtered.length}
        onKillSelected={handleKillSelected}
      />

      {/* Kill confirmation dialog */}
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
```

- [ ] **Step 9: Verify build**

Run: `cd /Users/hasanyalmanbas/Desktop/zporter && npm run build`
Expected: Build succeeds

- [ ] **Step 10: Commit**

```bash
git add src/pages/scanner.tsx src/hooks/use-ports.ts src/components/scanner/
git commit -m "feat: add scanner page with search, filters, table, and card views"
```

---

## Chunk 2: Backend Changes + Remaining Pages

### Task 7: Backend — get_process_stats + node detection

**Files:**
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Add ProcessStats struct and get_process_stats command**

In `src-tauri/src/lib.rs`, after the `KillResult` struct (line 21), add:

```rust
#[derive(Serialize, Deserialize)]
pub struct ProcessStats {
    pub pid: u32,
    pub cpu_percent: f32,
    pub memory_bytes: u64,
    pub uptime_secs: u64,
}
```

Before the `run()` function (line 429), add:

```rust
#[tauri::command]
async fn get_process_stats(pid: u32) -> Result<ProcessStats, String> {
    let mut system = System::new();
    system.refresh_processes(ProcessesToUpdate::All, true);

    if let Some(process) = system.process(Pid::from(pid as usize)) {
        Ok(ProcessStats {
            pid,
            cpu_percent: process.cpu_usage(),
            memory_bytes: process.memory(),
            uptime_secs: process.run_time(),
        })
    } else {
        Err(format!("Process with PID {} not found", pid))
    }
}
```

- [ ] **Step 2: Add node detection to detect_source_sync**

In the `detect_source_sync` function, add node detection before the final `else` branch. Change lines 240-243 from:

```rust
        } else if exe_path.contains("brew") {
            "brew".to_string()
        } else {
            "unknown".to_string()
```

to:

```rust
        } else if exe_path.contains("brew") {
            "brew".to_string()
        } else if exe_path.contains("node") || process.name().to_string_lossy().contains("node") {
            "node".to_string()
        } else {
            "unknown".to_string()
```

Do the same in the `detect_source` function (lines 419-422).

- [ ] **Step 3: Register get_process_stats in invoke_handler**

Change the invoke_handler (line 433-438) to include `get_process_stats`:

```rust
        .invoke_handler(tauri::generate_handler![
            list_ports,
            list_all_ports,
            kill_process,
            kill_by_port,
            detect_source,
            get_process_stats
        ])
```

- [ ] **Step 4: Verify Rust compiles**

Run: `cd /Users/hasanyalmanbas/Desktop/zporter && cd src-tauri && cargo check`
Expected: Compiles without errors

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat: add get_process_stats command and node detection in detect_source"
```

---

### Task 8: History Hook + Page

**Files:**
- Create: `src/hooks/use-history.ts`
- Create: `src/components/history/timeline-entry.tsx`
- Create: `src/pages/history.tsx`

- [ ] **Step 1: Create history hook**

```typescript
// src/hooks/use-history.ts
import { useState, useCallback } from 'react'
import type { HistoryEntry } from '@/types'

const HISTORY_KEY = 'zporter-history'
const MAX_ENTRIES = 500

function loadHistory(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

function saveHistory(entries: HistoryEntry[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES))) } catch {}
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(loadHistory)

  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    setEntries(prev => {
      const next = [{ ...entry, id: crypto.randomUUID(), timestamp: Date.now() }, ...prev].slice(0, MAX_ENTRIES)
      saveHistory(next)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setEntries([])
    try { localStorage.removeItem(HISTORY_KEY) } catch {}
  }, [])

  return { entries, addEntry, clearHistory }
}
```

- [ ] **Step 2: Create timeline-entry component**

```typescript
// src/components/history/timeline-entry.tsx
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
```

- [ ] **Step 3: Create history page**

```typescript
// src/pages/history.tsx
import { useState, useMemo } from 'react'
import { useHistory } from '@/hooks/use-history'
import { TimelineEntry } from '@/components/history/timeline-entry'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

type HistoryFilter = 'all' | 'kills' | 'scans'

function groupByDay(entries: { timestamp: number }[]): Map<string, typeof entries> {
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
      {/* Top bar */}
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

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-fg text-xs">No history yet</div>
        ) : (
          Array.from(grouped.entries()).map(([label, items]) => (
            <div key={label} className="mb-4">
              <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">{label}</div>
              <div className="border-l border-border">
                {items.map(entry => <TimelineEntry key={entry.id} entry={entry} />)}
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
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-history.ts src/components/history/ src/pages/history.tsx
git commit -m "feat: add history page with timeline view and localStorage persistence"
```

---

### Task 9: Favorites Hook + Page

**Files:**
- Create: `src/hooks/use-favorites.ts`
- Create: `src/components/favorites/favorite-card.tsx`
- Create: `src/components/favorites/favorite-group.tsx`
- Create: `src/components/favorites/quick-command.tsx`
- Create: `src/pages/favorites.tsx`

- [ ] **Step 1: Create favorites hook**

```typescript
// src/hooks/use-favorites.ts
import { useState, useCallback } from 'react'
import type { FavoriteGroup, FavoritePort, QuickCommand } from '@/types'

const FAVS_KEY = 'zporter-favorites'
const CMDS_KEY = 'zporter-quick-commands'

function loadGroups(): FavoriteGroup[] {
  try { const s = localStorage.getItem(FAVS_KEY); if (s) return JSON.parse(s) } catch {}
  return []
}

function loadCommands(): QuickCommand[] {
  try { const s = localStorage.getItem(CMDS_KEY); if (s) return JSON.parse(s) } catch {}
  return []
}

export function useFavorites() {
  const [groups, setGroups] = useState<FavoriteGroup[]>(loadGroups)
  const [commands, setCommands] = useState<QuickCommand[]>(loadCommands)

  const saveGroups = (g: FavoriteGroup[]) => {
    setGroups(g)
    try { localStorage.setItem(FAVS_KEY, JSON.stringify(g)) } catch {}
  }

  const addGroup = useCallback((name: string) => {
    saveGroups([...groups, { id: crypto.randomUUID(), name, ports: [] }])
  }, [groups])

  const removeGroup = useCallback((id: string) => {
    saveGroups(groups.filter(g => g.id !== id))
  }, [groups])

  const addPort = useCallback((groupId: string, port: FavoritePort) => {
    saveGroups(groups.map(g =>
      g.id === groupId ? { ...g, ports: [...g.ports, port] } : g
    ))
  }, [groups])

  const removePort = useCallback((groupId: string, port: number) => {
    saveGroups(groups.map(g =>
      g.id === groupId ? { ...g, ports: g.ports.filter(p => p.port !== port) } : g
    ))
  }, [groups])

  const addCommand = useCallback((cmd: Omit<QuickCommand, 'id'>) => {
    const next = [...commands, { ...cmd, id: crypto.randomUUID() }]
    setCommands(next)
    try { localStorage.setItem(CMDS_KEY, JSON.stringify(next)) } catch {}
  }, [commands])

  const removeCommand = useCallback((id: string) => {
    const next = commands.filter(c => c.id !== id)
    setCommands(next)
    try { localStorage.setItem(CMDS_KEY, JSON.stringify(next)) } catch {}
  }, [commands])

  return { groups, commands, addGroup, removeGroup, addPort, removePort, addCommand, removeCommand }
}
```

- [ ] **Step 2: Create favorite-card component**

```typescript
// src/components/favorites/favorite-card.tsx
import type { FavoritePort } from '@/types'

interface FavoriteCardProps {
  port: FavoritePort
  onScan: (port: number) => void
  onKill: (port: number) => void
  onRemove: (port: number) => void
}

export function FavoriteCard({ port, onScan, onKill, onRemove }: FavoriteCardProps) {
  return (
    <div className="bg-card border border-border rounded-md p-3 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold">:{port.port}</span>
          <span className="text-muted-fg text-[10px]">{port.label}</span>
        </div>
      </div>
      <div className="flex gap-1">
        <button onClick={() => onScan(port.port)} className="text-muted-fg border border-border px-2 py-1 rounded text-[10px] hover:text-fg">⌕</button>
        <button onClick={() => onKill(port.port)} className="text-destructive border border-border px-2 py-1 rounded text-[10px]">✕</button>
        <button onClick={() => onRemove(port.port)} className="text-muted-fg border border-border px-2 py-1 rounded text-[10px] hover:text-fg">—</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create favorite-group component**

```typescript
// src/components/favorites/favorite-group.tsx
import type { FavoriteGroup as FavoriteGroupType } from '@/types'
import { FavoriteCard } from './favorite-card'

interface FavoriteGroupProps {
  group: FavoriteGroupType
  onScan: (port: number) => void
  onKill: (port: number) => void
  onRemovePort: (groupId: string, port: number) => void
}

export function FavoriteGroup({ group, onScan, onKill, onRemovePort }: FavoriteGroupProps) {
  return (
    <div className="mb-4">
      <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">{group.name}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {group.ports.map(port => (
          <FavoriteCard
            key={port.port}
            port={port}
            onScan={onScan}
            onKill={onKill}
            onRemove={(p) => onRemovePort(group.id, p)}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create quick-command component**

```typescript
// src/components/favorites/quick-command.tsx
import type { QuickCommand as QuickCommandType } from '@/types'

interface QuickCommandProps {
  command: QuickCommandType
  onExecute: (cmd: QuickCommandType) => void
  onRemove: (id: string) => void
}

export function QuickCommand({ command, onExecute, onRemove }: QuickCommandProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-md">
      <button onClick={() => onExecute(command)} className="text-accent">▶</button>
      <span className="text-fg text-[11px]">{command.label}</span>
      <span className="ml-auto text-muted-fg text-[10px]">{command.ports.join(', ')}</span>
      <button onClick={() => onRemove(command.id)} className="text-muted-fg text-[10px] hover:text-fg">✕</button>
    </div>
  )
}
```

- [ ] **Step 5: Create favorites page**

```typescript
// src/pages/favorites.tsx
import { useState } from 'react'
import { useFavorites } from '@/hooks/use-favorites'
import { FavoriteGroup } from '@/components/favorites/favorite-group'
import { QuickCommand } from '@/components/favorites/quick-command'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { invoke } from '@tauri-apps/api/core'
import type { QuickCommand as QuickCommandType } from '@/types'

export function FavoritesPage() {
  const { groups, commands, addGroup, addPort, removePort, removeCommand } = useFavorites()
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [showAddPort, setShowAddPort] = useState<string | null>(null)
  const [newPort, setNewPort] = useState('')
  const [newPortLabel, setNewPortLabel] = useState('')

  const handleScan = async (port: number) => {
    await invoke('list_ports', { ports: [port], onlyListening: true })
  }

  const handleKill = async (port: number) => {
    await invoke('kill_by_port', { port, force: false })
  }

  const handleExecuteCommand = async (cmd: QuickCommandType) => {
    if (cmd.action === 'scan') {
      await invoke('list_ports', { ports: cmd.ports, onlyListening: true })
    } else {
      for (const port of cmd.ports) {
        await invoke('kill_by_port', { port, force: false })
      }
    }
  }

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim())
      setNewGroupName('')
      setShowAddGroup(false)
    }
  }

  const handleAddPort = () => {
    const portNum = parseInt(newPort)
    if (showAddPort && !isNaN(portNum) && portNum >= 1 && portNum <= 65535) {
      addPort(showAddPort, { port: portNum, label: newPortLabel || `Port ${portNum}`, groupId: showAddPort })
      setNewPort('')
      setNewPortLabel('')
      setShowAddPort(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/80">
        <span className="text-fg text-xs font-semibold">Favorites</span>
        <span className="flex-1" />
        <button onClick={() => setShowAddGroup(true)} className="bg-muted border border-input-border text-fg px-2.5 py-1 rounded-md text-[10px]">
          + Add Group
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {groups.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-fg text-xs">
            No favorites yet. Create a group to get started.
          </div>
        )}

        {groups.map(group => (
          <div key={group.id}>
            <FavoriteGroup group={group} onScan={handleScan} onKill={handleKill} onRemovePort={removePort} />
            <button onClick={() => setShowAddPort(group.id)} className="text-muted-fg text-[10px] hover:text-fg mb-4">
              + Add port to {group.name}
            </button>
          </div>
        ))}

        {commands.length > 0 && (
          <>
            <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2 mt-4">Quick Commands</div>
            <div className="space-y-1">
              {commands.map(cmd => (
                <QuickCommand key={cmd.id} command={cmd} onExecute={handleExecuteCommand} onRemove={removeCommand} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Group Dialog */}
      <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">New Group</DialogTitle></DialogHeader>
          <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group name" className="w-full bg-muted border border-input-border rounded-md px-2.5 py-1.5 text-xs text-fg outline-none mt-2" />
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={() => setShowAddGroup(false)} className="text-muted-fg border border-border px-3 py-1.5 rounded text-xs">Cancel</button>
            <button onClick={handleAddGroup} className="bg-accent text-accent-fg px-3 py-1.5 rounded text-xs">Create</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Port Dialog */}
      <Dialog open={!!showAddPort} onOpenChange={() => setShowAddPort(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Add Port</DialogTitle></DialogHeader>
          <div className="space-y-2 mt-2">
            <input value={newPort} onChange={e => setNewPort(e.target.value)} placeholder="Port number" type="number" className="w-full bg-muted border border-input-border rounded-md px-2.5 py-1.5 text-xs text-fg outline-none" />
            <input value={newPortLabel} onChange={e => setNewPortLabel(e.target.value)} placeholder="Label (optional)" className="w-full bg-muted border border-input-border rounded-md px-2.5 py-1.5 text-xs text-fg outline-none" />
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={() => setShowAddPort(null)} className="text-muted-fg border border-border px-3 py-1.5 rounded text-xs">Cancel</button>
            <button onClick={handleAddPort} className="bg-accent text-accent-fg px-3 py-1.5 rounded text-xs">Add</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/use-favorites.ts src/components/favorites/ src/pages/favorites.tsx
git commit -m "feat: add favorites page with groups, port cards, and quick commands"
```

---

### Task 10: Monitor Hook + Page

**Files:**
- Create: `src/hooks/use-monitor.ts`
- Create: `src/components/monitor/watch-card.tsx`
- Create: `src/components/monitor/polling-indicator.tsx`
- Create: `src/pages/monitor.tsx`

- [ ] **Step 1: Create monitor hook**

```typescript
// src/hooks/use-monitor.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { WatchedPort, PortInfo, ProcessStats } from '@/types'

const WATCH_KEY = 'zporter-watchlist'

function loadWatchlist(): number[] {
  try { const s = localStorage.getItem(WATCH_KEY); if (s) return JSON.parse(s) } catch {}
  return []
}

function saveWatchlist(ports: number[]) {
  try { localStorage.setItem(WATCH_KEY, JSON.stringify(ports)) } catch {}
}

export function useMonitor(pollingInterval: number) {
  const [watchedPorts, setWatchedPorts] = useState<WatchedPort[]>([])
  const [watchlist, setWatchlist] = useState<number[]>(loadWatchlist)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = useCallback(async () => {
    if (watchlist.length === 0) return
    try {
      const portInfos: PortInfo[] = await invoke('list_ports', { ports: watchlist, onlyListening: true })
      const activePorts = new Set(portInfos.map(p => p.port))

      const updated: WatchedPort[] = await Promise.all(
        watchlist.map(async (port) => {
          const info = portInfos.find(p => p.port === port)
          if (info) {
            let stats: ProcessStats | undefined
            try { stats = await invoke('get_process_stats', { pid: info.pid }) } catch {}
            return { port, status: 'active' as const, portInfo: info, stats, lastPid: info.pid }
          } else {
            const prev = watchedPorts.find(w => w.port === port)
            return {
              port, status: 'down' as const,
              lastSeen: prev?.status === 'active' ? Date.now() : prev?.lastSeen,
              lastPid: prev?.lastPid,
            }
          }
        })
      )
      setWatchedPorts(updated)
    } catch {}
  }, [watchlist, watchedPorts])

  useEffect(() => {
    poll()
    intervalRef.current = setInterval(poll, pollingInterval * 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [pollingInterval, watchlist])

  const addToWatchlist = useCallback((port: number) => {
    setWatchlist(prev => {
      if (prev.includes(port)) return prev
      const next = [...prev, port]
      saveWatchlist(next)
      return next
    })
  }, [])

  const removeFromWatchlist = useCallback((port: number) => {
    setWatchlist(prev => {
      const next = prev.filter(p => p !== port)
      saveWatchlist(next)
      return next
    })
    setWatchedPorts(prev => prev.filter(p => p.port !== port))
  }, [])

  return { watchedPorts, watchlist, addToWatchlist, removeFromWatchlist }
}
```

- [ ] **Step 2: Create polling-indicator component**

```typescript
// src/components/monitor/polling-indicator.tsx
export function PollingIndicator({ interval }: { interval: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-status-active animate-pulse" />
      <span className="text-muted-fg text-[10px]">Polling every {interval}s</span>
    </div>
  )
}
```

- [ ] **Step 3: Create watch-card component**

```typescript
// src/components/monitor/watch-card.tsx
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
    <div className={cn(
      'bg-card border border-border rounded-md p-3',
      isActive ? 'border-l-[3px] border-l-status-active' : 'border-l-[3px] border-l-status-down'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-fg font-bold text-base">:{watched.port}</span>
          <span className={cn(
            'text-[9px] px-1.5 py-0.5 rounded',
            isActive ? 'text-status-active bg-status-active/15' : 'text-status-down bg-status-down/15'
          )}>
            ● {isActive ? 'ACTIVE' : 'DOWN'}
          </span>
          {watched.portInfo && <SourceBadge source={watched.portInfo.source} />}
        </div>
        <div className="flex gap-1">
          {isActive && watched.portInfo && (
            <>
              <button onClick={() => onKill(watched.portInfo!.pid, false)} className="text-muted-fg border border-border px-2 py-1 rounded text-[10px]">⏻ Stop</button>
              <button onClick={() => onKill(watched.portInfo!.pid, true)} className="text-destructive border border-border px-2 py-1 rounded text-[10px]">✕ Kill</button>
            </>
          )}
          <button onClick={() => onUnwatch(watched.port)} className="text-muted-fg border border-border px-2 py-1 rounded text-[10px]">— Unwatch</button>
        </div>
      </div>

      {/* Stats */}
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
```

- [ ] **Step 4: Create monitor page**

```typescript
// src/pages/monitor.tsx
import { useState } from 'react'
import { useMonitor } from '@/hooks/use-monitor'
import { WatchCard } from '@/components/monitor/watch-card'
import { PollingIndicator } from '@/components/monitor/polling-indicator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { invoke } from '@tauri-apps/api/core'
import type { Settings } from '@/types'

interface MonitorPageProps {
  settings: Settings
}

export function MonitorPage({ settings }: MonitorPageProps) {
  const { watchedPorts, addToWatchlist, removeFromWatchlist } = useMonitor(settings.pollingInterval)
  const [showAddPort, setShowAddPort] = useState(false)
  const [newPort, setNewPort] = useState('')

  const handleKill = async (pid: number, force: boolean) => {
    await invoke('kill_process', { pid, force })
  }

  const handleAddPort = () => {
    const port = parseInt(newPort)
    if (!isNaN(port) && port >= 1 && port <= 65535) {
      addToWatchlist(port)
      setNewPort('')
      setShowAddPort(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/80">
        <span className="text-fg text-xs font-semibold">Watchlist</span>
        <span className="text-muted-fg text-[10px]">{watchedPorts.length} ports</span>
        <span className="flex-1" />
        <PollingIndicator interval={settings.pollingInterval} />
        <button onClick={() => setShowAddPort(true)} className="bg-muted border border-input-border text-fg px-2.5 py-1 rounded-md text-[10px]">
          + Add Port
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {watchedPorts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-fg text-xs">
            No ports being watched. Click "+ Add Port" to start monitoring.
          </div>
        ) : (
          watchedPorts.map(wp => (
            <WatchCard key={wp.port} watched={wp} onKill={handleKill} onUnwatch={removeFromWatchlist} />
          ))
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
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-monitor.ts src/components/monitor/ src/pages/monitor.tsx
git commit -m "feat: add monitor page with watchlist, polling, and live stats"
```

---

## Chunk 3: Dashboard, Settings, Process Detail, Final Wiring

### Task 11: Dashboard Page

**Files:**
- Create: `src/components/dashboard/stat-card.tsx`
- Create: `src/components/dashboard/recent-activity.tsx`
- Create: `src/components/dashboard/quick-actions.tsx`
- Create: `src/components/dashboard/watched-ports-summary.tsx`
- Create: `src/pages/dashboard.tsx`

- [ ] **Step 1: Create stat-card component**

```typescript
// src/components/dashboard/stat-card.tsx
interface StatCardProps {
  label: string
  value: number
  color?: string
  subtitle?: string
}

export function StatCard({ label, value, color = 'text-fg', subtitle }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-md p-3">
      <div className="text-muted-fg text-[9px] uppercase tracking-wider">{label}</div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className={`text-xl font-bold ${color}`}>{value}</span>
        {subtitle && <span className="text-status-active text-[10px]">{subtitle}</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create recent-activity component**

```typescript
// src/components/dashboard/recent-activity.tsx
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
```

- [ ] **Step 3: Create quick-actions component**

```typescript
// src/components/dashboard/quick-actions.tsx
import type { QuickCommand } from '@/types'

interface QuickActionsProps {
  commands: QuickCommand[]
  onExecute: (cmd: QuickCommand) => void
}

export function QuickActions({ commands, onExecute }: QuickActionsProps) {
  return (
    <div className="bg-card border border-border rounded-md p-3">
      <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">Quick Actions</div>
      {commands.length === 0 ? (
        <div className="text-muted-fg text-[10px]">Add favorites to see quick actions here</div>
      ) : (
        <div className="space-y-1">
          {commands.slice(0, 3).map(cmd => (
            <button key={cmd.id} onClick={() => onExecute(cmd)} className="w-full flex items-center gap-2 px-2 py-1.5 bg-muted rounded text-left hover:bg-hover">
              <span className="text-accent">⌕</span>
              <span className="text-fg text-[11px]">{cmd.label}</span>
              <span className="ml-auto text-muted-fg text-[9px]">{cmd.ports.join(', ')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create watched-ports-summary component**

```typescript
// src/components/dashboard/watched-ports-summary.tsx
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
```

- [ ] **Step 5: Create dashboard page**

```typescript
// src/pages/dashboard.tsx
import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { StatCard } from '@/components/dashboard/stat-card'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { WatchedPortsSummary } from '@/components/dashboard/watched-ports-summary'
import type { PortInfo, HistoryEntry, QuickCommand, WatchedPort } from '@/types'

interface DashboardPageProps {
  historyEntries: HistoryEntry[]
  quickCommands: QuickCommand[]
  watchedPorts: WatchedPort[]
  onNavigate: (page: 'monitor') => void
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
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active Ports" value={activePorts} color="text-accent" />
        <StatCard label="Processes" value={totalProcesses} />
        <StatCard label="Watching" value={watchedPorts.length} color="text-status-active" subtitle={`${watchingActive} ok`} />
        <StatCard label="Killed Today" value={killedToday} color="text-destructive" />
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <QuickActions commands={quickCommands} onExecute={onExecuteCommand} />
        <RecentActivity entries={historyEntries} />
      </div>

      {/* Watched Ports */}
      <WatchedPortsSummary watchedPorts={watchedPorts} onNavigateToMonitor={() => onNavigate('monitor')} />
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/ src/pages/dashboard.tsx
git commit -m "feat: add dashboard page with stats, quick actions, recent activity"
```

---

### Task 12: Settings Page

**Files:**
- Create: `src/components/settings/appearance-section.tsx`
- Create: `src/components/settings/behavior-section.tsx`
- Create: `src/pages/settings.tsx`

- [ ] **Step 1: Create appearance-section component**

```typescript
// src/components/settings/appearance-section.tsx
import { cn } from '@/lib/utils'
import type { ThemeMode } from '@/types'

interface AppearanceSectionProps {
  theme: ThemeMode
  compactMode: boolean
  onThemeChange: (t: ThemeMode) => void
  onCompactChange: (c: boolean) => void
}

export function AppearanceSection({ theme, compactMode, onThemeChange, onCompactChange }: AppearanceSectionProps) {
  return (
    <div className="mb-5">
      <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">Appearance</div>
      <div className="bg-card border border-border rounded-md overflow-hidden">
        {/* Theme */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <div>
            <div className="text-fg text-xs">Theme</div>
            <div className="text-muted-fg text-[10px] mt-0.5">Follow system preference or choose manually</div>
          </div>
          <div className="flex bg-muted border border-input-border rounded-md overflow-hidden">
            {(['system', 'light', 'dark'] as const).map(t => (
              <button key={t} onClick={() => onThemeChange(t)} className={cn(
                'px-2.5 py-1 text-[10px] capitalize',
                theme === t ? 'text-accent bg-accent/15' : 'text-muted-fg'
              )}>{t}</button>
            ))}
          </div>
        </div>
        {/* Compact mode */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div>
            <div className="text-fg text-xs">Compact Mode</div>
            <div className="text-muted-fg text-[10px] mt-0.5">Reduce spacing for more data density</div>
          </div>
          <button onClick={() => onCompactChange(!compactMode)} className={cn(
            'w-9 h-5 rounded-full relative transition-colors',
            compactMode ? 'bg-accent' : 'bg-border'
          )}>
            <span className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full transition-all',
              compactMode ? 'right-0.5 bg-white' : 'left-0.5 bg-muted-fg'
            )} />
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create behavior-section component**

```typescript
// src/components/settings/behavior-section.tsx
import { cn } from '@/lib/utils'
import type { KillMode } from '@/types'

interface BehaviorSectionProps {
  confirmBeforeKill: boolean
  defaultKillMode: KillMode
  pollingInterval: number
  onConfirmChange: (c: boolean) => void
  onKillModeChange: (m: KillMode) => void
  onIntervalChange: (i: 1 | 5 | 10 | 30) => void
}

export function BehaviorSection({ confirmBeforeKill, defaultKillMode, pollingInterval, onConfirmChange, onKillModeChange, onIntervalChange }: BehaviorSectionProps) {
  return (
    <div className="mb-5">
      <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">Behavior</div>
      <div className="bg-card border border-border rounded-md overflow-hidden">
        {/* Confirm before kill */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <div>
            <div className="text-fg text-xs">Confirm before kill</div>
            <div className="text-muted-fg text-[10px] mt-0.5">Show confirmation dialog before killing</div>
          </div>
          <button onClick={() => onConfirmChange(!confirmBeforeKill)} className={cn(
            'w-9 h-5 rounded-full relative transition-colors',
            confirmBeforeKill ? 'bg-accent' : 'bg-border'
          )}>
            <span className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full transition-all',
              confirmBeforeKill ? 'right-0.5 bg-white' : 'left-0.5 bg-muted-fg'
            )} />
          </button>
        </div>
        {/* Kill mode */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <div>
            <div className="text-fg text-xs">Default kill mode</div>
            <div className="text-muted-fg text-[10px] mt-0.5">How processes are terminated by default</div>
          </div>
          <div className="flex bg-muted border border-input-border rounded-md overflow-hidden">
            {(['graceful', 'force'] as const).map(m => (
              <button key={m} onClick={() => onKillModeChange(m)} className={cn(
                'px-2.5 py-1 text-[10px] capitalize',
                defaultKillMode === m ? 'text-accent bg-accent/15' : 'text-muted-fg'
              )}>{m}</button>
            ))}
          </div>
        </div>
        {/* Polling interval */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div>
            <div className="text-fg text-xs">Monitor polling interval</div>
            <div className="text-muted-fg text-[10px] mt-0.5">How often watched ports are checked</div>
          </div>
          <div className="flex bg-muted border border-input-border rounded-md overflow-hidden">
            {([1, 5, 10, 30] as const).map(i => (
              <button key={i} onClick={() => onIntervalChange(i)} className={cn(
                'px-2.5 py-1 text-[10px]',
                pollingInterval === i ? 'text-accent bg-accent/15' : 'text-muted-fg'
              )}>{i}s</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create settings page**

```typescript
// src/pages/settings.tsx
import { AppearanceSection } from '@/components/settings/appearance-section'
import { BehaviorSection } from '@/components/settings/behavior-section'
import type { Settings, ThemeMode, KillMode } from '@/types'

interface SettingsPageProps {
  settings: Settings
  onUpdateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

export function SettingsPage({ settings, onUpdateSetting }: SettingsPageProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4">
      <div className="text-fg text-sm font-semibold mb-4">Settings</div>

      <AppearanceSection
        theme={settings.theme}
        compactMode={settings.compactMode}
        onThemeChange={(t: ThemeMode) => onUpdateSetting('theme', t)}
        onCompactChange={(c: boolean) => onUpdateSetting('compactMode', c)}
      />

      <BehaviorSection
        confirmBeforeKill={settings.confirmBeforeKill}
        defaultKillMode={settings.defaultKillMode}
        pollingInterval={settings.pollingInterval}
        onConfirmChange={(c: boolean) => onUpdateSetting('confirmBeforeKill', c)}
        onKillModeChange={(m: KillMode) => onUpdateSetting('defaultKillMode', m)}
        onIntervalChange={(i: 1 | 5 | 10 | 30) => onUpdateSetting('pollingInterval', i)}
      />

      {/* About */}
      <div>
        <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">About</div>
        <div className="bg-card border border-border rounded-md p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center font-bold text-accent-fg text-sm">Z</div>
            <div>
              <div className="text-fg text-xs font-semibold">zPorter <span className="text-muted-fg font-normal">v1.0.0</span></div>
              <div className="text-muted-fg text-[10px]">Cross-platform port & process manager</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/settings/ src/pages/settings.tsx
git commit -m "feat: add settings page with appearance and behavior sections"
```

---

### Task 13: Process Detail Panel

**Files:**
- Create: `src/components/process-detail-panel.tsx`

- [ ] **Step 1: Create process detail slide-over panel**

```typescript
// src/components/process-detail-panel.tsx
import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { cn } from '@/lib/utils'
import { SourceBadge } from '@/components/scanner/source-badge'
import type { PortInfo, ProcessStats } from '@/types'

interface ProcessDetailPanelProps {
  item: PortInfo | null
  onClose: () => void
  onKill: (pid: number, force: boolean) => void
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

export function ProcessDetailPanel({ item, onClose, onKill }: ProcessDetailPanelProps) {
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
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 lg:relative lg:inset-auto lg:bg-transparent" onClick={onClose} />

      {/* Panel */}
      <div className={cn(
        'fixed right-0 top-0 bottom-0 w-full sm:w-80 bg-card border-l border-border z-50 flex flex-col overflow-y-auto',
        'lg:relative lg:right-auto lg:top-auto lg:bottom-auto lg:z-auto'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-accent font-bold text-base">:{item.port}</span>
            <span className="text-status-active text-[9px] bg-status-active/15 px-1.5 py-0.5 rounded">● ACTIVE</span>
          </div>
          <button onClick={onClose} className="text-muted-fg hover:text-fg text-sm">✕</button>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 px-3.5 py-2.5 border-b border-border">
          <button onClick={() => onKill(item.pid, false)} className="flex-1 bg-muted border border-input-border text-fg py-1.5 rounded text-[10px] text-center">⏻ Stop</button>
          <button onClick={() => onKill(item.pid, true)} className="flex-1 bg-destructive/15 border border-destructive/30 text-destructive py-1.5 rounded text-[10px] text-center">✕ Kill</button>
        </div>

        {/* Process Info */}
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

        {/* Resources */}
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

        {/* Command */}
        <div className="px-3.5 py-2.5 border-b border-border">
          <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">Command</div>
          <div className="bg-bg border border-border rounded p-2 text-[10px] text-fg break-all leading-relaxed">
            {item.process_name}
          </div>
        </div>

        {/* Executable */}
        <div className="px-3.5 py-2.5 border-b border-border">
          <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">Executable</div>
          <div className="bg-bg border border-border rounded p-2 text-[10px] text-muted-fg break-all">
            {item.exe_path || 'N/A'}
          </div>
        </div>

        {/* Remarks */}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/process-detail-panel.tsx
git commit -m "feat: add process detail slide-over panel with live stats"
```

---

### Task 14: Final App.tsx Wiring

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update App.tsx to wire all pages together**

Replace entire `src/App.tsx` with:

```typescript
// src/App.tsx
import { useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/layout/app-layout'
import { useTheme } from '@/hooks/use-theme'
import { useSettings } from '@/hooks/use-settings'
import { useHistory } from '@/hooks/use-history'
import { useFavorites } from '@/hooks/use-favorites'
import { useMonitor } from '@/hooks/use-monitor'
import { DashboardPage } from '@/pages/dashboard'
import { ScannerPage } from '@/pages/scanner'
import { MonitorPage } from '@/pages/monitor'
import { FavoritesPage } from '@/pages/favorites'
import { HistoryPage } from '@/pages/history'
import { SettingsPage } from '@/pages/settings'
import type { Page } from '@/types'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const theme = useTheme()
  const { settings, updateSetting } = useSettings()
  const { entries: historyEntries } = useHistory()
  const { commands: quickCommands } = useFavorites()
  const { watchedPorts } = useMonitor(settings.pollingInterval)

  // Keep theme in sync with settings
  if (settings.theme !== theme.mode) {
    theme.setMode(settings.theme)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardPage
            historyEntries={historyEntries}
            quickCommands={quickCommands}
            watchedPorts={watchedPorts}
            onNavigate={setCurrentPage}
            onExecuteCommand={() => {}}
          />
        )
      case 'scanner':
        return <ScannerPage settings={settings} />
      case 'monitor':
        return <MonitorPage settings={settings} />
      case 'favorites':
        return <FavoritesPage />
      case 'history':
        return <HistoryPage />
      case 'settings':
        return <SettingsPage settings={settings} onUpdateSetting={updateSetting} />
    }
  }

  return (
    <TooltipProvider>
      <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </AppLayout>
    </TooltipProvider>
  )
}
```

- [ ] **Step 2: Verify full build**

Run: `cd /Users/hasanyalmanbas/Desktop/zporter && npm run build`
Expected: Build succeeds with zero errors

- [ ] **Step 3: Verify Tauri dev build**

Run: `cd /Users/hasanyalmanbas/Desktop/zporter && npm run tauri:dev`
Expected: App launches with sidebar, all pages navigable

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire all pages into App.tsx, complete UI redesign"
```

---

### Task 15: Fix Review Issues

**Files:**
- Modify: `src/components/process-detail-panel.tsx` — add Favorite + Watch buttons
- Modify: `src/components/scanner/batch-action-bar.tsx` — add "Add to Favorites" and "Watch" actions
- Modify: `src/components/scanner/filter-bar.tsx` — add source filter + sort indicator
- Modify: `src/hooks/use-monitor.ts` — fix stale closure bug in poll callback
- Modify: `src/App.tsx` — lift hooks to App level, pass down as props for shared state; apply compactMode class; fix onExecuteCommand; wire history logging
- Modify: `src/pages/scanner.tsx` — accept and call history addEntry on scan/kill
- Modify: `src/pages/monitor.tsx` — accept and call history addEntry on kill
- Modify: `src/components/layout/bottom-nav.tsx` — add settings access via "More" menu
- Modify: `src/components/process-detail-panel.tsx` — dynamic status instead of hardcoded "ACTIVE"

- [ ] **Step 1: Add Favorite + Watch buttons to process detail panel**

In `src/components/process-detail-panel.tsx`, the actions row should have 4 buttons instead of 2:

```typescript
{/* Actions */}
<div className="flex gap-1.5 px-3.5 py-2.5 border-b border-border">
  <button onClick={() => onKill(item.pid, false)} className="flex-1 bg-muted border border-input-border text-fg py-1.5 rounded text-[10px] text-center">⏻ Stop</button>
  <button onClick={() => onKill(item.pid, true)} className="flex-1 bg-destructive/15 border border-destructive/30 text-destructive py-1.5 rounded text-[10px] text-center">✕ Kill</button>
  <button onClick={() => onFavorite?.(item.port)} className="flex-1 bg-muted border border-input-border text-fg py-1.5 rounded text-[10px] text-center">★ Fav</button>
  <button onClick={() => onWatch?.(item.port)} className="flex-1 bg-muted border border-input-border text-fg py-1.5 rounded text-[10px] text-center">◎ Watch</button>
</div>
```

Add `onFavorite?: (port: number) => void` and `onWatch?: (port: number) => void` to `ProcessDetailPanelProps`.

- [ ] **Step 2: Add batch actions to BatchActionBar**

In `src/components/scanner/batch-action-bar.tsx`, add "Add to Favorites" and "Watch" buttons:

```typescript
interface BatchActionBarProps {
  selectedCount: number
  totalCount: number
  onKillSelected: () => void
  onAddToFavorites?: () => void
  onWatch?: () => void
}

// In the JSX, after Kill Selected button:
<button onClick={onAddToFavorites} className="text-muted-fg border border-border px-2.5 py-1 rounded hover:text-fg">Add to Favorites</button>
<button onClick={onWatch} className="text-muted-fg border border-border px-2.5 py-1 rounded hover:text-fg">Watch</button>
```

- [ ] **Step 3: Add source filter to FilterBar**

In `src/components/scanner/filter-bar.tsx`, add source filter pills and sort indicator. Accept `sourceFilter`, `availableSources`, `onSourceChange`, `sortField`, `onSortChange` props.

- [ ] **Step 4: Fix stale closure in useMonitor**

In `src/hooks/use-monitor.ts`, use a `useRef` for watchedPorts to avoid stale closures:

```typescript
const watchedPortsRef = useRef<WatchedPort[]>([])
// Update ref whenever state changes
useEffect(() => { watchedPortsRef.current = watchedPorts }, [watchedPorts])
// In poll, use watchedPortsRef.current instead of watchedPorts
```

- [ ] **Step 5: Lift hooks to App.tsx for shared state**

Move `useHistory`, `useFavorites`, `useMonitor` to App.tsx and pass their state/functions as props to pages. This ensures history entries are shared across all pages.

```typescript
// In App.tsx:
const history = useHistory()
const favorites = useFavorites()
const monitor = useMonitor(settings.pollingInterval)

// Pass to scanner:
<ScannerPage settings={settings} onAddHistoryEntry={history.addEntry} />

// Pass to monitor:
<MonitorPage settings={settings} onAddHistoryEntry={history.addEntry} />
```

- [ ] **Step 6: Apply compactMode**

In App.tsx, apply compact mode class to the root:

```typescript
<div className={settings.compactMode ? 'compact' : ''}>
  <AppLayout ...>
```

Add to `index.css`:
```css
.compact { font-size: 10px; }
.compact .px-4 { padding-left: 0.5rem; padding-right: 0.5rem; }
```

- [ ] **Step 7: Fix bottom nav to include settings**

Change the "More" button in bottom-nav to navigate to 'history' by default, and add a settings gear as a 6th item or use a popover menu.

- [ ] **Step 8: Verify full build**

Run: `cd /Users/hasanyalmanbas/Desktop/zporter && npm run build`
Expected: Build succeeds

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "fix: address review issues - shared state, missing actions, filter bar, compact mode"
```

---

## Summary

| Chunk | Tasks | What it delivers |
|-------|-------|-----------------|
| 1 | Tasks 1-6 | Types, theme, settings, layout shell, scanner page — app is functional |
| 2 | Tasks 7-10 | Backend changes, history, favorites, monitor pages |
| 3 | Tasks 11-15 | Dashboard, settings, process detail panel, final wiring, review fixes |

**Total files created/modified:** ~35 new files, 3 modified (index.css, App.tsx, lib.rs), 1 deleted (App.css)
**Estimated tasks:** 15 tasks, ~55 atomic steps

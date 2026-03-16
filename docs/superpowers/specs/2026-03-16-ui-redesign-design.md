# zPorter UI Redesign — Production-Ready Developer Tool

**Date:** 2026-03-16
**Status:** Draft
**Approach:** Full frontend rebuild (Approach B) — keep Tauri backend + shadcn/ui primitives, rebuild all frontend code

## Overview

Redesign zPorter from a single-file prototype into a production-ready, multi-page desktop application with a developer tool aesthetic. The current 611-line monolithic App.tsx will be decomposed into a clean component architecture with consistent theming, sidebar navigation, and 5 distinct pages plus supporting panels.

**Backend note:** The Tauri backend will need minor additions to support new features (process resource stats). See "Backend Changes Required" section at the end.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Visual style | Developer Tool | Monospace fonts, compact layout, high information density. Matches the target audience (developers managing ports). |
| Theme | OS system preference + manual toggle | Most professional approach. Uses `prefers-color-scheme` media query with localStorage override. Three options: System, Light, Dark. |
| Navigation | Wide sidebar (220px) | Always-expanded with icons + labels. Collapses to icon-only at tablet breakpoint, becomes bottom nav on small screens. |
| Accent color | Amber/Orange (#f59e0b) | Warm, distinctive, high contrast on dark backgrounds. Used for active states, highlights, primary actions. |
| Approach | Full UI rebuild | Mevcut App.tsx too monolithic to incrementally refactor. shadcn/ui components kept as-is. Backend gets minor additions for resource stats. |
| Persistence | localStorage | All client-side state (favorites, history, settings) persisted via localStorage. Simple, no Tauri store plugin needed. |

## Pages & Components

### 1. Sidebar Navigation (Global)

Persistent left sidebar present on all pages.

**Desktop (≥1024px):** 220px wide, expanded with icons + labels.
- Logo + app name + version
- Navigation section: Dashboard, Scanner, Monitor, Favorites, History
- Footer: Settings, theme indicator
- Active page highlighted with amber background + left accent

**Tablet (640-1023px):** Collapsed to 44px, icon-only with tooltips.

**Small (<640px):** Sidebar hidden, replaced by bottom navigation bar with 5 icons + labels.

### 2. Dashboard Page (Default Landing)

Four stat cards in a row:
- **Active Ports** — count (delta shows difference from last scan in current session, stored in React state)
- **Processes** — total running process count
- **Watching** — monitored port count + status summary
- **Killed Today** — kill count for current session/day

Two-column layout below stats:
- **Quick Actions** — favorited commands and frequent operations. Fed from Favorites data.
- **Recent Activity** — timeline of last 5-10 actions (kills, scans) with colored status dots and relative timestamps.

Full-width section:
- **Watched Ports** — 3-column grid showing each monitored port's live status (ACTIVE/DOWN), process name, PID, CPU%. Left border color indicates status (green=active, red=down). Links to Monitor page.

### 3. Port Scanner Page (Core Feature)

**Top bar:** Inline search input with `ports:` prefix styling. Scan button (amber) and "All Ports" secondary button. Enter key triggers scan.

**Backend mapping:** "Scan" calls `list_ports(ports, true)`. "All Ports" calls `list_all_ports()`.

**Filter bar:** Single row below search showing:
- Result count (amber)
- Protocol filter: All / TCP / UDP (toggle pills)
- Source filter: docker / node / system / brew etc.
- Sort indicator

**Results table:**
- Columns: Checkbox, Port, Protocol, PID, Command, User, Source, Actions
- Checkbox column for batch selection
- Port numbers in amber (when scanned) or white
- PID as clickable blue links
- Command with text truncation + ellipsis
- Source badges with per-type colors: docker=purple, node=blue, brew=green, systemd=amber, unknown=gray
- Row actions: Graceful stop (⏻), Force kill (✕), Details (⋯)
- Selected row: amber left border + subtle amber background tint

**Bottom action bar:** Shows when items selected.
- Selection count
- Batch actions: Kill Selected, Add to Favorites, Watch
- Pagination info

**Responsive behavior:**
- Tablet: Hide User and Protocol columns, compact action buttons
- Small: Switch to card-based layout. Each process as a card showing port (large), source badge, PID, command, and action buttons.

### 4. Monitor Page

**Top bar:** "Watchlist" title, port count, polling status indicator (green dot + "Polling every 5s"), "+ Add Port" button.

**Watched port cards:** Vertically stacked, each card contains:
- Port number (large), status badge (ACTIVE green / DOWN red), source badge
- Action buttons: Stop, Kill, Unwatch
- Stats grid: PID, CPU%, Memory (MB), Uptime (requires new backend command `get_process_stats`)
- Full command path (truncated)
- Left border color matches status (green/red)

**Down ports:** Show "last seen" timestamp and last known PID instead of live stats.

**Polling:** Uses `list_ports` to check if port is still active at configured interval (1s/5s/10s/30s via Settings). Uses `get_process_stats` to fetch resource data for active ports. Visual indicator in top bar.

### 5. Favorites Page

**Top bar:** "Favorites" title, "+ Add Favorite" button.

**Groups:** User-defined groups (e.g., "Dev Stack", "Production"). Each group has:
- Group name header (uppercase, muted)
- 2-column grid of port cards

**Port cards:** Each shows:
- Port number (amber) + user-defined label (e.g., "Frontend Dev", "PostgreSQL")
- Live status indicator (● active / ● down) + source
- Quick action buttons: Scan (⌕), Kill (✕)

**Quick Commands section:** Below port groups.
- Saved command shortcuts (e.g., "Kill all dev ports", "Scan range 8000-9000")
- Each with play button (▶) and description
- Port list shown on right side

**Data persistence:** Favorites stored in localStorage.

### 6. History Page

**Top bar:** "History" title, filter pills (All / Kills / Scans), Clear button.

**Timeline view:** Grouped by day (Today, Yesterday, specific dates).
- Vertical timeline line on left with colored dots per event type
- Kill events: red dot (●)
- Scan events: amber dot (●)
- Each entry shows: action type, port(s), timestamp (right-aligned)
- Detail line below: PID, command, user, source

**Filters:** Toggle between All, Kills only, Scans only.

**Clear:** Removes all history entries (with confirmation).

**Data persistence:** History stored in localStorage. Max 500 entries kept — oldest entries are automatically pruned when limit is exceeded.

### 7. Process Detail Panel (Slide-over)

Triggered by clicking "⋯" on any process row in Scanner or Monitor.

**Behavior:** Slides in from right side, 320px wide. Main content area dims but remains visible. Close button (✕) in panel header.

**Panel sections:**

1. **Header:** Port number (large, amber) + status badge
2. **Actions row:** Stop, Force Kill, Favorite, Watch — 4 equal-width buttons
3. **Process Info:** Key-value grid — PID, User, Protocol, Source, Status
4. **Resources:** CPU% and Memory (MB) as progress bars with labels. Uptime as text. (Data from `get_process_stats` backend command.)
5. **Command:** Full command in monospace code block (dark background, word-wrap)
6. **Executable:** Full executable path in code block
7. **Remarks:** Shown when `PortInfo.remarks` is non-empty. Displayed as muted text below executable.

**Responsive:** On small screens, panel becomes full-screen overlay instead of side panel.

### 8. Settings Page

Accessed from sidebar footer. Three sections:

**Appearance:**
- Theme: System / Light / Dark (3-option segmented control)
- Compact Mode: Toggle switch (reduces spacing throughout app)

**Behavior:**
- Confirm before kill: Toggle switch (default: on)
- Default kill mode: Graceful / Force (segmented control)
- Monitor polling interval: 1s / 5s / 10s / 30s (segmented control, default: 5s)

**About:**
- App logo, name, version
- Description text

**Persistence:** All settings stored in localStorage. Applied immediately on change (no save button needed).

## Theme System

### Approach
CSS custom properties (CSS variables) defined at `:root` level with `.dark` class override. Tailwind `dark:` variant maps to these variables.

### Color Tokens

```
--background: light=#fafafa, dark=#0f0f0f
--foreground: light=#0f0f0f, dark=#e5e5e5
--card: light=#ffffff, dark=#161616
--card-foreground: light=#0f0f0f, dark=#e5e5e5
--border: light=#e5e5e5, dark=#2a2a2a
--muted: light=#f5f5f5, dark=#1a1a1a
--muted-foreground: light=#737373, dark=#666666
--accent: light=#f59e0b, dark=#f59e0b (same)
--accent-foreground: light=#000000, dark=#000000
--destructive: light=#ef4444, dark=#ef4444
```

### Source Badge Colors
Consistent across themes:
- docker: purple (#a855f7)
- node: blue (#60a5fa)
- brew: green (#22c55e)
- systemd: amber (#f59e0b)
- launchd: cyan (#22d3ee)
- unknown: gray (#888888)

### Status Colors
- active/running: green (#22c55e)
- down/stopped: red (#ef4444)
- scanning: amber (#f59e0b)

### Font
Primary: `ui-monospace, 'SF Mono', 'Cascadia Code', 'Fira Code', monospace`
Size base: 12px for data, 11px for secondary, 9-10px for labels/badges

## Component Architecture

```
src/
├── main.tsx                          # React entry point
├── App.tsx                           # Root: theme provider + router + layout shell
├── index.css                         # CSS variables, theme tokens, base styles
├── lib/
│   └── utils.ts                      # cn() utility (existing)
├── hooks/
│   ├── use-theme.ts                  # Theme detection (OS) + manual override + persistence
│   ├── use-ports.ts                  # Port scanning logic (Tauri invoke wrapper)
│   ├── use-monitor.ts                # Watchlist polling logic
│   ├── use-favorites.ts              # Favorites CRUD + persistence
│   ├── use-history.ts                # History logging + persistence
│   └── use-settings.ts               # Settings state + persistence
├── components/
│   ├── ui/                           # shadcn/ui primitives (existing, unchanged)
│   ├── layout/
│   │   ├── sidebar.tsx               # Sidebar navigation
│   │   ├── bottom-nav.tsx            # Mobile bottom navigation
│   │   └── app-layout.tsx            # Layout shell (sidebar + content area)
│   ├── scanner/
│   │   ├── search-bar.tsx            # Port search input + scan button
│   │   ├── filter-bar.tsx            # Protocol + source filters
│   │   ├── process-table.tsx         # Desktop table view
│   │   ├── process-card.tsx          # Mobile card view
│   │   ├── process-row.tsx           # Single table row
│   │   ├── batch-action-bar.tsx      # Bottom bar for selected items
│   │   └── source-badge.tsx          # Colored source indicator
│   ├── monitor/
│   │   ├── watch-card.tsx            # Single watched port card
│   │   └── polling-indicator.tsx     # Status dot + interval display
│   ├── favorites/
│   │   ├── favorite-card.tsx         # Single favorite port card
│   │   ├── favorite-group.tsx        # Group container
│   │   └── quick-command.tsx         # Saved command shortcut
│   ├── history/
│   │   ├── timeline.tsx              # Timeline container
│   │   └── timeline-entry.tsx        # Single history event
│   ├── dashboard/
│   │   ├── stat-card.tsx             # Single stat metric card
│   │   ├── quick-actions.tsx         # Quick action list
│   │   ├── recent-activity.tsx       # Recent activity feed
│   │   └── watched-ports-summary.tsx # Compact watched ports grid
│   ├── process-detail-panel.tsx      # Slide-over detail panel
│   └── settings/
│       ├── appearance-section.tsx    # Theme + compact mode
│       └── behavior-section.tsx      # Kill mode + polling + confirm
├── pages/
│   ├── dashboard.tsx                 # Dashboard page
│   ├── scanner.tsx                   # Port scanner page
│   ├── monitor.tsx                   # Monitor page
│   ├── favorites.tsx                 # Favorites page
│   ├── history.tsx                   # History page
│   └── settings.tsx                  # Settings page
└── types/
    └── index.ts                      # Shared TypeScript interfaces (see Types section)
```

## Routing

No external router library needed. Simple state-based page switching since this is a single-window desktop app:

```typescript
type Page = 'dashboard' | 'scanner' | 'monitor' | 'favorites' | 'history' | 'settings'
const [currentPage, setCurrentPage] = useState<Page>('dashboard')
```

The sidebar and bottom nav both call `setCurrentPage`. This avoids adding react-router as a dependency for what is essentially tab switching.

## Data Flow

### Port Scanning
1. User enters ports in search bar → `usePorts` hook calls Tauri `invoke('list_ports', { ports, onlyListening: true })` → Rust backend returns `PortInfo[]` → state update → table renders
2. "All Ports" button calls `invoke('list_all_ports')` → returns all listening ports

### Process Actions
1. Kill: `invoke('kill_process', { pid, force })` — returns `Result<KillResult, String>`. `force: true` for force kill, `false` for graceful.
2. Kill by port: `invoke('kill_by_port', { port, force })` — returns `Result<KillResult, String>`
3. Source detection: `invoke('detect_source', { pid })` — called per-process as needed
4. Most Tauri commands return `Result<T, String>` — frontend must handle error case (display error toast/message). Exception: `detect_source` returns `String` directly.

### Monitor Polling
1. `useMonitor` hook maintains watchlist in state + localStorage
2. `setInterval` calls `invoke('list_ports', { ports: allWatchedPorts, onlyListening: true })` with all watched ports batched in a single call at configured interval
3. For active ports, also calls `invoke('get_process_stats', { pid })` to get CPU/memory/uptime (new backend command)
4. Status changes trigger re-render of watch cards
5. DOWN detection: if a previously ACTIVE port returns empty results, mark as DOWN with "last seen" timestamp

### Favorites
1. `useFavorites` hook manages groups and ports in localStorage
2. CRUD operations: add/remove/rename ports, create/delete groups, add/remove quick commands
3. Live status: favorites page calls `list_ports` on mount to show current status

### History
1. `useHistory` hook logs every scan and kill action with timestamp
2. Stored in localStorage as array of events (max 500, auto-pruned)
3. Grouped by day for display
4. Clear function removes all entries

### Settings
1. `useSettings` hook reads/writes to localStorage
2. Theme changes apply immediately via document class toggle
3. All components read settings via hook (no prop drilling)

## Responsive Breakpoints

| Breakpoint | Sidebar | Table/Cards | Detail Panel | Stat Cards |
|-----------|---------|-------------|--------------|------------|
| ≥1024px (Desktop) | 220px expanded | Full table | Side panel 320px | 4 columns |
| 640-1023px (Tablet) | 44px icon-only | Compact table (fewer columns) | Side panel 280px | 2 columns |
| <640px (Small) | Bottom nav | Card layout | Full-screen overlay | 2 columns, stacked |

## Types

Key shared interfaces in `src/types/index.ts`:

```typescript
// From Tauri backend (matches Rust PortInfo struct)
interface PortInfo {
  port: number
  protocol: string
  pid: number
  process_name: string
  exe_path: string
  user: string
  source: string      // "docker" | "systemd" | "launchd" | "brew" | "node" | "unknown"
  remarks: string
}

// New: from get_process_stats backend command
interface ProcessStats {
  pid: number
  cpu_percent: number
  memory_bytes: number
  uptime_secs: number
}

// Frontend-only types
type Page = 'dashboard' | 'scanner' | 'monitor' | 'favorites' | 'history' | 'settings'

interface FavoritePort {
  port: number
  label: string          // user-defined name e.g. "Frontend Dev"
  groupId: string
}

interface FavoriteGroup {
  id: string
  name: string           // e.g. "Dev Stack"
  ports: FavoritePort[]
}

interface QuickCommand {
  id: string
  label: string          // e.g. "Kill all dev ports"
  action: 'kill' | 'scan'
  ports: number[]
}

interface HistoryEntry {
  id: string
  action: 'kill' | 'force_kill' | 'scan' | 'scan_all'
  ports: number[]
  pid?: number
  processName?: string
  timestamp: number      // Unix ms
}

type ThemeMode = 'system' | 'light' | 'dark'
type KillMode = 'graceful' | 'force'

interface Settings {
  theme: ThemeMode
  compactMode: boolean
  confirmBeforeKill: boolean
  defaultKillMode: KillMode
  pollingInterval: 1 | 5 | 10 | 30  // seconds
}

interface WatchedPort {
  port: number
  status: 'active' | 'down'
  lastSeen?: number      // Unix ms, set when port goes down
  lastPid?: number
  stats?: ProcessStats   // live stats when active
  portInfo?: PortInfo    // last known port info
}
```

## Backend Changes Required

The existing Tauri backend needs one new command to support resource monitoring:

**New command: `get_process_stats(pid: u32) -> Result<ProcessStats, String>`**
- Uses the existing `sysinfo` crate (already a dependency) to fetch CPU%, memory, and start time for a given PID
- Returns `ProcessStats { pid, cpu_percent, memory_bytes, uptime_secs }`
- Returns error if PID not found
- Called by Monitor page and Process Detail Panel for live stats

**Backend enhancement: Add "node" detection to `detect_source`**
- Current `detect_source_sync` checks for docker, systemd, launchd, brew — but not node
- Add heuristic: if process name is "node" or exe_path contains "node", return "node"
- This is a minor addition to the existing function, not a new command

**Existing commands used (signatures unchanged):**
- `list_ports(ports: Vec<u16>, only_listening: bool) -> Result<Vec<PortInfo>, String>`
- `list_all_ports() -> Result<Vec<PortInfo>, String>`
- `kill_process(pid: u32, force: bool) -> Result<KillResult, String>`
- `kill_by_port(port: u16, force: bool) -> Result<KillResult, String>`
- `detect_source(pid: u32) -> String`

**Note:** The `PortInfo.remarks` field from the backend will be displayed in the Process Detail Panel under a "Remarks" section when non-empty.

## What's NOT Changing

- **shadcn/ui components:** All `src/components/ui/` files stay as-is. We use them as building blocks.
- **Build tooling:** Vite + TypeScript + Tailwind CSS + Tauri CLI — all unchanged.
- **Dependencies:** No new npm packages needed. Everything builds on existing shadcn/ui + Radix + Lucide stack.
- **Existing Tauri commands:** All current backend command signatures unchanged. One new command added. Minor enhancement to `detect_source` for node detection.

## What IS Changing

- **App.tsx:** Reduced from 611 lines to ~30 lines (theme provider + layout shell + page router)
- **index.css:** Rewritten with proper dark/light CSS variable tokens
- **New files:** ~35 new component/hook/page files (see architecture above)
- **Deleted files:** App.css (Vite template CSS, unused styles)
- **Theme:** Consistent dark/light with OS detection + manual override + persistence
- **Backend:** One new Tauri command (`get_process_stats`) for resource monitoring + "node" detection in `detect_source`

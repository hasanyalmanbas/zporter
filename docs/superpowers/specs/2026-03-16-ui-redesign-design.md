# zPorter UI Redesign — Production-Ready Developer Tool

**Date:** 2026-03-16
**Status:** Draft
**Approach:** Full frontend rebuild (Approach B) — keep Tauri backend + shadcn/ui primitives, rebuild all frontend code

## Overview

Redesign zPorter from a single-file prototype into a production-ready, multi-page desktop application with a developer tool aesthetic. The current 611-line monolithic App.tsx will be decomposed into a clean component architecture with consistent theming, sidebar navigation, and 5 distinct pages plus supporting panels.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Visual style | Developer Tool | Monospace fonts, compact layout, high information density. Matches the target audience (developers managing ports). |
| Theme | OS system preference + manual toggle | Most professional approach. Uses `prefers-color-scheme` media query with localStorage override. Three options: System, Light, Dark. |
| Navigation | Wide sidebar (220px) | Always-expanded with icons + labels. Collapses to icon-only at tablet breakpoint, becomes bottom nav on small screens. |
| Accent color | Amber/Orange (#f59e0b) | Warm, distinctive, high contrast on dark backgrounds. Used for active states, highlights, primary actions. |
| Approach | Full UI rebuild | Mevcut App.tsx too monolithic to incrementally refactor. Backend (Rust/Tauri) and shadcn/ui components are kept as-is. |

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
- **Active Ports** — count + delta indicator (↑/↓)
- **Processes** — total running process count
- **Watching** — monitored port count + status summary
- **Killed Today** — kill count for current session/day

Two-column layout below stats:
- **Quick Actions** — favorited commands and frequent operations. Fed from Favorites data.
- **Recent Activity** — timeline of last 5-10 actions (kills, scans) with colored status dots and relative timestamps.

Full-width section:
- **Watched Ports** — 3-column grid showing each monitored port's live status (ACTIVE/DOWN), process name, PID, CPU. Left border color indicates status (green=active, red=down). Links to Monitor page.

### 3. Port Scanner Page (Core Feature)

**Top bar:** Inline search input with `ports:` prefix styling. Scan button (amber) and "All Ports" secondary button. Enter key triggers scan.

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
- Stats grid: PID, CPU, Memory, Uptime
- Full command path (truncated)
- Left border color matches status (green/red)

**Down ports:** Show "last seen" timestamp and last known PID instead of live stats.

**Polling:** Configurable interval (1s/5s/10s/30s) via Settings. Visual indicator in top bar.

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

**Data persistence:** Favorites stored in localStorage or Tauri app data directory.

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

**Data persistence:** History stored in localStorage or Tauri app data directory. Auto-cleanup after configurable retention period.

### 7. Process Detail Panel (Slide-over)

Triggered by clicking "⋯" on any process row in Scanner or Monitor.

**Behavior:** Slides in from right side, 320px wide. Main content area dims but remains visible. Close button (✕) in panel header.

**Panel sections:**

1. **Header:** Port number (large, amber) + status badge
2. **Actions row:** Stop, Force Kill, Favorite, Watch — 4 equal-width buttons
3. **Process Info:** Key-value grid — PID, PPID, User, Protocol, Source, Status
4. **Resources:** CPU and Memory as progress bars with percentage/value labels. Uptime and thread count as text.
5. **Command:** Full command in monospace code block (dark background, word-wrap)
6. **Executable:** Full executable path in code block

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

**Persistence:** All settings stored in localStorage or Tauri app data directory. Applied immediately on change (no save button needed).

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
    └── index.ts                      # Shared TypeScript interfaces
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
1. User enters ports in search bar → `usePorts` hook calls Tauri `invoke('scan_ports', { ports })` → Rust backend returns process list → state update → table renders

### Monitor Polling
1. `useMonitor` hook maintains watchlist in state + persisted storage
2. `setInterval` calls Tauri `invoke('check_port', { port })` for each watched port at configured interval
3. Status changes trigger re-render of watch cards
4. DOWN detection: if a previously ACTIVE port returns no process, mark as DOWN with "last seen" timestamp

### Favorites
1. `useFavorites` hook manages groups and ports in localStorage/Tauri store
2. CRUD operations: add/remove/rename ports, create/delete groups, add/remove quick commands
3. Live status: favorites page calls port check on mount to show current status

### History
1. `useHistory` hook logs every scan and kill action with timestamp
2. Stored in localStorage/Tauri store as array of events
3. Grouped by day for display
4. Clear function removes all entries

### Settings
1. `useSettings` hook reads/writes to localStorage/Tauri store
2. Theme changes apply immediately via document class toggle
3. All components read settings via hook (no prop drilling)

## Responsive Breakpoints

| Breakpoint | Sidebar | Table/Cards | Detail Panel | Stat Cards |
|-----------|---------|-------------|--------------|------------|
| ≥1024px (Desktop) | 220px expanded | Full table | Side panel 320px | 4 columns |
| 640-1023px (Tablet) | 44px icon-only | Compact table (fewer columns) | Side panel 280px | 2 columns |
| <640px (Small) | Bottom nav | Card layout | Full-screen overlay | 2 columns, stacked |

## What's NOT Changing

- **Tauri backend (Rust):** All `src-tauri/` code stays as-is. Same invoke commands, same process scanning logic.
- **shadcn/ui components:** All `src/components/ui/` files stay as-is. We use them as building blocks.
- **Build tooling:** Vite + TypeScript + Tailwind CSS + Tauri CLI — all unchanged.
- **Dependencies:** No new npm packages needed. Everything builds on existing shadcn/ui + Radix + Lucide stack.

## What IS Changing

- **App.tsx:** Reduced from 611 lines to ~30 lines (theme provider + layout shell + page router)
- **index.css:** Rewritten with proper dark/light CSS variable tokens
- **New files:** ~35 new component/hook/page files (see architecture above)
- **Deleted files:** App.css (Vite template CSS, unused styles)
- **Theme:** Consistent dark/light with OS detection + manual override + persistence

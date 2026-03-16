# zPorter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8DB)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB)](https://reactjs.org/)
[![Version](https://img.shields.io/badge/version-1.0.1-blue.svg)]()

A fast, safe, GUI-first utility to identify which process holds a specific port and free that port by terminating the owning process (gracefully, then forcefully if needed). Supports multiple ports, batch actions, and minimal friction across macOS, Windows, and Linux.

## Features

- **Port Scanning** — Search for processes using specific ports or scan all listening ports
- **Process Termination** — Graceful or force kill with confirmation dialogs
- **Batch Operations** — Select multiple processes and terminate at once
- **Source Detection** — Identify Docker containers, Node.js, systemd, launchd, and brew services
- **Dashboard** — Overview with active port stats, quick actions, recent activity, and watched port status
- **Port Monitoring** — Watchlist with real-time polling, CPU/memory/uptime stats per process
- **Favorites** — Save ports into groups with labels, create quick commands for common operations
- **History** — Timeline view of all scan and kill actions, filterable by type
- **Dark/Light Theme** — Follows OS system preference with manual override (System/Light/Dark)
- **Settings** — Configure theme, kill mode, confirmation dialogs, polling interval
- **Responsive UI** — Sidebar navigation on desktop, collapsed icons on tablet, bottom nav on mobile
- **Cross-Platform** — Works on macOS, Windows, and Linux

## Screenshots

> Screenshots will be updated with the new UI. The app now features a sidebar-based developer tool aesthetic with amber accent colors and monospace typography.

## Installation

### macOS

Download the latest `.dmg` file from [Releases](https://github.com/hasanyalmanbas/zporter/releases) and drag to Applications.

### Windows

Download the `.exe` or `.msi` installer from [Releases](https://github.com/hasanyalmanbas/zporter/releases).

### Linux

Download the `.AppImage` from [Releases](https://github.com/hasanyalmanbas/zporter/releases) and make it executable:

```bash
chmod +x zporter.AppImage
./zporter.AppImage
```

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://rustup.rs/) (latest stable)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/hasanyalmanbas/zporter.git
cd zporter
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run tauri:dev
```

### Building

```bash
# Development build
npm run tauri:dev

# Production build
npm run tauri:build
```

## Usage

The app has 6 pages accessible via the sidebar:

1. **Dashboard** — Overview with active port count, process count, watched ports status, quick actions, and recent activity timeline
2. **Scanner** — Enter port numbers (comma-separated or ranges like 8000-8100), filter by protocol (TCP/UDP), select multiple processes for batch kill
3. **Monitor** — Add ports to your watchlist, see real-time CPU/memory/uptime stats with configurable polling interval
4. **Favorites** — Organize ports into named groups (e.g. "Dev Stack"), create quick commands like "Kill all dev ports"
5. **History** — Timeline of all actions (kills, scans) grouped by day, filterable by type
6. **Settings** — Theme (System/Light/Dark), compact mode, kill confirmation toggle, default kill mode, polling interval

### Command Line Alternatives

For CLI alternatives, consider using:
- `lsof -i :PORT`
- `netstat -tulpn | grep :PORT`
- `ss -tulpn | grep :PORT`

## Architecture

- **Frontend**: React 19 + TypeScript + shadcn/ui + Tailwind CSS 4
- **Backend**: Rust + Tauri 2 + sysinfo
- **Packaging**: Tauri bundler for cross-platform distribution

### Project Structure

```
src/
├── App.tsx                    # Root layout shell + page router
├── index.css                  # CSS variables, theme tokens
├── hooks/                     # Custom React hooks
│   ├── use-theme.ts           # OS theme detection + manual override
│   ├── use-settings.ts        # Settings with localStorage persistence
│   ├── use-ports.ts           # Port scanning via Tauri invoke
│   ├── use-monitor.ts         # Watchlist polling + process stats
│   ├── use-favorites.ts       # Favorites groups + quick commands
│   └── use-history.ts         # Action history logging
├── pages/                     # Page components
│   ├── dashboard.tsx
│   ├── scanner.tsx
│   ├── monitor.tsx
│   ├── favorites.tsx
│   ├── history.tsx
│   └── settings.tsx
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   ├── layout/                # Sidebar, bottom nav, app shell
│   ├── scanner/               # Search bar, table, cards, filters
│   ├── dashboard/             # Stat cards, activity feed
│   ├── monitor/               # Watch cards, polling indicator
│   ├── favorites/             # Favorite cards, groups, commands
│   ├── history/               # Timeline entries
│   ├── settings/              # Appearance, behavior sections
│   └── process-detail-panel.tsx
└── types/
    └── index.ts               # Shared TypeScript interfaces
```

### Key Backend Commands (Rust/Tauri)

- `list_ports` — Find processes on specific ports
- `list_all_ports` — Scan all listening ports
- `kill_process` — Terminate a process by PID (graceful or force)
- `kill_by_port` — Terminate process on a specific port
- `detect_source` — Identify service source (docker, node, brew, etc.)
- `get_process_stats` — Get CPU%, memory, uptime for a process

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test thoroughly
4. Submit a pull request

## Troubleshooting

### Common Issues

**Port not found**: Make sure the port is actually in use. Check with `lsof -i :PORT`

**Permission denied**: Some processes require administrator privileges. The app will prompt for elevation.

**Process won't terminate**: Try force termination, or the process may be protected by the system.

### System Requirements

- **macOS**: 12.0+
- **Windows**: 10/11
- **Linux**: glibc-based distributions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Tauri](https://tauri.app/) for the desktop app framework
- [shadcn/ui](https://ui.shadcn.com/) for the UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [sysinfo](https://crates.io/crates/sysinfo) for system information
- [Lucide Icons](https://lucide.dev/) for the icon set
- [Claude](https://claude.ai/) (Anthropic) + [Superpowers](https://github.com/nicekid1/superpowers) plugin for AI-assisted development

## Support

- Issues: [GitHub Issues](https://github.com/hasanyalmanbas/zporter/issues)
- Discussions: [GitHub Discussions](https://github.com/hasanyalmanbas/zporter/discussions)

---

Made with Tauri, React, and [Claude Code](https://claude.ai/claude-code) + [Superpowers](https://github.com/nicekid1/superpowers)

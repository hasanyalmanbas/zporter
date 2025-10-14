# Changelog

All notable changes to zPorter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-14

### Added
- **Initial Release (MVP)**: Complete cross-platform port and process manager
- **Port Scanning**: Real-time port usage detection using system tools (`lsof`)
- **Process Management**: Graceful and force termination of processes
- **Source Detection**: Automatic identification of Docker, systemd, launchd, and brew services
- **Modern UI**: Clean interface built with React, TypeScript, and Mantine
- **Cross-Platform Support**: Native binaries for macOS, Windows, and Linux
- **Safety Features**: Confirmation dialogs and permission error handling
- **Batch Operations**: Multi-process termination support

### Technical Features
- **Backend**: Rust + Tauri for high-performance system operations
- **Frontend**: React + TypeScript + Mantine UI components
- **Packaging**: Tauri bundler for native desktop applications
- **System Integration**: Direct system tool integration for accurate port detection

### Documentation
- **README.md**: Comprehensive installation and usage guide
- **CONTRIBUTING.md**: Developer guidelines and contribution process
- **Project Structure**: Well-organized codebase with clear separation of concerns

## Types of changes
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities

## Roadmap

### [1.1.0] - Planned
- Tray icon support
- Remember last searched ports
- Dark/light theme toggle
- Internationalization (Turkish/English)
- Keyboard shortcuts

### [1.2.0] - Planned
- Privileged helper service for seamless elevation
- Advanced service management (start/stop)
- Process tree visualization
- Open file descriptors view

### [1.3.0] - Planned
- Advanced diagnostics
- Command palette
- Favorites system
- Export functionality
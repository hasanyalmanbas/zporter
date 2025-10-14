# Contributing to zPortKiller

Thank you for your interest in contributing to zPortKiller! We welcome contributions from the community. This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Contributing Guidelines](#contributing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Testing](#testing)
- [Documentation](#documentation)

## 🤝 Code of Conduct

This project follows a standard code of conduct. By participating, you agree to:
- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **Rust** (latest stable) - [Install](https://rustup.rs/)
- **Tauri CLI** - Install with: `npm install -g @tauri-apps/cli`

### Quick Setup

1. **Fork and Clone** the repository:
```bash
git clone https://github.com/yourusername/zportkiller.git
cd zportkiller
```

2. **Install Dependencies**:
```bash
npm install
```

3. **Run Development Mode**:
```bash
npm run tauri:dev
```

4. **Verify Installation**:
   - Frontend should open at `http://localhost:1420`
   - Desktop app should launch automatically

## 🛠️ Development Setup

### Environment Setup

1. **Install Rust Toolchain**:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

2. **Install Tauri Prerequisites** (platform-specific):
   - **macOS**: `brew install gcc`
   - **Windows**: Visual Studio Build Tools
   - **Linux**: Standard build tools

3. **Verify Installations**:
```bash
node --version  # Should be v18+
npm --version   # Should be latest
cargo --version # Should be latest
```

### Development Workflow

1. **Create Feature Branch**:
```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**:
   - Frontend changes: `src/` directory
   - Backend changes: `src-tauri/src/` directory
   - UI changes: Hot reload works automatically

3. **Test Changes**:
```bash
npm run tauri:dev  # Test in development
npm run build      # Test production build
```

4. **Run Linting** (if configured):
```bash
npm run lint
```

## 📁 Project Structure

```
zportkiller/
├── src/                    # React/TypeScript frontend
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── lib.rs         # Tauri commands and core logic
│   │   └── main.rs        # Application entry point
│   └── Cargo.toml         # Rust dependencies
├── screenshots/           # Application screenshots
├── package.json           # Node.js dependencies and scripts
├── vite.config.ts         # Vite configuration
├── postcss.config.cjs     # PostCSS configuration
└── README.md              # Project documentation
```

### Key Files

- **`src/App.tsx`**: Main UI component with port search and process table
- **`src-tauri/src/lib.rs`**: Backend logic for port scanning and process management
- **`package.json`**: Frontend dependencies and build scripts
- **`src-tauri/Cargo.toml`**: Backend dependencies

## 📝 Contributing Guidelines

### Code Style

- **Frontend**: Follow React/TypeScript best practices
- **Backend**: Follow Rust standard formatting (`cargo fmt`)
- **Commits**: Use conventional commits format
- **Documentation**: Document new features and API changes

### Commit Messages

Use conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

Examples:
```
feat: add port range scanning
fix: handle permission errors gracefully
docs: update installation instructions
```

### Code Quality

- **TypeScript**: Strict type checking enabled
- **Rust**: Use `cargo clippy` for linting
- **Testing**: Add tests for new features
- **Performance**: Consider performance impact of changes

## 🔄 Submitting Changes

### Pull Request Process

1. **Ensure Tests Pass**:
```bash
npm run build  # Should complete without errors
```

2. **Update Documentation**:
   - Update README.md if needed
   - Add code comments for complex logic
   - Update CHANGELOG.md

3. **Create Pull Request**:
   - Use descriptive title
   - Reference related issues
   - Provide testing instructions
   - Include screenshots for UI changes

4. **PR Template**:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test the changes

## Screenshots (if applicable)
Add screenshots of UI changes

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Code follows style guidelines
```

## 🧪 Testing

### Manual Testing

Test these scenarios:
- Port scanning with valid/invalid ports
- Process termination (graceful and force)
- Permission error handling
- Batch operations
- UI responsiveness

### Cross-Platform Testing

Test on all supported platforms:
- **macOS**: 12.0+
- **Windows**: 10/11
- **Linux**: Ubuntu, Fedora, etc.

### Automated Testing (Future)

When test framework is added:
```bash
npm run test        # Frontend tests
cargo test          # Backend tests
npm run test:e2e    # End-to-end tests
```

## 📚 Documentation

### Updating Documentation

- **README.md**: Installation, usage, and feature overview
- **API Docs**: Document new Tauri commands
- **Code Comments**: Explain complex algorithms
- **CHANGELOG.md**: Track version changes

### Documentation Standards

- Use clear, concise language
- Include code examples
- Provide troubleshooting guides
- Keep screenshots up to date

## 🐛 Issue Reporting

When reporting bugs:
- Use issue templates
- Include system information
- Provide reproduction steps
- Attach logs/screenshots

## 🎯 Areas for Contribution

### High Priority
- Cross-platform testing
- Performance optimizations
- Accessibility improvements

### Medium Priority
- Additional UI themes
- Internationalization (i18n)
- Plugin system

### Low Priority
- Advanced filtering options
- Export functionality
- Integration with system monitors

## 📞 Getting Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/zportkiller/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/zportkiller/discussions)
- **Documentation**: Check README.md and this guide first

## 🙏 Recognition

Contributors will be recognized in:
- CHANGELOG.md for significant contributions
- README.md acknowledgments section
- GitHub contributor statistics

Thank you for contributing to zPortKiller! 🎉
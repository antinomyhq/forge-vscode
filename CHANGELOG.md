# Change Log

All notable changes to the Forge VS Code extension.

## [0.9.7] - 2025-11-14

### Security & Packaging
- Added `.vscodeignore` to prevent packaging source files and build artifacts
- Reduced extension package size by excluding unnecessary files
- Added explicit Apache-2.0 license field to package.json

### Process Automation
- Transitioning to automated changelog management via Release Drafter
- Future changelogs will be available on GitHub Releases page

### Note
- This version prepares the extension for enhanced security and maintainability
- Users are directed to GitHub Releases for detailed changelog information going forward

## [0.0.1] - 2025-01-08

### Added
- Initial release of Forge VS Code extension
- Keyboard shortcuts for launching Forge (Ctrl+Escape, Ctrl+Shift+Escape, Ctrl+Alt+K)
- Automatic file context passing with line number support
- Smart Forge CLI detection and availability checking
- Configuration options for customizing behavior
- Context menus in editor and explorer
- Warning messages with actionable buttons for installation/configuration
- Support for custom CLI commands and paths

### Features
- **Quick Launch**: Launch Forge directly from VS Code
- **File Context**: Automatically pass current file and line selections to Forge using `@filename#L10-L20` syntax
- **Smart Detection**: Checks if Forge CLI is available before launching
- **Configurable**: Customize CLI command, auto-check behavior, and warnings
- **Context Menus**: Right-click access to Forge functionality
- **Multiple Terminal Support**: Option to create new terminal tabs or reuse existing ones

### Technical
- Built with TypeScript
- Supports VS Code 1.102.0+
- Cross-platform support (Windows, macOS, Linux)
- Robust CLI detection using multiple fallback methods
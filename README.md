# 🔥 Forge VS Code Extension

<div align="center">

**AI-enabled pair programmer for Claude, GPT, and 300+ models**

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue?logo=visual-studio-code)](https://marketplace.visualstudio.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-0.4.0-orange.svg)](package.json)

</div>

<!-- ![Demo](images/Animation.gif) -->

This VS Code extension provides a simple way to copy file references in the format that [Forge CLI](https://forgecode.dev) understands.

## Features

- **Copy File References**: Copy file references with line selections to clipboard
- **Reference Format**: `@[<filepath>:<line start>:<line end>]` (no symbol name)
- **Keyboard Shortcut**: Quick access with `CTRL+U` (all platforms)
- **Installation Prompt**: Suggests Forge installation if not detected

## Requirements

- [Forge CLI](https://forgecode.dev) must be installed and available in your PATH
- VS Code 1.102.0 or higher

## Installation

1. Install the Forge CLI from [forgecode.dev](https://forgecode.dev)
2. Install this extension from the VS Code marketplace
3. Start using Forge directly from VS Code!

## Usage

### Keyboard Shortcuts

- **CTRL+U**: Copy file reference to clipboard

### File Reference Format

The extension generates references in the exact format that Forge understands:

```
@[<filepath>:<line start>:<line end>]
```

**Examples:**

- Single line: `@[src/components/Button.tsx:10:10]`
- Line range: `@[src/components/Button.tsx:10:20]`
- No selection: `<absolute filepath>` (just the full path to the file)

### How to Use

1. **Select code** in any file
2. **Press CTRL+U**
3. **File reference is copied** to clipboard
4. **Paste in any terminal** where Forge is running

## Configuration

Access settings via File → Preferences → Settings → Extensions → Forge

### Available Settings

- **forge.showInstallationPrompt** (default: `true`): Show installation prompt when Forge is not detected

## Examples

```bash
# Select lines 10-20 in Button.tsx and press CTRL+U
# Result: @[src/components/Button.tsx:10:20] copied to clipboard

# Select single line 15 in App.tsx and press CTRL+U
# Result: @[src/App.tsx:15:15] copied to clipboard

# No selection, just press CTRL+U in any file
# Result: <absolute filepath> copied to clipboard

# Paste in your Forge terminal:
forge @[src/components/Button.tsx:10:20] explain this code
```

## Troubleshooting

### Forge Not Installed

If you see an installation prompt:

1. Click "Install Forge" to visit [forgecode.dev](https://forgecode.dev)
2. Follow the installation instructions for your platform
3. Verify installation: `forge --version`

## License

MIT - See the Forge project for details.

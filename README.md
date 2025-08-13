# 🔥 Forge Code VSCode Extension

<div align="center">

**AI software engineering agent integration for VS Code**

Seamlessly integrate [Forge Code](https://forgecode.dev) AI assistant into your VS Code workflow with intelligent file referencing.

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue?logo=visual-studio-code)](https://marketplace.visualstudio.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-0.4.0-orange.svg)](package.json)

</div>

![Demo](https://raw.githubusercontent.com/antinomyhq/forge-vscode/main/images/demo.gif)

This VS Code extension provides seamless integration with [Forge Code](https://forgecode.dev), an AI software engineering agent that runs in your terminal. The extension enables quick copying of file references in the exact format that Forge understands, streamlining your AI-assisted development workflow.

## Features

- **Copy File References**: Copy file references with line selections to clipboard
- **Reference Format**: `@[<filepath>:<line start>:<line end>]` (no symbol name)
- **Keyboard Shortcut**: Quick access with `CTRL+U` (all platforms)
- **Installation Prompt**: Suggests Forge installation if not detected

## Requirements

- [Forge Code](https://forgecode.dev) must be installed and available in your PATH
- VS Code 1.102.0 or higher

## Installation

### Step 1: Install Forge Code

**Option A: NPX (Quick Start)**

```bash
cd your/project/directory
npx forgecode@latest
```

**Option B: Global Installation**

```bash
npm install -g forgecode
# or visit https://forgecode.dev for other installation methods
```

### Step 2: Install VS Code Extension

1. Install this extension from the VS Code marketplace
2. Start using Forge directly from VS Code!

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

If you see an installation prompt, you have several options:

**Option 1: NPX (Quick Start)**

```bash
cd your/project/directory
npx forgecode@latest
```

**Option 2: Global Installation**

```bash
npm install -g forgecode
# Then verify installation
forge --version
```

**Option 3: Other Methods**

1. Visit [forgecode.dev](https://forgecode.dev) for Homebrew, direct download, and other installation options.
2. Follow the setup instructions for your platform.

### Getting Started with Forge

```bash
# Navigate to your project
cd path/to/your/project

# Start Forge (interactive REPL)
forge
```

For complete documentation, visit [forgecode.dev/docs](https://forgecode.dev/docs/).

## License

Apache 2.0 - See the LICENSE file for details.

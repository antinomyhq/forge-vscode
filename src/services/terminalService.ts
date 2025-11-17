import * as vscode from "vscode";
import { TERMINAL_NAME } from "../constants";
import { ConfigService } from "./configService";

// Manages Forge terminal creation, tracking, and operations
export class TerminalService {
  private lastFocusedForgeTerminal: vscode.Terminal | null = null;
  private terminalChangeDisposable: vscode.Disposable;

  constructor(
    private context: vscode.ExtensionContext,
    private configService: ConfigService
  ) {
    // Listen for terminal focus changes
    this.terminalChangeDisposable = vscode.window.onDidChangeActiveTerminal(
      (terminal) => {
        if (terminal && this.isForgeTerminal(terminal)) {
          this.lastFocusedForgeTerminal = terminal;
        }
      }
    );
  }

  // Check if terminal is a Forge terminal
  isForgeTerminal(terminal: vscode.Terminal): boolean {
    return (
      terminal.name === TERMINAL_NAME || terminal.name.startsWith(TERMINAL_NAME)
    );
  }

  // Create new Forge terminal
  createForgeTerminal(): vscode.Terminal {
    const terminal = vscode.window.createTerminal({
      name: TERMINAL_NAME,
      iconPath: {
        light: vscode.Uri.file(
          this.context.asAbsolutePath("images/favicon-dark.svg")
        ),
        dark: vscode.Uri.file(
          this.context.asAbsolutePath("images/favicon-light.svg")
        ),
      },
      location: {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: false,
      },
    });

    this.lastFocusedForgeTerminal = terminal;
    return terminal;
  }

  // Start Forge with auto-paste
  startForgeWithAutoPaste(terminal: vscode.Terminal, fileRef: string): void {
    terminal.show();
    terminal.sendText("forge", true);

    const autoPaste = this.configService.getAutoPasteEnabled();

    if (autoPaste) {
      const pasteDelay = this.configService.getPasteDelay();
      setTimeout(() => {
        terminal.sendText(fileRef, false);
      }, pasteDelay);
    }
  }

  // Get all Forge terminals
  getForgeTerminals(): vscode.Terminal[] {
    return vscode.window.terminals.filter((terminal) =>
      this.isForgeTerminal(terminal)
    );
  }

  // Get target Forge terminal (tracked or fallback)
  getTargetForgeTerminal(): vscode.Terminal | null {
    const forgeTerminals = this.getForgeTerminals();

    let targetForgeTerminal: vscode.Terminal | null = null;

    if (
      this.lastFocusedForgeTerminal !== null &&
      forgeTerminals.includes(this.lastFocusedForgeTerminal)
    ) {
      targetForgeTerminal = this.lastFocusedForgeTerminal;
    } else if (forgeTerminals.length > 0) {
      targetForgeTerminal = forgeTerminals[forgeTerminals.length - 1];
    }

    if (
      targetForgeTerminal !== null &&
      targetForgeTerminal !== this.lastFocusedForgeTerminal
    ) {
      this.lastFocusedForgeTerminal = targetForgeTerminal;
    }

    return targetForgeTerminal;
  }

  // Get disposable for terminal change listener
  getTerminalChangeDisposable(): vscode.Disposable {
    return this.terminalChangeDisposable;
  }

  // Clean up resources
  dispose(): void {
    this.terminalChangeDisposable.dispose();
  }
}


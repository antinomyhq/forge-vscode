import * as vscode from "vscode";

const TERMINAL_NAME = "forge";

export class TerminalService {
  private lastFocusedForgeTerminal: vscode.Terminal | null = null;

  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Creates a terminal on the right side of the editor
   */
  createRightSideTerminal(): vscode.Terminal {
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

    // Update our tracking since this will become the active terminal
    this.lastFocusedForgeTerminal = terminal;
    return terminal;
  }

  /**
   * Starts Forge in the terminal with auto-paste functionality
   */
  startForgeWithAutoPaste(terminal: vscode.Terminal, fileRef: string): void {
    // Start Forge in the terminal
    terminal.show();
    terminal.sendText("forge", true);

    // Auto-paste the file reference after a short delay
    setTimeout(() => {
      terminal.sendText(fileRef, true);
    }, 1000);
  }

  /**
   * Helper function to check if a terminal is a Forge terminal
   */
  isForgeTerminal(terminal: vscode.Terminal): boolean {
    return terminal.name === TERMINAL_NAME || terminal.name.startsWith(TERMINAL_NAME);
  }

  /**
   * Get the last focused Forge terminal
   */
  getLastFocusedForgeTerminal(): vscode.Terminal | null {
    return this.lastFocusedForgeTerminal;
  }

  /**
   * Set the last focused Forge terminal
   */
  setLastFocusedForgeTerminal(terminal: vscode.Terminal | null): void {
    this.lastFocusedForgeTerminal = terminal;
  }

  /**
   * Find existing Forge terminals
   */
  findExistingForgeTerminals(): vscode.Terminal[] {
    return vscode.window.terminals.filter(terminal => this.isForgeTerminal(terminal));
  }

  /**
   * Setup terminal focus change listener
   */
  setupTerminalFocusListener(): vscode.Disposable {
    return vscode.window.onDidChangeActiveTerminal((terminal) => {
      if (terminal && this.isForgeTerminal(terminal)) {
        this.lastFocusedForgeTerminal = terminal;
      }
    });
  }
}
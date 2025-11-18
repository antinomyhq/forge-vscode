import * as vscode from 'vscode';
import * as path from 'path';
import { ITerminalPort } from '../../api/ports/ITerminalPort';

/**
 * VSCodeTerminalAdapter implements ITerminalPort using VS Code's terminal API.
 * This adapter manages Forge terminals within VS Code.
 */
export class VSCodeTerminalAdapter implements ITerminalPort {
  private readonly terminalName = 'forge';
  private lastFocusedTerminal?: vscode.Terminal;
  private readonly disposables: vscode.Disposable[] = [];

  /**
   * Creates a new VSCodeTerminalAdapter
   * @param context - The VS Code extension context
   */
  constructor(private readonly context: vscode.ExtensionContext) {
    this.setupTerminalTracking();
  }

  /**
   * Sets up terminal tracking to monitor active terminal changes
   */
  private setupTerminalTracking(): void {
    const disposable = vscode.window.onDidChangeActiveTerminal((terminal) => {
      if (terminal && this.isForgeTerminalInstance(terminal)) {
        this.lastFocusedTerminal = terminal;
      }
    });
    this.disposables.push(disposable);
  }

  /**
   * Creates a new Forge terminal with custom icons
   * @returns Promise resolving to the terminal ID
   */
  public async createForgeTerminal(): Promise<string> {
    const iconPath = this.getIconPath();
    const terminal = vscode.window.createTerminal({
      name: this.terminalName,
      iconPath,
      location: {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: false,
      },
    });

    // Track this terminal
    this.lastFocusedTerminal = terminal;

    return this.getTerminalId(terminal);
  }

  /**
   * Gets all active Forge terminal IDs
   * @returns Array of terminal IDs
   */
  public getForgeTerminals(): string[] {
    return vscode.window.terminals
      .filter((t) => this.isForgeTerminalInstance(t))
      .map((t) => this.getTerminalId(t));
  }

  /**
   * Checks if a terminal ID represents a Forge terminal
   * @param terminalId - The terminal ID to check
   * @returns true if this is a Forge terminal
   */
  public isForgeTerminal(terminalId: string): boolean {
    return terminalId.startsWith(`${this.terminalName}-`);
  }

  /**
   * Focuses a terminal by ID without revealing it
   * @param terminalId - The terminal ID to focus
   */
  public async focusTerminal(terminalId: string): Promise<void> {
    const terminal = this.findTerminalById(terminalId);
    if (terminal) {
      terminal.show(false); // false = don't take focus
      this.lastFocusedTerminal = terminal;
    }
  }

  /**
   * Sends text to a terminal with an optional delay
   * @param terminalId - The terminal ID to send text to
   * @param text - The text to send
   * @param delay - Delay in milliseconds before sending
   * @param addNewLine - Whether to add a newline after the text (default: false)
   */
  public async sendText(terminalId: string, text: string, delay: number, addNewLine: boolean = false): Promise<void> {
    const terminal = this.findTerminalById(terminalId);
    if (!terminal) {
      throw new Error(`Terminal not found: ${terminalId}`);
    }

    if (delay > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          terminal.sendText(text, addNewLine);
          resolve();
        }, delay);
      });
    } else {
      terminal.sendText(text, addNewLine);
    }
  }

  /**
   * Gets the ID of the last focused Forge terminal
   * @returns The terminal ID, or undefined if no terminal or terminal is disposed
   */
  public getLastFocusedForgeTerminal(): string | undefined {
    if (this.lastFocusedTerminal && this.lastFocusedTerminal.exitStatus === undefined) {
      return this.getTerminalId(this.lastFocusedTerminal);
    }
    return undefined;
  }

  /**
   * Shows a terminal by ID, revealing it in the UI
   * @param terminalId - The terminal ID to show
   */
  public showTerminal(terminalId: string): void {
    const terminal = this.findTerminalById(terminalId);
    if (terminal) {
      terminal.show(true); // true = take focus
    }
  }

  /**
   * Checks if a VS Code terminal instance is a Forge terminal
   * @param terminal - The terminal to check
   * @returns true if this is a Forge terminal
   */
  private isForgeTerminalInstance(terminal: vscode.Terminal): boolean {
    return terminal.name === this.terminalName;
  }

  /**
   * Finds a terminal by its ID
   * @param terminalId - The terminal ID to find
   * @returns The terminal instance, or undefined if not found
   */
  private findTerminalById(terminalId: string): vscode.Terminal | undefined {
    return vscode.window.terminals.find(
      (t) => this.getTerminalId(t) === terminalId && t.exitStatus === undefined
    );
  }

  /**
   * Generates a unique ID for a terminal
   * @param terminal - The terminal to generate an ID for
   * @returns A unique terminal ID
   */
  private getTerminalId(terminal: vscode.Terminal): string {
    // Use terminal name and process ID if available
    // This is a simplified ID generation - in production you might want something more robust
    const timestamp = Date.now();
    return `${terminal.name}-${timestamp}`;
  }

  /**
   * Gets the icon path for Forge terminals
   * @returns Icon path with light and dark variants
   */
  private getIconPath(): { light: vscode.Uri; dark: vscode.Uri } | undefined {
    try {
      // Use images/favicon-dark.svg for light theme (dark icon on light background)
      // Use images/favicon-light.svg for dark theme (light icon on dark background)
      const lightIconPath = path.join(this.context.extensionPath, 'images', 'favicon-dark.svg');
      const darkIconPath = path.join(this.context.extensionPath, 'images', 'favicon-light.svg');

      return {
        light: vscode.Uri.file(lightIconPath),
        dark: vscode.Uri.file(darkIconPath),
      };
    } catch {
      // If icons don't exist, return undefined
      return undefined;
    }
  }

  /**
   * Disposes of all event listeners
   */
  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}

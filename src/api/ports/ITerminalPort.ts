/**
 * ITerminalPort defines the contract for terminal operations.
 * This port abstracts terminal management, allowing different implementations
 * (VS Code terminals, test mocks, etc.)
 * 
 * All terminal operations work with Forge-specific terminals (identified by name).
 */
export interface ITerminalPort {
  /**
   * Creates a new Forge terminal
   * The terminal should be named 'forge' and include appropriate icons
   * @returns Promise resolving to the terminal ID
   */
  createForgeTerminal(): Promise<string>;

  /**
   * Gets all active Forge terminal IDs
   * @returns Array of terminal IDs for all Forge terminals
   */
  getForgeTerminals(): string[];

  /**
   * Checks if a terminal ID represents a Forge terminal
   * @param terminalId - The terminal ID to check
   * @returns true if this is a Forge terminal
   */
  isForgeTerminal(terminalId: string): boolean;

  /**
   * Focuses a terminal by ID without revealing it
   * This brings the terminal into focus but doesn't necessarily show it
   * @param terminalId - The terminal ID to focus
   * @returns Promise that resolves when focus is complete
   */
  focusTerminal(terminalId: string): Promise<void>;

  /**
   * Sends text to a terminal with an optional delay
   * @param terminalId - The terminal ID to send text to
   * @param text - The text to send
   * @param delay - Delay in milliseconds before sending (0 for immediate)
   * @param addNewLine - Whether to add a newline after the text (default: false)
   * @returns Promise that resolves when text is sent
   */
  sendText(terminalId: string, text: string, delay: number, addNewLine?: boolean): Promise<void>;

  /**
   * Gets the ID of the last focused Forge terminal
   * @returns The terminal ID, or undefined if no Forge terminal was focused
   */
  getLastFocusedForgeTerminal(): string | undefined;

  /**
   * Shows a terminal by ID, revealing it in the UI
   * @param terminalId - The terminal ID to show
   */
  showTerminal(terminalId: string): void;
}

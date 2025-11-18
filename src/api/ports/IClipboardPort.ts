/**
 * IClipboardPort defines the contract for clipboard operations.
 * This port abstracts clipboard access, allowing different implementations
 * (VS Code clipboard, test mocks, etc.)
 */
export interface IClipboardPort {
  /**
   * Writes text to the clipboard
   * @param text - The text to write to clipboard
   * @returns Promise that resolves when write is complete
   */
  write(text: string): Promise<void>;

  /**
   * Reads text from the clipboard
   * @returns Promise resolving to the clipboard text content
   */
  read(): Promise<string>;
}

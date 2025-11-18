import * as vscode from 'vscode';
import { IClipboardPort } from '../../api/ports/IClipboardPort';

/**
 * VSCodeClipboardAdapter implements IClipboardPort using VS Code's clipboard API.
 * This adapter provides access to the system clipboard.
 */
export class VSCodeClipboardAdapter implements IClipboardPort {
  /**
   * Writes text to the clipboard
   * @param text - The text to write to clipboard
   */
  public async write(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
  }

  /**
   * Reads text from the clipboard
   * @returns Promise resolving to the clipboard text content
   */
  public async read(): Promise<string> {
    return await vscode.env.clipboard.readText();
  }
}

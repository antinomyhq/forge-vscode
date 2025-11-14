import * as vscode from "vscode";

export class ClipboardService {
  /**
   * Copy text to clipboard using VSCode's clipboard API
   */
  async copyToClipboard(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
  }

  /**
   * Read text from clipboard using VSCode's clipboard API
   */
  async readFromClipboard(): Promise<string> {
    return await vscode.env.clipboard.readText();
  }

  /**
   * Copy file reference to clipboard with optional notification
   */
  async copyFileReference(fileRef: string, message?: string): Promise<void> {
    await this.copyToClipboard(fileRef);
    
    if (message) {
      // Note: The notification will be handled by the calling code
      // since it depends on user configuration
    }
  }
}
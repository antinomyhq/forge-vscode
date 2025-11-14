import * as vscode from "vscode";
import { TerminalService } from "../services/TerminalService";
import { ProcessService } from "../services/ProcessService";
import { showNotificationIfEnabled } from "../utils/notifications";

const CLIPBOARD_MESSAGE =
  "File reference copied to clipboard. Paste it in any forge terminal when ready.";
import { getFileReference } from "../utils/fileUtils";

const FORGE_STARTING_MESSAGE =
  "Forge is starting... File reference copied to clipboard. Paste it when ready.";

export class ForgeSessionCommand {
  constructor(
    private terminalService: TerminalService,
    private processService: ProcessService
  ) {}

  /**
   * Start a new Forge session
   */
  startNewForgeSession(): void {
    // Create and start new Forge terminal
    const terminal = this.terminalService.createRightSideTerminal();
    terminal.show();
    terminal.sendText("forge", true);

    // Copy file reference to clipboard
    const fileRef = getFileReference();
    if (fileRef) {
      // Auto-paste the file reference after a short delay
      setTimeout(() => {
        terminal.sendText(fileRef, true);
      }, 1000);
      
      showNotificationIfEnabled(FORGE_STARTING_MESSAGE, 'info');
    } else {
      showNotificationIfEnabled("No file found.", 'warning');
    }
  }

  /**
   * Copy file reference and paste to existing Forge terminal
   */
  async copyFileReferenceAndPaste(): Promise<void> {
    const fileRef = getFileReference();
    if (!fileRef) {
      showNotificationIfEnabled("No file found.", 'warning');
      return;
    }

    // Copy to clipboard
    await vscode.env.clipboard.writeText(fileRef);

    // Check if Forge is running externally
    const isForgeRunning = await this.processService.checkExternalForgeProcess();
    if (isForgeRunning) {
      showNotificationIfEnabled(CLIPBOARD_MESSAGE, 'info');
      return;
    }

    // Find existing Forge terminals
    const existingForgeTerminals = this.terminalService.findExistingForgeTerminals();
    if (existingForgeTerminals.length > 0) {
      // Use the most recently focused Forge terminal
      const lastFocused = this.terminalService.getLastFocusedForgeTerminal();
      const targetTerminal = lastFocused && existingForgeTerminals.includes(lastFocused)
        ? lastFocused
        : existingForgeTerminals[existingForgeTerminals.length - 1];

      // Auto-paste the file reference
      this.terminalService.startForgeWithAutoPaste(targetTerminal, fileRef);
      showNotificationIfEnabled(FORGE_STARTING_MESSAGE, 'info');
    } else {
      // No Forge terminal exists, create a new one
      const terminal = this.terminalService.createRightSideTerminal();
      this.terminalService.startForgeWithAutoPaste(terminal, fileRef);
      showNotificationIfEnabled(FORGE_STARTING_MESSAGE, 'info');
    }
  }
}
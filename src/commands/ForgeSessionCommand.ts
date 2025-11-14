import * as vscode from "vscode";
import { TerminalService } from "../services/TerminalService";
import { ProcessService } from "../services/ProcessService";
import { showNotificationIfEnabled } from "../utils/notifications";
import { showCopyReferenceInActivityBar } from "../utils/statusBar";
import { getFileReference } from "../utils/fileUtils";

const CLIPBOARD_MESSAGE =
  "File reference copied to clipboard. Paste it in any forge terminal when ready.";

const FORGE_STARTING_MESSAGE =
  "Forge is starting... File reference copied to clipboard. Paste it when ready.";

export class ForgeSessionCommand {
  constructor(
    private terminalService: TerminalService,
    private processService: ProcessService
  ) {}

  /**
   * Copy file reference - main command bound to Ctrl+U
   * Handles terminal opening logic based on configuration
   */
  // eslint-disable-next-line complexity, max-lines-per-function
  async copyFileReference(): Promise<void> {
    const fileRef = getFileReference();
    if (!fileRef) {
      showNotificationIfEnabled("No file found.", 'warning');
      return;
    }

    // Always copy to clipboard first
    await vscode.env.clipboard.writeText(fileRef);

    const openTerminal = vscode.workspace
      .getConfiguration("forge")
      .get<string>("openTerminal", "once");

    if (openTerminal === "never") {
      showCopyReferenceInActivityBar("File reference copied to clipboard.");
      return;
    }

    // Once mode (default): Open terminal once and reuse it, copy when ambiguous
    // Check if Forge is running externally and get process count
    const externalRunning = await this.processService.checkExternalForgeProcess();
    const totalForgeProcesses = await this.processService.checkForgeProcessCount();

    // Find all Forge terminals in VS Code
    const forgeTerminals = this.terminalService.findExistingForgeTerminals();

    // Get the target Forge terminal: tracked one if valid, otherwise fallback
    const lastFocused = this.terminalService.getLastFocusedForgeTerminal();
    const targetForgeTerminal =
      lastFocused && forgeTerminals.includes(lastFocused)
        ? lastFocused
        : forgeTerminals[forgeTerminals.length - 1] || null;

    // Check for different scenarios
    const hasMultipleForgeTerminals = forgeTerminals.length > 1;

    // Scenario 1: Multiple Forge terminals exist
    // Show clipboard message and let user manually paste to avoid ambiguity
    if (hasMultipleForgeTerminals) {
      showCopyReferenceInActivityBar(CLIPBOARD_MESSAGE);
      return;
    }

    // Scenario 2: Both external and internal Forge processes detected
    // Show clipboard message to avoid conflicts between processes
    const hasBothExternalAndInternal =
      externalRunning &&
      targetForgeTerminal &&
      totalForgeProcesses > forgeTerminals.length;

    if (hasBothExternalAndInternal) {
      showCopyReferenceInActivityBar(CLIPBOARD_MESSAGE);
      return;
    }

    // Scenario 3: Single Forge terminal exists - reuse it
    if (targetForgeTerminal && forgeTerminals.length === 1) {
      targetForgeTerminal.show();

      const autoPaste = vscode.workspace
        .getConfiguration("forge")
        .get<boolean>("autoPaste", true);

      if (autoPaste) {
        targetForgeTerminal.sendText(fileRef, false);
        showCopyReferenceInActivityBar("File reference pasted to terminal");
      } else {
        showCopyReferenceInActivityBar("File reference copied to clipboard");
      }
      return;
    }

    // Scenario 4: No Forge terminal in VS Code and no external Forge
    // Create new terminal and auto-paste after startup delay
    if (!externalRunning && forgeTerminals.length === 0) {
      const terminal = this.terminalService.createRightSideTerminal();
      this.terminalService.startForgeWithAutoPaste(terminal, fileRef);
      showNotificationIfEnabled("New Forge terminal created.", 'info');
      showCopyReferenceInActivityBar("File reference will be pasted automatically");
      return;
    }

    // Scenario 5: Forge running externally only
    // Prompt user to either continue externally or launch inside VS Code
    if (externalRunning && !targetForgeTerminal) {
      showCopyReferenceInActivityBar(
        "File reference copied to clipboard. Paste in external Forge terminal."
      );

      const notificationConfig = vscode.workspace
        .getConfiguration("forge")
        .get<{info: boolean, warning: boolean, error: boolean}>("notifications");

      if (notificationConfig?.info) {
        const action = await vscode.window.showInformationMessage(
          `Forge is running in an external terminal. File reference copied - paste it there to continue.`,
          {
            modal: false,
            detail:
              "You can continue in the external terminal or launch Forge inside VS Code.",
          },
          "Launch Forge Inside VSCode"
        );

        if (action === "Launch Forge Inside VSCode") {
          const terminal = this.terminalService.createRightSideTerminal();
          this.terminalService.startForgeWithAutoPaste(terminal, fileRef);
          showNotificationIfEnabled(FORGE_STARTING_MESSAGE, 'info');
        }
      }
      return;
    }
  }

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
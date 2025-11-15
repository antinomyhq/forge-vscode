import * as vscode from "vscode";
import {
  CLIPBOARD_MESSAGE,
  FILE_REFERENCE_COPIED_MESSAGE,
  FILE_REFERENCE_WILL_BE_PASTED_MESSAGE,
  FORGE_STARTING_MESSAGE,
  NEW_FORGE_SESSION_MESSAGE,
  NO_FILE_FOUND_MESSAGE,
} from "../constants";
import { ConfigService } from "./configService";
import { FileReferenceService } from "./fileReferenceService";
import { NotificationService } from "./notificationService";
import { ProcessService } from "./processService";
import { TerminalService } from "./terminalService";

// Handles all Forge command logic
export class CommandService {
  constructor(
    private configService: ConfigService,
    private processService: ProcessService,
    private fileReferenceService: FileReferenceService,
    private notificationService: NotificationService,
    private terminalService: TerminalService
  ) {}

  // Start new Forge session
  async startNewForgeSession(): Promise<void> {
    const terminal = this.terminalService.createForgeTerminal();
    terminal.show();
    terminal.sendText("forge", true);

    // Copy current file reference to clipboard
    const fileRef = this.fileReferenceService.getFileReference();
    if (fileRef) {
      await vscode.env.clipboard.writeText(fileRef);

      // Check if auto-paste is enabled
      const autoPaste = this.configService.getAutoPasteEnabled();

      if (autoPaste) {
        const pasteDelay = this.configService.getPasteDelay();
        setTimeout(() => {
          terminal.sendText(fileRef, false);
        }, pasteDelay);

        this.notificationService.showNotificationIfEnabled(
          NEW_FORGE_SESSION_MESSAGE,
          "info"
        );
        this.notificationService.showCopyReferenceInActivityBar(
          FILE_REFERENCE_WILL_BE_PASTED_MESSAGE
        );
      } else {
        this.notificationService.showNotificationIfEnabled(
          NEW_FORGE_SESSION_MESSAGE,
          "info"
        );
        this.notificationService.showCopyReferenceInActivityBar(
          FILE_REFERENCE_COPIED_MESSAGE
        );
      }
    } else {
      this.notificationService.showNotificationIfEnabled(
        NEW_FORGE_SESSION_MESSAGE,
        "info"
      );
    }
  }

  // Copy file reference with terminal mode logic
  async copyFileReference(): Promise<void> {
    const fileRef = this.fileReferenceService.getFileReference();
    if (!fileRef) {
      this.notificationService.showNotificationIfEnabled(
        NO_FILE_FOUND_MESSAGE,
        "warning"
      );
      return;
    }

    // Always copy to clipboard first
    await vscode.env.clipboard.writeText(fileRef);

    const openTerminal = this.configService.getOpenTerminalMode();

    if (openTerminal === "never") {
      this.notificationService.showCopyReferenceInActivityBar(
        "File reference copied to clipboard."
      );
      return;
    }

    // Once mode (default): Open terminal once and reuse it, copy when ambiguous
    const externalRunning = await this.processService.checkExternalForgeProcess();
    const totalForgeProcesses = await this.processService.checkForgeProcessCount();

    const forgeTerminals = this.terminalService.getForgeTerminals();
    const targetForgeTerminal = this.terminalService.getTargetForgeTerminal();

    const hasMultipleForgeTerminals = forgeTerminals.length > 1;

    // Scenario 1: Multiple Forge terminals exist
    // Show clipboard message and let user manually paste to avoid ambiguity
    if (hasMultipleForgeTerminals) {
      this.notificationService.showCopyReferenceInActivityBar(CLIPBOARD_MESSAGE);
      return;
    }

    // Scenario 2: Both external and internal Forge processes detected
    // Show clipboard message to avoid conflicts between processes
    const hasBothExternalAndInternal =
      externalRunning &&
      targetForgeTerminal &&
      totalForgeProcesses > forgeTerminals.length;

    if (hasBothExternalAndInternal) {
      this.notificationService.showCopyReferenceInActivityBar(CLIPBOARD_MESSAGE);
      return;
    }

    // Scenario 3: Single Forge terminal exists - reuse it
    if (targetForgeTerminal && forgeTerminals.length === 1) {
      targetForgeTerminal.show();

      const autoPaste = this.configService.getAutoPasteEnabled();

      if (autoPaste) {
        targetForgeTerminal.sendText(fileRef, false);
        this.notificationService.showCopyReferenceInActivityBar(
          "File reference pasted to terminal"
        );
      } else {
        this.notificationService.showCopyReferenceInActivityBar(
          FILE_REFERENCE_COPIED_MESSAGE
        );
      }
      return;
    }

    // Scenario 4: No Forge terminal in VS Code and no external Forge
    if (!externalRunning && forgeTerminals.length === 0) {
      const terminal = this.terminalService.createForgeTerminal();
      this.terminalService.startForgeWithAutoPaste(terminal, fileRef);
      this.notificationService.showNotificationIfEnabled(
        "New Forge terminal created.",
        "info"
      );
      this.notificationService.showCopyReferenceInActivityBar(
        FILE_REFERENCE_WILL_BE_PASTED_MESSAGE
      );
      return;
    }

    // Scenario 5: Forge running externally only
    // Prompt user to either continue externally or launch inside VS Code
    if (externalRunning && !targetForgeTerminal) {
      this.notificationService.showCopyReferenceInActivityBar(
        "File reference copied to clipboard. Paste in external Forge terminal."
      );

      const notificationConfig = this.configService.getNotificationConfig();

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
          const terminal = this.terminalService.createForgeTerminal();
          this.terminalService.startForgeWithAutoPaste(terminal, fileRef);
          this.notificationService.showNotificationIfEnabled(
            FORGE_STARTING_MESSAGE,
            "info"
          );
        }
      }
      return;
    }
  }

  // Copy file reference with specific format (for context menu commands)
  async copyFileReferenceWithFormat(
    format: "absolute" | "relative"
  ): Promise<void> {
    const fileRef = this.fileReferenceService.getFileReference(format);
    if (!fileRef) {
      this.notificationService.showNotificationIfEnabled(
        NO_FILE_FOUND_MESSAGE,
        "warning"
      );
      return;
    }

    // Always just copy to clipboard for context menu commands
    await vscode.env.clipboard.writeText(fileRef);

    const formatLabel = format === "absolute" ? "absolute" : "relative";
    this.notificationService.showCopyReferenceInActivityBar(
      `File reference (${formatLabel} path) copied to clipboard`
    );
  }
}


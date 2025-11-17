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
    if (fileRef !== undefined) {
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
    if (fileRef === undefined) {
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

    await this.handleTerminalModeLogic(fileRef);
  }

  // Handle terminal mode logic for file reference copying
  private async handleTerminalModeLogic(fileRef: string): Promise<void> {
    const externalRunning = await this.processService.checkExternalForgeProcess();
    const totalForgeProcesses = await this.processService.checkForgeProcessCount();
    const forgeTerminals = this.terminalService.getForgeTerminals();
    const targetForgeTerminal = this.terminalService.getTargetForgeTerminal();

    // Scenario 1: Multiple Forge terminals exist
    if (forgeTerminals.length > 1) {
      this.notificationService.showCopyReferenceInActivityBar(CLIPBOARD_MESSAGE);
      return;
    }

    // Scenario 2: Both external and internal Forge processes detected
    if (this.hasBothExternalAndInternal(externalRunning, targetForgeTerminal, totalForgeProcesses, forgeTerminals)) {
      this.notificationService.showCopyReferenceInActivityBar(CLIPBOARD_MESSAGE);
      return;
    }

    // Scenario 3: Single Forge terminal exists - reuse it
    if (targetForgeTerminal !== null && forgeTerminals.length === 1) {
      this.handleSingleTerminalScenario(targetForgeTerminal, fileRef);
      return;
    }

    // Scenario 4: No Forge terminal in VS Code and no external Forge
    if (externalRunning === false && forgeTerminals.length === 0) {
      this.handleNoTerminalScenario(fileRef);
      return;
    }

    // Scenario 5: Forge running externally only
    if (externalRunning === true && targetForgeTerminal === null) {
      await this.handleExternalForgeScenario(fileRef);
    }
  }

  // Check if both external and internal Forge processes exist
  private hasBothExternalAndInternal(
    externalRunning: boolean,
    targetForgeTerminal: vscode.Terminal | null,
    totalForgeProcesses: number,
    forgeTerminals: vscode.Terminal[]
  ): boolean {
    return (
      externalRunning === true &&
      targetForgeTerminal !== null &&
      totalForgeProcesses > forgeTerminals.length
    );
  }

  // Handle scenario where single Forge terminal exists
  private handleSingleTerminalScenario(terminal: vscode.Terminal, fileRef: string): void {
    terminal.show();
    const autoPaste = this.configService.getAutoPasteEnabled();

    if (autoPaste) {
      terminal.sendText(fileRef, false);
      this.notificationService.showCopyReferenceInActivityBar("File reference pasted to terminal");
    } else {
      this.notificationService.showCopyReferenceInActivityBar(FILE_REFERENCE_COPIED_MESSAGE);
    }
  }

  // Handle scenario where no Forge terminal exists
  private handleNoTerminalScenario(fileRef: string): void {
    const terminal = this.terminalService.createForgeTerminal();
    this.terminalService.startForgeWithAutoPaste(terminal, fileRef);
    this.notificationService.showNotificationIfEnabled("New Forge terminal created.", "info");
    this.notificationService.showCopyReferenceInActivityBar(FILE_REFERENCE_WILL_BE_PASTED_MESSAGE);
  }

  // Handle scenario where Forge is running externally
  private async handleExternalForgeScenario(fileRef: string): Promise<void> {
    this.notificationService.showCopyReferenceInActivityBar(
      "File reference copied to clipboard. Paste in external Forge terminal."
    );

    const notificationConfig = this.configService.getNotificationConfig();
    if (notificationConfig?.info === true) {
      const action = await vscode.window.showInformationMessage(
        `Forge is running in an external terminal. File reference copied - paste it there to continue.`,
        {
          modal: false,
          detail: "You can continue in the external terminal or launch Forge inside VS Code.",
        },
        "Launch Forge Inside VSCode"
      );

      if (action === "Launch Forge Inside VSCode") {
        const terminal = this.terminalService.createForgeTerminal();
        this.terminalService.startForgeWithAutoPaste(terminal, fileRef);
        this.notificationService.showNotificationIfEnabled(FORGE_STARTING_MESSAGE, "info");
      }
    }
  }

  // Copy file reference with specific format (for context menu commands)
  async copyFileReferenceWithFormat(
    format: "absolute" | "relative"
  ): Promise<void> {
    const fileRef = this.fileReferenceService.getFileReference(format);
    if (fileRef === undefined) {
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


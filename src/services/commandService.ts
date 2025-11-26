import * as vscode from "vscode";
import * as semver from "semver";
import {
  CLIPBOARD_MESSAGE,
  COMMIT_MESSAGE_GENERATION_STOPPED,
  FILE_REFERENCE_COPIED_MESSAGE,
  FILE_REFERENCE_WILL_BE_PASTED_MESSAGE,
  FORGE_NOT_INSTALLED_MESSAGE,
  FORGE_STARTING_MESSAGE,
  FORGE_VERSION_OUTDATED_MESSAGE,
  MIN_FORGE_VERSION_FOR_COMMIT,
  NEW_FORGE_SESSION_MESSAGE,
  NO_FILE_FOUND_MESSAGE,
  NO_GIT_REPO_MESSAGE,
  NO_WORKSPACE_MESSAGE,
} from "../constants";
import { ConfigService } from "./configService";
import { FileReferenceService } from "./fileReferenceService";
import { GitService } from "./gitService";
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
    private terminalService: TerminalService,
    private gitService: GitService
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
    if (
      this.hasBothExternalAndInternal(
        externalRunning,
        targetForgeTerminal,
        totalForgeProcesses,
        forgeTerminals
      )
    ) {
      this.notificationService.showCopyReferenceInActivityBar(
        CLIPBOARD_MESSAGE
      );
      return;
    }

    // Scenario 3: Single Forge terminal exists - reuse it
    if (targetForgeTerminal !== null && forgeTerminals.length === 1) {
      this.handleSingleTerminalScenario(targetForgeTerminal, fileRef);
      return;
    }

    // Scenario 4: No Forge terminal in VS Code and no external Forge
    if (externalRunning === false && forgeTerminals.length === 0) {
      await this.handleNoTerminalScenario(fileRef);
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
  private handleSingleTerminalScenario(
    terminal: vscode.Terminal,
    fileRef: string
  ): void {
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
  private async handleNoTerminalScenario(fileRef: string): Promise<void> {
    // Check if Forge is installed before trying to start it
    const forgeVersion = await this.processService.getForgeVersion();

    if (forgeVersion === null) {
      // Forge not installed - always show installation prompt
      const action = await vscode.window.showErrorMessage(
        FORGE_NOT_INSTALLED_MESSAGE,
        "Install Forge"
      );

      if (action === "Install Forge") {
        await this.installForge();
      }
      return;
    }

    // Forge is installed - proceed normally
    const terminal = this.terminalService.createForgeTerminal();
    this.terminalService.startForgeWithAutoPaste(terminal, fileRef);
    this.notificationService.showNotificationIfEnabled(
      "New Forge terminal created.",
      "info"
    );
    this.notificationService.showCopyReferenceInActivityBar(
      FILE_REFERENCE_WILL_BE_PASTED_MESSAGE
    );
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
          detail:
            "You can continue in the external terminal or launch Forge inside VS Code.",
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

  // Copy file/folder reference with absolute or relative path
  async copyFileReferenceWithFormat(
    format: "absolute" | "relative",
    uri?: vscode.Uri
  ): Promise<void> {
    const fileRef = this.fileReferenceService.getFileReference(format, uri);
    if (fileRef === undefined) {
      this.notificationService.showNotificationIfEnabled(
        NO_FILE_FOUND_MESSAGE,
        "warning"
      );
      return;
    }

    await vscode.env.clipboard.writeText(fileRef);

    const isFolder = uri ? await this.isDirectory(uri) : false;
    const resourceType = isFolder ? "Folder" : "File";
    const formatLabel = format === "absolute" ? "absolute" : "relative";

    this.notificationService.showCopyReferenceInActivityBar(
      `${resourceType} reference (${formatLabel} path) copied to clipboard`
    );
  }

  private async isDirectory(uri: vscode.Uri): Promise<boolean> {
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      return stat.type === vscode.FileType.Directory;
    } catch {
      return false;
    }
  }

  // Generate commit message using Forge AI
  async generateCommitMessage(): Promise<void> {
    try {
      const maxDiffSize = this.configService.getCommitMessageMaxDiffSize();
      const forgePath = "forge";
      const workingDir = this.gitService.getWorkspacePath();

      if (workingDir === undefined) {
        this.notificationService.showNotificationIfEnabled(NO_WORKSPACE_MESSAGE, "error");
        return;
      }

      // Validate Git repository
      const repository = this.gitService.getRepository();
      if (repository === null) {
        this.notificationService.showNotificationIfEnabled(
          NO_GIT_REPO_MESSAGE,
          "error"
        );
        return;
      }

      // Check Forge version before proceeding
      const forgeVersion = await this.processService.getForgeVersion(forgePath);

      // No version = Forge not installed
      if (forgeVersion === null) {
        const action = await vscode.window.showErrorMessage(
          FORGE_NOT_INSTALLED_MESSAGE,
          "Install Forge"
        );

        if (action === "Install Forge") {
          await this.installForge();
        }
        return;
      }

      // Version < 1.5.0 = Outdated
      if (semver.lt(forgeVersion, MIN_FORGE_VERSION_FOR_COMMIT) === true) {
        const action = await vscode.window.showWarningMessage(
          `${FORGE_VERSION_OUTDATED_MESSAGE} (Current: ${forgeVersion}, Required: ${MIN_FORGE_VERSION_FOR_COMMIT}+)`,
          "Update to Latest Version"
        );

        if (action === "Update to Latest Version") {
          await this.updateToLatestVersion();
        }
        return;
      }

      // Set context to show stop button
      await vscode.commands.executeCommand("setContext", "forge.generatingCommitMessage", true);

      try {
        await this.runCommitMessageGeneration(
          forgePath,
          maxDiffSize,
          workingDir
        );
      } catch (error) {
        await this.clearCommitMessageGenerationState();
        this.notificationService.showNotificationIfEnabled(
          `Error generating commit message: ${error}`,
          "error"
        );
      }
    } catch (error) {
      this.notificationService.showNotificationIfEnabled(
        `Error generating commit message: ${error}`,
        "error"
      );
    }
  }

  // Run commit message generation with progress
  private async runCommitMessageGeneration(
    forgePath: string,
    maxDiffSize: number,
    workingDir: string
  ): Promise<void> {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.SourceControl,
        title: "Generating commit message...",
        cancellable: false,
      },
      async () => {
        return new Promise<void>((resolve) => {
          const forgeProcess = this.processService.spawnCommitMessageProcess(
            forgePath,
            maxDiffSize,
            workingDir
          );

          let stdout = "";
          let stderr = "";

          // Capture stdout
          forgeProcess.stdout?.on("data", (data: Buffer) => {
            stdout += data.toString();
          });

          // Capture stderr
          forgeProcess.stderr?.on("data", (data: Buffer) => {
            stderr += data.toString();
          });

          forgeProcess.on("error", (error: Error) => {
            void this.handleCommitMessageProcessError(error, resolve);
          });

          forgeProcess.on("close", (code: number | null, signal: string | null) => {
            void this.handleCommitMessageProcessClose(code, signal, stdout, stderr, resolve);
          });
        });
      }
    );
  }

  private async handleCommitMessageProcessError(error: Error, resolve: () => void): Promise<void> {
    await this.clearCommitMessageGenerationState();
    this.notificationService.showNotificationIfEnabled(
      `Failed to spawn forge: ${error.message}`,
      "error"
    );
    resolve();
  }

  private async handleCommitMessageProcessClose(
    code: number | null,
    signal: string | null,
    stdout: string,
    stderr: string,
    resolve: () => void
  ): Promise<void> {
    await this.clearCommitMessageGenerationState();

    // If process was killed by signal (user stopped it)
    if (signal !== null) {
      this.notificationService.showNotificationIfEnabled(
        COMMIT_MESSAGE_GENERATION_STOPPED,
        "info"
      );
      resolve();
      return;
    }

    // If process failed
    if (code !== 0) {
      this.notificationService.showNotificationIfEnabled(
        `Failed to generate commit message: ${stderr || `Exit code ${code}`}`,
        "error"
      );
      resolve();
      return;
    }

    // Success - parse and set commit message
    const output = stdout.trim();
    const errorOutput = stderr.trim();

    // Check if Forge CLI returned an error message in stdout (e.g., "⏺ [13:35:10] ERROR: No changes to commit")
    if (output.includes("ERROR:")) {
      const errorMatch = output.match(/ERROR:\s*(.+)/);
      const errorMessage = errorMatch
        ? errorMatch[1].trim()
        : "Failed to generate commit message";

      this.notificationService.showNotificationIfEnabled(
        errorMessage,
        "warning"
      );
      resolve();
      return;
    }

    // Strip the Forge CLI prefix (e.g., "⏺ [21:48:59] Generated commit message:")
    let commitMessage = output;
    const lines = commitMessage.split("\n");
    if (lines.length > 0 && lines[0].includes("Generated commit message:")) {
      commitMessage = lines.slice(1).join("\n").trim();
    }

    // Check if commit message is empty
    if (!commitMessage) {
      // If stderr has content, show it; otherwise show a user-friendly message
      const errorMessage =
        errorOutput || "No changes detected to generate commit message";

      this.notificationService.showNotificationIfEnabled(
        errorMessage,
        "warning"
      );
      resolve();
      return;
    }

    // Set the commit message in SCM input box
    void this.gitService.setCommitMessage(commitMessage);
    resolve();
  }

  // Clear commit message generation state
  private async clearCommitMessageGenerationState(): Promise<void> {
    this.processService.clearCommitMessageProcess();
    await vscode.commands.executeCommand(
      "setContext",
      "forge.generatingCommitMessage",
      false
    );
  }

  // Stop commit message generation
  async stopCommitMessageGeneration(): Promise<void> {
    this.processService.stopCommitMessageProcess();
  }

  // Install Forge (runs npm install -g forgecode@latest)
  async installForge(): Promise<void> {
    const terminal = vscode.window.createTerminal({
      name: "Install Forge",
      hideFromUser: false,
    });

    terminal.show();
    terminal.sendText("npm install -g forgecode@latest", true);

    this.notificationService.showNotificationIfEnabled(
      "Installing Forge...",
      "info"
    );
  }

  // Update to latest version (runs npm install -g forgecode@latest)
  async updateToLatestVersion(): Promise<void> {
    const terminal = vscode.window.createTerminal({
      name: "Update Forge",
      hideFromUser: false,
    });

    terminal.show();
    terminal.sendText("npm install -g forgecode@latest", true);

    this.notificationService.showNotificationIfEnabled(
      "Updating Forge to the latest version...",
      "info"
    );
  }
}

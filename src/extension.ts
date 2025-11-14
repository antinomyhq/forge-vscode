import * as vscode from "vscode";
import {
	CLIPBOARD_MESSAGE,
	FORGE_STARTING_MESSAGE,
	NO_FILE_FOUND_MESSAGE,
	NEW_FORGE_SESSION_MESSAGE,
	FILE_REFERENCE_WILL_BE_PASTED_MESSAGE,
	FILE_REFERENCE_COPIED_MESSAGE,
} from "./constants";
import { ConfigService } from "./services/configService";
import { ProcessService } from "./services/processService";
import { FileReferenceService } from "./services/fileReferenceService";
import { NotificationService } from "./services/notificationService";
import { TerminalService } from "./services/terminalService";

// Global reference to notification service for cleanup in deactivate()
let notificationService: NotificationService | null = null;

// This method is called when your extension is deactivated
export function deactivate() {
  // Clean up notification service resources
  if (notificationService) {
    notificationService.dispose();
    notificationService = null;
  }
}

// Notification functions moved to services/notificationService.ts



export function activate(context: vscode.ExtensionContext) {
  // Initialize services
  const configService = new ConfigService();
  const processService = new ProcessService();
  const fileReferenceService = new FileReferenceService(configService);
  const localNotificationService = new NotificationService(configService);
  const terminalService = new TerminalService(context, configService);

  // Store reference for cleanup in deactivate()
  notificationService = localNotificationService;

  let startNewForgeSessionDisposable = vscode.commands.registerCommand(
    "forgecode.startNewForgeSession",
    async () => {
      await startNewForgeSession();
    }
  );

  // Register Ctrl+U command - respects user settings
  let copyFileReferenceDisposable = vscode.commands.registerCommand(
    "forgecode.copyFileReference",
    async () => {
      await copyFileReference();
    }
  );

  // Register context menu commands - force specific path formats
  let copyFileReferenceAbsoluteDisposable = vscode.commands.registerCommand(
    "forgecode.copyFileReferenceAbsolute",
    async () => {
      await copyFileReferenceWithFormat("absolute");
    }
  );

  let copyFileReferenceRelativeDisposable = vscode.commands.registerCommand(
    "forgecode.copyFileReferenceRelative",
    async () => {
      await copyFileReferenceWithFormat("relative");
    }
  );

  context.subscriptions.push(
    startNewForgeSessionDisposable,
    copyFileReferenceDisposable,
    copyFileReferenceAbsoluteDisposable,
    copyFileReferenceRelativeDisposable,
    terminalService.getTerminalChangeDisposable()
  );

  async function startNewForgeSession() {
    const terminal = terminalService.createForgeTerminal();
    terminal.show();
    terminal.sendText("forge", true);

    // Copy current file reference to clipboard
    const fileRef = fileReferenceService.getFileReference();
    if (fileRef) {
      await vscode.env.clipboard.writeText(fileRef);

      // Check if auto-paste is enabled
		  const autoPaste = configService.getAutoPasteEnabled();

	    	  if (autoPaste) {
	    	    const pasteDelay = configService.getPasteDelay();
	    	    setTimeout(() => {
	    	      terminal.sendText(fileRef, false);
	    	    }, pasteDelay);

	    	    localNotificationService.showNotificationIfEnabled(
	    	      NEW_FORGE_SESSION_MESSAGE,
	    	      'info'
	    	    );
	    	    localNotificationService.showCopyReferenceInActivityBar(
	    	      FILE_REFERENCE_WILL_BE_PASTED_MESSAGE
	    	    );
	    	  } else {
	    	    localNotificationService.showNotificationIfEnabled(
	    	      NEW_FORGE_SESSION_MESSAGE,
	    	      'info'
	    	    );
	    	    localNotificationService.showCopyReferenceInActivityBar(
	    	      FILE_REFERENCE_COPIED_MESSAGE
	    	    );
	    	  }
	    } else {
	      localNotificationService.showNotificationIfEnabled(NEW_FORGE_SESSION_MESSAGE, 'info');
	    }
  }

  async function copyFileReference() {
    const fileRef = fileReferenceService.getFileReference();
	    if (!fileRef) {
	      localNotificationService.showNotificationIfEnabled(NO_FILE_FOUND_MESSAGE, 'warning');
	      return;
	    }

    // Always copy to clipboard first
    await vscode.env.clipboard.writeText(fileRef);

    const openTerminal = configService.getOpenTerminalMode();

	      if (openTerminal === "never") {
	      	localNotificationService.showCopyReferenceInActivityBar(
	      	  "File reference copied to clipboard."
	      	);
	        return;
	      }

    // Once mode (default): Open terminal once and reuse it, copy when ambiguous
    const externalRunning = await processService.checkExternalForgeProcess();
    const totalForgeProcesses = await processService.checkForgeProcessCount();

    const forgeTerminals = terminalService.getForgeTerminals();
    const targetForgeTerminal = terminalService.getTargetForgeTerminal();

    const hasMultipleForgeTerminals = forgeTerminals.length > 1;

    // Scenario 1: Multiple Forge terminals exist
    // Show clipboard message and let user manually paste to avoid ambiguity
    if (hasMultipleForgeTerminals) {
      localNotificationService.showCopyReferenceInActivityBar(CLIPBOARD_MESSAGE);
      return;
    }

    // Scenario 2: Both external and internal Forge processes detected
    // Show clipboard message to avoid conflicts between processes
    const hasBothExternalAndInternal =
      externalRunning &&
      targetForgeTerminal &&
      totalForgeProcesses > forgeTerminals.length;

    if (hasBothExternalAndInternal) {
      localNotificationService.showCopyReferenceInActivityBar(CLIPBOARD_MESSAGE);
      return;
    }

    // Scenario 3: Single Forge terminal exists - reuse it
    if (targetForgeTerminal && forgeTerminals.length === 1) {
      targetForgeTerminal.show();

      const autoPaste = configService.getAutoPasteEnabled();

	      if (autoPaste) {
	        targetForgeTerminal.sendText(fileRef, false);
	        localNotificationService.showCopyReferenceInActivityBar(
	          "File reference pasted to terminal"
	        );
	      } else {
	        localNotificationService.showCopyReferenceInActivityBar(
	          FILE_REFERENCE_COPIED_MESSAGE
	        );
	      }
      return;
    }

    // Scenario 4: No Forge terminal in VS Code and no external Forge
    if (!externalRunning && forgeTerminals.length === 0) {
      const terminal = terminalService.createForgeTerminal();
      terminalService.startForgeWithAutoPaste(terminal, fileRef);
      localNotificationService.showNotificationIfEnabled("New Forge terminal created.", 'info');
      localNotificationService.showCopyReferenceInActivityBar(
        FILE_REFERENCE_WILL_BE_PASTED_MESSAGE
      );
      return;
    }

    // Scenario 5: Forge running externally only
    // Prompt user to either continue externally or launch inside VS Code
    if (externalRunning && !targetForgeTerminal) {
      localNotificationService.showCopyReferenceInActivityBar(
        "File reference copied to clipboard. Paste in external Forge terminal."
      );

      const notificationConfig = configService.getNotificationConfig();

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
          const terminal = terminalService.createForgeTerminal();
          terminalService.startForgeWithAutoPaste(terminal, fileRef);
          localNotificationService.showNotificationIfEnabled(FORGE_STARTING_MESSAGE, 'info');
        }
      }
      return;
    }
  }

  // Context menu commands - only copy to clipboard (no auto-paste)
  async function copyFileReferenceWithFormat(format: "absolute" | "relative") {
    const fileRef = fileReferenceService.getFileReference(format);
    if (!fileRef) {
	      localNotificationService.showNotificationIfEnabled(NO_FILE_FOUND_MESSAGE, 'warning');
      return;
    }

    // Always just copy to clipboard for context menu commands
    await vscode.env.clipboard.writeText(fileRef);

    const formatLabel = format === "absolute" ? "absolute" : "relative";
    localNotificationService.showCopyReferenceInActivityBar(
      `File reference (${formatLabel} path) copied to clipboard`
    );
  }
}

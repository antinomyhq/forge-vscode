import * as vscode from "vscode";
import {
	TERMINAL_NAME,
	DEFAULT_STARTUP_DELAY,
	CLIPBOARD_MESSAGE,
	FORGE_STARTING_MESSAGE,
	STATUS_BAR_HIDE_DELAY,
	NO_FILE_FOUND_MESSAGE,
	NEW_FORGE_SESSION_MESSAGE,
	FILE_REFERENCE_WILL_BE_PASTED_MESSAGE,
	FILE_REFERENCE_COPIED_MESSAGE,
} from "./constants";

// This method is called when your extension is deactivated
export function deactivate() {
  // Clean up status bar item
  if (copyStatusBarItem) {
    copyStatusBarItem.dispose();
    copyStatusBarItem = null;
  }
  if (copyTimeout) {
    clearTimeout(copyTimeout);
    copyTimeout = null;
  }
}

function showNotificationIfEnabled(message: string, messageType: 'info' | 'warning' | 'error' = 'info', ...items: string[]) {
  const notifications = vscode.workspace
    .getConfiguration("forge")
    .get<{info: boolean, warning: boolean, error: boolean}>("notifications");

  // Check if this specific notification type is enabled
  if (!notifications?.[messageType]) {
    return Promise.resolve(undefined);
  }

  switch (messageType) {
    case 'warning':
      return vscode.window.showWarningMessage(message, ...items);
    case 'error':
      return vscode.window.showErrorMessage(message, ...items);
    default:
      return vscode.window.showInformationMessage(message, ...items);
  }
}

// Reusable status bar item and counter for copy notifications
let copyStatusBarItem: vscode.StatusBarItem | null = null;
let copyCount = 0;
let copyTimeout: NodeJS.Timeout | null = null;

function showCopyReferenceInActivityBar(message: string) {
  copyCount++;

  // Create status bar item if it doesn't exist
  if (!copyStatusBarItem) {
    copyStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  }

  copyStatusBarItem.text = copyCount > 1
    ? `$(forge-logo) ${message} (${copyCount})`
    : `$(forge-logo) ${message}`;
  copyStatusBarItem.show();

  // Clear existing timeout if any
  if (copyTimeout) {
    clearTimeout(copyTimeout);
  }

		// Set new timeout to hide and reset
		copyTimeout = setTimeout(() => {
			copyStatusBarItem?.hide();
			copyCount = 0;
			copyTimeout = null;
		}, STATUS_BAR_HIDE_DELAY);
}



export function activate(context: vscode.ExtensionContext) {
  // Track the last focused Forge terminal
  let lastFocusedForgeTerminal: vscode.Terminal | null = null;

  // Helper function to check if a terminal is a Forge terminal
  const isForgeTerminal = (terminal: vscode.Terminal) =>
    terminal.name === TERMINAL_NAME || terminal.name.startsWith(TERMINAL_NAME);

  // Listen for terminal focus changes
  const terminalChangeDisposable = vscode.window.onDidChangeActiveTerminal(
    (terminal) => {
      if (terminal && isForgeTerminal(terminal)) {
        lastFocusedForgeTerminal = terminal;
      }
    }
  );

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
    terminalChangeDisposable
  );

  async function startNewForgeSession() {
    // Create and start new Forge terminal
    const terminal = createRightSideTerminal();
    terminal.show();
    terminal.sendText("forge", true);

    // Copy current file reference to clipboard
    const fileRef = getFileReference();
    if (fileRef) {
      await vscode.env.clipboard.writeText(fileRef);

      // Check if auto-paste is enabled
		  const autoPaste = vscode.workspace
		    .getConfiguration("forge")
		    .get<boolean>("autoPaste", true);

	    	  if (autoPaste) {
	    	    const pasteDelay = vscode.workspace
	    	      .getConfiguration("forge")
	    	      .get<number>("pasteDelay", DEFAULT_STARTUP_DELAY);
	    	    setTimeout(() => {
	    	      terminal.sendText(fileRef, false);
	    	    }, pasteDelay);
	    	
	    	    showNotificationIfEnabled(
	    	      NEW_FORGE_SESSION_MESSAGE,
	    	      'info'
	    	    );
	    	    showCopyReferenceInActivityBar(
	    	      FILE_REFERENCE_WILL_BE_PASTED_MESSAGE
	    	    );
	    	  } else {
	    	    showNotificationIfEnabled(
	    	      NEW_FORGE_SESSION_MESSAGE,
	    	      'info'
	    	    );
	    	    showCopyReferenceInActivityBar(
	    	      FILE_REFERENCE_COPIED_MESSAGE
	    	    );
	    	  }
	    } else {
	      showNotificationIfEnabled(NEW_FORGE_SESSION_MESSAGE, 'info');
	    }
  }

  async function copyFileReference() {
    const fileRef = getFileReference();
	    if (!fileRef) {
	      showNotificationIfEnabled(NO_FILE_FOUND_MESSAGE, 'warning');
	      return;
	    }

    // Always copy to clipboard first
    await vscode.env.clipboard.writeText(fileRef);

    const openTerminal = vscode.workspace
      .getConfiguration("forge")
      .get<string>("openTerminal", "once");

	      if (openTerminal === "never") {
	      	showCopyReferenceInActivityBar(
	      	  "File reference copied to clipboard."
	      	);
	        return;
	      }

    // Once mode (default): Open terminal once and reuse it, copy when ambiguous
    // Check if Forge is running externally and get process count
    const externalRunning = await checkExternalForgeProcess();
    const totalForgeProcesses = await checkForgeProcessCount();

    // Find all Forge terminals in VS Code
    const forgeTerminals = vscode.window.terminals.filter(isForgeTerminal);

    // Get the target Forge terminal: tracked one if valid, otherwise fallback
    const targetForgeTerminal =
      lastFocusedForgeTerminal &&
      forgeTerminals.includes(lastFocusedForgeTerminal)
        ? lastFocusedForgeTerminal
        : forgeTerminals[forgeTerminals.length - 1] || null;

    // Update tracking if we're using a fallback
    if (
      targetForgeTerminal &&
      targetForgeTerminal !== lastFocusedForgeTerminal
    ) {
      lastFocusedForgeTerminal = targetForgeTerminal;
    }

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
	        showCopyReferenceInActivityBar(
	          "File reference pasted to terminal"
	        );
	      } else {
	        showCopyReferenceInActivityBar(
	          FILE_REFERENCE_COPIED_MESSAGE
	        );
	      }
      return;
    }

    // Scenario 4: No Forge terminal in VS Code and no external Forge
    // Create new terminal and auto-paste after startup delay
    if (!externalRunning && forgeTerminals.length === 0) {
      const terminal = createRightSideTerminal();
      startForgeWithAutoPaste(terminal, fileRef);
      showNotificationIfEnabled("New Forge terminal created.", 'info');
      showCopyReferenceInActivityBar(
	        FILE_REFERENCE_WILL_BE_PASTED_MESSAGE
      );
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
          const terminal = createRightSideTerminal();
          startForgeWithAutoPaste(terminal, fileRef);
          showNotificationIfEnabled(FORGE_STARTING_MESSAGE, 'info');
        }
      }
      return;
    }
  }

  function createRightSideTerminal(): vscode.Terminal {
    const terminal = vscode.window.createTerminal({
      name: TERMINAL_NAME,
      iconPath: {
        light: vscode.Uri.file(
          context.asAbsolutePath("images/favicon-dark.svg")
        ),
        dark: vscode.Uri.file(
          context.asAbsolutePath("images/favicon-light.svg")
        ),
      },
      location: {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: false,
      },
    });

    // Update our tracking since this will become the active terminal
    lastFocusedForgeTerminal = terminal;
    return terminal;
  }

  function startForgeWithAutoPaste(terminal: vscode.Terminal, fileRef: string) {
    // Start Forge in the terminal
    terminal.show();
    terminal.sendText("forge", true);

    const autoPaste = vscode.workspace
      .getConfiguration("forge")
      .get<boolean>("autoPaste", true);

    if (autoPaste) {
      const pasteDelay = vscode.workspace
        .getConfiguration("forge")
        .get<number>("pasteDelay", DEFAULT_STARTUP_DELAY);
      setTimeout(() => {
        terminal.sendText(fileRef, false);
      }, pasteDelay);
    }
    // When disabled: only start Forge, no auto-paste
  }

  async function checkExternalForgeProcess(): Promise<boolean> {
    return new Promise((resolve) => {
      const { exec } = require("child_process");
      let processCheckCmd: string;
      if (process.platform === "win32") {
        processCheckCmd =
          'tasklist /FI "IMAGENAME eq forge.exe" /FO CSV | find /C "forge.exe"';
      } else {
        processCheckCmd = 'pgrep -f "forge" | wc -l';
      }
      exec(processCheckCmd, (error: any, stdout: string) => {
        if (error) {
          resolve(false);
          return;
        }
        const count = parseInt((stdout || "0").toString().trim(), 10);
        resolve(count > 0);
      });
    });
  }

  async function checkForgeProcessCount(): Promise<number> {
    return new Promise((resolve) => {
      const { exec } = require("child_process");
      let processCheckCmd: string;
      if (process.platform === "win32") {
        processCheckCmd =
          'tasklist /FI "IMAGENAME eq forge.exe" /FO CSV | find /C "forge.exe"';
      } else {
        processCheckCmd = 'pgrep -f "forge" | wc -l';
      }
      exec(processCheckCmd, (error: any, stdout: string) => {
        if (error) {
          resolve(0);
          return;
        }
        const count = parseInt((stdout || "0").toString().trim(), 10);
        resolve(count);
      });
    });
  }

  /**
   * Get workspace-relative path for a file URI
   * Falls back to absolute path if file is not in any workspace folder
   */
  function getWorkspaceRelativePath(fileUri: vscode.Uri): string {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);

    if (workspaceFolder) {
      // Get relative path from workspace root
      const relativePath = vscode.workspace.asRelativePath(fileUri, false);
      return relativePath;
    }

    // Fallback to absolute path if not in workspace
    return fileUri.fsPath;
  }

  /**
   * Get the file path with a specific format (absolute or relative)
   * If format is not specified, uses the user's preference from settings
   */
  function getFilePathWithFormat(
    fileUri: vscode.Uri,
    format?: "absolute" | "relative"
  ): string {
    // If no format specified, use user's preference from settings
    const pathFormat = format ?? vscode.workspace
      .getConfiguration("forge")
      .get<string>("fileReferenceFormat", "absolute");

    if (pathFormat === "relative") {
      return getWorkspaceRelativePath(fileUri);
    }

    // Default to absolute path
    return fileUri.fsPath;
  }

  function getFileReference(format?: "absolute" | "relative"): string | undefined {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    const document = activeEditor.document;

    // Get the file path (with optional format override)
    const filePath = getFilePathWithFormat(document.uri, format);

    const selection = activeEditor.selection;

    // if no selection, return the file path in formatted form
    if (selection.isEmpty) {
      return `@[${filePath}]`;
    }

    // Get line numbers (1-based)
    const startLine = activeEditor.selection.start.line + 1;
    const endLine = activeEditor.selection.end.line + 1;

    // Always return file reference without symbol name
    return `@[${filePath}:${startLine}:${endLine}]`;
  }

  /**
   * Copy file reference with a specific path format (for context menu commands)
   */
  // Context menu commands - only copy to clipboard (no auto-paste)
  async function copyFileReferenceWithFormat(format: "absolute" | "relative") {
    const fileRef = getFileReference(format);
    if (!fileRef) {
	      showNotificationIfEnabled(NO_FILE_FOUND_MESSAGE, 'warning');
      return;
    }

    // Always just copy to clipboard for context menu commands
    await vscode.env.clipboard.writeText(fileRef);

    const formatLabel = format === "absolute" ? "absolute" : "relative";
    showCopyReferenceInActivityBar(
      `File reference (${formatLabel} path) copied to clipboard`
    );
  }
}

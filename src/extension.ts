import * as vscode from "vscode";

const TERMINAL_NAME = "forge";

// This method is called when your extension is deactivated
export function deactivate() {}

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

  let copyFileReferenceDisposable = vscode.commands.registerCommand(
    "forgecode.copyFileReference",
    async () => {
      await copyFileReference();
    }
  );

  context.subscriptions.push(
    copyFileReferenceDisposable,
    terminalChangeDisposable
  );

  async function copyFileReference() {
    const fileRef = getFileReference();
    if (!fileRef) {
      vscode.window.showWarningMessage("No file found.");
      return;
    }

    // Always copy to clipboard first
    await vscode.env.clipboard.writeText(fileRef);

    // Brief success indicator
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    statusBarItem.text = `$(check) File reference copied`;
    statusBarItem.tooltip = fileRef;
    statusBarItem.show();
    setTimeout(() => statusBarItem.dispose(), 2000);

    // If Forge not installed, open terminal with install command (do not execute)
    const forgeAvailable = await checkForgeAvailability();
    if (!forgeAvailable) {
      const installTerminal = vscode.window.createTerminal({
        name: "Forge Installation",
        iconPath: {
          light: vscode.Uri.file(
            context.asAbsolutePath("images/favicon-dark.svg")
          ),
          dark: vscode.Uri.file(
            context.asAbsolutePath("images/favicon-light.svg")
          ),
        },
      });
      installTerminal.show();
      installTerminal.sendText("npx forgecode@latest", false);
      vscode.window.showInformationMessage(
        "Installation command added to terminal. Press Enter to install Forge."
      );
      return;
    }

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
    const hasNonForgeTerminals = vscode.window.terminals.some(
      (terminal) => !isForgeTerminal(terminal)
    );

    // Row 6: Multiple Forge terminals -> Show clipboard message (SAME as Row 4)
    // HIGHEST PRIORITY: Check this first
    if (hasMultipleForgeTerminals) {
      vscode.window.showInformationMessage(
        "File reference copied to clipboard. Paste it in any forge terminal when ready."
      );
      return;
    }

    // Row 4: Forge running BOTH external + internal -> Use internal (no auto-paste, just clipboard message)
    // Strong condition: More forge processes than internal terminals = external processes exist
    const hasBothExternalAndInternal =
      externalRunning &&
      targetForgeTerminal &&
      totalForgeProcesses > forgeTerminals.length;

    if (hasBothExternalAndInternal) {
      vscode.window.showInformationMessage(
        "File reference copied to clipboard. Paste it in any forge terminal when ready."
      );
      return;
    }

    // Row 2: Single Forge running inside VS Code ONLY -> Paste directly (no message)
    // Only after confirming it's not multiple terminals or both external + internal
    if (
      targetForgeTerminal &&
      forgeTerminals.length === 1 &&
      !hasNonForgeTerminals
    ) {
      targetForgeTerminal.show();
      targetForgeTerminal.sendText(fileRef, false);
      return;
    }

    // Row 1 & 5: No forge running OR Non-Forge terminal exists -> Create new terminal + auto-paste
    // But exclude cases where external forge is running (should go to Row 3 instead)
    if (
      (!externalRunning && !targetForgeTerminal) ||
      (hasNonForgeTerminals && !targetForgeTerminal && !externalRunning)
    ) {
      const terminal = createRightSideTerminal();
      terminal.show();
      terminal.sendText("forge", true);

      // Auto-paste after a delay to allow Forge to start
      const startupDelay = vscode.workspace
        .getConfiguration("forge")
        .get<number>("startupDelay", 5000);
      setTimeout(() => {
        terminal.sendText(fileRef, false);
      }, startupDelay);

      vscode.window.showInformationMessage(
        "Forge is starting... File reference copied to clipboard. Paste it when ready."
      );
      return;
    }

    // Row 3: Forge running external only -> Ask, then auto-paste if user chooses
    if (externalRunning && !targetForgeTerminal) {
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
        terminal.show();
        terminal.sendText("forge", true);

        // Auto-paste after a delay to allow Forge to start
        const startupDelay = vscode.workspace
          .getConfiguration("forge")
          .get<number>("startupDelay", 5000);
        setTimeout(() => {
          terminal.sendText(fileRef, false);
        }, startupDelay);

        vscode.window.showInformationMessage(
          "Forge is starting... File reference copied to clipboard. Paste it when ready."
        );
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

  async function checkForgeAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const { exec } = require("child_process");
      exec("forge --version", (error: any) => {
        if (!error) {
          resolve(true);
          return;
        }
        exec("forge --help", (error2: any) => {
          if (!error2) {
            resolve(true);
            return;
          }
          const checkCmd =
            process.platform === "win32" ? "where forge" : "which forge";
          exec(checkCmd, (error3: any) => resolve(!error3));
        });
      });
    });
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

  function getFileReference(): string | undefined {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    const document = activeEditor.document;

    // Get the absolute path
    const absolutePath = document.uri.fsPath;

    const selection = activeEditor.selection;

    // if no selection, return the absolute path
    if (selection.isEmpty) {
      return absolutePath;
    }

    // Get line numbers (1-based)
    const startLine = activeEditor.selection.start.line + 1;
    const endLine = activeEditor.selection.end.line + 1;

    // Always return file reference without symbol name
    return `@[${absolutePath}:${startLine}:${endLine}]`;
  }
}

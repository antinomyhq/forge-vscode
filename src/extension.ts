import * as vscode from "vscode";

const TERMINAL_NAME = "forge";

// This method is called when your extension is deactivated
export function deactivate() {}

export function activate(context: vscode.ExtensionContext) {
  let copyFileReferenceDisposable = vscode.commands.registerCommand(
    "forgecode.copyFileReference",
    async () => {
      await copyFileReference();
    }
  );

  context.subscriptions.push(copyFileReferenceDisposable);

  async function copyFileReference() {
    const fileRef = getFileReference();
    if (!fileRef) {
      vscode.window.showWarningMessage("No file or selection found.");
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

    // Check if Forge is running externally
    const externalRunning = await checkExternalForgeProcess();

    // Check if there's an active VS Code terminal, fallback to last terminal if none active
    const existingTerminal = vscode.window.activeTerminal || 
      (vscode.window.terminals.length > 0
        ? vscode.window.terminals[vscode.window.terminals.length - 1]
        : null);

    // Case 1: Check if forge might be running in the existing VS Code terminal
    if (existingTerminal && externalRunning) {
      // Try to detect if forge is running in the VS Code terminal by checking the terminal name
      const isForgeTerminal =
        existingTerminal.name === TERMINAL_NAME ||
        existingTerminal.name.startsWith(TERMINAL_NAME);

      if (isForgeTerminal) {
        // Forge is likely running in the VS Code terminal, just paste directly
        existingTerminal.show();
        existingTerminal.sendText(fileRef, false);
        return;
      } else {
        // Forge is running externally, show options
        const action = await vscode.window.showInformationMessage(
          `Forge is running in an external terminal. What would you like to do?`,
          "Use External Terminal",
          "Create New VS Code Terminal"
        );

        if (action === "Use External Terminal") {
          vscode.window.showInformationMessage(
            `File reference copied to clipboard. Please switch to your external Forge terminal and paste.`
          );
          return;
        } else if (action === "Create New VS Code Terminal") {
          // Use existing VS Code terminal, start forge, copy to clipboard
          existingTerminal.show();
          existingTerminal.sendText("forge", true);
          vscode.window.showInformationMessage(
            "Forge is starting in VS Code terminal. File reference copied to clipboard. Paste it when ready."
          );
          return;
        } else {
          // User dismissed the dialog, do nothing
          return;
        }
      }
    }

    // Case 2: Existing VS Code terminal + No forge running anywhere
    if (existingTerminal && !externalRunning) {
      existingTerminal.show();
      existingTerminal.sendText("forge", true);
      vscode.window.showInformationMessage(
        "Forge is starting in existing terminal. File reference copied to clipboard. Paste it when ready."
      );
      return;
    }

    // Case 3: Forge running externally (no VS Code terminal)
    if (externalRunning) {
      const action = await vscode.window.showInformationMessage(
        `Forge is running in an external terminal. What would you like to do?`,
        "Use External Terminal",
        "Create New VS Code Terminal"
      );

      if (action === "Use External Terminal") {
        // Try to bring external terminal to focus and paste
        vscode.window.showInformationMessage(
          `File reference copied to clipboard. Please switch to your external Forge terminal and paste.`
        );
        return;
      } else if (action === "Create New VS Code Terminal") {
        // User explicitly chose to create new terminal
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
        terminal.show();
        terminal.sendText("forge", true);
        vscode.window.showInformationMessage(
          "New forge session started. File reference copied to clipboard. Paste it when ready."
        );
        return;
      } else {
        // User dismissed the dialog, do nothing
        return;
      }
    }

    // Case 4: No forge running anywhere - show message, create terminal and run forge
    if (!externalRunning) {
      // Show message that forge is not running
      const action = await vscode.window.showInformationMessage(
        "Forge is not running. Please run forge.",
        "Open Terminal & Run Forge"
      );

      if (action === "Open Terminal & Run Forge") {
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
        terminal.show();

        // Automatically run forge command
        terminal.sendText("forge", true);

        // Show message that reference is copied and ready to paste
        vscode.window.showInformationMessage(
          "Forge is starting... File reference copied to clipboard. Paste it when ready."
        );
      }
      // If user dismissed the dialog, do nothing (just return)
      return;
    }


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

  function getFileReference(): string | undefined {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    const document = activeEditor.document;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
      return;
    }

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

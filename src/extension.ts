import * as vscode from "vscode";
import { TerminalService } from "./services/TerminalService";
import { ProcessService } from "./services/ProcessService";
import { ClipboardService } from "./services/ClipboardService";
import { CopyCommand } from "./commands/CopyCommand";
import { ForgeSessionCommand } from "./commands/ForgeSessionCommand";
import { showCopyReferenceInActivityBar, disposeStatusBar } from "./utils/statusBar";
import { showNotificationIfEnabled } from "./utils/notifications";

const CLIPBOARD_MESSAGE =
  "File reference copied to clipboard. Paste it in any forge terminal when ready.";

// Global instances
let terminalService: TerminalService;
let processService: ProcessService;
let clipboardService: ClipboardService;
let copyCommand: CopyCommand;
let forgeSessionCommand: ForgeSessionCommand;
let terminalChangeDisposable: vscode.Disposable;

export function deactivate(): void {
  // Clean up status bar item
  disposeStatusBar();
  
  // Clean up terminal change listener
  if (terminalChangeDisposable) {
    terminalChangeDisposable.dispose();
  }
}

export function activate(context: vscode.ExtensionContext): void {
  initializeServices(context);
  registerCommands(context);
  
  // Show activation message if Forge is running externally
  checkExternalForgeAndNotify();
}

function initializeServices(context: vscode.ExtensionContext): void {
  // Initialize services
  terminalService = new TerminalService(context);
  processService = new ProcessService();
  clipboardService = new ClipboardService();
  
  // Initialize commands
  copyCommand = new CopyCommand(clipboardService);
  forgeSessionCommand = new ForgeSessionCommand(terminalService, processService);

  // Setup terminal focus listener
  terminalChangeDisposable = terminalService.setupTerminalFocusListener();
}

function registerCommands(context: vscode.ExtensionContext): void {
  const copyFileReferenceCommand = vscode.commands.registerCommand(
    "forge.copyFileReference",
    async () => {
      await copyCommand.copyFileReference();
      showCopyReferenceInActivityBar("File reference copied to clipboard");
    }
  );

  const startNewForgeSessionCommand = vscode.commands.registerCommand(
    "forge.startNewForgeSession",
    async () => {
      await forgeSessionCommand.startNewForgeSession();
    }
  );

  const copyFileReferenceAndPasteCommand = vscode.commands.registerCommand(
    "forge.copyFileReferenceAndPaste",
    async () => {
      await forgeSessionCommand.copyFileReferenceAndPaste();
      showCopyReferenceInActivityBar("File reference copied to clipboard");
    }
  );

  // Context menu commands for absolute and relative paths
  const copyAbsoluteReferenceCommand = vscode.commands.registerCommand(
    "forge.copyAbsoluteReference",
    async () => {
      await copyCommand.copyFileReferenceWithFormat("absolute");
      showCopyReferenceInActivityBar("Absolute file reference copied to clipboard");
    }
  );

  const copyRelativeReferenceCommand = vscode.commands.registerCommand(
    "forge.copyRelativeReference",
    async () => {
      await copyCommand.copyFileReferenceWithFormat("relative");
      showCopyReferenceInActivityBar("Relative file reference copied to clipboard");
    }
  );

  // Add all disposables to context
  context.subscriptions.push(
    copyFileReferenceCommand,
    startNewForgeSessionCommand,
    copyFileReferenceAndPasteCommand,
    copyAbsoluteReferenceCommand,
    copyRelativeReferenceCommand,
    terminalChangeDisposable
  );

  // Show activation message if Forge is running externally
  checkExternalForgeAndNotify();
}

async function checkExternalForgeAndNotify(): Promise<void> {
  const isForgeRunning = await processService.checkExternalForgeProcess();
  if (isForgeRunning) {
    showNotificationIfEnabled(CLIPBOARD_MESSAGE, 'info');
  }
}
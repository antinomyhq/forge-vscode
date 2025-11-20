import * as vscode from "vscode";
import { CommandService } from "./services/commandService";
import { ConfigService } from "./services/configService";
import { FileReferenceService } from "./services/fileReferenceService";
import { GitService } from "./services/gitService";
import { NotificationService } from "./services/notificationService";
import { ProcessService } from "./services/processService";
import { TerminalService } from "./services/terminalService";

let notificationService: NotificationService | null = null;

export function activate(context: vscode.ExtensionContext): void {
  // Initialize services
  const configService = new ConfigService();
  const processService = new ProcessService();
  const fileReferenceService = new FileReferenceService(configService);
  const localNotificationService = new NotificationService(configService);
  const terminalService = new TerminalService(context, configService);
  const gitService = new GitService();
  const commandService = new CommandService(
    configService,
    processService,
    fileReferenceService,
    localNotificationService,
    terminalService,
    gitService
  );

  notificationService = localNotificationService;

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "forgecode.startNewForgeSession",
      () => commandService.startNewForgeSession()
    ),
    vscode.commands.registerCommand(
      "forgecode.copyFileReference",
      () => commandService.copyFileReference()
    ),
    vscode.commands.registerCommand(
      "forgecode.copyFileReferenceAbsolute",
      async (uri?: vscode.Uri) => {
        // Context menu provides URI; keyboard shortcut uses clipboard trick
        uri ??= await getExplorerSelection();
        return commandService.copyFileReferenceWithFormat("absolute", uri);
      }
    ),
    vscode.commands.registerCommand(
      "forgecode.copyFileReferenceRelative",
      async (uri?: vscode.Uri) => {
        uri ??= await getExplorerSelection();
        return commandService.copyFileReferenceWithFormat("relative", uri);
      }
    ),
    vscode.commands.registerCommand(
      "forgecode.generateCommitMessage",
      () => commandService.generateCommitMessage()
    ),
    vscode.commands.registerCommand(
      "forgecode.stopCommitMessageGeneration",
      () => commandService.stopCommitMessageGeneration()
    ),
    terminalService.getTerminalChangeDisposable()
  );
}

// Get explorer selection via clipboard trick for keyboard shortcuts
async function getExplorerSelection(): Promise<vscode.Uri | undefined> {
  try {
    // Use VS Code's copyFilePath to get selected file/folder path
    await vscode.commands.executeCommand("copyFilePath");
    const filePath = await vscode.env.clipboard.readText();

    // Clipboard will be overwritten by the command, so no need to restore
    if (filePath) {
      return vscode.Uri.file(filePath);
    }
  } catch {
    // Nothing selected in explorer, fallback to active editor
  }

  return undefined;
}

export function deactivate(): void {
  if (notificationService) {
    notificationService.dispose();
    notificationService = null;
  }
}

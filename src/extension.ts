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
      () => commandService.copyFileReferenceWithFormat("absolute")
    ),
    vscode.commands.registerCommand(
      "forgecode.copyFileReferenceRelative",
      () => commandService.copyFileReferenceWithFormat("relative")
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

export function deactivate(): void {
  if (notificationService) {
    notificationService.dispose();
    notificationService = null;
  }
}

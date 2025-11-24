import * as vscode from "vscode";
import { CommandService } from "./services/commandService";
import { ConfigService } from "./services/configService";
import { FileReferenceService } from "./services/fileReferenceService";
import { GitService } from "./services/gitService";
import { NotificationService } from "./services/notificationService";
import { ProcessService } from "./services/processService";
import { TerminalService } from "./services/terminalService";

let notificationService: NotificationService | null = null;
let terminalService: TerminalService | null = null;
let processService: ProcessService | null = null;

export function activate(context: vscode.ExtensionContext): void {
  // Initialize services
  const configService = new ConfigService();
  const localProcessService = new ProcessService();
  const fileReferenceService = new FileReferenceService(configService);
  const localNotificationService = new NotificationService(configService);
  const localTerminalService = new TerminalService(context, configService);
  const gitService = new GitService();
  const commandService = new CommandService(
    configService,
    localProcessService,
    fileReferenceService,
    localNotificationService,
    localTerminalService,
    gitService
  );

  // Store services for cleanup
  notificationService = localNotificationService;
  terminalService = localTerminalService;
  processService = localProcessService;

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("forgecode.startNewForgeSession", () =>
      commandService.startNewForgeSession()
    ),
    vscode.commands.registerCommand("forgecode.copyFileReference", () =>
      commandService.copyFileReference()
    ),
    vscode.commands.registerCommand("forgecode.copyFileReferenceAbsolute", () =>
      commandService.copyFileReferenceWithFormat("absolute")
    ),
    vscode.commands.registerCommand("forgecode.copyFileReferenceRelative", () =>
      commandService.copyFileReferenceWithFormat("relative")
    ),
    vscode.commands.registerCommand("forgecode.generateCommitMessage", () =>
      commandService.generateCommitMessage()
    ),
    vscode.commands.registerCommand(
      "forgecode.stopCommitMessageGeneration",
      () => commandService.stopCommitMessageGeneration()
    ),
    localTerminalService.getTerminalChangeDisposable()
  );
}

export function deactivate(): void {
  // Clean up all services
  if (notificationService) {
    notificationService.dispose();
    notificationService = null;
  }

  if (terminalService) {
    terminalService.dispose();
    terminalService = null;
  }

  if (processService) {
    processService.stopCommitMessageProcess();
    processService = null;
  }
}

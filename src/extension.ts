import * as vscode from "vscode";
import { ConfigService } from "./services/configService";
import { ProcessService } from "./services/processService";
import { FileReferenceService } from "./services/fileReferenceService";
import { NotificationService } from "./services/notificationService";
import { TerminalService } from "./services/terminalService";
import { CommandService } from "./services/commandService";

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
  const commandService = new CommandService(
    configService,
    processService,
    fileReferenceService,
    localNotificationService,
    terminalService
  );

  // Store reference for cleanup in deactivate()
  notificationService = localNotificationService;

  // Register commands
  let startNewForgeSessionDisposable = vscode.commands.registerCommand(
    "forgecode.startNewForgeSession",
    async () => await commandService.startNewForgeSession()
  );

  let copyFileReferenceDisposable = vscode.commands.registerCommand(
    "forgecode.copyFileReference",
    async () => await commandService.copyFileReference()
  );

  let copyFileReferenceAbsoluteDisposable = vscode.commands.registerCommand(
    "forgecode.copyFileReferenceAbsolute",
    async () => await commandService.copyFileReferenceWithFormat("absolute")
  );

  let copyFileReferenceRelativeDisposable = vscode.commands.registerCommand(
    "forgecode.copyFileReferenceRelative",
    async () => await commandService.copyFileReferenceWithFormat("relative")
  );

  context.subscriptions.push(
    startNewForgeSessionDisposable,
    copyFileReferenceDisposable,
    copyFileReferenceAbsoluteDisposable,
    copyFileReferenceRelativeDisposable,
    terminalService.getTerminalChangeDisposable()
  );
}

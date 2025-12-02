import * as vscode from "vscode";
import { ForgeCodeLensProvider } from "./providers/forgeCodeLensProvider";
import { CommandService } from "./services/commandService";
import { ConfigService } from "./services/configService";
import { FileReferenceService } from "./services/fileReferenceService";
import { GitService } from "./services/gitService";
import { NotificationService } from "./services/notificationService";
import { ProcessService } from "./services/processService";
import { TerminalService } from "./services/terminalService";
import { BackgroundForgeService } from "./services/backgroundForgeService";

let notificationService: NotificationService | null = null;
let terminalService: TerminalService | null = null;
let processService: ProcessService | null = null;
let backgroundForgeService: BackgroundForgeService | null = null;

function initializeServices(context: vscode.ExtensionContext): {
  configService: ConfigService;
  localNotificationService: NotificationService;
  localTerminalService: TerminalService;
  localBackgroundForgeService: BackgroundForgeService;
  commandService: CommandService;
} {
  const configService = new ConfigService();
  const localProcessService = new ProcessService();
  const fileReferenceService = new FileReferenceService(configService);
  const localNotificationService = new NotificationService(configService);
  const localTerminalService = new TerminalService(context, configService);
  const gitService = new GitService();
  const localBackgroundForgeService = new BackgroundForgeService(
    localNotificationService,
    context
  );
  const commandService = new CommandService(
    configService,
    localProcessService,
    fileReferenceService,
    localNotificationService,
    localTerminalService,
    gitService,
    localBackgroundForgeService
  );

  notificationService = localNotificationService;
  terminalService = localTerminalService;
  processService = localProcessService;
  backgroundForgeService = localBackgroundForgeService;

  return {
    configService,
    localNotificationService,
    localTerminalService,
    localBackgroundForgeService,
    commandService,
  };
}

function registerCodeLensProvider(
  context: vscode.ExtensionContext,
  configService: ConfigService,
  localBackgroundForgeService: BackgroundForgeService
): void {
  const codeLensProvider = new ForgeCodeLensProvider(configService, localBackgroundForgeService);
  const documentSelector: vscode.DocumentSelector = { scheme: "file" };

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(documentSelector, codeLensProvider),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("forge.codeLens")) {
        codeLensProvider.refresh();
      }
    })
  );
}

function registerCommands(
  context: vscode.ExtensionContext,
  commandService: CommandService,
  localTerminalService: TerminalService
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("forgecode.startNewForgeSession", () =>
      commandService.startNewForgeSession()
    ),
    vscode.commands.registerCommand("forgecode.copyFileReference", () =>
      commandService.copyFileReference()
    ),
    vscode.commands.registerCommand(
      "forgecode.copyFileReferenceAbsolute",
      async (uri?: vscode.Uri) => {
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
    vscode.commands.registerCommand("forgecode.generateCommitMessage", () =>
      commandService.generateCommitMessage()
    ),
    vscode.commands.registerCommand("forgecode.stopCommitMessageGeneration", () =>
      commandService.stopCommitMessageGeneration()
    ),
    vscode.commands.registerCommand(
      "forgecode.delegateToForge",
      (context: { uri: vscode.Uri; line: number; lineText: string; tag: string }) =>
        commandService.delegateToForge(context)
    ),
    vscode.commands.registerCommand("forgecode.showBackgroundTasks", () =>
      commandService.showBackgroundTasks()
    ),
    vscode.commands.registerCommand("forgecode.stopAllBackgroundTasks", () =>
      commandService.stopAllBackgroundTasks()
    ),
    vscode.commands.registerCommand("forgecode.stopTask", (taskId: string) =>
      commandService.stopTask(taskId)
    ),
    vscode.commands.registerCommand("forgecode.installForge", () =>
      commandService.installForge()
    ),
    vscode.commands.registerCommand("forgecode.updateToLatestVersion", () =>
      commandService.updateToLatestVersion()
    ),
    localTerminalService.getTerminalChangeDisposable()
  );
}

export function activate(context: vscode.ExtensionContext): void {
  const services = initializeServices(context);
  registerCodeLensProvider(context, services.configService, services.localBackgroundForgeService);
  registerCommands(context, services.commandService, services.localTerminalService);
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

  if (backgroundForgeService) {
    backgroundForgeService.dispose();
    backgroundForgeService = null;
  }
}

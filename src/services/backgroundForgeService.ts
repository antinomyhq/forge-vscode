import * as vscode from "vscode";
import { spawn, execSync, ChildProcess } from "child_process";
import * as os from "os";
import { NotificationService } from "./notificationService";

export interface BackgroundTask {
  id: string;
  tag: string;
  message: string;
  filePath: string;
  uri: vscode.Uri; // Full URI for accurate comparison
  line: number;
  process: ChildProcess;
  startTime: number;
  status: "running" | "completed" | "failed" | "cancelled";
  output: string[];
  errors: string[];
  outputChannel: vscode.OutputChannel; // Individual output channel for this task
}

export class BackgroundForgeService {
  private tasks: Map<string, BackgroundTask> = new Map();
  private masterOutputChannel: vscode.OutputChannel; // Master channel for overview
  private statusBarItem: vscode.StatusBarItem;
  private outputChannelDisposables: Map<string, vscode.Disposable> = new Map(); // Track disposables for cleanup

  // Event emitter for task status changes (for CodeLens refresh)
  private readonly _onTaskStatusChanged = new vscode.EventEmitter<void>();
  public readonly onTaskStatusChanged = this._onTaskStatusChanged.event;

  constructor(
    private notificationService: NotificationService,
    private context: vscode.ExtensionContext
  ) {
    this.masterOutputChannel = vscode.window.createOutputChannel("Forge Background Tasks");
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = "forgecode.showBackgroundTasks";
    this.context.subscriptions.push(this.masterOutputChannel, this.statusBarItem);
    this.updateStatusBar();
  }

  /**
   * Get running task ID for a specific file and line
   * Returns task ID if found, undefined otherwise
   */
  getRunningTaskId(filePath: string, line: number): string | undefined {
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.uri.fsPath === filePath && task.line === line && task.status === "running") {
        return taskId;
      }
    }
    return undefined;
  }

  /**
   * Run a Forge task in the background
   * No limits - runs unlimited concurrent tasks
   * Prevents duplicate tasks on the same line
   */
  runBackgroundTask(
    message: string,
    context: { uri: vscode.Uri; line: number; tag: string; filePath: string }
  ): void {
    // Start task immediately without awaiting (fire and forget for unlimited parallel execution)
    // Note: Duplicate check is done inside executeTask after task is created to avoid race conditions
    void this.executeTask(message, context);
  }

  /**
   * Execute a background task
   */
  private async executeTask(
    message: string,
    context: { uri: vscode.Uri; line: number; tag: string; filePath: string }
  ): Promise<void> {
    // Check for duplicate task AFTER entering async context to prevent race conditions
    const existingTaskId = this.getRunningTaskId(context.uri.fsPath, context.line);
    if (existingTaskId !== undefined) {
      this.notificationService.showCopyReferenceInActivityBar(
        `Task already running for ${context.tag} at line ${context.line + 1}`
      );
      return;
    }

    const taskId = `${context.tag}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    if (!workspaceFolder) {
      this.notificationService.showNotificationIfEnabled(
        "No workspace folder found",
        "error"
      );
      return;
    }

    // Create individual output channel for this task
    const taskOutputChannel = vscode.window.createOutputChannel(
      `Forge: ${context.tag} (${context.filePath}:${context.line + 1})`
    );

    // Track disposable separately for proper cleanup
    const disposable = this.context.subscriptions[this.context.subscriptions.push(taskOutputChannel) - 1];
    this.outputChannelDisposables.set(taskId, disposable);

    this.logTaskStart(taskId, context, message, taskOutputChannel);

    const isWindows = os.platform() === "win32";
    const forgeProcess = spawn("forge", [], {
      cwd: workspaceFolder.uri.fsPath,
      shell: true,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
      detached: !isWindows, // On Unix, create process group for proper cleanup
    });

    const task = this.createTask(taskId, context, message, forgeProcess, taskOutputChannel);
    this.tasks.set(taskId, task);
    this.notifyTaskStatusChanged();

    if (!this.sendMessageToProcess(forgeProcess, message, task, taskId)) {
      return;
    }

    this.setupProcessHandlers(forgeProcess, task, taskId, context);

    this.notificationService.showCopyReferenceInActivityBar(
      `${context.tag} task started in background`
    );
  }

  /**
   * Log task start information
   */
  private logTaskStart(
    taskId: string,
    context: { tag: string; filePath: string; line: number },
    message: string,
    taskOutputChannel: vscode.OutputChannel
  ): void {
    // Log to individual task channel
    taskOutputChannel.appendLine(`\n${"=".repeat(80)}`);
    taskOutputChannel.appendLine(`[START] ${context.tag} Task: ${taskId}`);
    taskOutputChannel.appendLine(`[INFO] File: ${context.filePath}:${context.line + 1}`);
    taskOutputChannel.appendLine(`[INFO] Message: ${message}`);
    taskOutputChannel.appendLine(`[INFO] Time: ${new Date().toLocaleTimeString()}`);
    taskOutputChannel.appendLine(`${"=".repeat(80)}\n`);

    // Log summary to master channel
    this.masterOutputChannel.appendLine(
      `[START] ${context.tag} at ${context.filePath}:${context.line + 1} - ${new Date().toLocaleTimeString()}`
    );
  }

  /**
   * Create task object
   */
  private createTask(
    taskId: string,
    context: { uri: vscode.Uri; tag: string; filePath: string; line: number },
    message: string,
    forgeProcess: ChildProcess,
    taskOutputChannel: vscode.OutputChannel
  ): BackgroundTask {
    return {
      id: taskId,
      tag: context.tag,
      message,
      filePath: context.filePath,
      uri: context.uri,
      line: context.line,
      process: forgeProcess,
      startTime: Date.now(),
      status: "running",
      output: [],
      errors: [],
      outputChannel: taskOutputChannel,
    };
  }

  /**
   * Send message to Forge process via stdin
   */
  private sendMessageToProcess(
    forgeProcess: ChildProcess,
    message: string,
    task: BackgroundTask,
    taskId: string
  ): boolean {
    try {
      forgeProcess.stdin?.write(message + "\n");
      forgeProcess.stdin?.end();
      return true;
    } catch (error) {
      task.outputChannel.appendLine(`[ERROR] Failed to write to stdin: ${error}`);
      this.masterOutputChannel.appendLine(`[ERROR] Task ${taskId} failed to write to stdin: ${error}`);
      task.status = "failed";
      task.errors.push(`Failed to write to stdin: ${error}`);
      this.cleanupTask(taskId);
      return false;
    }
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(
    forgeProcess: ChildProcess,
    task: BackgroundTask,
    taskId: string,
    context: { tag: string }
  ): void {
    forgeProcess.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();
      task.output.push(output);
      task.outputChannel.append(output); // Write to individual task channel
    });

    forgeProcess.stderr?.on("data", (data: Buffer) => {
      const error = data.toString();
      task.errors.push(error);
      task.outputChannel.appendLine(`[ERROR] ${error}`); // Write to individual task channel
    });

    forgeProcess.on("close", (code: number | null) => {
      this.handleProcessClose(code, task, taskId, context);
    });

    forgeProcess.on("error", (error: Error) => {
      this.handleProcessError(error, task, taskId);
    });
  }

  /**
   * Handle process close event
   */
  private handleProcessClose(
    code: number | null,
    task: BackgroundTask,
    taskId: string,
    context: { tag: string }
  ): void {
    const duration = ((Date.now() - task.startTime) / 1000).toFixed(2);

    // Write to individual task channel
    task.outputChannel.appendLine(`\n${"-".repeat(80)}`);

    if (code === 0) {
      task.status = "completed";
      task.outputChannel.appendLine(`[SUCCESS] ${context.tag} task completed in ${duration}s`);
      this.masterOutputChannel.appendLine(`[SUCCESS] ${context.tag} at ${task.filePath}:${task.line + 1} completed in ${duration}s`);
      this.notificationService.showCopyReferenceInActivityBar(
        `✓ ${context.tag} task completed (${duration}s)`
      );
    } else if (code === null || task.status === "cancelled") {
      // Process was killed (either by user or system)
      // Status might already be "cancelled" if user clicked stop button
      if (task.status !== "cancelled") {
        task.status = "cancelled";
      }
      task.outputChannel.appendLine(`[CANCELLED] ${context.tag} task was cancelled`);
      this.masterOutputChannel.appendLine(`[CANCELLED] ${context.tag} at ${task.filePath}:${task.line + 1} was cancelled`);

      this.notificationService.showNotificationIfEnabled(
        `${context.tag} task cancelled`,
        "info"
      );
    } else {
      task.status = "failed";
      task.outputChannel.appendLine(`[FAILED] ${context.tag} task failed with code ${code}`);
      this.masterOutputChannel.appendLine(`[FAILED] ${context.tag} at ${task.filePath}:${task.line + 1} failed with code ${code}`);
      this.notificationService.showNotificationIfEnabled(
        `${context.tag} task failed. Check Output panel for details.`,
        "error"
      );
    }

    task.outputChannel.appendLine(`${"-".repeat(80)}\n`);

    // Notify status change immediately
    this.notifyTaskStatusChanged();

    // Cleanup task after delay (keep output channel visible for 30 seconds)
    setTimeout(() => {
      this.cleanupTask(taskId);
    }, 30000);
  }

  /**
   * Handle process error event
   */
  private handleProcessError(error: Error, task: BackgroundTask, taskId: string): void {
    task.status = "failed";
    task.errors.push(error.message);
    task.outputChannel.appendLine(`[ERROR] Process error: ${error.message}`);
    this.masterOutputChannel.appendLine(`[ERROR] Task ${taskId} process error: ${error.message}`);
    this.notificationService.showNotificationIfEnabled(
      `Failed to start Forge: ${error.message}`,
      "error"
    );
    this.cleanupTask(taskId);
  }

  /**
   * Get count of running tasks
   */
  getRunningTaskCount(): number {
    return Array.from(this.tasks.values()).filter(
      (task) => task.status === "running"
    ).length;
  }

  /**
   * Get all tasks
   */
  getAllTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Clean up a task - dispose output channel and remove from maps
   */
  private cleanupTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.outputChannel.dispose();

      // Remove from context subscriptions
      const disposable = this.outputChannelDisposables.get(taskId);
      if (disposable) {
        const index = this.context.subscriptions.indexOf(disposable);
        if (index > -1) {
          this.context.subscriptions.splice(index, 1);
        }
        this.outputChannelDisposables.delete(taskId);
      }

      this.tasks.delete(taskId);
    }
    this.notifyTaskStatusChanged();
  }

  /**
   * Kill a process and its entire process tree (cross-platform)
   */
  private killProcessTree(childProcess: ChildProcess): void {
    const pid = childProcess.pid;
    if (pid === undefined) {
      return;
    }

    const isWindows = os.platform() === "win32";
    if (isWindows) {
      // On Windows, use taskkill to kill the entire process tree
      try {
        execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
      } catch {
        // Fallback to normal kill if taskkill fails
        childProcess.kill();
      }
    } else {
      // On Unix-like systems, kill the process group
      try {
        process.kill(-pid, "SIGTERM"); // Negative PID kills the process group
      } catch {
        childProcess.kill(); // Fallback
      }
    }
  }

  /**
   * Stop a specific task
   */
  stopTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task && task.status === "running") {
      // Set status immediately so CodeLens refreshes right away
      task.status = "cancelled";
      this.killProcessTree(task.process);
      task.outputChannel.appendLine(`[STOP] Task ${taskId} stopped by user`);
      this.masterOutputChannel.appendLine(`[STOP] Task ${taskId} stopped by user`);
      this.notifyTaskStatusChanged();
      return true;
    }
    return false;
  }

  /**
   * Stop all running tasks
   */
  stopAllTasks(): number {
    let stoppedCount = 0;
    this.tasks.forEach((task) => {
      if (task.status === "running") {
        this.killProcessTree(task.process);
        task.status = "cancelled";
        task.outputChannel.appendLine(`[STOP] Task stopped by user`);
        stoppedCount++;
      }
    });

    if (stoppedCount > 0) {
      this.masterOutputChannel.appendLine(`[STOP] Stopped ${stoppedCount} running task(s)`);
      this.notificationService.showCopyReferenceInActivityBar(
        `Stopped ${stoppedCount} background task(s)`
      );
      this.notifyTaskStatusChanged();
    }

    return stoppedCount;
  }

  /**
   * Notify listeners that task status changed (for CodeLens refresh)
   */
  private notifyTaskStatusChanged(): void {
    this._onTaskStatusChanged.fire();
    this.updateStatusBar();
  }

  /**
   * Update status bar display
   */
  private updateStatusBar(): void {
    const runningCount = this.getRunningTaskCount();

    if (runningCount === 0) {
      this.statusBarItem.hide();
      return;
    }

    const icon = "$(sync~spin)";
    const text = `${icon} Forge: ${runningCount} running`;

    this.statusBarItem.text = text;
    this.statusBarItem.tooltip = `Click to view background tasks\n${runningCount} running`;
    this.statusBarItem.show();
  }

  /**
   * Show background tasks panel
   */
  async showBackgroundTasks(): Promise<void> {
    const tasks = this.getAllTasks();

    if (tasks.length === 0) {
      vscode.window.showInformationMessage("No background tasks running");
      return;
    }

    const items: vscode.QuickPickItem[] = [];

    // Add running/completed tasks
    tasks.forEach((task) => {
      const duration = ((Date.now() - task.startTime) / 1000).toFixed(0);
      const statusIcon =
        task.status === "running"
          ? "$(sync~spin)"
          : task.status === "completed"
          ? "$(check)"
          : task.status === "failed"
          ? "$(error)"
          : "$(circle-slash)";

      items.push({
        label: `${statusIcon} ${task.tag}`,
        description: `${task.filePath}:${task.line + 1}`,
        detail: `${task.status} • ${duration}s • ${task.message.substring(0, 100)}`,
      });
    });

    // Add action buttons
    if (this.getRunningTaskCount() > 0) {
      items.push({
        label: "$(debug-stop) Stop All Running Tasks",
        description: "",
        detail: "Cancel all currently running background tasks",
      });
    }

    items.push({
      label: "$(output) View Output Panel",
      description: "",
      detail: "Open Forge Background Tasks output panel",
    });

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: "Background Forge Tasks",
    });

    if (selected?.label.includes("Stop All") === true) {
      const stopped = this.stopAllTasks();
      vscode.window.showInformationMessage(`Stopped ${stopped} task(s)`);
    } else if (selected?.label.includes("View Output") === true) {
      this.masterOutputChannel.show();
    }
  }

  /**
   * Dispose service
   */
  dispose(): void {
    this.stopAllTasks();

    // Dispose all individual task channels
    this.tasks.forEach((task) => {
      task.outputChannel.dispose();
    });

    this.masterOutputChannel.dispose();
    this.statusBarItem.dispose();
    this._onTaskStatusChanged.dispose();
  }
}

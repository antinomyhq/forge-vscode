import * as vscode from 'vscode';
import { INotificationPort } from '../../api/ports/INotificationPort';
import { NotificationConfig } from '../../config/NotificationConfig';

/**
 * VSCodeNotificationAdapter implements INotificationPort using VS Code's notification API.
 * This adapter shows notifications respecting user preferences from configuration.
 */
export class VSCodeNotificationAdapter implements INotificationPort {
  private statusBarItem?: vscode.StatusBarItem;
  private hideTimeout?: NodeJS.Timeout;

  /**
   * Creates a new VSCodeNotificationAdapter
   * @param config - Notification configuration (which notifications to show)
   */
  constructor(private readonly config: NotificationConfig) {}

  /**
   * Shows an informational message to the user
   * @param message - The message to display
   * @param actions - Optional action button labels
   * @returns Promise resolving to the selected action label, or undefined if dismissed
   */
  public async showInfo(message: string, ...actions: string[]): Promise<string | undefined> {
    if (!this.config.showInfo) {
      return undefined;
    }
    return await vscode.window.showInformationMessage(message, ...actions);
  }

  /**
   * Shows a warning message to the user
   * @param message - The message to display
   * @param actions - Optional action button labels
   * @returns Promise resolving to the selected action label, or undefined if dismissed
   */
  public async showWarning(message: string, ...actions: string[]): Promise<string | undefined> {
    if (!this.config.showWarning) {
      return undefined;
    }
    return await vscode.window.showWarningMessage(message, ...actions);
  }

  /**
   * Shows an error message to the user
   * @param message - The message to display
   * @param actions - Optional action button labels
   * @returns Promise resolving to the selected action label, or undefined if dismissed
   */
  public async showError(message: string, ...actions: string[]): Promise<string | undefined> {
    if (!this.config.showError) {
      return undefined;
    }
    return await vscode.window.showErrorMessage(message, ...actions);
  }

  /**
   * Shows a temporary message in the status bar
   * The message automatically disappears after the specified duration
   * @param message - The message to display in status bar
   * @param durationMs - How long to show the message in milliseconds
   */
  public showStatusBar(message: string, durationMs: number): void {
    // Clean up previous status bar item and timeout
    this.cleanupStatusBar();

    // Create new status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBarItem.text = message;
    this.statusBarItem.show();

    // Auto-hide after duration
    this.hideTimeout = setTimeout(() => {
      this.cleanupStatusBar();
    }, durationMs);
  }

  /**
   * Cleans up the status bar item and timeout
   */
  private cleanupStatusBar(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = undefined;
    }
    if (this.statusBarItem) {
      this.statusBarItem.dispose();
      this.statusBarItem = undefined;
    }
  }

  /**
   * Disposes of resources
   */
  public dispose(): void {
    this.cleanupStatusBar();
  }
}

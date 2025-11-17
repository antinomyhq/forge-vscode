import * as vscode from "vscode";
import { STATUS_BAR_HIDE_DELAY } from "../constants";
import { ConfigService } from "./configService";

// Manages VS Code notifications and status bar messages
export class NotificationService {
  private copyStatusBarItem: vscode.StatusBarItem | null = null;
  private copyCount = 0;
  private copyTimeout: NodeJS.Timeout | null = null;

  constructor(private configService: ConfigService) {}

  // Show notification if enabled in settings
  showNotificationIfEnabled(
    message: string,
    messageType: "info" | "warning" | "error" = "info",
    ...items: string[]
  ): Thenable<string | undefined> {
    if (!this.configService.isNotificationEnabled(messageType)) {
      return Promise.resolve(undefined);
    }

    switch (messageType) {
      case "warning":
        return vscode.window.showWarningMessage(message, ...items);
      case "error":
        return vscode.window.showErrorMessage(message, ...items);
      default:
        return vscode.window.showInformationMessage(message, ...items);
    }
  }

  // Show message in status bar with counter support
  showCopyReferenceInActivityBar(message: string): void {
    this.copyCount++;

    // Create status bar item if it doesn't exist
    this.copyStatusBarItem ??= vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );

    this.copyStatusBarItem.text =
      this.copyCount > 1
        ? `$(forge-logo) ${message} (${this.copyCount})`
        : `$(forge-logo) ${message}`;
    this.copyStatusBarItem.show();

    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
    }

    this.copyTimeout = setTimeout(() => {
      this.copyStatusBarItem?.hide();
      this.copyCount = 0;
      this.copyTimeout = null;
    }, STATUS_BAR_HIDE_DELAY);
  }

  // Clean up resources
  dispose(): void {
    if (this.copyStatusBarItem) {
      this.copyStatusBarItem.dispose();
      this.copyStatusBarItem = null;
    }

    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
      this.copyTimeout = null;
    }

    this.copyCount = 0;
  }
}


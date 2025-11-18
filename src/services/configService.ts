import * as vscode from "vscode";
import { DEFAULT_STARTUP_DELAY } from "../constants";

export interface NotificationConfig {
  info: boolean;
  warning: boolean;
  error: boolean;
}

// Centralized configuration access for Forge extension
export class ConfigService {
  private readonly configNamespace = "forge";

  private getConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(this.configNamespace);
  }

  getNotificationConfig(): NotificationConfig | undefined {
    return this.getConfig().get<NotificationConfig>("notifications");
  }

  isNotificationEnabled(messageType: "info" | "warning" | "error"): boolean {
    const notifications = this.getNotificationConfig();
    if (!notifications) {
      return true;
    }
    // Safe: messageType is a union type with only 3 valid keys
    // eslint-disable-next-line security/detect-object-injection
    const value = notifications[messageType];
    return value ?? true;
  }

  /**
   * Get auto-paste setting
   * @returns true if auto-paste is enabled (default: true)
   */
  getAutoPasteEnabled(): boolean {
    return this.getConfig().get<boolean>("autoPaste", true);
  }

  /**
   * Get paste delay in milliseconds
   * @returns Delay in milliseconds (default: DEFAULT_STARTUP_DELAY)
   */
  getPasteDelay(): number {
    return this.getConfig().get<number>("pasteDelay", DEFAULT_STARTUP_DELAY);
  }

  /**
   * Get terminal opening mode
   * @returns "once" | "never" | "always" (default: "once")
   */
  getOpenTerminalMode(): string {
    return this.getConfig().get<string>("openTerminal", "once");
  }

  /**
   * Get file reference format preference
   * @returns "absolute" | "relative" (default: "absolute")
   */
  getFileReferenceFormat(): string {
    return this.getConfig().get<string>("fileReferenceFormat", "absolute");
  }

  /**
   * Get max diff size for commit message generation
   * @returns Max diff size in bytes (default: 10000)
   */
  getCommitMessageMaxDiffSize(): number {
    return this.getConfig().get<number>("commitMessage.maxDiffSize", 10000);
  }
}


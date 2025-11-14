import * as vscode from "vscode";
import { DEFAULT_STARTUP_DELAY } from "../constants";

/**
 * Configuration interface for notification settings
 */
export interface NotificationConfig {
  info: boolean;
  warning: boolean;
  error: boolean;
}

/**
 * Service for accessing VS Code configuration settings for the Forge extension.
 * Centralizes all configuration access to ensure consistency and maintainability.
 * 
 * Best Practices Applied:
 * - Single Responsibility: Only handles configuration access
 * - Type Safety: Uses TypeScript interfaces for config values
 * - Default Values: Provides sensible defaults for all settings
 * - Immutability: Returns values, doesn't modify state
 */
export class ConfigService {
  private readonly configNamespace = "forge";

  /**
   * Get the configuration object for the Forge extension
   */
  private getConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(this.configNamespace);
  }

  /**
   * Get notification configuration settings
   * @returns NotificationConfig object with info, warning, and error flags
   */
  getNotificationConfig(): NotificationConfig | undefined {
    return this.getConfig().get<NotificationConfig>("notifications");
  }

  /**
   * Check if a specific notification type is enabled
   * @param messageType - The type of notification (info, warning, error)
   * @returns true if the notification type is enabled, false otherwise
   */
  isNotificationEnabled(messageType: "info" | "warning" | "error"): boolean {
    const notifications = this.getNotificationConfig();
    return notifications?.[messageType] ?? true; // Default to true if not configured
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
}


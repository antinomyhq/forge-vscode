import * as vscode from 'vscode';
import { IConfigurationPort } from '../../api/ports/IConfigurationPort';

/**
 * VSCodeConfigAdapter implements IConfigurationPort using VS Code's configuration API.
 * This adapter reads settings from the 'forge' configuration namespace.
 */
export class VSCodeConfigAdapter implements IConfigurationPort {
  private readonly namespace = 'forge';

  /**
   * Gets the VS Code configuration object for the forge namespace
   * @returns WorkspaceConfiguration for 'forge'
   */
  private getConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(this.namespace);
  }

  /**
   * Gets the file reference format preference
   * @returns 'absolute' or 'relative' based on user settings
   */
  public getFileReferenceFormat(): 'absolute' | 'relative' {
    return this.getConfig().get<'absolute' | 'relative'>('fileReferenceFormat', 'absolute');
  }

  /**
   * Gets the terminal opening mode preference
   * @returns 'once' or 'never' based on user settings
   */
  public getOpenTerminalMode(): 'once' | 'never' {
    return this.getConfig().get<'once' | 'never'>('openTerminalMode', 'once');
  }

  /**
   * Checks if automatic paste is enabled
   * @returns true if auto-paste is enabled (default: true)
   */
  public getAutoPasteEnabled(): boolean {
    return this.getConfig().get<boolean>('autoPasteEnabled', true);
  }

  /**
   * Gets the delay in milliseconds before pasting file reference
   * @returns Delay in milliseconds (default: 5000ms)
   */
  public getPasteDelay(): number {
    return this.getConfig().get<number>('pasteDelay', 5000);
  }

  /**
   * Checks if notifications of a specific type are enabled
   * @param type - The notification type to check
   * @returns true if notifications of this type should be shown
   */
  public isNotificationEnabled(type: 'info' | 'warning' | 'error'): boolean {
    const notifications = this.getConfig().get<Record<string, boolean>>('notifications', {
      info: true,
      warning: true,
      error: true,
    });
    // eslint-disable-next-line security/detect-object-injection
    return notifications[type] ?? true;
  }

  /**
   * Checks if the installation prompt should be shown
   * @returns true if the installation prompt should be displayed (default: true)
   */
  public showInstallationPrompt(): boolean {
    return this.getConfig().get<boolean>('showInstallationPrompt', true);
  }
}

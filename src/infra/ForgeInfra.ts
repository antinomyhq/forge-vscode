import * as vscode from 'vscode';
import { VSCodeEditorAdapter } from './adapters/VSCodeEditorAdapter';
import { VSCodeClipboardAdapter } from './adapters/VSCodeClipboardAdapter';
import { VSCodeTerminalAdapter } from './adapters/VSCodeTerminalAdapter';
import { NodeProcessAdapter } from './adapters/NodeProcessAdapter';
import { VSCodeConfigAdapter } from './adapters/VSCodeConfigAdapter';
import { VSCodeNotificationAdapter } from './adapters/VSCodeNotificationAdapter';
import { VSCodeWorkspaceAdapter } from './adapters/VSCodeWorkspaceAdapter';
import { NotificationConfig } from '../config/NotificationConfig';
import type { IEditorPort } from '../api/ports/IEditorPort';
import type { IClipboardPort } from '../api/ports/IClipboardPort';
import type { ITerminalPort } from '../api/ports/ITerminalPort';
import type { IProcessPort } from '../api/ports/IProcessPort';
import type { IConfigurationPort } from '../api/ports/IConfigurationPort';
import type { INotificationPort } from '../api/ports/INotificationPort';
import type { IWorkspacePort } from '../api/ports/IWorkspacePort';

/**
 * ForgeInfra - Infrastructure Layer
 * 
 * Holds concrete adapter implementations and implements all port interfaces.
 * This follows the Rust pattern where a struct holds service fields and implements traits.
 * 
 * Rust equivalent:
 * ```rust
 * #[derive(Clone)]
 * pub struct ForgeInfra {
 *     editor_adapter: Arc<VSCodeEditorAdapter>,
 *     clipboard_adapter: Arc<VSCodeClipboardAdapter>,
 *     // ...
 * }
 * 
 * impl ForgeInfra {
 *     pub fn new(context: ExtensionContext) -> Self {
 *         let config_adapter = Arc::new(VSCodeConfigAdapter::new());
 *         let notification_config = NotificationConfig { ... };
 *         
 *         Self {
 *             editor_adapter: Arc::new(VSCodeEditorAdapter::new()),
 *             clipboard_adapter: Arc::new(VSCodeClipboardAdapter::new()),
 *             terminal_adapter: Arc::new(VSCodeTerminalAdapter::new(context)),
 *             process_adapter: Arc::new(NodeProcessAdapter::new()),
 *             config_adapter,
 *             notification_adapter: Arc::new(VSCodeNotificationAdapter::new(notification_config)),
 *             workspace_adapter: Arc::new(VSCodeWorkspaceAdapter::new()),
 *         }
 *     }
 * }
 * ```
 * 
 * TypeScript note: We don't need Arc<T> because objects are references in JavaScript.
 * All fields are readonly to ensure immutability.
 */
export class ForgeInfra implements 
  IEditorPort, 
  IClipboardPort, 
  ITerminalPort, 
  IProcessPort, 
  IConfigurationPort, 
  INotificationPort, 
  IWorkspacePort 
{
  // Concrete adapter implementations (like Rust Arc<ServiceType> fields)
  private readonly editorAdapter: VSCodeEditorAdapter;
  private readonly clipboardAdapter: VSCodeClipboardAdapter;
  private readonly terminalAdapter: VSCodeTerminalAdapter;
  private readonly processAdapter: NodeProcessAdapter;
  private readonly configAdapter: VSCodeConfigAdapter;
  private readonly notificationAdapter: VSCodeNotificationAdapter;
  private readonly workspaceAdapter: VSCodeWorkspaceAdapter;

  /**
   * Constructor takes only required parameters and creates all adapters internally
   * Similar to Rust's new() that creates Arc<T> instances internally
   * 
   * @param context - VS Code extension context (required for terminal adapter)
   */
  constructor(context: vscode.ExtensionContext) {
    // Create config adapter first (needed for notification config)
    this.configAdapter = new VSCodeConfigAdapter();
    
    // Create notification config from configuration
    const notificationConfig: NotificationConfig = {
      showInfo: this.configAdapter.isNotificationEnabled('info'),
      showWarning: this.configAdapter.isNotificationEnabled('warning'),
      showError: this.configAdapter.isNotificationEnabled('error'),
    };
    
    // Create all other adapters
    this.editorAdapter = new VSCodeEditorAdapter();
    this.clipboardAdapter = new VSCodeClipboardAdapter();
    this.terminalAdapter = new VSCodeTerminalAdapter(context);
    this.processAdapter = new NodeProcessAdapter();
    this.notificationAdapter = new VSCodeNotificationAdapter(notificationConfig);
    this.workspaceAdapter = new VSCodeWorkspaceAdapter();
  }

  // ========================================================================
  // IEditorPort implementation - delegates to editorAdapter
  // ========================================================================

  public getActiveFilePath(): string | undefined {
    return this.editorAdapter.getActiveFilePath();
  }

  public getSelection(): { start: number; end: number; isEmpty: boolean } | undefined {
    return this.editorAdapter.getSelection();
  }

  public hasActiveEditor(): boolean {
    return this.editorAdapter.hasActiveEditor();
  }

  // ========================================================================
  // IClipboardPort implementation - delegates to clipboardAdapter
  // ========================================================================

  public async read(): Promise<string> {
    return this.clipboardAdapter.read();
  }

  public async write(text: string): Promise<void> {
    return this.clipboardAdapter.write(text);
  }

  // ========================================================================
  // ITerminalPort implementation - delegates to terminalAdapter
  // ========================================================================

  public async createForgeTerminal(): Promise<string> {
    return this.terminalAdapter.createForgeTerminal();
  }

  public getForgeTerminals(): string[] {
    return this.terminalAdapter.getForgeTerminals();
  }

  public isForgeTerminal(terminalId: string): boolean {
    return this.terminalAdapter.isForgeTerminal(terminalId);
  }

  public async focusTerminal(terminalId: string): Promise<void> {
    return this.terminalAdapter.focusTerminal(terminalId);
  }

  public async sendText(
    terminalId: string, 
    text: string, 
    delay: number, 
    addNewLine?: boolean
  ): Promise<void> {
    return this.terminalAdapter.sendText(terminalId, text, delay, addNewLine);
  }

  public getLastFocusedForgeTerminal(): string | undefined {
    return this.terminalAdapter.getLastFocusedForgeTerminal();
  }

  public showTerminal(terminalId: string): void {
    return this.terminalAdapter.showTerminal(terminalId);
  }

  // ========================================================================
  // IProcessPort implementation - delegates to processAdapter
  // ========================================================================

  public async countForgeProcesses(): Promise<number> {
    return this.processAdapter.countForgeProcesses();
  }

  public async hasExternalForgeProcess(): Promise<boolean> {
    return this.processAdapter.hasExternalForgeProcess();
  }

  // ========================================================================
  // IConfigurationPort implementation - delegates to configAdapter
  // ========================================================================

  public getAutoPasteEnabled(): boolean {
    return this.configAdapter.getAutoPasteEnabled();
  }

  public getPasteDelay(): number {
    return this.configAdapter.getPasteDelay();
  }

  public getFileReferenceFormat(): 'absolute' | 'relative' {
    return this.configAdapter.getFileReferenceFormat();
  }

  public getOpenTerminalMode(): 'once' | 'never' {
    return this.configAdapter.getOpenTerminalMode();
  }

  public isNotificationEnabled(type: 'info' | 'warning' | 'error'): boolean {
    return this.configAdapter.isNotificationEnabled(type);
  }

  public showInstallationPrompt(): boolean {
    return this.configAdapter.showInstallationPrompt();
  }

  // ========================================================================
  // INotificationPort implementation - delegates to notificationAdapter
  // ========================================================================

  public async showInfo(message: string, ...actions: string[]): Promise<string | undefined> {
    return this.notificationAdapter.showInfo(message, ...actions);
  }

  public async showWarning(message: string, ...actions: string[]): Promise<string | undefined> {
    return this.notificationAdapter.showWarning(message, ...actions);
  }

  public async showError(message: string, ...actions: string[]): Promise<string | undefined> {
    return this.notificationAdapter.showError(message, ...actions);
  }

  public showStatusBar(message: string, durationMs: number): void {
    return this.notificationAdapter.showStatusBar(message, durationMs);
  }

  // ========================================================================
  // IWorkspacePort implementation - delegates to workspaceAdapter
  // ========================================================================

  public getWorkspaceFolder(filePath: string): string | undefined {
    return this.workspaceAdapter.getWorkspaceFolder(filePath);
  }

  public getRelativePath(filePath: string, workspaceFolder: string): string {
    return this.workspaceAdapter.getRelativePath(filePath, workspaceFolder);
  }
}
